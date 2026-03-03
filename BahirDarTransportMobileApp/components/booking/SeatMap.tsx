// components/booking/SeatMap.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import Animated, {
  FadeIn,
  Layout,
  SlideInDown,
} from 'react-native-reanimated';
import { Crown, Armchair, Info, AlertCircle, XCircle, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, getSeatColors } from '../../constants/colors';
import { Trip } from '../../types';
import { useToast } from '../common/Toast';
import { bookingsApi } from '../../lib/api/bookings';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SeatMapProps {
  trip: Trip;
  selectedSeats: number[];
  onSeatSelect: (seatNumber: number) => void;
  maxSelectable?: number;
  userBookedSeats?: string[]; // User's own booked seats
}

export default function SeatMap({
  trip,
  selectedSeats,
  onSeatSelect,
  maxSelectable = 8,
  userBookedSeats = [],
}: SeatMapProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<Set<number>>(new Set());

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

  // Fetch booked seats from the server
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

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchBookedSeats();
    
    const interval = setInterval(fetchBookedSeats, 15000);
    return () => clearInterval(interval);
  }, [trip?._id]);

  const getSeatStatus = useCallback((seatId: string): 'available' | 'selected' | 'booked' => {
    const seatNum = parseInt(seatId, 10);
    
    // Check if seat is booked by ANYONE (from the API)
    if (bookedSeats.has(seatNum)) {
      return 'booked';
    }
    
    // Also check user's own booked seats (as backup)
    if (userBookedSeats.includes(seatId)) {
      return 'booked';
    }
    
    // If it's selected in current session
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

        // Log first few seats for debugging
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

  const driverColors = getSeatColors('driver');

  if (!trip) {
    return (
      <View className="p-8 items-center justify-center">
        <AlertCircle size={48} color={COLORS.danger} />
        <Text className="text-lg font-semibold mt-4" style={{ color: COLORS.textPrimary }}>
          No Trip Data
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: COLORS.background }}>
      <View className="mx-4 mt-2 p-4 rounded-xl" style={{ backgroundColor: COLORS.cardBackground }}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
            Select Your Seats
          </Text>
          <View className="flex-row items-center">
            <View className="bg-blue-50 px-3 py-1 rounded-full mr-2">
              <Text className="text-blue-600 text-xs font-medium">
                {availableCount} left
              </Text>
            </View>
            <TouchableOpacity onPress={fetchBookedSeats} disabled={loading}>
              <RefreshCw size={16} color={COLORS.primary} style={loading ? { opacity: 0.5 } : {}} />
            </TouchableOpacity>
          </View>
        </View>

        {isFullyBooked && (
          <Animated.View
            entering={SlideInDown.springify()}
            className="mb-4 p-4 bg-red-50 rounded-xl border-2 border-red-200 items-center"
          >
            <XCircle size={48} color="#ef4444" />
            <Text className="text-red-700 font-bold text-lg mt-2">Fully Booked</Text>
            <Text className="text-red-600 text-center mt-1">
              All seats on this trip are already taken.
            </Text>
          </Animated.View>
        )}

        {!isFullyBooked && (
          <View className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <Text className="text-yellow-700 text-xs text-center">
              ⚡ Red seats are already booked. Select your preferred available seats.
            </Text>
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
            <Crown size={32} color={COLORS.accent} />
          </View>
          <Text className="text-sm font-medium mt-2" style={{ color: COLORS.textSecondary }}>
            Driver
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(200).springify()}
          className="flex-row justify-between mb-6"
        >
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: COLORS.gray200 }}>
            <Text className="text-xs font-medium" style={{ color: COLORS.gray700 }}>
              FRONT DOOR
            </Text>
          </View>
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: COLORS.gray200 }}>
            <Text className="text-xs font-medium" style={{ color: COLORS.gray700 }}>
              FRONT DOOR
            </Text>
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
                {row.slice(0, 2).map((seat: any) => (
                  <AnimatedTouchable
                    key={seat.id}
                    onPress={() => handleSeatPress(seat.id)}
                    disabled={seat.status === 'booked' || isFullyBooked}
                    layout={Layout.springify()}
                    className={`w-14 h-14 mx-1 rounded-lg items-center justify-center border-2 ${
                      seat.status === 'booked' 
                        ? 'bg-red-500 border-red-600' 
                        : seat.status === 'selected'
                          ? 'bg-green-500 border-green-600'
                          : isFullyBooked 
                            ? 'opacity-40 bg-gray-200 border-gray-300'
                            : 'bg-white border-gray-300'
                    }`}
                  >
                    <Armchair size={20} color={
                      seat.status === 'booked' 
                        ? 'white' 
                        : seat.status === 'selected'
                          ? 'white'
                          : '#374151'
                    } />
                    <Text className={`text-xs mt-1 font-medium ${
                      seat.status === 'booked' 
                        ? 'text-white' 
                        : seat.status === 'selected'
                          ? 'text-white'
                          : 'text-gray-700'
                    }`}>
                      {seat.id}
                    </Text>
                  </AnimatedTouchable>
                ))}
              </View>

              <View className="w-8" />

              <View className="flex-row">
                {row.slice(2, 4).map((seat: any) => (
                  <AnimatedTouchable
                    key={seat.id}
                    onPress={() => handleSeatPress(seat.id)}
                    disabled={seat.status === 'booked' || isFullyBooked}
                    layout={Layout.springify()}
                    className={`w-14 h-14 mx-1 rounded-lg items-center justify-center border-2 ${
                      seat.status === 'booked' 
                        ? 'bg-red-500 border-red-600' 
                        : seat.status === 'selected'
                          ? 'bg-green-500 border-green-600'
                          : isFullyBooked 
                            ? 'opacity-40 bg-gray-200 border-gray-300'
                            : 'bg-white border-gray-300'
                    }`}
                  >
                    <Armchair size={20} color={
                      seat.status === 'booked' 
                        ? 'white' 
                        : seat.status === 'selected'
                          ? 'white'
                          : '#374151'
                    } />
                    <Text className={`text-xs mt-1 font-medium ${
                      seat.status === 'booked' 
                        ? 'text-white' 
                        : seat.status === 'selected'
                          ? 'text-white'
                          : 'text-gray-700'
                    }`}>
                      {seat.id}
                    </Text>
                  </AnimatedTouchable>
                ))}
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View
          entering={FadeIn.delay(400).springify()}
          className="flex-row justify-between mt-6"
        >
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: COLORS.gray200 }}>
            <Text className="text-xs font-medium" style={{ color: COLORS.gray700 }}>
              BACK DOOR
            </Text>
          </View>
          <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: COLORS.gray200 }}>
            <Text className="text-xs font-medium" style={{ color: COLORS.gray700 }}>
              BACK DOOR
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(500).springify()}
          className="flex-row justify-center mt-6 pt-4 flex-wrap"
          style={{ borderTopWidth: 1, borderTopColor: COLORS.border }}
        >
          <View className="flex-row items-center mx-3 mb-2">
            <View className="w-5 h-5 rounded mr-2 border-2 bg-white border-gray-300" />
            <Text className="text-xs text-gray-600">
              Available ({availableCount})
            </Text>
          </View>
          <View className="flex-row items-center mx-3 mb-2">
            <View className="w-5 h-5 rounded mr-2 border-2 bg-green-500 border-green-600" />
            <Text className="text-xs text-gray-600">
              Selected ({selectedSeats.length})
            </Text>
          </View>
          <View className="flex-row items-center mx-3 mb-2">
            <View className="w-5 h-5 rounded mr-2 border-2 bg-red-500 border-red-600" />
            <Text className="text-xs text-gray-600">
              Booked ({bookedCount})
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(600).springify()}
          className="flex-row items-center justify-between mt-4 pt-2"
        >
          <View className="flex-row items-center">
            <Info size={16} color={COLORS.primary} />
            <Text className="ml-2 text-xs" style={{ color: COLORS.textSecondary }}>
              {loading ? 'Refreshing...' : `${availableCount} seats available`}
            </Text>
          </View>
          <Text className="text-xs font-medium" style={{ color: COLORS.primary }}>
            {selectedSeats.length} of {maxSelectable} selected
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}