import React, { useState, useEffect, useRef } from 'react';
import ViewShot, { captureRef } from 'react-native-view-shot';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';

import {
  ArrowLeft,
  Bus,
  Clock,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Share2,
  Copy,
  Ticket,
  AlertTriangle,
  Maximize2,
  Save,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useBooking } from '../../../hooks/useBooking';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { QrCodeDisplay } from '../../../components/ui/QrCodeDisplay';
import { Booking, Trip, Station, Vehicle, Driver } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { useTheme } from '../../../context/ThemeContext';
import { savePDFToDevice, saveToGallery } from '../../../utils/filesystem';

export default function TicketDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getBookingById, getMyBookings, loading } = useBooking();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { translate } = useTranslation();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [compLoading, setCompLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [relatedBookingIds, setRelatedBookingIds] = useState<string[]>([]);
  const [mediaPermission, setMediaPermission] = useState<boolean>(false);
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  useEffect(() => {
    if (action === 'download' && booking) {
      setTimeout(() => handleDownloadPDF(), 500);
    } else if (action === 'share' && booking) {
      setTimeout(() => handleShare(), 500);
    }
  }, [action, booking]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      (async () => {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          setMediaPermission(status === 'granted');
        } catch (err) {
          console.warn('⚠️ MediaLibrary permission request failed:', err);
          // Don't crash, just set permission to false
          setMediaPermission(false);
        }
      })();
    }
  }, []);

  const fetchBooking = async () => {
    console.log('🔍 Fetching booking for ID:', id);
    setCompLoading(true);
    try {
      const data = await getBookingById(id);
      if (data) {
        console.log('✅ Booking found:', data._id);
        setBooking(data);

        if (data.status?.toLowerCase() === 'pending') {
          try {
            const allMyBookings = await getMyBookings();
            if (allMyBookings && allMyBookings.length > 0) {
              const currentTripId = typeof data.tripID === 'object' && data.tripID !== null ? data.tripID._id : data.tripID;

              const sameTripPending = allMyBookings.filter(b => {
                const bTripId = typeof b.tripID === 'object' && b.tripID !== null ? b.tripID._id : b.tripID;
                return bTripId === currentTripId &&
                  b.status?.toLowerCase() === 'pending' &&
                  b._id !== data._id;
              });

              if (sameTripPending.length > 0) {
                setRelatedBookingIds([data._id, ...sameTripPending.map(b => b._id)]);
              } else {
                setRelatedBookingIds([data._id]);
              }
            } else {
              setRelatedBookingIds([data._id]);
            }
          } catch (err) {
            console.error('Error fetching related bookings:', err);
            setRelatedBookingIds([data._id]);
          }
        } else {
          setRelatedBookingIds([data._id]);
        }
      } else {
        console.warn('❌ Booking not found for ID:', id);
        setBooking(null);
      }
    } catch (err) {
      console.error('❌ Error in fetchBooking:', err);
      setBooking(null);
    } finally {
      setCompLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchBooking();
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    const code = booking?.bookingNumber || booking?._id?.slice(-6).toUpperCase() || '';
    await Clipboard.setStringAsync(code);
    setCopySuccess(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopySuccess(false), 2000);
    showToast(translate('booking_code_copied'), 'success');
  };

  const generateTicketHTML = () => {
    if (!booking) return '';

    const trip = typeof booking.tripID === 'object' && booking.tripID !== null
      ? booking.tripID as Trip
      : {} as Trip;
    const origin = (trip.origin || {}) as Station;
    const destination = (trip.destination || {}) as Station;
    const vehicle = (trip.vehicle || {}) as Vehicle;
    const seatNumbers = booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []);
    const seatCount = seatNumbers.length;
    const totalAmount = booking.totalPrice || booking.amount || ((trip.price || 0) * seatCount);
    const pricePerSeat = totalAmount / seatCount;
    const passengerName = booking.passengerDetails?.fullName || user?.fullName || 'N/A';
    const passengerPhone = booking.passengerDetails?.phoneNumber || user?.phoneNumber || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${translate('app_name')} - ${translate('ticket')}</title>
        <style>
          @page { size: 80mm 200mm; margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            margin: 0; 
            padding: 10mm; 
            background: white; 
            color: black;
            width: 80mm;
          }
          .ticket { 
            width: 100%;
            text-align: left;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 5mm; 
          }
          .header .brand { 
            font-weight: bold; 
            font-size: 18px; 
            display: block;
            margin-bottom: 2px;
          }
          .divider { 
            border-top: 1px dashed black; 
            margin: 3mm 0; 
          }
          .info-row { 
            margin-bottom: 1.5mm; 
            font-size: 13px;
          }
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .qr-container {
            text-align: center;
            margin: 5mm 0;
          }
          .qr-placeholder {
            width: 40mm;
            height: 40mm;
            border: 1px solid black;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <span class="brand">🚌 ${translate('mengedenya')}</span>
            <div style="font-size: 12px;">${translate('public_transport_service')}</div>
          </div>

          <div class="info-row">
            ${translate('from')} ${origin.stationName || ''} - ${destination.stationName || ''} ${destination.city ? `(${destination.city})` : ''}
          </div>
          <div class="info-row">${translate('tin_label')} : 0049849051</div>
          <div class="info-row">${translate('seats_label')} .. ${seatNumbers.join(', ')} ..</div>
          <div class="info-row bold">${translate('plate_no')} : ${vehicle.plateNumber || ''}</div>
          <div class="info-row bold">${translate('ticket_number_label')} : ${booking.ticketNumber || ''}</div>
          
          <div class="divider"></div>
          
          <div class="info-row">${translate('travel_date')} : ${trip.departureTime ? formatDate(trip.departureTime) : ''} ${trip.departureTime ? formatTime(trip.departureTime) : ''}</div>
          <div class="info-row">${translate('passenger_receipt')} : ${passengerName}</div>
          <div class="info-row">${translate('phone_number')} : ${passengerPhone}</div>
          
          <div class="divider"></div>
          
          <div class="info-row">${translate('tariff')} : ${pricePerSeat.toFixed(2)} ${translate('etb')}</div>
          <div class="info-row">${translate('service')} : 0.00 ${translate('etb')}</div>
          <div class="info-row bold">${translate('total_fee')} : ${totalAmount.toFixed(2)} ${translate('etb')}</div>
          
          <div class="divider"></div>
          
          <div class="info-row">${translate('ticket_date')} : ${formatDate(booking.bookingDate || booking.createdAt || '')} ${formatTime(booking.bookingDate || booking.createdAt || '')}</div>
          <div class="info-row">${translate('association_name')} : ${vehicle.associationName || 'N/A'}</div>
          <div class="info-row">${translate('agent')} : system</div>
          <div class="info-row bold">${translate('confirmation_number')} : ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}</div>
          
          <div class="divider"></div>
          
          <div class="info-row">✓ ${translate('authorized_note')}</div>
          <div class="info-row">✓ ${translate('complaints_note')}</div>
          
          <div class="qr-container">
            <div class="qr-placeholder">QR Code Verification</div>
          </div>
          
          <div class="center" style="font-size: 10px; margin-top: 5mm;">
            #1 Choice for Travelers
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast(translate('generating_pdf'), 'info');

      if (!booking) {
        showToast(translate('no_booking_data'), 'error');
        return;
      }

      const html = generateTicketHTML();
      const { uri } = await Print.printToFileAsync({ html });

      const timestamp = new Date().getTime();
      const fileName = `ticket-${booking.bookingNumber || booking._id}-${timestamp}.pdf`;

      const result = await savePDFToDevice(uri, fileName, mediaPermission);

      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }

    } catch (error: any) {
      console.error('PDF error:', error);
      showToast(`Failed: ${error?.message || 'Unknown error'}`, 'error');
    }
  };


  const handleShare = async () => {
    if (!booking || !viewShotRef.current) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast(translate('preparing_share') || 'Preparing to share...', 'info');

      // Capture the ticket as an image first
      const uri = await captureRef(viewShotRef.current, {
        format: 'png',
        quality: 0.9,
      });

      const trip = typeof booking.tripID === 'object' && booking.tripID !== null
        ? booking.tripID as Trip
        : {} as Trip;
      const origin = (trip.origin || {}) as Station;
      const destination = (trip.destination || {}) as Station;
      const seatNumbers = booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []);

      const shareTitle = `${translate('app_name')} - ${translate('ticket')}`;
      const shareMessage = `${translate('from')}: ${origin.stationName}\n${translate('to')}: ${destination.stationName}\n${translate('seat_numbers')}: ${seatNumbers.join(', ')}`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: shareTitle,
          UTI: 'public.png',
        });
        showToast(translate('ticket_shared_success') || 'Ticket shared successfully!', 'success');
      } else {
        // Fallback to basic text share if Sharing API is not available
        await Share.share({
          message: `🚌 ${shareTitle}\n\n${shareMessage}`,
          title: shareTitle
        });
      }

    } catch (error: any) {
      console.error('Share error:', error);
      showToast(`Failed to share: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleSaveToGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast(translate('capturing_ticket'), 'info');

      if (!booking) {
        showToast(translate('no_booking_data'), 'error');
        return;
      }

      if (!viewShotRef.current) {
        showToast(translate('ticket_view_not_ready'), 'error');
        return;
      }
      const uri = await captureRef(viewShotRef.current, {
        format: 'png',
        quality: 0.9,
      });

      const timestamp = new Date().getTime();
      const fileName = `ticket-${booking.bookingNumber || booking._id}-${timestamp}.png`;

      const result = await saveToGallery(uri, fileName, mediaPermission);

      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }

    } catch (error: any) {
      console.error('Gallery save error:', error);
      showToast(`Failed: ${error?.message || 'Unknown error'}`, 'error');
    }
  };
  if ((loading || compLoading) && !refreshing) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'} justify-center items-center`}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText color={isDark ? colors.textTertiary : colors.textSecondary} className="mt-4">{translate('loading_ticket_details')}</AppText>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className="p-4">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}>
            <ArrowLeft size={24} color={isDark ? colors.textSecondary : "#4b5563"} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <Ticket size={60} color="#ef4444" />
          <AppText variant="h2" weight="bold" color={isDark ? 'white' : colors.gray800} className="mt-4">
            {translate('booking_not_found')}
          </AppText>
          <AppText color={isDark ? colors.gray400 : colors.gray500} className="text-center mt-2 mb-4">
            {translate('booking_not_found_msg')}
          </AppText>

          <View className={`px-4 py-2 rounded-lg mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <AppText variant="caption" color={colors.textTertiary}>ID: {id}</AppText>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/tabs/tickets')}
            className="bg-blue-600 py-4 px-8 rounded-2xl shadow-lg"
          >
            <AppText weight="semibold" color="white">{translate('view_my_tickets')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const trip = typeof booking.tripID === 'object' && booking.tripID !== null
    ? booking.tripID as Trip
    : {} as Trip;
  const origin = (trip.origin || {}) as Station;
  const destination = (trip.destination || {}) as Station;
  const vehicle = (trip.vehicle || {}) as Vehicle;
  const driver = (trip.driver || {}) as Driver;
  const seatNumbers = booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []);
  const totalAmount = booking.totalPrice || booking.amount || ((trip.price || 0) * seatNumbers.length);
  const isConfirmed = booking.status?.toLowerCase() === 'confirmed';
  const isPending = booking.status?.toLowerCase() === 'pending';
  const isCancelled = booking.status?.toLowerCase() === 'cancelled';
  const isPaid = booking.paymentStatus === 'success';
  const seatCount = seatNumbers.length;
  const pricePerSeat = totalAmount / seatCount;
  const passengerName = booking.passengerDetails?.fullName || user?.fullName || 'N/A';

  const qrValue = `
${translate('public_transport_service')}
${translate('from')} ${origin.stationName || 'N/A'} - ${destination.stationName || 'N/A'}
TIN : 0049849051
${translate('seats_label')} .. ${seatNumbers.join(', ')} ..
${translate('plate_no')} : ${vehicle.plateNumber || 'N/A'}
${translate('ticket_number_label')} : ${booking.ticketNumber || booking._id?.slice(-6).toUpperCase()}
${translate('travel_date')} : ${formatDate(trip.departureTime || '')} ${formatTime(trip.departureTime || '')}
${translate('passenger_receipt')} : ${passengerName}
${translate('tariff')} : ${pricePerSeat.toFixed(2)} ${translate('etb')}
${translate('total_fee')} : ${totalAmount.toFixed(2)} ${translate('etb')}
${translate('ticket_date')} : ${formatDate(booking.bookingDate || booking.createdAt || '')}
${translate('confirmation_number')} : ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
`.trim();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top', 'left', 'right', 'bottom']}>
      <View className={`px-4 py-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex-row items-center`}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color={isDark ? colors.textSecondary : "#4b5563"} />
        </TouchableOpacity>
        <AppText variant="h3" weight="semibold" color={isDark ? 'white' : colors.gray800} className="flex-1">
          {translate('trip_details')}
        </AppText>
        <TouchableOpacity onPress={() => setQrModalVisible(true)} className="mr-2 p-2">
          <Maximize2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        <View className={`p-4 ${isConfirmed ? (isDark ? 'bg-green-900/20' : 'bg-green-50') : 
                        isPending ? (isDark ? 'bg-yellow-900/20' : 'bg-yellow-50') : 
                        isCancelled ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : 
                        (isDark ? colors.card : 'bg-gray-50')}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {isConfirmed && <CheckCircle size={20} color="#16a34a" />}
              {isPending && <Clock size={20} color="#ca8a04" />}
              {isCancelled && <XCircle size={20} color="#dc2626" />}
              <View>
                <AppText weight="semibold" color={isConfirmed ? (isDark ? '#4ade80' : '#15803d') :
                  isPending ? (isDark ? '#fbbf24' : '#a16207') : 
                  isCancelled ? (isDark ? '#f87171' : '#b91c1c') : (isDark ? 'white' : '#374151')
                  }>
                  {translate(`ticket_status_${booking.status?.toLowerCase()}` as any).toUpperCase()}
                </AppText>
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>
                  {translate('ticket_number_label')} {booking.ticketNumber || booking._id?.slice(-6).toUpperCase()}
                </AppText>
              </View>
            </View>
            <TouchableOpacity onPress={handleCopyCode} className="p-2">
              <Copy size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {copySuccess && (
            <AppText variant="caption" color="#16a34a" className="mt-1">{translate('copied_to_clipboard')}</AppText>
          )}
        </View>
        <View className={`mx-4 mt-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-4 border items-center`}>
          <QrCodeDisplay
            value={qrValue}
            size={180}
            title={translate('scan_qr_code')}
            subtitle={translate('boarding_qr_subtitle')}
            showActions={true}
            onSave={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast('QR code saved', 'success');
            }}
            onShare={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast('QR code shared', 'success');
            }}
          />
        </View>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.9 }}
          style={{ backgroundColor: isDark ? '#1f2937' : 'white' }} 
        >
          <View className={`mx-4 mt-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 shadow-sm border`} style={{ minHeight: 500 }}>
            <View className="items-center mb-6">
              <AppText weight="bold" className="text-xl">🚌 {translate('mengedenya')}</AppText>
              <AppText variant="caption" color={isDark ? colors.textSecondary : '#4b5563'}>{translate('public_transport_service')}</AppText>
            </View>

            <View className="mb-2">
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('from')} {origin.stationName} - {destination.stationName} {destination.city ? `(${destination.city})` : ''}
              </AppText>
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('tin_label')} : 0049849051
              </AppText>
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('seats_label')} .. {seatNumbers.join(', ')} ..
              </AppText>
              <AppText variant="bodySmall" weight="bold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('plate_no')} : {vehicle.plateNumber || 'N/A'}
              </AppText>
              <AppText variant="bodySmall" weight="bold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('ticket_number_label')} : {booking.ticketNumber || 'N/A'}
              </AppText>
            </View>

            <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: isDark ? '#4b5563' : '#000', marginVertical: 10 }} />

            <View className="mb-2">
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('travel_date')} : {formatDate(trip.departureTime || '')} {formatTime(trip.departureTime || '')}
              </AppText>
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('passenger_receipt')} : {passengerName}
              </AppText>
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('phone_number')} : {booking.passengerDetails?.phoneNumber || user?.phoneNumber || 'N/A'}
              </AppText>
            </View>

            <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: isDark ? '#4b5563' : '#000', marginVertical: 10 }} />

            <View className="mb-2">
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('tariff')} : {pricePerSeat.toFixed(2)} {translate('etb')}
              </AppText>
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('service')} : 0.00 {translate('etb')}
              </AppText>
              <AppText variant="bodySmall" weight="bold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('total_fee')} : {totalAmount.toFixed(2)} {translate('etb')}
              </AppText>
            </View>

            <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: isDark ? '#4b5563' : '#000', marginVertical: 10 }} />

            <View className="mb-2">
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('ticket_date')} : {formatDate(booking.bookingDate || booking.createdAt || '')} {formatTime(booking.bookingDate || booking.createdAt || '')}
              </AppText>
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('association_name')} : {vehicle.associationName || 'N/A'}
              </AppText>
              <AppText variant="bodySmall" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('agent')} : system
              </AppText>
              <AppText variant="bodySmall" weight="bold" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {translate('confirmation_number')} : {booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
              </AppText>
            </View>

            <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: isDark ? '#4b5563' : '#000', marginVertical: 10 }} />

            <View className="mb-6">
              <AppText variant="caption" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                ✓ {translate('authorized_note')}
              </AppText>
              <AppText variant="caption" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                ✓ {translate('complaints_note')}
              </AppText>
            </View>

            <View className="items-center mt-auto">
              <QrCodeDisplay
                value={qrValue}
                size={120}
                showActions={false}
              />
              <AppText variant="caption" className="mt-4 text-gray-400">#1 Choice for Travelers</AppText>
            </View>
          </View>
        </ViewShot>
        <View className="px-4 pb-4 gap-3">
          {isPending && (!booking.paymentStatus || booking.paymentStatus === 'pending') && (
            <TouchableOpacity
              onPress={() => {
                const finalIds = relatedBookingIds.length > 0 ? relatedBookingIds : [id];
                router.push({
                  pathname: '/(screens)/payment/checkout',
                  params: {
                    bookingIds: JSON.stringify(finalIds),
                    seatCount: (finalIds.length > 1 ? finalIds.length : seatNumbers.length).toString()
                  }
                });
              }}
              className="flex-row items-center justify-center py-4 bg-yellow-500 rounded-xl gap-2"
            >
              <CreditCard size={20} color="white" />
              <AppText weight="semibold" color="white">
                {relatedBookingIds.length > 1 ? `${translate('pay_now')} (${relatedBookingIds.length} ${translate('seats')})` : translate('complete_payment_now')}
              </AppText>
            </TouchableOpacity>
          )}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={handleDownloadPDF}
              className="flex-row items-center justify-center py-4 bg-blue-600 rounded-xl shadow-sm"
              activeOpacity={0.8}
            >
              <Download size={20} color="white" />
              <AppText weight="bold" color="white" className="ml-2">Download PDF Ticket</AppText>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleSaveToGallery}
                className="flex-1 flex-row items-center justify-center py-4 bg-emerald-600 rounded-xl shadow-sm"
                activeOpacity={0.8}
              >
                <Save size={20} color="white" />
                <AppText weight="bold" color="white" className="ml-2">Save Image</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                className="flex-1 flex-row items-center justify-center py-4 bg-indigo-600 rounded-xl shadow-sm"
                activeOpacity={0.8}
              >
                <Share2 size={20} color="white" />
                <AppText weight="bold" color="white" className="ml-2">Share Ticket</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setQrModalVisible(false)}
          className="flex-1 bg-black/90 justify-center items-center"
        >
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl`}>
            <QrCodeDisplay
              value={qrValue}
              size={280}
              title="Boarding Pass QR Code"
              subtitle="Scan this at the station"
              showActions={true}
            />
            <TouchableOpacity
              onPress={() => {
                setQrModalVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`mt-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} py-2 px-4 rounded-full self-center`}
            >
              <AppText variant="bodyMedium" weight="500" color={isDark ? colors.text : colors.gray700} className="text-center">Close</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}