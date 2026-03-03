// app/(screens)/payment/checkout.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePayment } from '../../../hooks/usePayment';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { formatCurrency } from '../../../utils/helpers';
import { Booking } from '../../../types';

type PaymentMethod = 'mobile_money' | 'card' | 'cash';

export default function PaymentCheckoutScreen() {
  const { bookingIds, bookingId, seatCount } = useLocalSearchParams<{
    bookingIds: string;
    bookingId: string;
    seatCount: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { initializePayment, verifyPayment, loading: paymentLoading } = usePayment();
  const { getBookingById } = useBooking();
  const { showToast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mobile_money');
  const [processing, setProcessing] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [backendAmount, setBackendAmount] = useState<number | null>(null);
  const [globalTxRef, setGlobalTxRef] = useState<string>('');
  const [fetchRetryCount, setFetchRetryCount] = useState<number>(0);
  
  const webViewRef = useRef<any>(null);
  const paymentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chapaTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse booking IDs from URL params
  const parsedBookingIds = useMemo(() => {
    try {
      return bookingIds ? JSON.parse(bookingIds) : (bookingId ? [bookingId] : []);
    } catch (error) {
      console.error('Error parsing bookingIds:', error);
      return [];
    }
  }, [bookingIds, bookingId]);

  const totalSeatCount = useMemo(() => 
    parseInt(seatCount) || parsedBookingIds.length || 1, 
    [seatCount, parsedBookingIds]
  );

  // Calculate all seat numbers from bookings
  const allSeatNumbers = useMemo(() => {
    const seats = bookings.flatMap(booking =>
      booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : [])
    );
    console.log('🎫 All seat numbers for payment:', seats);
    return seats;
  }, [bookings]);

  // Calculate price per seat
  const pricePerSeat = useMemo(() => {
    if (bookings.length === 0) return 0;
    
    // If we have pricePerSeat from the booking, use it
    if (bookings[0]?.pricePerSeat) {
      return bookings[0].pricePerSeat;
    }
    
    // Try to get from trip
    if (typeof bookings[0]?.tripID === 'object' && bookings[0]?.tripID?.price) {
      return bookings[0].tripID.price;
    }
    
    // Calculate from total amount and seat count
    if (allSeatNumbers.length > 0 && bookings[0]?.totalPrice) {
      return bookings[0].totalPrice / allSeatNumbers.length;
    }
    
    return 0;
  }, [bookings, allSeatNumbers]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      return sum + (booking.totalPrice || booking.amount || 0);
    }, 0);
  }, [bookings]);

  // Check if this is a group booking
  const isGroupBooking = useMemo(() => 
    bookings.length > 0 && (bookings[0]?.isGroupBooking || allSeatNumbers.length > 1),
    [bookings, allSeatNumbers]
  );

  // Set up payment timeout when WebView is shown
  useEffect(() => {
    if (showWebView && checkoutUrl) {
      const timer = setTimeout(() => {
        console.log('⏰ Payment timeout - auto redirecting');
        setShowWebView(false);
        setPaymentCompleted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast('Payment verification required', 'warning');

        setTimeout(() => {
          router.replace({
            pathname: '/(screens)/booking/confirmation',
            params: {
              bookingIds: JSON.stringify(parsedBookingIds),
              success: 'pending'
            }
          });
        }, 1000);
      }, 300000); // 5 minutes

      paymentTimerRef.current = timer;

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [showWebView, checkoutUrl, parsedBookingIds, router, showToast]);

  // Clear payment timer when payment is completed
  useEffect(() => {
    if (paymentCompleted && paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
  }, [paymentCompleted]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (paymentTimerRef.current) {
        clearTimeout(paymentTimerRef.current);
      }
      if (chapaTimerRef.current) {
        clearTimeout(chapaTimerRef.current);
      }
    };
  }, []);

  // Fetch booking details when IDs are available
  useEffect(() => {
    if (parsedBookingIds.length > 0) {
      fetchAllBookingDetails();
    }
  }, [parsedBookingIds]);

  // Retry mechanism for fetching bookings
  useEffect(() => {
    if (bookings.length === 0 && parsedBookingIds.length > 0 && fetchRetryCount < 3) {
      console.log(`🔄 Retrying fetch for bookings (attempt ${fetchRetryCount + 1})...`);
      const retryTimer = setTimeout(() => {
        setFetchRetryCount(prev => prev + 1);
        fetchAllBookingDetails();
      }, 1500); // Increased retry delay

      return () => clearTimeout(retryTimer);
    }
    
    if (fetchRetryCount >= 3 && bookings.length === 0) {
      console.log('❌ Max retry attempts reached for fetching bookings');
      showToast('Unable to load booking details. Please try again.', 'error');
      setTimeout(() => {
        router.back();
      }, 2000);
    }
  }, [bookings.length, parsedBookingIds, fetchRetryCount, router, showToast]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showWebView) {
        closeWebView();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showWebView]);
  

