// app/tabs/tickets/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import ViewShot, { captureRef } from 'react-native-view-shot';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
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
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { QrCodeDisplay } from '../../../components/ui/QrCodeDisplay';
import { Booking, Trip, Station, Vehicle, Driver } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';
import { savePDFToDevice, saveToGallery } from '../../../utils/filesystem';

export default function TicketDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getBookingById, getMyBookings, loading } = useBooking();
  const { showToast } = useToast();

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
    // Handle quick actions from the list screen
    if (action === 'download' && booking) {
      setTimeout(() => handleDownloadPDF(), 500);
    } else if (action === 'share' && booking) {
      setTimeout(() => handleShare(), 500);
    }
  }, [action, booking]);

  useEffect(() => {
    // Request media library permissions on Android
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

      // If the booking is pending, find other pending bookings for the same trip to batch pay
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
    showToast('Booking code copied to clipboard!', 'success');
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
        <title>Bahir Dar Transport - Ticket</title>
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
            <p>E-Ticket</p>
          </div>
          <div class="content">
            <div class="status-badge status-${booking.status?.toLowerCase() || 'pending'}">
              ${booking.status?.toUpperCase() || 'PENDING'}
            </div>
            
            <div class="info-row">
              <span class="label">Booking #</span>
              <span class="value">${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Ticket #</span>
              <span class="value">${booking.ticketNumber || 'N/A'}</span>
            </div>
            
            <div class="route">
              <h2>${origin.stationName || 'N/A'} → ${destination.stationName || 'N/A'}</h2>
              <div class="route-time">
                <div class="time-block">
                  <div class="time-label">Departure</div>
                  <div class="time-value">${departureTime ? departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                  <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${departureTime ? departureTime.toLocaleDateString() : ''}</div>
                </div>
                <div class="time-block">
                  <div class="time-label">Arrival</div>
                  <div class="time-value" style="color: #10b981;">${arrivalTime ? arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                  <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${arrivalTime ? arrivalTime.toLocaleDateString() : ''}</div>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-bottom: 16px;">
              ${seatNumbers.map((seat, index) => (
      `<span class="seat-tag" ${index > 0 ? 'style="margin-left: 4px;"' : ''}>Seat ${seat}</span>`
    )).join('')}
            </div>
            
            <div class="info-row">
              <span class="label">Passenger</span>
              <span class="value">${booking.passengerDetails?.fullName || user?.fullName || 'N/A'}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Vehicle</span>
              <span class="value">${vehicle.carType || 'Bus'} • ${vehicle.plateNumber || 'N/A'}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Payment</span>
              <span class="value" style="color: ${booking.paymentStatus === 'success' ? '#16a34a' : '#ca8a04'}">${(booking.paymentStatus || 'PENDING').toUpperCase()}</span>
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
            Thank you for choosing Bahir Dar Transport System!<br/>
            This is a computer generated ticket. Valid with ID proof.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // In your ticket detail screen, the handleDownloadPDF function
  const handleDownloadPDF = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast('Generating PDF...', 'info');

      if (!booking) {
        showToast('No booking data available', 'error');
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

      const message = `🚌 *Bahir Dar Transport - Ticket*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `*From:* ${origin.stationName || 'Origin'}\n` +
        `*To:* ${destination.stationName || 'Destination'}\n` +
        `*Date:* ${departureTime ? departureTime.toLocaleDateString() : 'N/A'}\n` +
        `*Time:* ${departureTime ? departureTime.toLocaleTimeString() : 'N/A'}\n` +
        `*Seat:* ${seatNumbers.join(', ')}\n` +
        `*Booking #:* ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}\n` +
        `*Amount:* ${formatCurrency(totalAmount)}\n` +
        `*Status:* ${booking.status?.toUpperCase()}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Thank you for choosing Bahir Dar Transport System!`;

      const result = await Share.share({
        message,
        title: 'My Bus Ticket'
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        }
        showToast('Ticket shared successfully', 'success');
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
      showToast('Capturing ticket...', 'info');

      if (!booking) {
        showToast('No booking data available', 'error');
        return;
      }

      if (!viewShotRef.current) {
        showToast('Ticket view not ready', 'error');
        return;
      }

      // Capture the ticket card as an image
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
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Loading ticket details...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="p-4">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}>
            <ArrowLeft size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <Ticket size={60} color="#ef4444" />
          <Text className="text-xl font-semibold text-gray-800 mt-4">
            Ticket Not Found
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            The ticket you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/tabs/tickets')}
            className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-semibold">View My Tickets</Text>
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Ticket Details
        </Text>
        <TouchableOpacity onPress={() => setQrModalVisible(true)} className="mr-2 p-2">
          <Maximize2 size={20} color={COLORS.primary} />
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
        {/* Status Banner */}
        <View className={`p-4 ${isConfirmed ? 'bg-green-50' : isPending ? 'bg-yellow-50' : isCancelled ? 'bg-red-50' : 'bg-gray-50'}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {isConfirmed && <CheckCircle size={20} color="#16a34a" />}
              {isPending && <Clock size={20} color="#ca8a04" />}
              {isCancelled && <XCircle size={20} color="#dc2626" />}
              <View>
                <Text className={`font-semibold ${isConfirmed ? 'text-green-700' :
                  isPending ? 'text-yellow-700' : isCancelled ? 'text-red-700' : 'text-gray-700'
                  }`}>
                  {booking.status?.toUpperCase()}
                </Text>
                <Text className="text-xs text-gray-500">
                  Ticket #{booking.ticketNumber || booking._id?.slice(-6).toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleCopyCode} className="p-2">
              <Copy size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {copySuccess && (
            <Text className="text-xs text-green-600 mt-1">Copied to clipboard!</Text>
          )}
        </View>

        {/* QR Code Section */}
        <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-200 items-center">
          <QrCodeDisplay
            value={qrValue}
            size={180}
            title="Scan this QR code"
            subtitle="Show this at the bus station for boarding"
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

        {/* Main Ticket Card - Captured for Gallery Saving */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.9 }}
          style={{ backgroundColor: '#f9fafb' }} // Match background to avoid artifacts
        >
          <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-gray-200">
            {/* Route Header */}
            <View className="p-4 bg-blue-50 border-b border-blue-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 items-center">
                  <Text className="text-xs text-gray-500">From</Text>
                  <Text className="font-bold text-gray-800 text-center">
                    {origin.stationName || 'N/A'}
                  </Text>
                  {origin.city && (
                    <Text className="text-xs text-gray-500">{origin.city}</Text>
                  )}
                </View>
                <View className="px-4">
                  <Bus size={24} color={COLORS.primary} />
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-xs text-gray-500">To</Text>
                  <Text className="font-bold text-gray-800 text-center">
                    {destination.stationName || 'N/A'}
                  </Text>
                  {destination.city && (
                    <Text className="text-xs text-gray-500">{destination.city}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Timeline */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Clock size={14} color={COLORS.primary} />
                    <Text className="text-xs text-gray-500">Departure</Text>
                  </View>
                  <Text className="font-semibold text-gray-800">
                    {trip.departureTime ? formatDate(trip.departureTime) : 'N/A'} at {trip.departureTime ? formatTime(trip.departureTime) : 'N/A'}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Clock size={14} color="#10b981" />
                    <Text className="text-xs text-gray-500">Arrival</Text>
                  </View>
                  <Text className="font-semibold text-gray-800">
                    {trip.arrivalTime ? formatDate(trip.arrivalTime) : 'N/A'} at {trip.arrivalTime ? formatTime(trip.arrivalTime) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Details */}
            <View className="p-4 gap-3">
              {/* Seat Info */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500">Seat Number(s)</Text>
                <View className="flex-row gap-1">
                  {seatNumbers.map((seat: number, index: number) => (
                    <View key={index} className="bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-sm font-bold">{seat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Vehicle Info */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500">Vehicle</Text>
                <Text className="font-medium text-gray-800">
                  {vehicle.carType || 'Bus'} • {vehicle.plateNumber || 'N/A'}
                </Text>
              </View>

              {/* Driver Info */}
              {driver?.fullName && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-500">Driver</Text>
                  <Text className="font-medium text-gray-800">
                    {driver.fullName}
                  </Text>
                </View>
              )}

              {/* Passenger Details */}
              <View className="mt-2 pt-2 border-t border-gray-200">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Passenger Details
                </Text>
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <User size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600">
                      {booking.passengerDetails?.fullName || user?.fullName}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Phone size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600">
                      {booking.passengerDetails?.phoneNumber || user?.phoneNumber}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Mail size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600">
                      {booking.passengerDetails?.email || user?.email}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Info */}
              <View className="mt-2 pt-2 border-t border-gray-200">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Payment Information
                </Text>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <CreditCard size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600">Status</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${isPaid ? 'bg-green-100' :
                    booking.paymentStatus === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                    <Text className={`text-xs font-medium ${isPaid ? 'text-green-700' :
                      booking.paymentStatus === 'pending' ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                      {(booking.paymentStatus || 'PENDING').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Total Amount */}
              <View className="mt-2 pt-2 border-t border-gray-200">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-medium text-gray-700">
                    Total Amount
                  </Text>
                  <Text className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
                {seatNumbers.length > 1 && (
                  <Text className="text-xs text-gray-500 text-right mt-1">
                    {seatNumbers.length} seats × {formatCurrency(totalAmount / seatNumbers.length)}
                  </Text>
                )}
              </View>
            </View>

            {/* Footer */}
            <View className="p-3 bg-gray-50 border-t border-gray-200">
              <Text className="text-xs text-gray-400 text-center">
                Booked on: {formatDate(booking.bookingDate || booking.createdAt || '')}
              </Text>
            </View>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View className="px-4 pb-4 gap-3">
          {/* Payment Button for Pending Bookings */}
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
              <Text className="font-semibold text-white">
                {relatedBookingIds.length > 1 ? `Pay for ${relatedBookingIds.length} Seats` : 'Complete Payment Now'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Download PDF Button */}
          <TouchableOpacity
            onPress={handleDownloadPDF}
            className="flex-row items-center justify-center py-3 bg-blue-600 rounded-xl gap-2"
          >
            <Download size={20} color="white" />
            <Text className="font-medium text-white">Download PDF Ticket</Text>
          </TouchableOpacity>

          {/* Save to Gallery Button */}
          <TouchableOpacity
            onPress={handleSaveToGallery}
            className="flex-row items-center justify-center py-3 bg-green-600 rounded-xl gap-2"
          >
            <Save size={20} color="white" />
            <Text className="font-medium text-white">Save to Gallery</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center py-3 bg-purple-600 rounded-xl gap-2"
          >
            <Share2 size={20} color="white" />
            <Text className="font-medium text-white">Share Ticket</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* QR Code Fullscreen Modal */}
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
              <Text className="text-gray-700 font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}