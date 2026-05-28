import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
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
import { useToast } from '../../../components/common/Toast';
import { formatCurrency } from '../../../utils/helpers';
import { Booking } from '../../../types';
import { AppText } from '../../../components/common/AppText';
import { useTranslation } from '../../../hooks/useTranslation';
import { useTheme } from '../../../context/ThemeContext';
import ReceiptUpload from '../../../components/payment/ReceiptUpload';
import { usePaymentStore } from '../../../store/paymentStore';

type PaymentMethodType = 'mobile_money' | 'card' | 'bank_transfer' | 'cash';

export default function PaymentCheckoutScreen() {
  const { bookingIds, bookingId } = useLocalSearchParams<{
    bookingIds: string;
    bookingId: string;
  }>();
  const router = useRouter();
  const { initializePayment, verifyPayment, loading: paymentLoading } = usePayment();
  const { getBookingById } = useBooking();
  const { showToast } = useToast();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('mobile_money');
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

  const parsedBookingIds = useMemo(() => {
    try {
      return bookingIds ? JSON.parse(bookingIds) : (bookingId ? [bookingId] : []);
    } catch (error) {
      console.error('Error parsing bookingIds:', error);
      return [];
    }
  }, [bookingIds, bookingId]);

  const allSeatNumbers = useMemo(() => {
    const seats = bookings.flatMap(booking =>
      booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : [])
    );
    console.log('🎫 All seat numbers for payment:', seats);
    return seats;
  }, [bookings]);

  const pricePerSeat = useMemo(() => {
    if (bookings.length === 0) return 0;

    if (bookings[0]?.pricePerSeat) {
      return bookings[0].pricePerSeat;
    }
    if (typeof bookings[0]?.tripID === 'object' && bookings[0]?.tripID?.price) {
      return bookings[0].tripID.price;
    }

    if (allSeatNumbers.length > 0 && bookings[0]?.totalPrice) {
      return bookings[0].totalPrice / allSeatNumbers.length;
    }

    return 0;
  }, [bookings, allSeatNumbers]);

  const totalAmount = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      return sum + (booking.totalPrice || booking.amount || 0);
    }, 0);
  }, [bookings]);

  const isGroupBooking = useMemo(() =>
    bookings.length > 0 && (bookings[0]?.isGroupBooking || allSeatNumbers.length > 1),
    [bookings, allSeatNumbers]
  );

  const fetchAllBookingDetails = useCallback(async () => {
    try {
      const fetchedBookings: Booking[] = [];

      for (const id of parsedBookingIds) {
        try {
          console.log(`📋 Fetching booking ${id}...`);
          const data = await getBookingById(id);
          if (data) {
            const bookingData = { ...data };
            if (!bookingData.seatNumbers && bookingData.seatNumber) {
              bookingData.seatNumbers = [bookingData.seatNumber];
            }

            fetchedBookings.push(bookingData);
          } else {
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
          } else {
          }
        }
      }

      setBookings(fetchedBookings);
      setFetchRetryCount(0);

      if (fetchedBookings.length === 0 && parsedBookingIds.length > 0) {
        showToast(translate('trip_not_found_err'), 'error');
        setTimeout(() => {
          router.replace('/tabs/trips');
        }, 2000);
      } else if (fetchedBookings.length < parsedBookingIds.length) {
        showToast(translate('found_bookings_count', { fetched: fetchedBookings.length, total: parsedBookingIds.length }), 'info');
      }
    } catch {
    }
  }, [parsedBookingIds, getBookingById, showToast, translate, router]);

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

  const handleVerification = useCallback(async () => {
    if (verifying || parsedBookingIds.length === 0 || paymentCompleted) return;

    setVerifying(true);
    showToast(translate('verifying_payment'), 'info');

    try {
      if (!globalTxRef) {
        showToast(translate('no_tx_ref_err'), 'error');
        setVerifying(false);
        return;
      }

      const result = await verifyPayment(globalTxRef);
      if (result.success) {
        if (result.payment) {
          if (result.payment.paymentStatus === 'success' || result.payment.paymentStatus === 'processing') {
            setPaymentCompleted(true);
            setShowWebView(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(translate('payment_confirmed'), 'success');

            setTimeout(() => {
              router.replace({
                pathname: '/(screens)/booking/confirmation',
                params: {
                  bookingIds: JSON.stringify(parsedBookingIds),
                  success: 'true',
                  txRef: globalTxRef
                }
              });
            }, 300);
            return;
          }
        } else {
          setPaymentCompleted(true);
          setShowWebView(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast(translate('payment_confirmed'), 'success');

          setTimeout(() => {
            router.replace({
              pathname: '/(screens)/booking/confirmation',
              params: {
                bookingIds: JSON.stringify(parsedBookingIds),
                success: 'true',
                txRef: globalTxRef
              }
            });
          }, 300);
          return;
        }
      }
      showToast(result.message || translate('payment_pending_msg'), 'info');

    } catch {
      showToast(translate('verification_failed_msg'), 'warning');
    } finally {
      setVerifying(false);
    }
  }, [verifying, parsedBookingIds, paymentCompleted, globalTxRef, router, showToast, verifyPayment, translate]);

  const closeWebView = useCallback(() => {
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }

    setShowWebView(false);
    Alert.alert(
      translate('payment_failed_title'),
      translate('payment_failed_desc'),
      [
        { text: translate('success'), onPress: handleVerification },
        { text: translate('back'), onPress: handleGoToConfirmation },
        { text: translate('cancel'), style: 'cancel' }
      ]
    );
  }, [handleVerification, handleGoToConfirmation, translate]);

  const handleNavigationStateChange = useCallback((navState: any) => {
    const { url } = navState;
    if (url.includes('tx_ref=')) {
      const match = url.match(/[?&]tx_ref=([^&]+)/);
      if (match && match[1]) {
        setGlobalTxRef(match[1]);
        console.log('🔍 Extracted tx_ref:', match[1]);
      }
    }
    const isPaymentSuccess =
      url.includes('payment/success') ||
      url.includes('status=success') ||
      url.includes('payment_status=success') ||
      url.includes('transaction/success') ||
      url.includes('checkout/success') ||
      url.includes('checkout/test-payment/success') ||
      url.includes('checkout/payment-receipt') ||
      url.includes('payment-receipt') ||
      // Intercept Chapa's callback to our backend /payment/verify/ endpoint
      url.includes('/api/payment/verify/') ||
      url.includes('/payment/verify/') ||
      (url.includes('chapa.co/payment') && url.includes('success')) ||
      (url.includes('chapa.co/receipt')) ||
      (url.includes('chapa.co/transaction') && url.includes('success')) ||
      (url.includes('chapa.co') && (url.includes('success') || url.includes('completed') || url.includes('receipt'))) ||
      url.includes('/booking/confirmation') ||
      url.includes('booking/confirmation') ||
      url.includes('payment=completed') ||
      (url.includes('success=true') && (url.includes('bookingId=') || url.includes('bookingID=')));

    const isPaymentFailure =
      url.includes('error=') ||
      url.includes('status=failed') ||
      url.includes('status=cancelled') ||
      url.includes('payment/failed') ||
      url.includes('payment/cancelled');

    // Chapa specific: If we are on a Chapa domain and not completed,
    // start a more aggressive verification timer if it looks like a receipt/success page
    if (url.includes('chapa.co') && !paymentCompleted) {
      const isLikelySuccess =
        url.includes('receipt') ||
        url.includes('success') ||
        url.includes('completed') ||
        url.includes('test-payment') ||
        url.includes('checkout/test');

      if (chapaTimerRef.current) {
        clearTimeout(chapaTimerRef.current);
      }

      chapaTimerRef.current = setTimeout(() => {
        if (!paymentCompleted) {
          handleVerification();
        }
      }, isLikelySuccess ? 1500 : 7000); // Very fast check if it looks like success
    }

    if (isPaymentSuccess) {
      console.log('✅ Payment success detected from URL:', url);
      setShowWebView(false);
      setPaymentCompleted(true);
      
      const { addPayment } = usePaymentStore.getState();
      parsedBookingIds.forEach((id: string) => {
        addPayment({
          _id: globalTxRef || 'opt_' + Date.now().toString(),
          bookingID: id,
          paymentStatus: 'success',
          amount: totalAmount,
          currency: 'ETB',
          paymentMethod: selectedMethod,
          paymentGateway: 'chapa',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(translate('success'), 'success');

      // Reduce delay to back to confirmation page
      setTimeout(() => {
        router.replace({
          pathname: '/(screens)/booking/confirmation',
          params: {
            bookingIds: JSON.stringify(parsedBookingIds),
            success: 'true',
            ...(globalTxRef && { txRef: globalTxRef })
          }
        });
      }, 300); // Reduced from 1000ms

      return false;
    }

    if (isPaymentFailure) {
      setShowWebView(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        translate('payment_failed_title'),
        translate('payment_failed_desc'),
        [
          { text: translate('try_again'), onPress: () => setShowWebView(true) },
          { text: translate('back'), onPress: handleGoToConfirmation }
        ]
      );

      return false;
    }

    return true;
  }, [paymentCompleted, parsedBookingIds, globalTxRef, router, showToast, handleVerification, handleGoToConfirmation, translate]);

  const handlePayment = async () => {
    if (parsedBookingIds.length === 0 || bookings.length === 0) {
      showToast(translate('no_bookings_found_to_pay'), 'error');
      return;
    }

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await initializePayment(
        parsedBookingIds[0],
        totalAmount,
        selectedMethod
      );

      if (result?.checkoutUrl) {
        setCheckoutUrl(result.checkoutUrl);
        setGlobalTxRef(result.txRef);
        setBackendAmount(result.amount);
        setShowWebView(true);
        setTimeout(() => {
          if (!paymentCompleted && showWebView) {
            handleVerification();
          }
        }, 45000);
      } else {
        Alert.alert(translate('error'), translate('something_went_wrong'));
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || translate('failed_init_payment');
      Alert.alert(translate('error'), msg);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (showWebView && checkoutUrl) {
      const timer = setTimeout(() => {
        console.log('⏰ Payment timeout - auto redirecting');
        setShowWebView(false);
        setPaymentCompleted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast(translate('verifying_payment'), 'warning');

        setTimeout(() => {
          router.replace({
            pathname: '/(screens)/booking/confirmation',
            params: {
              bookingIds: JSON.stringify(parsedBookingIds),
              success: 'pending'
            }
          });
        }, 1000);
      }, 300000);

      paymentTimerRef.current = timer;

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [showWebView, checkoutUrl, parsedBookingIds, router, showToast, translate]);

  useEffect(() => {
    if (paymentCompleted && paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
  }, [paymentCompleted]);

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

  useEffect(() => {
    if (parsedBookingIds.length > 0) {
      fetchAllBookingDetails();
    }
  }, [parsedBookingIds, fetchAllBookingDetails]);

  useEffect(() => {
    if (bookings.length === 0 && parsedBookingIds.length > 0 && fetchRetryCount < 3) {
      const retryTimer = setTimeout(() => {
        setFetchRetryCount(prev => prev + 1);
        fetchAllBookingDetails();
      }, 1500);

      return () => clearTimeout(retryTimer);
    }

    if (fetchRetryCount >= 3 && bookings.length === 0) {
      showToast(translate('something_went_wrong'), 'error');
      setTimeout(() => {
        router.back();
      }, 2000);
    }
  }, [bookings.length, parsedBookingIds, fetchRetryCount, router, showToast, translate, fetchAllBookingDetails]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showWebView) {
        closeWebView();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showWebView, closeWebView]);




  const paymentMethods: { id: PaymentMethodType; name: string; icon: any; description: string }[] = [
    {
      id: 'mobile_money',
      name: translate('online_payment(chapa)'),
      icon: Smartphone,
      description: translate('mobile_money_desc')
    },
    {
      id: 'bank_transfer',
      name: translate('bank_transfer') || 'Bank Transfer',
      icon: Banknote,
      description: translate('bank_transfer_desc') || 'Upload a bank transfer receipt'
    },
    {
      id: 'cash',
      name: translate('cash_payment'),
      icon: Banknote,
      description: translate('cash_payment_desc')
    }
  ];

  if (bookings.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'} justify-center items-center`}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{translate('loading_content')}</AppText>
      </SafeAreaView>
    );
  }
  if (showWebView && checkoutUrl) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <View className={`px-4 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} flex-row items-center`}>
          <TouchableOpacity onPress={closeWebView} className="mr-3">
            <ArrowLeft size={24} color={isDark ? colors.textSecondary : "#4b5563"} />
          </TouchableOpacity>
          <AppText className={`flex-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {translate('secure_payment_title')}
          </AppText>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-white">
              <ActivityIndicator size="large" color="#3b82f6" />
              <AppText className="mt-4 text-gray-600">{translate('loading')}</AppText>
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

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right', 'bottom']}>
      <View className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex-row items-center`}>
        <TouchableOpacity onPress={handleGoToConfirmation} className="mr-3">
          <ArrowLeft size={24} color={isDark ? colors.textSecondary : "#4b5563"} />
        </TouchableOpacity>
        <AppText className={`flex-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {translate('complete_payment')}
        </AppText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' }} className="p-5 rounded-xl border mb-6">
          <AppText className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>{translate('total_amount')}</AppText>
          <AppText className={`text-3xl font-bold ${isDark ? colors.primary : '#2563eb'} text-center`}>
            {formatCurrency(totalAmount)}
          </AppText>

          <View className="flex-row justify-center flex-wrap gap-2 mt-3">
            {allSeatNumbers.length > 0 ? (
              allSeatNumbers.map((seat: number, index: number) => (
                <View key={index} className="bg-blue-500 px-4 py-2 rounded-full shadow-sm">
                  <AppText className="text-white text-sm font-bold">{translate('seat_label', { number: seat })}</AppText>
                </View>
              ))
            ) : (
              <View className="bg-gray-400 px-4 py-2 rounded-full">
                <AppText className="text-white text-sm font-bold">{translate('loading_seats')}</AppText>
              </View>
            )}
          </View>
          {isGroupBooking && (
            <View className={`${isDark ? 'bg-purple-900/20' : 'bg-purple-100'} px-3 py-1 rounded-full self-center mt-2`}>
              <AppText className={`${isDark ? 'text-purple-400' : 'text-purple-700'} text-xs font-bold`}>
                {translate('group_booking_label')} • {allSeatNumbers.length} {translate('seats')}
              </AppText>
            </View>
          )}
          {allSeatNumbers.length > 0 && (
            <>
              <AppText className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center mt-3`}>
                {allSeatNumbers.length} {allSeatNumbers.length === 1 ? translate('passenger_label') : translate('passengers')} × {formatCurrency(pricePerSeat)}
              </AppText>

              <View className={`flex-row flex-wrap justify-between items-start pt-4 border-t ${isDark ? 'border-blue-900/30' : 'border-gray-100'}`}>
                <View className="mr-4 mb-2">
                  <AppText className="text-gray-600 font-medium">{translate('total_amount')}</AppText>
                  {allSeatNumbers.length > 1 && (
                    <AppText className="text-xs text-gray-500">
                      {allSeatNumbers.length} {translate('seats')}
                    </AppText>
                  )}
                </View>
                <View className="items-end">
                  <AppText className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {formatCurrency(backendAmount || totalAmount)}
                  </AppText>
                  <AppText className="text-xs text-gray-500 text-right">
                    {translate('pending_seats_note')}
                  </AppText>
                </View>
              </View>
            </>
          )}
        </View>
        <AppText className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>{translate('payment_methods_title')}</AppText>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setSelectedMethod(method.id)}
            className={`
              flex-row items-center p-4 mb-3 rounded-xl border-2
              ${selectedMethod === method.id
                ? (isDark ? 'border-blue-600 bg-blue-900/10' : 'border-blue-500 bg-blue-50')
                : `${isDark ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-white'}`
              }
            `}
          >
            <View className={`
              w-10 h-10 rounded-full items-center justify-center mr-3
              ${selectedMethod === method.id
                ? 'bg-blue-500'
                : isDark ? 'bg-gray-700' : 'bg-gray-100'}
            `}>
              <method.icon
                size={20}
                color={selectedMethod === method.id
                  ? 'white'
                  : isDark ? '#9ca3af' : '#6b7280'}
              />
            </View>
            <View className="flex-1">
              <AppText className={`font-semibold ${selectedMethod === method.id
                ? (isDark ? 'text-blue-400' : 'text-blue-600')
                : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
                {method.name}
              </AppText>
              <AppText className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{method.description}</AppText>
            </View>
            {selectedMethod === method.id && (
              <CheckCircle size={20} color="#3b82f6" />
            )}
          </TouchableOpacity>
        ))}

        {selectedMethod === 'bank_transfer' ? (
          <View className="mt-4">
            <ReceiptUpload
              bookingId={parsedBookingIds[0]}
              amount={backendAmount || totalAmount}
              onVerificationSuccess={(data) => {
                setPaymentCompleted(true);
                setShowWebView(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                setTimeout(() => {
                  router.replace({
                    pathname: '/(screens)/booking/confirmation',
                    params: {
                      bookingIds: JSON.stringify(parsedBookingIds),
                      success: 'true',
                      txRef: data.payment?.gatewayTransactionID || ''
                    }
                  });
                }, 1000);
              }}
            />
          </View>
        ) : (
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
                <AppText className="text-white font-semibold ml-2 text-base flex-shrink" numberOfLines={1} adjustsFontSizeToFit>
                  {translate('pay_btn', { amount: formatCurrency(backendAmount || totalAmount) })}
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleVerification}
          disabled={verifying || paymentCompleted}
          className={`py-3 rounded-xl flex-row items-center justify-center mt-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
        >
          {verifying ? (
            <ActivityIndicator size="small" color={isDark ? colors.textSecondary : "#4b5563"} />
          ) : (
            <AppText className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{translate('check_payment_status')}</AppText>
          )}
        </TouchableOpacity>
        <View className={`mt-6 p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
          <View className="flex-row items-start gap-2">
            <AlertCircle size={16} color={isDark ? colors.textTertiary : "#6b7280"} />
            <AppText className={`flex-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {translate('secure_payment_note')}
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}