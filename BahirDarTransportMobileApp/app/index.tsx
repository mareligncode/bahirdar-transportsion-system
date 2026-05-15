import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader } from '@/components/common/Loader';
import { useTrips } from '@/hooks/useTrips';

import { useTheme } from '@/context/ThemeContext';
import {
  Bus,
  Shield,
  Clock,
  Ticket,
  CreditCard,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle,
  PlayCircle,
  PhoneCall,
  Mail,
  Globe,
  Zap,
  Sun,
  Moon
} from 'lucide-react-native';



const HERO_IMAGES = [
  require('@/assets/images/image1.png'),
  require('@/assets/images/image2.png'),
  require('@/assets/images/image3.png'),
];

const FALLBACK_COLORS = ['#3B82F6', '#10B981', '#8B5CF6'];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { translate, language, setLanguage } = useTranslation();

  const { isDark, colors, setTheme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useSharedValue(1);
  const [imageError, setImageError] = useState(false);

  const { fetchAllTrips, fetchStations } = useTrips();
  const [stats, setStats] = useState({ activeTrips: 0, totalStations: 0 });

  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withRepeat(withSpring(1.05, { damping: 2, stiffness: 80 }), -1, true) }]
  }));

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
  }, [isAuthenticated, fetchAllTrips, fetchStations]);

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

          <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

          <View className="absolute top-6 left-4 right-4">
            <View className="flex-row items-center justify-between gap-x-4">
              <View className="flex-row items-center">
                <Sparkles size={28} color="#FFD700" />
                <AppText variant="h2" weight="bold" color="primary" className="ml-2">
                  {translate('app_name_full')}
                </AppText>
              </View>
              <View className="flex-row items-center gap-x-3">
                <TouchableOpacity
                  onPress={() => setTheme(isDark ? 'light' : 'dark')}
                  activeOpacity={0.7}
                  className="bg-amber-500 w-10 h-10 rounded-full items-center justify-center shadow-md"
                >
                  {isDark ? <Sun size={20} color="white" /> : <Moon size={20} color="white" />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setLanguage(language === 'en' ? 'am' : 'en')}
                  activeOpacity={0.7}
                  className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-md"
                >
                  <Globe size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="absolute bottom-6 left-4 right-4">
            <Animated.View entering={FadeInLeft.duration(600).delay(200)}>
              <AppText variant="h1" weight="bold" color="white" className="mb-2 leading-tight">
                <AppText weight="bold" color="#fbbf24">{translate('smart_travel')}</AppText> <AppText weight="bold" color="#fb923c">{translate('bahir_dar')}</AppText>
              </AppText>
            </Animated.View>
            <Animated.View entering={FadeInLeft.duration(600).delay(400)}>
              <AppText variant="bodyLarge" color="white" className="mb-4 opacity-90">
                {translate('landing_sub')}
              </AppText>
            </Animated.View>

            <Animated.View entering={FadeInLeft.duration(600).delay(600)} className="flex-row items-center gap-x-3">
              <TouchableOpacity
                onPress={() => router.push('/auth/Register')}
                activeOpacity={0.9}
                className="flex-1 rounded-2xl overflow-hidden shadow-lg"
              >
                <LinearGradient
                  colors={['#facc15', '#fb923c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-4 py-4 flex-row items-center justify-center"
                >
                  <AppText weight="bold" color="white" className="text-lg">
                    {translate('get_started')}
                  </AppText>
                  <ArrowRight size={20} color="white" className="ml-2" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/auth/Login')}
                activeOpacity={0.8}
                className="flex-1 rounded-2xl overflow-hidden shadow-lg"
              >
                <LinearGradient
                  colors={['#facc15', '#fb923c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-4 py-4 flex-row items-center justify-center"
                >
                  <AppText weight="bold" color="white" className="text-lg">
                    {translate('sign_in')}
                  </AppText>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

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

        <View className="px-4 py-4 mt-2">
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

        <View className="px-4 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <AppText variant="h3" weight="bold" color="textPrimary">
              {translate('landing_how_it_works')}
            </AppText>
            <TouchableOpacity onPress={() => router.push('/auth/Register')}>
              <AppText weight="semibold" color="primary">{translate('try_now')} →</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            {steps.map((step, index) => {
              const isExpanded = expandedStep === index;
              return (
                <Animated.View
                  key={index}
                  entering={FadeInRight.duration(500).delay(200 * index)}
                  className="w-72 mr-4"
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setExpandedStep(isExpanded ? null : index)}
                    className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-2xl shadow-sm border`}
                  >
                    <View className="flex-row items-center mb-4">
                      <View className={`w-12 h-12 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-full items-center justify-center mr-4`}>
                        <AppText weight="bold" color="primary">
                          {step.number}
                        </AppText>
                      </View>
                      <View className="flex-1">
                        <AppText weight="bold" color="textPrimary" className="text-lg">
                          {step.title}
                        </AppText>
                      </View>
                    </View>

                    {isExpanded && (
                      <Animated.View entering={FadeInDown.duration(300)}>
                        <AppText color="textSecondary" className="mb-4 leading-relaxed">
                          {step.description}
                        </AppText>
                        <View className="flex-row items-center bg-blue-50/50 p-3 rounded-xl">
                          <step.icon size={18} color={colors.primary} />
                          <AppText variant="caption" color="primary" weight="semibold" className="ml-2 uppercase">
                            {translate('get_started')}
                          </AppText>
                        </View>
                      </Animated.View>
                    )}

                    {!isExpanded && (
                      <AppText variant="caption" color="primary" weight="medium" className="opacity-60">
                        {translate('tap_to_learn_more')} →
                      </AppText>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
        <View className="px-4 py-8">
          <AppText variant="h3" weight="bold" color="textPrimary" className="mb-4">
            {translate('why_choose_us')}
          </AppText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-2"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {[
              {
                titleKey: 'online_payment_title',
                descKey: 'online_payment_desc',
                icon: Globe,
                color: '#3b82f6',
              },
              {
                titleKey: 'safe_secure_title',
                descKey: 'safe_secure_desc',
                icon: Shield,
                color: '#10b981',
              },
              {
                titleKey: 'pay_faster_title',
                descKey: 'pay_faster_desc',
                icon: Zap,
                color: '#f59e0b',
              },
            ].map((feature, index) => {
              const isExpanded = expandedFeature === index;
              return (
                <Animated.View
                  key={index}
                  entering={FadeInUp.duration(600).delay(200 * index)}
                  className="w-80 mr-4"
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setExpandedFeature(isExpanded ? null : index)}
                    className={`relative ${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-3xl p-6 shadow-sm border ${isDark ? 'border-gray-700' : (isExpanded ? 'border-blue-200 bg-blue-50/20' : 'border-gray-100')}`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-sm"
                        style={{ backgroundColor: `${feature.color}15` }}
                      >
                        <feature.icon size={28} color={feature.color} />
                      </View>
                      <View className="flex-1">
                        <AppText variant="h3" weight="bold" color="textPrimary">
                          {translate(feature.titleKey as any)}
                        </AppText>
                        {!isExpanded && (
                          <AppText variant="caption" color="textSecondary" className="mt-1">
                            {translate('view_details')} →
                          </AppText>
                        )}
                      </View>
                    </View>

                    {isExpanded && (
                      <Animated.View entering={FadeInUp.duration(400)} className="mt-4 pt-4 border-t border-gray-100/50">
                        <AppText color="textSecondary" className="leading-relaxed text-base">
                          {translate(feature.descKey as any)}
                        </AppText>
                      </Animated.View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-4 py-4">
          <LinearGradient
            colors={isDark ? ['#1e3a8a33', '#1e1b4b33'] : ['#eff6ff', '#e0e7ff']}
            className="rounded-3xl p-8 shadow-sm relative overflow-hidden border border-blue-100/20"
          >
            <View className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/20'}`} />
            <View className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/20'}`} />

            <AppText variant="h2" weight="bold" align="center" className="mb-4">
              <AppText weight="bold" color="#fb923c">{translate('ready_to_travel')}</AppText>
            </AppText>
            <AppText color="textSecondary" align="center" className="mb-8 text-lg">
              {translate('join_passengers')}
            </AppText>

            <View className="gap-y-6">
              <Animated.View entering={ZoomIn.duration(600).delay(800)}>
                <Animated.View style={pulseAnimatedStyle}>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/Register')}
                    className="bg-blue-600 py-4 items-center rounded-2xl shadow-lg active:opacity-90"
                    activeOpacity={0.8}
                  >
                    <AppText weight="bold" color="white" className="text-lg">
                      {translate('create_account')}
                    </AppText>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              <View className="items-center">
                <View className="flex-row items-center">
                  <AppText color="textSecondary">
                    {translate('already_have_account')} 
                  </AppText>
                  <TouchableOpacity onPress={() => router.push('/auth/Login')} className="ml-1">
                    <AppText weight="bold" color="primary">
                      {translate('sign_in')}
                    </AppText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => router.replace('/tabs/trips/search')}
                  className="mt-6 py-2 border-b border-blue-200"
                >
                  <AppText color="primary" weight="semibold">
                    {translate('explore_guest')} →
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

          </LinearGradient>
        </View>

        <View className={`px-4 py-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className="items-center">
            <AppText variant="h2" weight="bold" color={isDark ? 'white' : 'textPrimary'} className="mb-4">
              {translate('need_help' as any)}
            </AppText>

            <View className="flex-row space-x-6 mb-4">
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

            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
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
              © {new Date().getFullYear()} {translate('app_name_full')}. {translate('making_travel_better')}
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