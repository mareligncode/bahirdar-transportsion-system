import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Alert
} from 'react-native';
import { AppText } from '../common/AppText';
import Animated, {
  FadeIn,
  Layout,
  SlideInDown,
} from 'react-native-reanimated';
import { Crown, Armchair, Info, AlertCircle, XCircle, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Trip } from '../../types';
import { bookingsApi } from '../../lib/api/bookings';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SeatMapProps {
  trip: Trip;
  selectedSeats: number[];
  onSeatSelect: (seatNumber: number) => void;
  maxSelectable?: number;
  userBookedSeats?: string[];
}

export default function SeatMap({
  trip,
  selectedSeats,
  onSeatSelect,
  maxSelectable = 8,
  userBookedSeats = [],
}: SeatMapProps) {

  const [loading, setLoading] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<Set<number>>(new Set());
  const { isDark, colors } = useTheme();
  const { translate } = useTranslation();

  console.log('🪑 Trip available seats:', trip.availableSeats, 'of', trip.totalSeats);
  console.log('🪑 User booked seats:', userBookedSeats);

  const selectedSeatsStr = useMemo(() =>
    selectedSeats.map(seat => seat.toString()),
    [selectedSeats]
  );

  const totalSeats = useMemo(() => {
    if (!trip) return 40;
    const raw = trip.totalSeats ?? trip.vehicle?.totalCapacity ?? 40;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 40;
  }, [trip]);

  const fetchBookedSeats = useCallback(async () => {
    if (!trip?._id) return;

    setLoading(true);
    try {
      const bookedSeatNumbers = await bookingsApi.getBookedSeatsForTrip(trip._id);
      setBookedSeats(new Set(bookedSeatNumbers));
      console.log('📡 Fetched booked seats:', bookedSeatNumbers);
    } catch (error) {
      console.error('Failed to fetch booked seats:', error);
    } finally {
      setLoading(false);
    }
  }, [trip?._id]);

  useEffect(() => {
    fetchBookedSeats();

    const interval = setInterval(fetchBookedSeats, 15000);
    return () => clearInterval(interval);
  }, [trip?._id, fetchBookedSeats]);

  const getSeatStatus = useCallback((seatId: string): 'available' | 'selected' | 'booked' => {
    const seatNum = parseInt(seatId, 10);

    if (bookedSeats.has(seatNum)) {
      return 'booked';
    }

    if (userBookedSeats.includes(seatId)) {
      return 'booked';
    }

    if (selectedSeatsStr.includes(seatId)) {
      return 'selected';
    }

    return 'available';
  }, [bookedSeats, userBookedSeats, selectedSeatsStr]);

  const seatLayout = useMemo(() => {
    if (totalSeats <= 0) return [];
    const columns = 4;
    const layout: { id: string; number: string; status: string }[][] = [];

    console.log('🪑 Generating seat layout for', totalSeats, 'seats');
    console.log('🪑 Booked seats:', Array.from(bookedSeats).sort((a, b) => a - b));

    for (let seatNum = 1; seatNum <= totalSeats; seatNum += columns) {
      const row: { id: string; number: string; status: string }[] = [];
      for (let col = 0; col < columns && seatNum + col <= totalSeats; col++) {
        const id = String(seatNum + col);
        const status = getSeatStatus(id);

        if (seatNum <= 4 && col < 4) {
          console.log(`🪑 Seat ${id}: ${status}${status === 'booked' ? ' (BOOKED)' : ''}`);
        }

        row.push({ id, number: id, status });
      }
      if (row.length > 0) layout.push(row);
    }
    return layout;
  }, [totalSeats, getSeatStatus, bookedSeats]);

  const bookedCount = bookedSeats.size;
  const availableCount = totalSeats - bookedCount;
  const isFullyBooked = availableCount === 0;

  const handleSeatPress = useCallback((seatId: string) => {
    const seatNumber = parseInt(seatId, 10);
    const status = getSeatStatus(seatId);

    if (status === 'booked') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Seat Already Booked',
        `Seat ${seatNumber} is already booked by another passenger.`
      );
      return;
    }

    if (status === 'selected') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSeatSelect(seatNumber);
    } else {
      if (selectedSeats.length >= maxSelectable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Maximum Seats Reached',
          `You can only select up to ${maxSelectable} seats.`
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSeatSelect(seatNumber);
    }
  }, [selectedSeats, maxSelectable, getSeatStatus, onSeatSelect]);

  const driverColors = {
    bg: isDark ? '#374151' : '#fef3c7',
    border: isDark ? '#4b5563' : '#f59e0b'
  };

  const getSeatStyle = (status: 'available' | 'selected' | 'booked') => {
    switch (status) {
      case 'booked':
        return {
          bg: isDark ? '#7f1d1d' : '#fecaca',
          border: isDark ? '#991b1b' : '#f87171',
          text: 'white',
          icon: 'white'
        };
      case 'selected':
        return {
          bg: isDark ? '#064e3b' : '#10b981',
          border: isDark ? '#065f46' : '#059669',
          text: 'white',
          icon: 'white'
        };
      case 'available':
      default:
        return {
          bg: colors.card,
          border: colors.border,
          text: colors.text,
          icon: colors.textSecondary
        };
    }
  };

  if (!trip) {
    return (
      <View className="p-8 items-center justify-center">
        <AlertCircle size={48} color="#ef4444" />
        <AppText variant="bodyLarge" weight="semibold" color={colors.text} className="mt-4">
          No Trip Data
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background }}>
      <View className="mx-4 mt-2 p-4 rounded-xl shadow-sm" style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}>
        <View className="flex-row justify-between items-center mb-4">
          <AppText variant="bodyLarge" weight="semibold" color={colors.text}>
            {translate('select_your_seats') || 'Select Your Seats'}
          </AppText>
          <View className="flex-row items-center">
            <View className={`${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} px-3 py-1 rounded-full mr-2`}>
              <AppText variant="caption" weight="500" color="#3b82f6">
                {availableCount} {translate('left') || 'left'}
              </AppText>
            </View>
            <TouchableOpacity onPress={fetchBookedSeats} disabled={loading}>
              <RefreshCw size={16} color={colors.primary} style={loading ? { opacity: 0.5 } : {}} />
            </TouchableOpacity>
          </View>
        </View>

        {isFullyBooked && (
          <Animated.View
            entering={SlideInDown.springify()}
            className={`mb-4 p-4 ${isDark ? 'bg-red-900/30' : 'bg-red-50'} rounded-xl border-2 ${isDark ? 'border-red-900' : 'border-red-200'} items-center`}
          >
            <XCircle size={48} color="#ef4444" />
            <AppText variant="h3" weight="bold" color={isDark ? '#fca5a5' : '#b91c1c'} className="mt-2 text-center">
              {translate('fully_booked') || 'Fully Booked'}
            </AppText>
            <AppText variant="bodySmall" color={isDark ? '#f87171' : '#dc2626'} className="text-center mt-1">
              {translate('fully_booked_desc') || 'All seats on this trip are already taken.'}
            </AppText>
          </Animated.View>
        )}

        {!isFullyBooked && (
          <View className={`mb-4 p-3 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'} rounded-lg border ${isDark ? 'border-yellow-900/50' : 'border-yellow-200'}`}>
            <AppText variant="caption" color={isDark ? '#fbbf24' : '#854d0e'} className="text-center">
              ⚡ {translate('seat_selection_tip') || 'Red seats are already booked. Select your preferred available seats.'}
            </AppText>
          </View>
        )}

        <Animated.View
          entering={FadeIn.delay(100).springify()}
          className="items-center mb-6"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center border-2"
            style={{ backgroundColor: driverColors.bg, borderColor: driverColors.border }}
          >
            <Crown size={32} color={isDark ? '#fbbf24' : '#f59e0b'} />
          </View>
          <AppText variant="bodySmall" weight="500" color={colors.textSecondary} className="mt-2 text-center">
            {translate('driver') || 'Driver'}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(200).springify()}
          className="flex-row justify-between mb-6"
        >
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
            <AppText variant="caption" weight="500" color={isDark ? colors.textSecondary : '#4b5563'}>
              {translate('front_door') || 'FRONT DOOR'}
            </AppText>
          </View>
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
            <AppText variant="caption" weight="500" color={isDark ? colors.textSecondary : '#4b5563'}>
              {translate('front_door') || 'FRONT DOOR'}
            </AppText>
          </View>
        </Animated.View>

        <View className="items-center">
          {seatLayout.map((row, rowIndex) => (
            <Animated.View
              key={`row-${rowIndex}`}
              entering={FadeIn.delay(300 + rowIndex * 50).springify()}
              layout={Layout.springify()}
              className="flex-row justify-between mb-2 w-full"
            >
              <View className="flex-row">
                {row.slice(0, 2).map((seat: any) => {
                  const style = getSeatStyle(seat.status);
                  return (
                    <AnimatedTouchable
                      key={seat.id}
                      onPress={() => handleSeatPress(seat.id)}
                      disabled={seat.status === 'booked' || isFullyBooked}
                      layout={Layout.springify()}
                      style={{ backgroundColor: style.bg, borderColor: style.border }}
                      className={`w-14 h-14 mx-1 rounded-xl items-center justify-center border-2 ${isFullyBooked && seat.status === 'available' ? 'opacity-40' : ''
                        }`}
                    >
                      <Armchair size={20} color={style.icon as any} />
                      <AppText
                        variant="caption"
                        weight="semibold"
                        color={style.text as any}
                        className="mt-1"
                      >
                        {seat.id}
                      </AppText>
                    </AnimatedTouchable>
                  );
                })}
              </View>

              <View className="w-8" />

              <View className="flex-row">
                {row.slice(2, 4).map((seat: any) => {
                  const style = getSeatStyle(seat.status);
                  return (
                    <AnimatedTouchable
                      key={seat.id}
                      onPress={() => handleSeatPress(seat.id)}
                      disabled={seat.status === 'booked' || isFullyBooked}
                      layout={Layout.springify()}
                      style={{ backgroundColor: style.bg, borderColor: style.border }}
                      className={`w-14 h-14 mx-1 rounded-xl items-center justify-center border-2 ${isFullyBooked && seat.status === 'available' ? 'opacity-40' : ''
                        }`}
                    >
                      <Armchair size={20} color={style.icon as any} />
                      <AppText
                        variant="caption"
                        weight="semibold"
                        color={style.text as any}
                        className="mt-1"
                      >
                        {seat.id}
                      </AppText>
                    </AnimatedTouchable>
                  );
                })}
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View
          entering={FadeIn.delay(400).springify()}
          className="flex-row justify-between mt-6"
        >
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
            <AppText variant="caption" weight="500" color={isDark ? colors.textSecondary : '#4b5563'}>
              {translate('back_door') || 'BACK DOOR'}
            </AppText>
          </View>
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
            <AppText variant="caption" weight="500" color={isDark ? colors.textSecondary : '#4b5563'}>
              {translate('back_door') || 'BACK DOOR'}
            </AppText>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(500).springify()}
          className="flex-row justify-center mt-6 pt-4 flex-wrap"
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <View className="flex-row items-center mx-3 mb-2">
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="w-5 h-5 rounded mr-2 border-2" />
            <AppText variant="caption" color={colors.textSecondary}>
              {translate('available') || 'Available'} ({availableCount})
            </AppText>
          </View>
          <View className="flex-row items-center mx-3 mb-2">
            <View className={`w-5 h-5 rounded mr-2 border-2 ${isDark ? 'bg-green-900/40 border-green-800' : 'bg-green-500 border-green-600'}`} />
            <AppText variant="caption" color={colors.textSecondary}>
              {translate('selected') || 'Selected'} ({selectedSeats.length})
            </AppText>
          </View>
          <View className="flex-row items-center mx-3 mb-2">
            <View className={`w-5 h-5 rounded mr-2 border-2 ${isDark ? 'bg-red-900/40 border-red-800' : 'bg-red-500 border-red-600'}`} />
            <AppText variant="caption" color={colors.textSecondary}>
              {translate('booked') || 'Booked'} ({bookedCount})
            </AppText>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(600).springify()}
          className="flex-row items-center justify-between mt-4 pt-2"
        >
          <View className="flex-row items-center">
            <Info size={16} color={colors.primary} />
            <AppText variant="caption" color={colors.textSecondary} className="ml-2">
              {loading ? translate('refreshing') || 'Refreshing...' : `${availableCount} ${translate('seats_available') || 'seats available'}`}
            </AppText>
          </View>
          <AppText variant="caption" weight="semibold" color={colors.primary}>
            {selectedSeats.length} {translate('of') || 'of'} {maxSelectable} {translate('selected') || 'selected'}
          </AppText>
        </Animated.View>
      </View>
    </View>
  );
}