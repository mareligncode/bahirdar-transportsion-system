import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, LogBox } from 'react-native';
import { useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { useTranslation } from '@/hooks/useTranslation';

import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { FontProvider } from '@/context/FontContext';
import { socketService } from '@/lib/socketService';
import { useNotificationStore } from '@/store/notificationStore';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '@/lib/notifications';
import { AppState, AppStateStatus } from 'react-native';

LogBox.ignoreLogs(['Unable to activate keep awake']);

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { translate } = useTranslation();
  const segments = useSegments();
  const router = useRouter();
  const refreshNotifications = useNotificationStore(state => state.refreshOnLogin);

  // Set up notifications and sockets globally when authenticated
  useEffect(() => {
    let unsubscribeNotifications: (() => void) | undefined;

    if (isAuthenticated) {
      // Connect to Socket.io for real-time in-app notifications
      socketService.connect();

      // Register for push notifications globally
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          console.log('📱 Global Push token registered:', token);
        }
      }).catch(err => console.log('📱 Push registration skipped:', err.message));

      // Set up listeners for local/push notifications
      unsubscribeNotifications = setupNotificationListeners();

      // Refresh notifications when logging in or App comes to foreground
      refreshNotifications();
    } else {
      socketService.disconnect();
    }

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      socketService.disconnect();
    };
  }, [isAuthenticated, refreshNotifications]);

  // Refresh notifications when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        refreshNotifications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, refreshNotifications]);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      console.log('🔗 Deep link received in _layout:', url);

      const parsed = Linking.parse(url);
      const queryParams = parsed.queryParams;

      if (url.includes('reset-password') || url.includes('redirect.html')) {
        let token: string | null = null;

        if (queryParams?.token) {
          const tokenValue = queryParams.token;
          token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;
        }

        if (!token) {
          const match = url.match(/[?&]token=([^&]+)/);
          token = match ? match[1] : null;
        }

        if (token) {
          console.log('✅ Reset token found in deep link:', token);
          setTimeout(() => {
            router.push({
              pathname: '/auth/reset-password',
              params: { token }
            });
          }, 100);
        } else {
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
          setTimeout(() => {
            router.push({
              pathname: '/(screens)/booking/confirmation',
              params: { bookingId }
            });
          }, 100);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, [router]);

  const handleNavigation = useCallback(() => {
    if (isLoading) return;

    const segmentsArray = segments as string[];
    const currentRoute = segmentsArray[0] || 'index';

    const isNestedAuthRoute = segmentsArray[0] === 'auth' && segmentsArray.length > 1;
    const isResetPasswordRoute = isNestedAuthRoute && segmentsArray[1] === 'reset-password';

    const isAuthRoute = currentRoute === 'auth' && !isResetPasswordRoute;
    const isTabsRoute = currentRoute === 'tabs';
    const isScreensRoute = currentRoute === '(screens)';
    const isIndexRoute = currentRoute === 'index' || currentRoute === '';
    const isPublicRoute = isIndexRoute || ['privacy', 'terms'].includes(currentRoute);

    if (isResetPasswordRoute) return;

    if (!isAuthenticated) {
      if (isTabsRoute || isScreensRoute) {
        router.replace('/auth/Login');
        return;
      }

      if (isAuthRoute || isPublicRoute) return;

      router.replace('/');
      return;
    }

    if (isAuthRoute || isIndexRoute) {
      router.replace('/tabs/home');
      return;
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    handleNavigation();

    const hideSplashScreen = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Failed to hide splash screen:', e);
      }
    };

    if (!isLoading) {
      hideSplashScreen();
    }
  }, [handleNavigation, isLoading]);

  if (isLoading) {
    return <Loader message={translate('loading')} />;
  }

  const content = (
    <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />

      <Stack.Screen name="auth/Login" />
      <Stack.Screen name="auth/Register" />
      <Stack.Screen name="auth/Forgot-Password" />
      <Stack.Screen name="auth/reset-password" />

      <Stack.Screen
        name="tabs"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="(screens)"
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="menu"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );

  return (
    Platform.OS === 'web' ? (
      <View style={{
        flex: 1,
        backgroundColor: '#F3F4F6',
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
    )
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <FontProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </FontProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}