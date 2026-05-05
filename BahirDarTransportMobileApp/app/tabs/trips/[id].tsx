import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Car,
  User,
  Phone,
  AlertCircle,
  ArrowLeft,
  Bus,
  ChevronRight,
  Star,
  Wifi,
  Coffee,
  Tv,
  Battery,
  AirVent,
  Shield
} from 'lucide-react-native';
import { useTrips } from '../../../hooks/useTrips';
import { useBooking } from '../../../hooks/useBooking';
import { useTranslation } from '../../../hooks/useTranslation';
import { useTheme } from '../../../context/ThemeContext';
import { Badge } from '../../../components/common/Badge';
import { Loader } from '../../../components/common/Loader';
import { formatTime, formatDate, formatCurrency } from '../../../utils/helpers';
import { Trip, Vehicle, Driver, Station } from '../../../types/trip';

const { width } = Dimensions.get('window');

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'error' | 'info';

export default function TripDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { translate } = useTranslation();
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const { getTripById, loading, error } = useTrips();
  const { selectTrip } = useBooking();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    // Validate tripId before proceeding
    if (!tripId || tripId === 'index' || tripId === 'undefined' || tripId === 'null') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tabs/home');
      }
      return;
    }

    if (tripId.length !== 24) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tabs/home');
      }
      return;
    }

    loadTripDetails(tripId);
  }, [tripId]);

  const loadTripDetails = async (id: string) => {
    try {
      const data = await getTripById(id);
      setTrip(data);
      selectTrip(data);
    } catch (err: any) {
      let errorMessage = translate('something_went_wrong');

      if (err.response?.status === 500) {
        errorMessage = translate('error');
      } else if (err.response?.status === 404) {
        errorMessage = translate('no_trips_found');
      }

      Alert.alert(translate('error'), errorMessage);

      // Navigate back after error
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/tabs/home');
        }
      }, 2000);
    }
  };

  const handleSelectSeats = () => {
    if (!trip) return;

    const availableSeats = trip.availableSeats ?? 0;

    if (availableSeats === 0) {
      Alert.alert(translate('fully_booked'), translate('fully_booked'));
      return;
    }

    router.push({
      pathname: '/tabs/trips/seat-selection',
      params: { id: trip._id }
    });
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/tabs/home');
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'info';
      case 'boarding': return 'warning';
      case 'departed': return 'success';
      case 'arrived': return 'secondary';
      case 'cancelled': return 'error';
      default: return 'secondary';
    }
  };

  // Safe data extraction with proper typing
  const availableSeats = trip?.availableSeats ?? 0;
  const totalSeats = trip?.totalSeats ?? (trip?.vehicle as Vehicle)?.totalCapacity ?? 0;
  const price = trip?.price ?? 0;
  const tripStatus = trip?.tripStatus ?? 'scheduled';
  const departureTime = trip?.departureTime ?? '';
  const arrivalTime = trip?.arrivalTime ?? '';

  const origin = trip?.origin as Station;
  const destination = trip?.destination as Station;
  const driver = trip?.driver as Driver;
  const vehicle = trip?.vehicle as Vehicle;

  const originName = origin?.stationName ?? 'Unknown';
  const destinationName = destination?.stationName ?? 'Unknown';
  const originCity = origin?.city ?? '';
  const destinationCity = destination?.city ?? '';

  const driverName = driver?.fullName ?? 'Driver assigned';
  const driverPhone = driver?.phoneNumber;

  const vehiclePlate = vehicle?.plateNumber ?? 'Vehicle assigned';
  const vehicleType = vehicle?.carType ?? 'Bus';

  const canBook = availableSeats > 0 && (trip?.tripStatus === 'scheduled' || trip?.tripStatus === 'boarding');

  // Get vehicle features icons
  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes('wifi')) return <Wifi size={16} color="#3b82f6" />;
    if (featureLower.includes('ac') || featureLower.includes('air')) return <AirVent size={16} color="#3b82f6" />;
    if (featureLower.includes('tv')) return <Tv size={16} color="#3b82f6" />;
    if (featureLower.includes('charging') || featureLower.includes('usb')) return <Battery size={16} color="#3b82f6" />;
    if (featureLower.includes('coffee') || featureLower.includes('snack')) return <Coffee size={16} color="#3b82f6" />;
    return <Shield size={16} color="#3b82f6" />;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Loader message={translate('loading_trips')} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center p-8">
          <AlertCircle size={64} color={colors.error} />
          <AppText variant="h2" weight="bold" color={colors.text} className="mt-4">
            {translate('no_trips_found')}
          </AppText>
          <AppText variant="bodyMedium" color={colors.textSecondary} className="text-center mt-2">
            {translate('no_trips_found_desc') || translate('no_trips_found')}
          </AppText>
          <TouchableOpacity
            onPress={handleGoBack}
            style={{ backgroundColor: colors.primary }}
            className="mt-6 py-3 px-6 rounded-xl"
          >
            <AppText variant="bodyMedium" weight="bold" color="white">{translate('back')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ backgroundColor: isDark ? colors.background : '#f9fafb' }} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Header with Gradient */}
        <LinearGradient
          colors={isDark ? ['#1e3a8a', '#1e40af'] : ['#1e40af', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-3"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleGoBack}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <View className="flex-1">
              <AppText variant="caption" color="rgba(255,255,255,0.8)">{translate('trip_details')}</AppText>
              <AppText variant="bodyLarge" weight="bold" color="white" numberOfLines={1}>
                {originName} → {destinationName}
              </AppText>
            </View>
            <Badge
              variant={getStatusBadgeVariant(tripStatus)}
              text={translate(tripStatus?.toLowerCase() as any)?.toUpperCase() || tripStatus.toUpperCase()}
            />
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-3 pt-3 border-t border-white/20">
            <View className="flex-1">
              <AppText variant="caption" color="#bfdbfe">{translate('date')}</AppText>
              <AppText variant="bodySmall" weight="bold" color="white">
                {formatDate(departureTime)}
              </AppText>
            </View>
            <View className="flex-1">
              <AppText variant="caption" color="#bfdbfe">{translate('time')}</AppText>
              <AppText variant="bodySmall" weight="bold" color="white">
                {formatTime(departureTime)}
              </AppText>
            </View>
            <View className="flex-1">
              <AppText variant="caption" color="#bfdbfe">{translate('price')}</AppText>
              <AppText variant="bodySmall" weight="bold" color="white">
                {formatCurrency(price)}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 140, // Increased padding to ensure button is visible above bottom tabs
          }}
        >
          {/* Quick Info Cards */}
          <View className="flex-row px-4 mt-4 mb-3">
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-1 rounded-xl p-3 mr-2 border">
              <View className="flex-row items-center">
                <Clock size={16} color={colors.primary} />
                <AppText variant="caption" color={colors.textSecondary} className="ml-2">{translate('duration')}</AppText>
              </View>
              <AppText variant="h3" weight="bold" color={colors.text} className="mt-1">
                {Math.ceil((new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / (1000 * 60 * 60))}h
              </AppText>
            </View>
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-1 rounded-xl p-3 mr-2 border">
              <View className="flex-row items-center">
                <Users size={16} color="#f59e0b" />
                <AppText variant="caption" color={colors.textSecondary} className="ml-2">{translate('available')}</AppText>
              </View>
              <AppText variant="h3" weight="bold" color={colors.text} className="mt-1">
                {availableSeats}/{totalSeats}
              </AppText>
            </View>
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-1 rounded-xl p-3 border">
              <View className="flex-row items-center">
                <Star size={16} color={colors.success} />
                <AppText variant="caption" color={colors.textSecondary} className="ml-2">{translate('rating')}</AppText>
              </View>
              <AppText variant="h3" weight="bold" color={colors.text} className="mt-1">4.8</AppText>
            </View>
          </View>

          <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="p-4 mx-4 mb-3 rounded-xl border">
            <AppText variant="bodyLarge" weight="semibold" color={colors.text} className="mb-3">
              {translate('journey_details')}
            </AppText>

            <View className="space-y-4">
              {/* Origin */}
              <View className="flex-row">
                <View className="w-8 items-center">
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                </View>
                <View className="flex-1 ml-2 pb-4">
                  <AppText variant="caption" color={colors.textSecondary}>{translate('departure')}</AppText>
                  <AppText variant="bodyMedium" weight="semibold" color={colors.text}>{originName}</AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary}>{originCity}</AppText>
                  <AppText variant="bodySmall" weight="500" color={colors.primary} className="mt-1">
                    {formatTime(departureTime)}
                  </AppText>
                </View>
              </View>

              {/* Line connecting dots */}
              <View style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} className="absolute left-3 top-6 bottom-6 w-0.5" />

              {/* Destination */}
              <View className="flex-row">
                <View className="w-8 items-center">
                  <View className="w-3 h-3 rounded-full bg-red-500" />
                </View>
                <View className="flex-1 ml-2">
                  <AppText variant="caption" color={colors.textSecondary}>{translate('arrival')}</AppText>
                  <AppText variant="bodyMedium" weight="semibold" color={colors.text}>{destinationName}</AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary}>{destinationCity}</AppText>
                  <AppText variant="bodySmall" weight="500" color={colors.success} className="mt-1">
                    {formatTime(arrivalTime)}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          {/* Vehicle & Driver Card */}
          <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="p-4 mx-4 mb-3 rounded-xl border">
            <AppText variant="bodyLarge" weight="semibold" color={colors.text} className="mb-3">
              {translate('vehicle_driver')}
            </AppText>

            <View className="space-y-4">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' }} className="w-10 h-10 rounded-lg items-center justify-center">
                  <Car size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <AppText variant="bodyMedium" weight="500" color={colors.text}>
                    {vehiclePlate}
                  </AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    {translate(vehicleType?.toLowerCase() as any) || vehicleType} • {totalSeats} {translate('seats')}
                  </AppText>
                </View>
              </View>

              <View className="flex-row items-center">
                <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4' }} className="w-10 h-10 rounded-lg items-center justify-center">
                  <User size={20} color={colors.success} />
                </View>
                <View className="ml-3 flex-1">
                  <AppText variant="bodyMedium" weight="500" color={colors.text}>
                    {driverName}
                  </AppText>
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    {translate('driver')}
                  </AppText>
                </View>
                {driverPhone && (
                  <TouchableOpacity
                    style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' }}
                    className="p-2 rounded-lg"
                    onPress={() => {
                      Alert.alert(translate('call_driver') || 'Call Driver', `${translate('call') || 'Call'} ${driverName}?`, [
                        { text: translate('cancel'), style: 'cancel' },
                        { text: translate('call') || 'Call', onPress: () => console.log('Calling...') }
                      ]);
                    }}
                  >
                    <Phone size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Amenities Card */}
          <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="p-4 mx-4 mb-3 rounded-xl border">
            <AppText variant="bodyLarge" weight="semibold" color={colors.text} className="mb-3">
              {translate('amenities')}
            </AppText>
            <View className="flex-row flex-wrap">
              {vehicle?.features && vehicle.features.length > 0 ? (
                vehicle.features.map((feature, index) => (
                  <View key={index} style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' }} className="px-3 py-2 rounded-full mr-2 mb-2 flex-row items-center">
                    {getFeatureIcon(feature)}
                    <AppText variant="bodySmall" weight="500" color={colors.primary} className="ml-1">{translate(feature.toLowerCase() as any) || feature}</AppText>
                  </View>
                ))
              ) : (
                <AppText variant="bodyMedium" color={colors.textSecondary}>{translate('standard_amenities')}</AppText>
              )}
            </View>
          </View>

          {/* Notes Card */}
          {trip.notes && (
            <View style={{ backgroundColor: isDark ? 'rgba(234,179,8,0.1)' : '#fefce8', borderColor: isDark ? 'rgba(234,179,8,0.2)' : '#fef08a' }} className="p-4 mx-4 mb-4 rounded-xl border">
              <AppText variant="bodySmall" color={isDark ? colors.gray300 : "#374151"}>
                <AppText variant="bodySmall" weight="semibold" color={isDark ? '#eab308' : "#854d0e"}>{translate('note') || 'Note'}:</AppText> {trip.notes}
              </AppText>
            </View>
          )}

          {/* Price Summary Card */}
          <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="p-4 mx-4 mb-3 rounded-xl border">
            <AppText variant="bodyLarge" weight="semibold" color={colors.text} className="mb-3">
              {translate('price_summary')}
            </AppText>
            <View className="space-y-2">
              <View className="flex-row justify-between py-2">
                <AppText variant="bodyMedium" color={colors.textSecondary}>{translate('price_per_seat')}</AppText>
                <AppText variant="h3" weight="bold" color={colors.primary}>
                  {formatCurrency(price)}
                </AppText>
              </View>
              <View style={{ borderTopColor: colors.border }} className="flex-row justify-between py-2 border-t">
                <AppText variant="bodyMedium" color={colors.textSecondary}>{translate('available_today')}</AppText>
                <AppText variant="bodyMedium" weight="500" color={availableSeats > 0 ? colors.success : colors.error}>
                  {availableSeats} / {totalSeats}
                </AppText>
              </View>
              <View style={{ borderTopColor: colors.border }} className="flex-row justify-between py-2 border-t">
                <AppText variant="bodyMedium" color={colors.textSecondary}>{translate('total_for_1_seat')}</AppText>
                <AppText variant="h2" weight="bold" color={colors.primary}>
                  {formatCurrency(price)}
                </AppText>
              </View>
            </View>
          </View>

          {/* Action Button - Enhanced and more visible */}
          <View className="mx-4 mt-4 mb-6">
            <TouchableOpacity
              onPress={handleSelectSeats}
              disabled={!canBook}
              style={{
                backgroundColor: !canBook ? (isDark ? '#4b5563' : '#d1d5db') : colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5
              }}
              className="py-4 rounded-xl flex-row items-center justify-center"
            >
              <Bus size={22} color="white" />
              <AppText variant="bodyLarge" weight="bold" color="white" className="ml-2">
                {!canBook
                  ? (trip?.tripStatus !== 'scheduled' && trip?.tripStatus !== 'boarding')
                    ? translate('trip_unavailable')
                    : translate('fully_booked')
                  : translate('select_seats')}
              </AppText>
              {canBook && <ChevronRight size={22} color="white" className="ml-2" />}
            </TouchableOpacity>

            {/* Booking Info */}
            {canBook && (
              <View className="mt-3 flex-row justify-center items-center">
                <Shield size={14} color={colors.success} />
                <AppText variant="caption" color={colors.textSecondary} className="ml-1">
                  {translate('secure_booking_info')}
                </AppText>
              </View>
            )}

            {!canBook && trip?.tripStatus === 'scheduled' && availableSeats === 0 && (
              <View style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#f87171' }} className="mt-3 p-3 rounded-lg border">
                <AppText variant="caption" color={isDark ? '#f87171' : "#dc2626"} className="text-center">
                  {translate('fully_booked_desc') || "This trip is fully booked. Please check other available trips."}
                </AppText>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}