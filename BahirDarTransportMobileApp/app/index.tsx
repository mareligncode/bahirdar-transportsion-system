import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { useBooking } from '@/hooks/useBooking';
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
  const { getMyBookings } = useBooking();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [imageError, setImageError] = useState(false);
  const [realTestimonials, setRealTestimonials] = useState<any[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/tabs/home');
    }
  }, [isAuthenticated]);

  // Load real testimonials from backend
  useEffect(() => {
    loadRealTestimonials();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
        setImageError(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const loadRealTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      // Get user bookings to find frequent travelers
      const bookings = await getMyBookings();

      if (bookings && bookings.length > 0) {
        // Extract unique passengers from bookings
        const uniquePassengers = Array.from(
          new Set(bookings.map((b: any) => b.passengerDetails?.fullName))
        ).filter(Boolean);

        // Create testimonials from real booking data
        const realTestimonialsData = uniquePassengers.slice(0, 3).map((name, index) => {
          const userBookings = bookings.filter((b: any) => b.passengerDetails?.fullName === name);
          const totalTrips = userBookings.length;
          const recentTrip = userBookings[userBookings.length - 1];

          return {
            id: index + 1,
            name: name,
            role: totalTrips > 5 ? 'Frequent Traveler' : totalTrips > 2 ? 'Regular User' : 'New User',
            text: totalTrips > 5
              ? `Booked ${totalTrips} trips! Always on time and reliable service.`
              : totalTrips > 2
                ? `Great service for my regular trips. Very convenient!`
                : `Easy to use and saved me time on my first booking.`,
            rating: totalTrips > 5 ? 5 : totalTrips > 2 ? 5 : 4,
          };
        });

        setRealTestimonials(realTestimonialsData);
      } else {
        // Fallback to static testimonials if no bookings
        setRealTestimonials([
          {
            id: 1,
            name: 'Alem Gebre',
            role: 'Daily Commuter',
            text: 'Saves me 2 hours every day! Very reliable service.',
            rating: 5,
          },
          {
            id: 2,
            name: 'Mikias Hailu',
            role: 'Student',
            text: 'Affordable and reliable. Perfect for campus travel.',
            rating: 5,
          },
          {
            id: 3,
            name: 'Selamawit Tadele',
            role: 'Tourist Guide',
            text: 'Makes showing tourists around Bahir Dar so easy.',
            rating: 4,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load testimonials:', error);
      // Use fallback testimonials
      setRealTestimonials([
        {
          id: 1,
          name: 'Alem Gebre',
          role: 'Daily Commuter',
          text: 'Saves me 2 hours every day! Very reliable service.',
          rating: 5,
        },
        {
          id: 2,
          name: 'Mikias Hailu',
          role: 'Student',
          text: 'Affordable and reliable. Perfect for campus travel.',
          rating: 5,
        },
        {
          id: 3,
          name: 'Selamawit Tadele',
          role: 'Tourist Guide',
          text: 'Makes showing tourists around Bahir Dar so easy.',
          rating: 4,
        },
      ]);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (isLoading) {
    return <Loader message="Loading..." />;
  }

  const features = [
    {
      icon: Bus,
      title: '100+ Buses',
      description: 'Modern fleet across city',
      color: 'bg-blue-500',
    },
    {
      icon: Clock,
      title: 'On Time',
      description: '95% punctuality rate',
      color: 'bg-green-500',
    },
    {
      icon: Shield,
      title: 'Safe Travel',
      description: 'Verified drivers & routes',
      color: 'bg-purple-500',
    },
    {
      icon: CreditCard,
      title: 'Easy Payment',
      description: 'Multiple payment options',
      color: 'bg-orange-500',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Search & Select',
      description: 'Find your route and choose preferred time',
      icon: Bus,
    },
    {
      number: '02',
      title: 'Book & Pay',
      description: 'Secure payment with multiple options',
      icon: CreditCard,
    },
    {
      number: '03',
      title: 'Get Ticket',
      description: 'Receive digital QR ticket instantly',
      icon: Ticket,
    },
    {
      number: '04',
      title: 'Travel',
      description: 'Board your bus and enjoy the journey',
      icon: Users,
    },
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Alem Gebre',
      role: 'Daily Commuter',
      text: 'Saves me 2 hours every day! Very reliable service.',
      rating: 5,
    },
    {
      id: 2,
      name: 'Mikias Hailu',
      role: 'Student',
      text: 'Affordable and reliable. Perfect for campus travel.',
      rating: 5,
    },
    {
      id: 3,
      name: 'Selamawit Tadele',
      role: 'Tourist Guide',
      text: 'Makes showing tourists around Bahir Dar so easy.',
      rating: 4,
    },
  ];

  const quickDemos = [
    {
      id: 1,
      title: 'Booking Demo',
      icon: Ticket,
      time: '1 min',
      route: '/tabs/trips/search',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      title: 'View Tickets',
      icon: CheckCircle,
      time: 'QR Code',
      route: '/tabs/tickets',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 3,
      title: 'Payment',
      icon: CreditCard,
      time: 'Secure',
      route: '/payment/checkout',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 4,
      title: 'My Profile',
      icon: Users,
      time: 'Account',
      route: '/tabs/profile',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

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
              style={{
                width: '100%',
                height: '100%',
                opacity: fadeAnim
              }}
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
                <Sparkles size={28} color="#FFFFFF" />
                <Text className="text-2xl font-bold text-white ml-2">
                  BahirDar Transport
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/auth/Login')}
                className="border border-white/30 px-4 py-2 rounded-full"
                activeOpacity={0.7}
              >
                <Text className="text-white font-medium">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="absolute bottom-6 left-4 right-4">
            <Text className="text-3xl font-bold text-white mb-2 leading-tight">
              Smart Travel in{' '}
              <Text className="text-yellow-300">Bahir Dar</Text>
            </Text>
            <Text className="text-lg text-white/90 mb-6">
              Book buses, travel safely and conveniently
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/auth/Register')}
              className="bg-white py-4 px-6 rounded-full flex-row items-center justify-center active:opacity-90 shadow-lg"
              activeOpacity={0.8}
            >
              <Text className="text-blue-600 font-bold text-lg">
                Get Started
              </Text>
              <ArrowRight size={20} color="#3B82F6" className="ml-2" />
            </TouchableOpacity>
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

        {/* Quick Stats */}
        <View className="px-4 py-6 -mt-4">
          <View className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <View className="flex-row flex-wrap -mx-2">
              {features.map((feature, index) => (
                <View key={index} className="w-1/2 px-2 mb-4">
                  <View className="flex-row items-center">
                    <View className={`${feature.color} w-10 h-10 rounded-lg items-center justify-center mr-3`}>
                      <feature.icon size={20} color="white" />
                    </View>
                    <View>
                      <Text className="font-bold text-gray-900">
                        {feature.title}
                      </Text>
                      <Text className="text-gray-600 text-xs">
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* How It Works - Horizontal Scroll for Mobile */}
        <View className="px-4 py-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              How It Works
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/Register')}>
              <Text className="text-blue-600 font-semibold">Try Now →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {steps.map((step, index) => (
              <View key={index} className="w-64 mr-4">
                <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                      <Text className="text-blue-600 font-bold">
                        {step.number}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800">
                        {step.title}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600 text-sm mb-4">
                    {step.description}
                  </Text>
                  <View className="flex-row items-center">
                    <step.icon size={16} color="#3B82F6" />
                    <Text className="text-blue-600 text-sm ml-2">
                      Learn more
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Interactive Demos */}
        <View className="px-4 py-6 bg-gray-50">
          <Text className="text-xl font-bold text-center text-gray-900 mb-6">
            Try Interactive Features
          </Text>

          <View className="flex-row flex-wrap -mx-2">
            {quickDemos.map((demo) => (
              <TouchableOpacity
                key={demo.id}
                onPress={() => router.push(demo.route)}
                className="w-1/2 px-2 mb-4"
                activeOpacity={0.8}
              >
                <View className={`bg-gradient-to-br ${demo.color} p-5 rounded-xl shadow-sm`}>
                  <demo.icon size={28} color="white" />
                  <Text className="text-white font-bold mt-3 mb-1">
                    {demo.title}
                  </Text>
                  <Text className="text-white/80 text-sm">
                    {demo.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/tabs/trips/search')}
            className="mt-6 bg-white py-4 rounded-xl border border-gray-200 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <PlayCircle size={20} color="#3B82F6" />
            <Text className="text-blue-600 font-semibold ml-2">
              Start Full Demo (3 min)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Testimonials */}
        <View className="px-4 py-6">
          <Text className="text-xl font-bold text-center text-gray-900 mb-6">
            Loved by Passengers
          </Text>

          {loadingTestimonials ? (
            <View className="flex-row justify-center">
              <Text className="text-gray-600">Loading real passenger reviews...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {realTestimonials.map((testimonial) => (
                <View
                  key={testimonial.id}
                  className="bg-white mr-4 p-5 rounded-xl shadow-sm border border-gray-100 w-72"
                >
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                      <Users size={20} color="#3B82F6" />
                    </View>
                    <View className="ml-3">
                      <Text className="font-bold text-gray-900">
                        {testimonial.name}
                      </Text>
                      <Text className="text-gray-600 text-xs">
                        {testimonial.role}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-700 text-sm mb-4 leading-relaxed">
                    "{testimonial.text}"
                  </Text>

                  <View className="flex-row">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < testimonial.rating ? "#F59E0B" : "none"}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Final CTA */}
        <View className="px-4 py-8">
          <View className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6">
            <Text className="text-2xl font-bold text-white text-center mb-4">
              Ready to Travel Smarter?
            </Text>
            <Text className="text-white/90 text-center mb-6">
              Join thousands of happy passengers
            </Text>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => router.push('/auth/Register')}
                className="bg-white py-4 rounded-xl active:opacity-90"
                activeOpacity={0.8}
              >
                <Text className="text-blue-600 font-bold text-center text-lg">
                  Create Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/auth/Login')}
                className="bg-transparent border-2 border-white py-4 rounded-xl active:opacity-90"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-center text-lg">
                  Sign In to Your Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/tabs/home')}
                className="py-3"
              >
                <Text className="text-white/70 text-center">
                  Or explore features as guest →
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center space-x-4 mt-6">
              <View className="flex-row items-center">
                <CheckCircle size={14} color="#86EFAC" />
                <Text className="text-white/80 text-xs ml-1">No card needed</Text>
              </View>
              <View className="flex-row items-center">
                <CheckCircle size={14} color="#86EFAC" />
                <Text className="text-white/80 text-xs ml-1">Free to use</Text>
              </View>
              <View className="flex-row items-center">
                <CheckCircle size={14} color="#86EFAC" />
                <Text className="text-white/80 text-xs ml-1">1-min setup</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Support */}
        <View className="px-4 py-6 bg-gray-900">
          <View className="items-center">
            <Text className="text-white text-xl font-bold mb-6">
              Need Help Getting Started?
            </Text>

            <View className="flex-row space-x-6 mb-6">
              <TouchableOpacity
                className="flex-1 bg-white/10 p-4 rounded-xl items-center"
                activeOpacity={0.7}
              >
                <PhoneCall size={20} color="white" />
                <Text className="text-white text-sm mt-2">Call Support</Text>
                <Text className="text-white/60 text-xs">+251 123 456 789</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-white/10 p-4 rounded-xl items-center"
                activeOpacity={0.7}
              >
                <Mail size={20} color="white" />
                <Text className="text-white text-sm mt-2">Email Us</Text>
                <Text className="text-white/60 text-xs">help@bahirdartransport.et</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row space-x-6 mb-8">
              <TouchableOpacity onPress={() => router.push('/privacy')}>
                <Text className="text-gray-400">Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/terms')}>
                <Text className="text-gray-400">Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/support/help')}>
                <Text className="text-gray-400">FAQs</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-500 text-center text-sm mb-2">
              © 2024 BahirDar Transport. Making city travel better.
            </Text>
            <Text className="text-gray-600 text-xs">
              Available on Web, iOS & Android
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}