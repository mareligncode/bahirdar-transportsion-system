import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated as RNAnimated,
  StatusBar,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  useSharedValue,
  withDelay
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader } from '@/components/common/Loader';
import { useTrips } from '@/hooks/useTrips';
import { useBooking } from '@/hooks/useBooking';
import { useTheme } from '@/context/ThemeContext';
import {
  Bus,
  Shield,
  Clock,
  Ticket,
  CreditCard,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  CheckCircle,
  ChevronRight,
  PlayCircle,
  PhoneCall,
  Mail,
  Map
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Use your existing images
const HERO_IMAGES = [
  require('@/assets/images/image1.png'),
  require('@/assets/images/image2.png'),
  require('@/assets/images/image3.png'),
];

// Fallback color if image fails to load
const FALLBACK_COLORS = ['#3B82F6', '#10B981', '#8B5CF6'];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { translate } = useTranslation();
  const { getMyBookings } = useBooking();
  const { isDark, colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useSharedValue(1);
  const [imageError, setImageError] = useState(false);
  const [realTestimonials, setRealTestimonials] = useState<any[]>([]);
  const { trips, fetchAllTrips, stations, fetchStations, loading: dataLoading } = useTrips();
  const [stats, setStats] = useState({ activeTrips: 0, totalStations: 0 });

  // Animated styles must be at the top level to follow Rules of Hooks
  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withRepeat(withSpring(1.05, { damping: 2, stiffness: 80 }), -1, true) }]
  }));

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/tabs/home');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!isAuthenticated) {
      interval = setInterval(() => {
        fadeAnim.value = withSequence(
          withSpring(0, { duration: 300 }),
          withDelay(0, withSpring(1, { duration: 300 }))
        );
        setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
          setImageError(false);
        }, 300);
      }, 4000);
    }

    return () => clearInterval(interval);
  }, [isAuthenticated, fadeAnim]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [tripsData, stationsData] = await Promise.all([
          fetchAllTrips({ limit: 100 }),
          fetchStations()
        ]);
        setStats({
          activeTrips: (tripsData || []).filter((t: any) => t.tripStatus === 'scheduled').length,
          totalStations: (stationsData || []).length
        });
      } catch (err) {
        console.warn('Failed to fetch landing stats:', err);
      }
    };

    if (!isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const handleImageError = () => {
    setImageError(true);
  };


  if (isLoading) {
    return <Loader message={translate('loading')} />;
  }

  const features = [
    {
      icon: Bus,
      title: translate('feature_buses'),
      description: translate('feature_buses_desc'),
      color: 'bg-blue-500',
      route: '/tabs/trips',
    },
    {
      icon: Clock,
      title: translate('feature_ontime'),
      description: translate('feature_ontime_desc'),
      color: 'bg-green-500',
      route: '/tabs/trips',
    },
    {
      icon: Shield,
      title: translate('feature_safe'),
      description: translate('feature_safe_desc'),
      color: 'bg-purple-500',
      route: '/menu/support',
    },
    {
      icon: CreditCard,
      title: translate('feature_payment'),
      description: translate('feature_payment_desc'),
      color: 'bg-orange-500',
      route: '/(screens)/payment/history',
    },
  ];

  const steps = [
    {
      number: '01',
      title: translate('step_1_title'),
      description: translate('step_1_desc'),
      icon: Bus,
    },
    {
      number: '02',
      title: translate('step_2_title'),
      description: translate('step_2_desc'),
      icon: CreditCard,
    },
    {
      number: '03',
      title: translate('step_3_title'),
      description: translate('step_3_desc'),
      icon: Ticket,
    },
    {
      number: '04',
      title: translate('step_4_title'),
      description: translate('step_4_desc'),
      icon: Users,
    },
  ];

  // Mock testimonials removed as requested

  const quickDemos = [
    {
      id: 1,
      title: translate('booking_demo'),
      icon: Ticket,
      time: '1 min',
      route: '/tabs/trips/search',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      title: translate('view_tickets'),
      icon: CheckCircle,
      time: 'QR Code',
      route: '/tabs/tickets',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 3,
      title: translate('payment'),
      icon: CreditCard,
      time: translate('secure'),
      route: '/(screens)/payment/checkout',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 4,
      title: translate('profile'),
      icon: Users,
      time: translate('personal_info'),
      route: '/tabs/profile',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#111827' : '#F3F4F6'}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Hero Section with Auto-sliding Images */}
        <View className="relative h-80">
          {imageError ? (
            <View
              className="absolute w-full h-full"
              style={{ backgroundColor: FALLBACK_COLORS[currentSlide] }}
            />
          ) : (
            <Animated.Image
              source={HERO_IMAGES[currentSlide]}
              style={[
                {
                  width: '100%',
                  height: '100%',
                },
                fadeAnimatedStyle
              ]}
              className="absolute"
              resizeMode="cover"
              onError={handleImageError}
            />
          )}

          {/* Overlay gradient */}
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

          <View className="absolute top-6 left-4 right-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Sparkles size={28} color="#FFD700" />
                <AppText variant="h2" weight="bold" color="white" className="ml-2">
                  {translate('app_name_full')}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/auth/Login')}
                className="border border-white/30 px-4 py-2 rounded-full"
                activeOpacity={0.7}
              >
                <AppText weight="medium" color="white">{translate('sign_in')}</AppText>
              </TouchableOpacity>
            </View>
          </View>

          <View className="absolute bottom-6 left-4 right-4">
            <Animated.View entering={FadeInLeft.duration(600).delay(200)}>
              <AppText variant="h1" weight="bold" color="white" className="mb-2 leading-tight">
                {translate('smart_travel')}{' '}
                <AppText weight="bold" color="accent">Bahir Dar</AppText>
              </AppText>
            </Animated.View>
            <Animated.View entering={FadeInLeft.duration(600).delay(400)}>
              <AppText variant="bodyLarge" color="white" className="mb-6 opacity-90">
                {translate('landing_sub')}
              </AppText>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(600).delay(600)}>
              <TouchableOpacity
                onPress={() => router.push('/auth/Register')}
                className="bg-white py-4 px-6 rounded-full flex-row items-center justify-center active:opacity-90 shadow-lg"
                activeOpacity={0.8}
              >
                <AppText variant="h3" weight="bold" color="primary">
                  {translate('get_started')}
                </AppText>
                <ArrowRight size={20} color="#1a56db" className="ml-2" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Dots indicator */}
          <View className="absolute bottom-32 left-0 right-0 flex-row justify-center">
            {HERO_IMAGES.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentSlide(index)}
                className="mx-1"
              >
                <View
                  className={`w-2 h-2 rounded-full ${currentSlide === index ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Features / Quick Stats */}
        <View className="px-4 py-4 -mt-8">
          <AppText variant="h3" weight="bold" color="textPrimary" className="mb-4">
            {translate('quick_highlights' as any) || 'Quick Highlights'}
          </AppText>
          <Animated.View
            entering={FadeInUp.duration(600).delay(800)}
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-5 border`}
          >
            <View className="flex-row flex-wrap -mx-2">
              {features.map((feature: any, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-1/2 px-2 mb-4"
                  onPress={() => router.push(feature.route as any)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Animated.View
                      entering={ZoomIn.duration(400).delay(1000 + (index * 100))}
                      className={`${feature.color} w-10 h-10 rounded-lg items-center justify-center mr-3 shadow-sm`}
                    >
                      <feature.icon size={20} color="white" />
                    </Animated.View>
                    <View className="flex-1">
                      <AppText weight="bold" color="textPrimary" style={{ fontSize: 13 }}>
                        {feature.title}
                      </AppText>
                      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                        {feature.description}
                      </AppText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* How It Works */}
        <View className="px-4 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <AppText variant="h3" weight="bold" color="textPrimary">
              {translate('landing_how_it_works')}
            </AppText>
            <TouchableOpacity onPress={() => router.push('/auth/Register')}>
              <AppText weight="semibold" color="primary">{translate('try_now')} →</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {steps.map((step, index) => (
              <Animated.View
                key={index}
                entering={FadeInRight.duration(500).delay(200 * index)}
                className="w-64 mr-4"
              >
                <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-sm border`}>
                  <View className="flex-row items-center mb-4">
                    <View className={`w-12 h-12 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-full items-center justify-center mr-4`}>
                      <AppText weight="bold" color="primary">
                        {step.number}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText weight="semibold" color="textPrimary">
                        {step.title}
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="bodySmall" color="textSecondary" className="mb-4">
                    {step.description}
                  </AppText>
                  <View className="flex-row items-center">
                    <step.icon size={16} color={colors.primary} />
                    <AppText variant="bodySmall" color="primary" className="ml-2">
                      {translate('personal_info')}
                    </AppText>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Interactive Demos / Features */}
        <View className={`px-4 py-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <AppText variant="h2" weight="bold" color="textPrimary" className="text-center mb-8">
            {translate('try_features')}
          </AppText>

          <View className="flex-row flex-wrap -mx-2">
            {quickDemos.map((demo, index) => (
              <Animated.View
                key={demo.id}
                entering={FadeInUp.duration(500).delay(300 + (index * 100))}
                className="w-1/2 px-2 mb-4"
              >
                <TouchableOpacity
                  onPress={() => router.push(demo.route)}
                  activeOpacity={0.8}
                >
                  <View className={`${isDark ? `bg-gradient-to-br ${demo.color}` : 'bg-white border border-gray-100 shadow-sm'} p-6 rounded-2xl items-center`}>
                    <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-white/10' : 'bg-blue-50'}`}>
                      <demo.icon size={24} color={isDark ? 'white' : colors.primary} />
                    </View>
                    <AppText weight="bold" color={isDark ? 'white' : 'textPrimary'} className="text-center">
                      {demo.title}
                    </AppText>
                    <AppText variant="caption" color={isDark ? 'white' : 'textSecondary'} className="mt-1 opacity-70">
                      {demo.time}
                    </AppText>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/tabs/trips/search')}
            className={`mt-6 ${isDark ? 'bg-gray-900' : 'bg-white'} py-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} flex-row items-center justify-center`}
            activeOpacity={0.7}
          >
            <PlayCircle size={20} color={colors.primary} />
            <AppText weight="semibold" color="primary" className="ml-2">
              {translate('full_demo')}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Live Stats instead of testimonials */}
        <View className="px-4 py-8">
          <AppText variant="h2" weight="bold" color="textPrimary" className="text-center mb-10">
            {translate('live_stats' as any) || 'System Activity'}
          </AppText>

          <View className="flex-row space-x-4">
            <Animated.View
              entering={FadeInUp.duration(600).delay(400)}
              className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-3xl shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} items-center`}
            >
              <AppText variant="h1" color="primary" weight="bold">{stats.activeTrips}</AppText>
              <AppText variant="bodySmall" color="textSecondary" className="mt-2">{translate('active_trips' as any) || 'Active Trips'}</AppText>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(600).delay(600)}
              className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-3xl shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} items-center`}
            >
              <AppText variant="h1" color="success" weight="bold">{stats.totalStations}</AppText>
              <AppText variant="bodySmall" color="textSecondary" className="mt-2">{translate('total_stations' as any) || 'Active Stations'}</AppText>
            </Animated.View>
          </View>
        </View>

        {/* Final CTA */}
        <View className="px-4 py-6">
          <View className={`${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-3xl p-8 shadow-sm relative overflow-hidden border ${isDark ? 'border-transparent' : 'border-blue-100'}`}>
            {/* Background design elements */}
            <View className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/20'}`} />
            <View className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/20'}`} />

            <AppText variant="h2" weight="bold" color="textPrimary" className="text-center mb-4">
              {translate('ready_to_travel')}
            </AppText>
            <AppText color="textSecondary" className="text-center mb-8 text-lg">
              {translate('join_passengers')}
            </AppText>

            <View className="gap-y-4">
              <Animated.View
                entering={ZoomIn.duration(600).delay(800)}
                style={pulseAnimatedStyle}
              >
                <TouchableOpacity
                  onPress={() => router.push('/auth/Register')}
                  className="bg-blue-600 py-4 items-center rounded-2xl active:opacity-90 shadow-md"
                  activeOpacity={0.8}
                >
                  <AppText weight="bold" color="white" className="text-center text-lg">
                    {translate('create_account')}
                  </AppText>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={() => router.push('/auth/Login')}
                className={`bg-transparent items-center border-2 ${isDark ? 'border-white/30' : 'border-blue-200'} py-4 rounded-2xl active:opacity-90`}
                activeOpacity={0.8}
              >
                <AppText weight="bold" color={isDark ? 'white' : 'primary'} className="text-center text-lg">
                  {translate('sign_in')}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/tabs/trips/search')}
                className="py-3 items-center flex-row justify-center"
              >
                <AppText color="primary" className="font-semibold">
                  {translate('explore_guest')}
                </AppText>
                <ArrowRight size={18} color={colors.primary} className="ml-2" />
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-blue-100/50">
              <View className="flex-row items-center">
                <CheckCircle size={16} color={colors.success} />
                <AppText variant="caption" color="textSecondary" className="ml-2 font-medium">{translate('no_card_needed')}</AppText>
              </View>
              <View className="flex-row items-center">
                <CheckCircle size={16} color={colors.success} />
                <AppText variant="caption" color="textSecondary" className="ml-2 font-medium">{translate('free_to_use')}</AppText>
              </View>
              <View className="flex-row items-center">
                <CheckCircle size={16} color={colors.success} />
                <AppText variant="caption" color="textSecondary" className="ml-2 font-medium">{translate('setup_1min')}</AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Support */}
        <View className={`px-4 py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className="items-center">
            <AppText variant="h2" weight="bold" color={isDark ? 'white' : 'textPrimary'} className="mb-8">
              {translate('need_help' as any)}
            </AppText>

            <View className="flex-row space-x-6 mb-8">
              <TouchableOpacity
                className={`flex-1 ${isDark ? 'bg-white/10' : 'bg-white'} p-5 rounded-2xl items-center shadow-sm border ${isDark ? 'border-transparent' : 'border-gray-100'}`}
                activeOpacity={0.7}
              >
                <PhoneCall size={24} color={isDark ? 'white' : colors.primary} />
                <AppText weight="bold" color={isDark ? 'white' : 'textPrimary'} className="mt-3 text-sm">{translate('call_support' as any)}</AppText>
                <AppText variant="caption" color={isDark ? 'white' : 'textSecondary'} className="opacity-60">+251 900 000 000</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 ${isDark ? 'bg-white/10' : 'bg-white'} p-5 rounded-2xl items-center shadow-sm border ${isDark ? 'border-transparent' : 'border-gray-100'}`}
                activeOpacity={0.7}
              >
                <Mail size={24} color={isDark ? 'white' : colors.primary} />
                <AppText weight="bold" color={isDark ? 'white' : 'textPrimary'} className="mt-3 text-sm">{translate('email_us' as any)}</AppText>
                <AppText variant="caption" color={isDark ? 'white' : 'textSecondary'} className="opacity-60">superadmin@bahirdar.com</AppText>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
              <TouchableOpacity onPress={() => router.push('/privacy')}>
                <AppText color={isDark ? 'white' : 'textSecondary'} className="opacity-70">{translate('privacy_policy')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/terms')}>
                <AppText color={isDark ? 'white' : 'textSecondary'} className="opacity-70">{translate('terms_service')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/menu/support')}>
                <AppText color={isDark ? 'white' : 'textSecondary'} className="opacity-70">FAQs</AppText>
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color={isDark ? 'white' : 'textSecondary'} className="opacity-50 text-center mb-2">
              © 2024 {translate('app_name_full')}. {translate('making_travel_better')}
            </AppText>
            <AppText variant="caption" color={isDark ? 'white' : 'textSecondary'} className="opacity-30">
              Available on Web, iOS & Android
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}