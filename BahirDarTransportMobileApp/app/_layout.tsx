import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, LogBox } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Suppress non-fatal SDK 54+ development warnings
LogBox.ignoreLogs(['Unable to activate keep awake']);
import { Loader } from '@/components/common/Loader';
import { storage } from '@/lib/storage';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding before auth is checked
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Handle deep links - FIXED TypeScript error
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      console.log('🔗 Deep link received in _layout:', url);

      // Parse the URL
      const parsed = Linking.parse(url);
      const queryParams = parsed.queryParams;

      // Handle reset password links
      if (url.includes('reset-password') || url.includes('redirect.html')) {
        // ✅ FIXED: Type-safe token extraction
        let token: string | null = null;

        // Try to get token from query params
        if (queryParams?.token) {
          const tokenValue = queryParams.token;
          token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;
        }

        // If not found, try to extract from URL using regex
        if (!token) {
          const match = url.match(/[?&]token=([^&]+)/);
          token = match ? match[1] : null;
        }

        if (token) {
          console.log('✅ Reset token found in deep link:', token);
          // Navigate to reset password screen with token
          setTimeout(() => {
            router.push({
              pathname: '/auth/reset-password',
              params: { token }
            });
          }, 100);
        } else {
          console.log('❌ No token found in deep link:', url);
        }
      } else if (url.includes('booking/confirmation')) {
        let bookingId: string | null = null;
        if (queryParams?.bookingId) {
          const bsIdVal = queryParams.bookingId;
          bookingId = Array.isArray(bsIdVal) ? bsIdVal[0] : bsIdVal;
        }

        if (!bookingId) {
          const match = url.match(/[?&]bookingId=([^&]+)/);
          bookingId = match ? match[1] : null;
        }

        if (bookingId) {
          console.log('✅ Found booking Id in deep link:', bookingId);
          setTimeout(() => {
            router.push({
              pathname: '/(screens)/booking/confirmation',
              params: { bookingId }
            });
          }, 100);
        }
      }
    };

    // Subscribe to deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  // Initial storage check removed (redundant with AuthStore)

  useEffect(() => {
    if (isLoading) return;

    // Hide splash screen once loading is complete
    const hideAsync = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('SplashScreen.hideAsync error:', e);
      }
    };
    hideAsync();

    const segmentsArray = segments as string[];
    const currentRoute = segmentsArray[0] || 'index';

    // Check if we're on a nested route like auth/reset-password
    const isNestedAuthRoute = segmentsArray[0] === 'auth' && segmentsArray.length > 1;
    const isResetPasswordRoute = isNestedAuthRoute && segmentsArray[1] === 'reset-password';

    // Check route groups and folders
    const isAuthRoute = currentRoute === 'auth' && !isResetPasswordRoute;
    const isTabsRoute = currentRoute === 'tabs';
    const isScreensRoute = currentRoute === '(screens)';
    const isIndexRoute = currentRoute === 'index' || currentRoute === '';
    const isPublicRoute = isIndexRoute || ['privacy', 'terms'].includes(currentRoute);

    // ALWAYS allow reset password route - NO AUTH REQUIRED
    if (isResetPasswordRoute) return;

    // User is NOT authenticated
    if (!isAuthenticated) {
      if (isTabsRoute || isScreensRoute) {
        router.replace('/auth/Login');
        return;
      }

      if (isAuthRoute || isPublicRoute) return;

      router.replace('/');
      return;
    }

    // User IS authenticated
    if (isAuthRoute || isIndexRoute) {
      router.replace('/tabs/home');
      return;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <Loader message="Loading..." />;
  }

  const content = (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Public / Root */}
      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />

      {/* Auth Screens */}
      <Stack.Screen name="auth/Login" />
      <Stack.Screen name="auth/Register" />
      <Stack.Screen name="auth/Forgot-Password" />
      <Stack.Screen name="auth/reset-password" />

      {/* Tabs (Main App Navigation) */}
      <Stack.Screen
        name="tabs"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />

      {/* Screens (Modal/Stack screens) */}
      <Stack.Screen
        name="(screens)"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack>
  );

  return (
    <SafeAreaProvider>
      {Platform.OS === 'web' ? (
        <View style={{
          flex: 1,
          backgroundColor: '#F3F4F6', // gray-100
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            width: '100%',
            maxWidth: 480,
            height: '100%',
            backgroundColor: 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}>
            {content}
          </View>
        </View>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}