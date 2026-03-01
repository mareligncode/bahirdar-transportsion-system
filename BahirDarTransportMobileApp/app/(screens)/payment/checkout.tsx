import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  AppState,
  AppStateStatus
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { usePayment } from '../../../hooks/usePayment';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';

export default function PaymentCheckoutScreen() {
  const { bookingId, seatCount } = useLocalSearchParams<{
    bookingId: string;
    seatCount: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { initializePayment, verifyPayment, loading } = usePayment();
  const { showToast } = useToast();
  const { getBookingById } = useBooking();

  const [selectedMethod, setSelectedMethod] = useState('mobile_money');
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const appState = useRef(AppState.currentState);
  const browserOpened = useRef(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    // Set up deep link handling
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Set up AppState listener to detect when user returns to app
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Check for initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL in checkout:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [bookingId]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (browserOpened.current &&
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active') {
      // User returned to the app from browser
      console.log('📱 App returned to foreground, checking payment status...');
      browserOpened.current = false;

      if (bookingId && !checkingPayment) {
        setCheckingPayment(true);
        // Small delay to ensure any deep link is processed first
        setTimeout(() => {
          handleVerifyPayment();
          setCheckingPayment(false);
        }, 1500);
      }
    }
    appState.current = nextAppState;
  };

  const fetchBookingDetails = async () => {
    const data = await getBookingById(bookingId);
    if (data) {
      setBooking(data);
    }
  };

  const handleDeepLink = (event: { url: string }) => {
    const { url } = event;
    console.log('🔗 Deep link received in checkout:', url);

    // Extract bookingId and success status from URL
    let extractedBookingId = bookingId;
    let success = 'false';

    // Parse the URL parameters
    if (url.includes('bookingId=')) {
      const match = url.match(/bookingId=([^&]+)/);
      if (match) extractedBookingId = match[1];
    }

    if (url.includes('success=')) {
      const match = url.match(/success=([^&]+)/);
      if (match) success = match[1];
    } else if (url.includes('/confirmation')) {
      success = 'true';
    }

    // Check if this is a success redirect
    if (success === 'true' || url.includes('success=true') || url.includes('/confirmation')) {
      showToast('Payment successful! Redirecting...', 'success');

      // Navigate to confirmation
      setTimeout(() => {
        router.replace({
          pathname: '/(screens)/booking/confirmation',
          params: { bookingId: extractedBookingId, success: 'true' }
        });
      }, 500);
    }
    else if (url.includes('error') || url.includes('failed') || url.includes('cancel')) {
      Alert.alert(
        'Payment Issue',
        'There was a problem with your payment. You can try again or check your payment status.',
        [
          { text: 'Check Status', onPress: () => handleVerifyPayment() },
          { text: 'Try Again', onPress: () => handlePayment() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handlePayment = async () => {
    if (!bookingId || !booking) return;

    setProcessing(true);

    const amountToPay = booking.totalPrice || booking.amount ||
      ((booking.tripID?.price || 0) * (parseInt(seatCount) || 1));

    const result = await initializePayment(
      bookingId,
      amountToPay,
      selectedMethod
    );

    if (result?.checkoutUrl) {
      console.log('💰 Opening Chapa checkout:', result.checkoutUrl);
      browserOpened.current = true;

      // Open the payment page
      await WebBrowser.openBrowserAsync(result.checkoutUrl, {
        enableBarCollapsing: true,
        showInRecents: true,
        toolbarColor: '#3b82f6',
        controlsColor: '#3b82f6',
        // For Android, this helps with redirect
        createTask: true,
      });

      // When browser closes, verify payment
      // This handles cases where redirect doesn't work
      setTimeout(() => {
        if (!browserOpened.current) return; // Already handled by AppState
        handleVerifyPayment();
      }, 2000);
    } else {
      Alert.alert(
        'Payment Error',
        'Failed to initialize payment. Please try again.',
        [{ text: 'OK' }]
      );
    }

    setProcessing(false);
  };

  const handleVerifyPayment = async () => {
    if (!bookingId) return;

    setCheckingPayment(true);
    showToast('Checking payment status...', 'info');

    try {
      const payment = await verifyPayment(bookingId);

      if (payment && payment.paymentStatus === 'success') {
        showToast('Payment confirmed!', 'success');
        router.replace({
          pathname: '/(screens)/booking/confirmation',
          params: { bookingId, success: 'true' }
        });
      } else if (payment && payment.paymentStatus === 'failed') {
        Alert.alert('Payment Failed', 'Your payment was not successful. Please try again.');
      } else {
        showToast('Payment still processing. Check again later.', 'info');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      showToast('Failed to verify payment', 'error');
    } finally {
      setCheckingPayment(false);
    }
  };

  const paymentMethods = [
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

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  const seatNumbers = booking.seatNumber ? [booking.seatNumber] : (booking.seatNumbers || []);
  const calculatedSeatCount = parseInt(seatCount) || seatNumbers.length || 1;
  const totalAmount = booking.totalPrice || booking.amount || ((booking.tripID?.price || 0) * calculatedSeatCount);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Complete Payment
        </Text>
      </View>

      <View className="flex-1 p-4">
        {/* Amount Summary */}
        <View className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
          <Text className="text-sm text-gray-600 text-center">Total Amount</Text>
          <Text className="text-3xl font-bold text-blue-600 text-center">
            ETB {totalAmount.toLocaleString()}
          </Text>
          <View className="flex-row justify-center flex-wrap gap-1 mt-2">
            {seatNumbers.map((seat: number, index: number) => (
              <View key={index} className="bg-blue-500 px-2 py-1 rounded-full">
                <Text className="text-white text-xs">Seat {seat}</Text>
              </View>
            ))}
          </View>
          <Text className="text-xs text-gray-500 text-center mt-2">
            {calculatedSeatCount} seat(s) × ETB {(booking.pricePerSeat || booking.tripID?.price || 0).toLocaleString()}
          </Text>
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

        {/* Payment Button */}
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading || processing || checkingPayment}
          className={`
            py-4 rounded-xl flex-row items-center justify-center mt-6
            ${loading || processing || checkingPayment ? 'bg-gray-300' : 'bg-blue-600'}
          `}
        >
          {loading || processing || checkingPayment ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CreditCard size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Pay ETB {totalAmount.toLocaleString()}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Verify Button (for testing) */}
        {__DEV__ && (
          <TouchableOpacity
            onPress={handleVerifyPayment}
            disabled={checkingPayment}
            className="py-3 rounded-xl flex-row items-center justify-center mt-3 bg-gray-200"
          >
            {checkingPayment ? (
              <ActivityIndicator size="small" color="#4b5563" />
            ) : (
              <Text className="font-semibold text-gray-700">Check Payment Status</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Security Note */}
        <View className="mt-6 p-3 bg-gray-50 rounded-lg flex-row items-start gap-2">
          <AlertCircle size={16} color="#6b7280" />
          <Text className="flex-1 text-xs text-gray-500">
            Your payment is secure and encrypted. You will be redirected to our payment partner's secure page to complete the transaction.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}