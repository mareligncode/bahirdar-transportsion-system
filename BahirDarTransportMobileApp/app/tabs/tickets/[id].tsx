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
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setMediaPermission(status === 'granted');
      })();
    }
  }, []);

  const fetchBooking = async () => {
    const data = await getBookingById(id);
    if (data) {
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
    const departureTime = trip.departureTime ? new Date(trip.departureTime) : null;
    const arrivalTime = trip.arrivalTime ? new Date(trip.arrivalTime) : null;
    const seatNumbers = booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []);
    const totalAmount = booking.totalPrice || booking.amount || ((trip.price || 0) * seatNumbers.length);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${translate('app_name')} - ${translate('ticket')}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f3f4f6; 
          }
          .ticket { 
            max-width: 400px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 24px; 
            overflow: hidden; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6, #1e40af); 
            padding: 24px; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 24px; 
            font-weight: bold; 
          }
          .header p { 
            color: #bfdbfe; 
            margin: 8px 0 0; 
            font-size: 14px; 
          }
          .content { 
            padding: 24px; 
          }
          .status-badge { 
            display: inline-block; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: bold; 
            margin-bottom: 16px; 
            text-transform: uppercase;
          }
          .status-confirmed { 
            background: #dcfce7; 
            color: #166534; 
          }
          .status-pending { 
            background: #fef3c7; 
            color: #92400e; 
          }
          .status-cancelled { 
            background: #fee2e2; 
            color: #991b1b; 
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 12px; 
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label { 
            color: #6b7280; 
            font-size: 14px; 
          }
          .value { 
            font-weight: 600; 
            color: #1f2937; 
            font-size: 14px;
          }
          .route { 
            text-align: center; 
            margin: 24px 0; 
            padding: 16px;
            background: #f9fafb;
            border-radius: 12px;
          }
          .route h2 { 
            margin: 0; 
            font-size: 18px; 
            font-weight: 700;
            color: #1f2937;
          }
          .route-time {
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
          }
          .time-block {
            flex: 1;
            text-align: center;
          }
          .time-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .time-value {
            font-size: 16px;
            font-weight: 700;
            color: #3b82f6;
          }
          .divider { 
            height: 1px; 
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent); 
            margin: 24px 0; 
          }
          .footer { 
            background: #f9fafb; 
            padding: 16px; 
            text-align: center; 
            font-size: 11px; 
            color: #6b7280; 
            border-top: 1px dashed #d1d5db; 
          }
          .qr-placeholder { 
            width: 120px; 
            height: 120px; 
            background: #f3f4f6; 
            margin: 16px auto; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 2px dashed #d1d5db; 
            border-radius: 12px; 
          }
          .seat-tag {
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
          }
          .amount {
            font-size: 24px;
            font-weight: 800;
            color: #1e40af;
            text-align: center;
            margin: 16px 0;
          }
          .barcode {
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            letter-spacing: 4px;
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>Bahir Dar Transport</h1>
            <p>${translate('e_ticket')}</p>
          </div>
          <div class="content">
            <div class="status-badge status-${booking.status?.toLowerCase() || 'pending'}">
              ${translate(`ticket_status_${booking.status?.toLowerCase()}` as any).toUpperCase()}
            </div>
            
            <div class="info-row">
              <span class="label">${translate('booking')} #</span>
              <span class="value">${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}</span>
            </div>
            
            <div class="info-row">
              <span class="label">${translate('ticket')} #</span>
              <span class="value">${booking.ticketNumber || translate('not_available')}</span>
            </div>
            
            <div class="route">
              <h2>${origin.stationName || translate('unknown')} → ${destination.stationName || translate('unknown')}</h2>
              <div class="route-time">
                <div class="time-block">
                  <div class="time-label">${translate('departure')}</div>
                  <div class="time-value">${departureTime ? departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : translate('not_available')}</div>
                  <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${departureTime ? formatDate(departureTime.toISOString()) : ''}</div>
                </div>
                <div class="time-block">
                  <div class="time-label">${translate('arrival')}</div>
                  <div class="time-value" style="color: #10b981;">${arrivalTime ? arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : translate('not_available')}</div>
                  <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${arrivalTime ? formatDate(arrivalTime.toISOString()) : ''}</div>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-bottom: 16px;">
              ${seatNumbers.map((seat, index) => (
      `<span class="seat-tag" ${index > 0 ? 'style="margin-left: 4px;"' : ''}>${translate('seat_label_static')} ${seat}</span>`
    )).join('')}
            </div>
            
            <div class="info-row">
              <span class="label">${translate('passenger_label')}</span>
              <span class="value">${booking.passengerDetails?.fullName || user?.fullName || translate('unknown')}</span>
            </div>
            
            <div class="info-row">
              <span class="label">${translate('vehicle')}</span>
              <span class="value">${vehicle.carType || translate('bus')} • ${vehicle.plateNumber || translate('not_available')}</span>
            </div>
            
            <div class="info-row">
              <span class="label">${translate('payment')}</span>
              <span class="value" style="color: ${booking.paymentStatus === 'success' ? '#16a34a' : '#ca8a04'}">${translate(`ticket_status_${booking.paymentStatus || 'pending'}` as any).toUpperCase()}</span>
            </div>
            
            <div class="amount">
              ${formatCurrency(totalAmount)}
            </div>
            
            <div class="barcode">
              ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
            </div>
            
            <div class="qr-placeholder">
              <span style="color: #9ca3af;">QR Code</span>
            </div>
          </div>
          <div class="footer">
            ${translate('share_thank_you')}<br/>
            ${translate('computer_generated_note')}
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
    if (!booking) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const trip = typeof booking.tripID === 'object' && booking.tripID !== null
        ? booking.tripID as Trip
        : {} as Trip;
      const origin = (trip.origin || {}) as Station;
      const destination = (trip.destination || {}) as Station;
      const departureTime = trip.departureTime ? new Date(trip.departureTime) : null;
      const seatNumbers = booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []);
      const totalAmount = booking.totalPrice || booking.amount || 0;

      const message = `🚌 *${translate('app_name')} - ${translate('ticket')}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `*${translate('from')}:* ${origin.stationName || translate('unknown')}\n` +
        `*${translate('to')}:* ${destination.stationName || translate('unknown')}\n` +
        `*${translate('date')}:* ${departureTime ? formatDate(departureTime.toISOString()) : translate('not_available')}\n` +
        `*${translate('time')}:* ${departureTime ? formatTime(departureTime.toISOString()) : translate('not_available')}\n` +
        `*${translate('seats')}:* ${seatNumbers.join(', ')}\n` +
        `*${translate('booking')} #:* ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}\n` +
        `*${translate('total_amount')}:* ${formatCurrency(totalAmount)}\n` +
        `*${translate('status')}:* ${translate(`ticket_status_${booking.status?.toLowerCase()}` as any).toUpperCase()}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${translate('share_thank_you')}`;

      const result = await Share.share({
        message,
        title: translate('ticket')
      });

      if (result.action === Share.sharedAction) {
        showToast(translate('ticket_shared_success'), 'success');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
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
  if (loading && !refreshing) {
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
          <AppText color={isDark ? colors.gray400 : colors.gray500} className="text-center mt-2">
            {translate('booking_not_found_msg')}
          </AppText>
          <TouchableOpacity
            onPress={() => router.push('/tabs/tickets')}
            className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
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
  const qrValue = JSON.stringify({
    id: booking._id,
    bookingNumber: booking.bookingNumber,
    ticketNumber: booking.ticketNumber,
    seatNumbers,
    departureTime: trip.departureTime,
    passengerName: booking.passengerDetails?.fullName || user?.fullName,
  });

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
          style={{ backgroundColor: isDark ? colors.background : '#f9fafb' }} 
        >
          <View className={`mx-4 mt-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl overflow-hidden border shadow-sm`}>
            <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderBottomColor: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' }} className="p-4 border-b">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 items-center">
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('from')}</AppText>
                  <AppText weight="bold" color={isDark ? 'white' : colors.gray900} className="text-center">
                    {origin.stationName || translate('not_available')}
                  </AppText>
                  {origin.city && (
                    <AppText variant="caption" color={isDark ? colors.textTertiary : colors.gray500}>{origin.city}</AppText>
                  )}
                </View>
                <View className="px-4">
                  <Bus size={24} color={isDark ? colors.primary : colors.primary} />
                </View>
                <View className="flex-1 items-center">
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('to')}</AppText>
                  <AppText weight="bold" color={isDark ? 'white' : colors.gray900} className="text-center">
                    {destination.stationName || translate('not_available')}
                  </AppText>
                  {destination.city && (
                    <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{destination.city}</AppText>
                  )}
                </View>
              </View>
            </View>
            <View className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Clock size={14} color={colors.primary} />
                    <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('departure')}</AppText>
                  </View>
                  <AppText variant="bodySmall" weight="semibold" color={isDark ? 'white' : colors.gray900}>
                    {trip.departureTime ? formatDate(trip.departureTime) : translate('not_available')} {translate('at')} {trip.departureTime ? formatTime(trip.departureTime) : translate('not_available')}
                  </AppText>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Clock size={14} color="#10b981" />
                    <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('arrival')}</AppText>
                  </View>
                  <AppText variant="bodySmall" weight="semibold" color={isDark ? 'white' : colors.gray900}>
                    {trip.arrivalTime ? formatDate(trip.arrivalTime) : translate('not_available')} {translate('at')} {trip.arrivalTime ? formatTime(trip.arrivalTime) : translate('not_available')}
                  </AppText>
                </View>
              </View>
            </View>
            <View className="p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <AppText variant="bodySmall" color={isDark ? colors.gray400 : colors.gray500}>{translate('seat_numbers')}</AppText>
                <View className="flex-row gap-1">
                  {seatNumbers.map((seat: number, index: number) => (
                    <View key={index} className="bg-blue-500 px-3 py-1 rounded-full">
                      <AppText weight="bold" color="white" variant="bodySmall">{seat}</AppText>
                    </View>
                  ))}
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <AppText variant="bodySmall" color={isDark ? colors.gray400 : colors.gray500}>{translate('vehicle')}</AppText>
                <AppText weight="500" color={isDark ? 'white' : colors.gray900} variant="bodySmall">
                  {vehicle.carType || translate('bus')} • {vehicle.plateNumber || translate('not_available')}
                </AppText>
              </View>
              {driver?.fullName && (
                <View className="flex-row items-center justify-between">
                  <AppText variant="bodySmall" color={isDark ? colors.gray400 : colors.gray500}>{translate('driver')}</AppText>
                  <AppText weight="500" color={isDark ? 'white' : colors.gray900} variant="bodySmall">
                    {driver.fullName}
                  </AppText>
                </View>
              )}
              <View className={`mt-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <AppText weight="semibold" color={isDark ? colors.gray300 : colors.gray700} variant="bodyMedium" className="mb-2">
                  {translate('passenger_info')}
                </AppText>
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <User size={14} color={colors.textSecondary} />
                    <AppText color={isDark ? colors.gray300 : colors.gray600} variant="bodySmall">
                      {booking.passengerDetails?.fullName || user?.fullName}
                    </AppText>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Phone size={14} color={colors.textSecondary} />
                    <AppText color={isDark ? colors.gray300 : colors.gray600} variant="bodySmall">
                      {booking.passengerDetails?.phoneNumber || user?.phoneNumber}
                    </AppText>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Mail size={14} color={colors.textSecondary} />
                    <AppText color={isDark ? colors.gray300 : colors.gray600} variant="bodySmall">
                      {booking.passengerDetails?.email || user?.email}
                    </AppText>
                  </View>
                </View>
              </View>
              <View className={`mt-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <AppText weight="semibold" color={isDark ? colors.gray300 : colors.gray700} variant="bodyMedium" className="mb-2">
                  {translate('payment_information')}
                </AppText>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <CreditCard size={14} color={colors.textSecondary} />
                    <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray600}>{translate('status')}</AppText>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${isPaid ? (isDark ? 'bg-green-900/30' : 'bg-green-100') :
                    booking.paymentStatus === 'pending' ? (isDark ? 'bg-yellow-900/30' : 'bg-yellow-100') : (isDark ? 'bg-gray-700' : 'bg-gray-100')
                    }`}>
                    <AppText variant="caption" weight="bold" color={isPaid ? (isDark ? '#4ade80' : '#15803d') :
                      booking.paymentStatus === 'pending' ? (isDark ? '#fbbf24' : '#a16207') : (isDark ? colors.textTertiary : '#374151')
                      }>
                      {translate(`ticket_status_${booking.paymentStatus || 'pending'}` as any).toUpperCase()}
                    </AppText>
                  </View>
                </View>
              </View>
              <View className={`mt-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <View className="flex-row justify-between items-center">
                  <AppText variant="bodyLarge" weight="semibold" color={isDark ? colors.gray300 : colors.gray700}>
                    {translate('total_amount')}
                  </AppText>
                  <AppText variant="h2" weight="bold" color={isDark ? '#60a5fa' : colors.primary}>
                    {formatCurrency(totalAmount)}
                  </AppText>
                </View>
                {seatNumbers.length > 1 && (
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500} className="text-right mt-1">
                    {seatNumbers.length} {translate('seats')} × {formatCurrency(totalAmount / seatNumbers.length)}
                  </AppText>
                )}
              </View>
            </View>
            <View className={`p-3 ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t`}>
              <AppText variant="caption" color={isDark ? colors.textTertiary : colors.gray400} className="text-center">
                {translate('booked_on')} {formatDate(booking.bookingDate || booking.createdAt || '')}
              </AppText>
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
          <TouchableOpacity
            onPress={handleDownloadPDF}
            className="flex-row items-center justify-center py-3 bg-blue-600 rounded-xl gap-2"
          >
            <Download size={20} color="white" />
            <AppText weight="medium" color="white">Download PDF Ticket</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveToGallery}
            className="flex-row items-center justify-center py-3 bg-green-600 rounded-xl gap-2"
          >
            <Save size={20} color="white" />
            <AppText weight="medium" color="white">Save to Gallery</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center py-3 bg-purple-600 rounded-xl gap-2"
          >
            <Share2 size={20} color="white" />
            <AppText weight="medium" color="white">Share Ticket</AppText>
          </TouchableOpacity>
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
          <View className="bg-white p-6 rounded-2xl">
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
              className="mt-4 bg-gray-200 py-2 px-4 rounded-full self-center"
            >
              <AppText variant="bodyMedium" weight="500" color={isDark ? colors.gray300 : colors.gray700} className="text-center">Close</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}