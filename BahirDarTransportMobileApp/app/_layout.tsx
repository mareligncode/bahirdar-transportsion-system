import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { storage } from '@/lib/storage';
import * as Linking from 'expo-linking';

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

  // Check storage on initial load
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const accessToken = await storage.getToken();
        const userData = await storage.getUser();
        const isLoggedIn = await storage.isLoggedIn();

        console.log('🔍 Storage check:', {
          hasAccessToken: !!accessToken,
          hasUserData: !!userData,
          isLoggedIn
        });

        setIsCheckingStorage(false);
      } catch (error) {
        console.error('❌ Storage check error:', error);
        setIsCheckingStorage(false);
      }
    };

    checkStorage();
  }, []);

  useEffect(() => {
    console.log('📍 Layout: Routing check', {
      isAuthenticated,
      isLoading,
      isCheckingStorage,
      segments,
    });

    if (isLoading || isCheckingStorage) {
      console.log('⏳ Layout: Waiting for auth initialization...');
      return;
    }

    // Convert segments to array and access safely
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

    console.log('📍 Layout: Decision data:', {
      currentRoute,
      isNestedAuthRoute,
      isResetPasswordRoute,
      isAuthenticated,
      isAuthRoute,
      isTabsRoute,
      isScreensRoute,
      isIndexRoute,
      isPublicRoute
    });

    // ALWAYS allow reset password route - NO AUTH REQUIRED
    if (isResetPasswordRoute) {
      console.log('✅ Layout: Allowed (reset password route - public)');
      return;
    }

    // User is NOT authenticated
    if (!isAuthenticated) {
      console.log('👤 Layout: User NOT authenticated');

      // If trying to access protected routes, redirect to login
      if (isTabsRoute || isScreensRoute) {
        console.log('🚫 Layout: Redirecting to login (unauthenticated + protected route)');
        router.replace('/auth/Login');
        return;
      }

      // If on auth or public pages, stay there
      if (isAuthRoute || isPublicRoute) {
        console.log('✅ Layout: Allowed (unauthenticated on auth/public)');
        return;
      }

      // Default: go to index
      console.log('➡️ Layout: Default redirect to index');
      router.replace('/');
      return;
    }

    // User IS authenticated
    console.log('👤 Layout: User IS authenticated');

    // If on auth pages, redirect to home tab
    if (isAuthRoute) {
      console.log('🏠 Layout: Redirecting to home (authenticated on auth)');
      router.replace('/tabs/home');
      return;
    }

    // If on index, redirect to home tab
    if (isIndexRoute) {
      console.log('🏠 Layout: Redirecting to home (authenticated on index)');
      router.replace('/tabs/home');
      return;
    }

    // All other routes are OK
    console.log('✅ Layout: Allowed (authenticated on protected route)');

  }, [isAuthenticated, isLoading, segments, isCheckingStorage]);

  // Show loader while checking
  if (isLoading || isCheckingStorage) {
    return <Loader message="Loading..." />;
  }

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}