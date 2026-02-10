import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { storage } from '@/lib/storage';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const segments = useSegments(); 
  const router = useRouter();

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
      currentSegment: segments[0]
    });

    if (isLoading || isCheckingStorage) {
      console.log('⏳ Layout: Waiting for auth initialization...');
      return;
    }

    // FIX: Safe segment access
    const currentRoute = segments[0] || 'index';
    const secondSegment = segments.length > 1 ? segments[1] : undefined; // Safe access
    
    // Check route groups and folders
    const isAuthRoute = currentRoute === 'auth';
    const isTabsRoute = currentRoute === 'tabs';
    const isScreensRoute = currentRoute === '(screens)';
    const isIndexRoute = currentRoute === 'index' || currentRoute === '';
    const isPublicRoute = isIndexRoute || ['privacy', 'terms'].includes(currentRoute);

    console.log('📍 Layout: Decision data:', {
      currentRoute,
      secondSegment,
      isAuthenticated,
      isAuthRoute,
      isTabsRoute,
      isScreensRoute,
      isIndexRoute,
      isPublicRoute
    });

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

        {/* Auth */}
        <Stack.Screen name="auth/Login" />
        <Stack.Screen name="auth/Register" />
        <Stack.Screen name="auth/Forgot-Password" />

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