const fetchAllBookingDetails = async () => {
  try {
    console.log('🔍 Fetching booking details for IDs:', parsedBookingIds);
    const fetchedBookings: Booking[] = [];

    for (const id of parsedBookingIds) {
      try {
        console.log(`📋 Fetching booking ${id}...`);
        const data = await getBookingById(id);
        if (data) {
          console.log(`✅ Booking ${id} found:`, {
            bookingNumber: data.bookingNumber,
            status: data.status,
            paymentStatus: data.paymentStatus,
            seatNumbers: data.seatNumbers || data.seatNumber
          });
          
          // Ensure seatNumbers is properly set
          const bookingData = { ...data };
          if (!bookingData.seatNumbers && bookingData.seatNumber) {
            bookingData.seatNumbers = [bookingData.seatNumber];
          }
          
          fetchedBookings.push(bookingData);
        } else {
          console.warn(`⚠️ Booking ${id} not found or returned null - it may have been deleted`);
          // Don't show error toast here, just log it
        }
      } catch (error: any) {
        // Check if it's a 404 (not found)
        if (error.response?.status === 404) {
          console.warn(`⚠️ Booking ${id} not found (404) - it may have been deleted`);
        } else {
          console.error(`❌ Error fetching booking ${id}:`, error);
        }
      }
    }

    console.log(`📊 Total bookings fetched: ${fetchedBookings.length}`);
    console.log('📊 Seat numbers:', fetchedBookings.flatMap(b => b.seatNumbers || []));
    
    setBookings(fetchedBookings);
    setFetchRetryCount(0); // Reset retry count on success

    if (fetchedBookings.length === 0 && parsedBookingIds.length > 0) {
      console.log('⚠️ No bookings found - they may have been deleted');
      showToast('Bookings no longer available. Please try again.', 'error');
      setTimeout(() => {
        router.replace('/tabs/trips');
      }, 2000);
    } else if (fetchedBookings.length < parsedBookingIds.length) {
      // Some bookings were found, but not all
      console.log(`⚠️ Found ${fetchedBookings.length} of ${parsedBookingIds.length} bookings`);
      showToast(`Found ${fetchedBookings.length} of ${parsedBookingIds.length} bookings`, 'info');
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
  }
};
  const handlePayment = async () => {
    if (parsedBookingIds.length === 0 || bookings.length === 0) {
      showToast('No bookings found to pay for', 'error');
      return;
    }

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('💰 Initializing payment for batch:', parsedBookingIds, 'total amount:', totalAmount);

      // Initialize payment with the first booking ID
      const result = await initializePayment(
        parsedBookingIds[0],
        totalAmount,
        selectedMethod
      );

      if (result?.checkoutUrl) {
        console.log('💰 Payment initialization success. txRef:', result.txRef, 'amount:', result.amount);
        setCheckoutUrl(result.checkoutUrl);
        setGlobalTxRef(result.txRef);
        setBackendAmount(result.amount);
        setShowWebView(true);

        // Automatic verification fallback
        setTimeout(() => {
          if (!paymentCompleted && showWebView) {
            console.log('⏰ Auto-verification fallback triggered');
            handleVerification();
          }
        }, 45000);
      } else {
        Alert.alert('Payment Error', 'Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      const msg = error.response?.data?.message || 'Failed to initialize payment';
      Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleNavigationStateChange = useCallback((navState: any) => {
    const { url } = navState;
    console.log('🌐 WebView navigation:', url);

    // Extract transaction reference
    if (url.includes('tx_ref=')) {
      const match = url.match(/[?&]tx_ref=([^&]+)/);
      if (match && match[1]) {
        setGlobalTxRef(match[1]);
        console.log('🔍 Extracted tx_ref:', match[1]);
      }
    }

    // Check for payment success
    const isPaymentSuccess =
      url.includes('payment/success') ||
      url.includes('status=success') ||
      url.includes('payment_status=success') ||
      url.includes('transaction/success') ||
      url.includes('checkout/success') ||
      (url.includes('chapa.co/payment') && url.includes('success')) ||
      (url.includes('chapa.co/receipt') && url.includes('success')) ||
      (url.includes('chapa.co/transaction') && url.includes('success')) ||
      (url.includes('chapa.co') && (url.includes('success') || url.includes('completed'))) ||
      url.includes('/booking/confirmation') ||
      url.includes('booking/confirmation') ||
      url.includes('payment=completed') ||
      (url.includes('success=true') && (url.includes('bookingId=') || url.includes('bookingID=')));

    // Check for payment failure
    const isPaymentFailure =
      url.includes('error=') ||
      url.includes('status=failed') ||
      url.includes('status=cancelled') ||
      url.includes('payment/failed') ||
      url.includes('payment/cancelled');

    // Set up verification fallback for Chapa pages
    if (url.includes('chapa.co') && !paymentCompleted) {
      console.log('🔄 On Chapa page, setting up verification fallback');

      if (chapaTimerRef.current) {
        clearTimeout(chapaTimerRef.current);
      }

      chapaTimerRef.current = setTimeout(() => {
        if (!paymentCompleted) {
          console.log('⏰ Triggering automatic payment verification');
          handleVerification();
        }
      }, 10000);
    }

    if (isPaymentSuccess) {
      console.log('✅ Detected payment success');

      setShowWebView(false);
      setPaymentCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Payment successful!', 'success');

      setTimeout(() => {
        router.replace({
          pathname: '/(screens)/booking/confirmation',
          params: {
            bookingIds: JSON.stringify(parsedBookingIds),
            success: 'true',
            ...(globalTxRef && { txRef: globalTxRef })
          }
        });
      }, 1000);

      return false;
    }

    if (isPaymentFailure) {
      console.log('❌ Detected payment failure');
      setShowWebView(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Payment Failed',
        'There was a problem with your payment. Please try again.',
        [
          { text: 'Try Again', onPress: () => setShowWebView(true) },
          { text: 'Back to Booking', onPress: handleGoToConfirmation }
        ]
      );

      return false;
    }

    return true;
  }, [paymentCompleted, parsedBookingIds, globalTxRef, router, showToast]);

  // app/(screens)/payment/checkout.tsx - Update handleVerification function

const handleVerification = useCallback(async () => {
  if (verifying || parsedBookingIds.length === 0 || paymentCompleted) return;

  setVerifying(true);
  showToast('Verifying your payment...', 'info');

  try {
    if (!globalTxRef) {
      showToast('No transaction reference found', 'error');
      setVerifying(false);
      return;
    }

    console.log('🔍 Verifying payment with txRef:', globalTxRef);
    const result = await verifyPayment(globalTxRef);

    console.log('📥 Verification result:', result);

    // Check if verification was successful
    if (result.success) {
      // Check payment status if we have payment data
      if (result.payment) {
        if (result.payment.paymentStatus === 'success' || result.payment.paymentStatus === 'processing') {
          console.log('✅ Payment verification successful with status:', result.payment.paymentStatus);
          setPaymentCompleted(true);
          setShowWebView(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast('Payment confirmed!', 'success');

          setTimeout(() => {
            router.replace({
              pathname: '/(screens)/booking/confirmation',
              params: {
                bookingIds: JSON.stringify(parsedBookingIds),
                success: 'true',
                txRef: globalTxRef
              }
            });
          }, 1000);
          return;
        }
      } else {
        // Success but no payment data - still consider it successful
        console.log('✅ Payment verification successful (no payment data)');
        setPaymentCompleted(true);
        setShowWebView(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Payment confirmed!', 'success');

        setTimeout(() => {
          router.replace({
            pathname: '/(screens)/booking/confirmation',
            params: {
              bookingIds: JSON.stringify(parsedBookingIds),
              success: 'true',
              txRef: globalTxRef
            }
          });
        }, 1000);
        return;
      }
    }

    // If we get here, verification wasn't successful
    console.log('ℹ️ Payment verification returned:', result.message || 'Payment still pending');
    showToast(result.message || 'Payment still pending. Please wait.', 'info');
    
  } catch (error: any) {
    console.error('Verification error:', error);
    showToast('Verification failed. We will check again shortly.', 'warning');
  } finally {
    setVerifying(false);
  }
}, [verifying, parsedBookingIds, paymentCompleted, globalTxRef, router, showToast, verifyPayment]);

  const handleGoToConfirmation = useCallback(() => {
    if (parsedBookingIds.length > 0) {
      router.replace({
        pathname: '/(screens)/booking/confirmation',
        params: { bookingIds: JSON.stringify(parsedBookingIds) }
      });
    } else {
      router.back();
    }
  }, [parsedBookingIds, router]);

  const closeWebView = useCallback(() => {
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }

    setShowWebView(false);
    Alert.alert(
      'Payment Incomplete',
      'Did you complete the payment?',
      [
        { text: 'Yes, Verify', onPress: handleVerification },
        { text: 'No, Go Back', onPress: handleGoToConfirmation },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }, [handleVerification, handleGoToConfirmation]);

  const paymentMethods: Array<{ id: PaymentMethod; name: string; icon: any; description: string }> = [
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'Pay using Telebirr, M-Pesa, etc.'
    },
    {
      id: 'card',
      name: 'Card Payment',
      icon: CreditCard,
      description: 'Credit or Debit card'
    },
    {
      id: 'cash',
      name: 'Cash at Station',
      icon: Banknote,
      description: 'Pay at the bus station'
    }
  ];

  // Loading state
  if (bookings.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  // WebView payment page
  if (showWebView && checkoutUrl) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center bg-white">
          <TouchableOpacity onPress={closeWebView} className="mr-3">
            <ArrowLeft size={24} color="#4b5563" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-gray-800">
            Secure Payment
          </Text>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-white">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="mt-4 text-gray-600">Loading payment page...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          incognito={false}
          cacheEnabled={false}
        />
      </SafeAreaView>
    );
  }

  // Main checkout screen
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={handleGoToConfirmation} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Complete Payment
        </Text>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Amount Summary Card */}
        <View className="bg-blue-50 p-5 rounded-xl border border-blue-200 mb-6">
          <Text className="text-sm text-gray-600 text-center">Total Amount</Text>
          <Text className="text-3xl font-bold text-blue-600 text-center">
            {formatCurrency(totalAmount)}
          </Text>

          {/* Seat Numbers Display */}
          <View className="flex-row justify-center flex-wrap gap-2 mt-3">
            {allSeatNumbers.length > 0 ? (
              allSeatNumbers.map((seat: number, index: number) => (
                <View key={index} className="bg-blue-500 px-4 py-2 rounded-full shadow-sm">
                  <Text className="text-white text-sm font-bold">Seat {seat}</Text>
                </View>
              ))
            ) : (
              <View className="bg-gray-400 px-4 py-2 rounded-full">
                <Text className="text-white text-sm font-bold">Loading seats...</Text>
              </View>
            )}
          </View>

          {/* Group Booking Indicator */}
          {isGroupBooking && (
            <View className="bg-purple-100 px-3 py-1 rounded-full self-center mt-2">
              <Text className="text-purple-700 text-xs font-bold">
                GROUP BOOKING • {allSeatNumbers.length} SEATS
              </Text>
            </View>
          )}

          {/* Price Breakdown */}
          {allSeatNumbers.length > 0 && (
            <>
              <Text className="text-xs text-gray-500 text-center mt-3">
                {allSeatNumbers.length} {allSeatNumbers.length === 1 ? 'seat' : 'seats'} × {formatCurrency(pricePerSeat)}
              </Text>

              <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                <View>
                  <Text className="text-gray-600 font-medium">Total Amount</Text>
                  {allSeatNumbers.length > 1 && (
                    <Text className="text-xs text-gray-500">
                      {allSeatNumbers.length} seats
                    </Text>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-blue-600">
                    {formatCurrency(backendAmount || totalAmount)}
                  </Text>
                  {backendAmount && backendAmount !== totalAmount && (
                    <Text className="text-xs text-amber-600 font-medium">
                      Includes all pending seats for this trip
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Payment Methods */}
        <Text className="font-semibold text-gray-700 mb-3">Select Payment Method</Text>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setSelectedMethod(method.id)}
            className={`
              flex-row items-center p-4 mb-3 rounded-xl border-2
              ${selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
              }
            `}
          >
            <View className={`
              w-10 h-10 rounded-full items-center justify-center mr-3
              ${selectedMethod === method.id ? 'bg-blue-500' : 'bg-gray-100'}
            `}>
              <method.icon
                size={20}
                color={selectedMethod === method.id ? 'white' : '#6b7280'}
              />
            </View>
            <View className="flex-1">
              <Text className={`font-semibold ${selectedMethod === method.id ? 'text-blue-600' : 'text-gray-700'}`}>
                {method.name}
              </Text>
              <Text className="text-xs text-gray-500">{method.description}</Text>
            </View>
            {selectedMethod === method.id && (
              <CheckCircle size={20} color="#3b82f6" />
            )}
          </TouchableOpacity>
        ))}

        {/* Pay Button */}
        <TouchableOpacity
          onPress={handlePayment}
          disabled={paymentLoading || processing || verifying}
          className={`
            py-4 rounded-xl flex-row items-center justify-center mt-6
            ${paymentLoading || processing || verifying ? 'bg-gray-300' : 'bg-blue-600'}
          `}
        >
          {paymentLoading || processing || verifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CreditCard size={20} color="white" />
              <Text className="text-white font-semibold ml-2 text-base">
                Pay {formatCurrency(backendAmount || totalAmount)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Check Status Button */}
        <TouchableOpacity
          onPress={handleVerification}
          disabled={verifying || paymentCompleted}
          className="py-3 rounded-xl flex-row items-center justify-center mt-3 bg-gray-100"
        >
          {verifying ? (
            <ActivityIndicator size="small" color="#4b5563" />
          ) : (
            <Text className="font-semibold text-gray-600">Check Payment Status</Text>
          )}
        </TouchableOpacity>

        {/* Security Note */}
        <View className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <View className="flex-row items-start gap-2">
            <AlertCircle size={16} color="#6b7280" />
            <Text className="flex-1 text-xs text-gray-500">
              Your payment is secure and encrypted. You'll be redirected to our secure payment page.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}