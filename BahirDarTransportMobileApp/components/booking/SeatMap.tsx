import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Crown, Armchair, Info, AlertCircle } from 'lucide-react-native';
import { COLORS, getSeatColors } from '../../constants/colors';
import { tripsApi } from '../../lib/api/trips';
import { Trip } from '../../types';

interface SeatMapProps {
  trip: Trip;
  selectedSeats: number[];
  onSeatSelect: (seatNumber: number) => void;
  maxSelectable?: number;
  bookedSeats?: string[];
}

export default function SeatMap({
  trip,
  selectedSeats,
  onSeatSelect,
  maxSelectable = 8,
  bookedSeats: externalBookedSeats
}: SeatMapProps) {
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert selectedSeats (number[]) to string[] for comparison
  const selectedSeatsStr = useMemo(() =>
    selectedSeats.map(seat => seat.toString()),
    [selectedSeats]
  );

  // Use exact vehicle seat count from trip
  const totalSeats = useMemo(() => {
    if (!trip) return 40;

    // Try to get total seats from various possible locations
    const raw =
      trip.totalSeats ??
      trip.vehicle?.totalCapacity ??
      trip.vehicleID?.totalCapacity ??
      40; // Default fallback

    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 40;
  }, [trip]);

  // Generate seat layout: vehicle seat numbers 1 to totalSeats
  const seatLayout = useMemo(() => {
    if (totalSeats <= 0) return [];
    const columns = 4;
    const layout: { id: string; number: string; status: string }[][] = [];

    for (let seatNum = 1; seatNum <= totalSeats; seatNum += columns) {
      const row: { id: string; number: string; status: string }[] = [];
      for (let col = 0; col < columns && seatNum + col <= totalSeats; col++) {
        const id = String(seatNum + col);
        const status = bookedSeats.includes(id)
          ? 'booked'
          : selectedSeatsStr.includes(id)
            ? 'selected'
            : 'available';
        row.push({ id, number: id, status });
      }
      if (row.length > 0) layout.push(row);
    }
    return layout;
  }, [totalSeats, bookedSeats, selectedSeatsStr]);

  // Initialize booked seats from props or fetch
  useEffect(() => {
    if (externalBookedSeats !== undefined) {
      setBookedSeats(Array.isArray(externalBookedSeats) ? externalBookedSeats : []);
    } else if (trip?._id) {
      fetchBookedSeats();
    }
  }, [trip?._id, externalBookedSeats]);

  const fetchBookedSeats = async () => {
    if (!trip?._id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await tripsApi.getBookedSeatsForTrip(trip._id);
      // Handle different response structures
      const seats = response?.data?.bookedSeats || response?.bookedSeats || [];
      setBookedSeats(seats.map((seat: any) => seat.toString()));
    } catch (error) {
      console.log('⚠️ Could not load booked seats', error);
      setError('Failed to load seat availability');
      setBookedSeats([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = useCallback((seatId: string): 'available' | 'selected' | 'booked' => {
    if (bookedSeats.includes(seatId)) return 'booked';
    if (selectedSeatsStr.includes(seatId)) return 'selected';
    return 'available';
  }, [bookedSeats, selectedSeatsStr]);

  const handleSeatPress = useCallback((seatId: string) => {
    const seatNumber = parseInt(seatId, 10);
    const status = getSeatStatus(seatId);

    if (status === 'booked') {
      Alert.alert('Seat Unavailable', 'This seat is already booked.');
      return;
    }

    if (status === 'selected') {
      // Remove seat
      onSeatSelect(seatNumber);
    } else {
      // Add seat if under max limit
      if (selectedSeats.length >= maxSelectable) {
        Alert.alert(
          'Maximum Seats Reached',
          `You can only select up to ${maxSelectable} seats per booking.`
        );
        return;
      }
      onSeatSelect(seatNumber);
    }
  }, [selectedSeats, maxSelectable, getSeatStatus, onSeatSelect]);

  const getSeatStyle = useCallback((seatId: string) => {
    const status = getSeatStatus(seatId);
    const colors = getSeatColors(status);
    return {
      backgroundColor: colors.bg,
      borderColor: colors.border,
    };
  }, [getSeatStatus]);

  const getSeatTextColor = useCallback((seatId: string) => {
    const status = getSeatStatus(seatId);
    const colors = getSeatColors(status);
    return colors.text;
  }, [getSeatStatus]);

  const getSeatIconColor = useCallback((seatId: string) => {
    const status = getSeatStatus(seatId);
    const colors = getSeatColors(status);
    return colors.text;
  }, [getSeatStatus]);

  const driverColors = getSeatColors('driver');
  const availableColors = getSeatColors('available');
  const selectedColors = getSeatColors('selected');
  const bookedColors = getSeatColors('booked');

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

  // Calculate booked count
  const bookedCount = bookedSeats.length;
  const availableCount = totalSeats - bookedCount;

  return (
    <View style={{ backgroundColor: COLORS.background }}>
      <View className="mx-4 mt-2 p-4 rounded-xl" style={{ backgroundColor: COLORS.cardBackground }}>

        {/* Driver Section */}
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center border-2"
            style={{ backgroundColor: driverColors.bg, borderColor: driverColors.border }}
          >
            <Crown size={32} color={COLORS.accent} />
          </View>
          <Text className="text-sm font-medium mt-2" style={{ color: COLORS.textSecondary }}>
            Driver
          </Text>
        </View>

        {/* Front Doors */}
        <View className="flex-row justify-between mb-6">
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
        </View>

        {/* Seat Layout */}
        <View className="items-center">
          {seatLayout.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} className="flex-row justify-between mb-2 w-full">
              <View className="flex-row">
                {row.slice(0, 2).map((seat: any) => (
                  <TouchableOpacity
                    key={seat.id}
                    onPress={() => handleSeatPress(seat.id)}
                    disabled={seat.status === 'booked'}
                    className="w-14 h-14 mx-1 rounded-lg items-center justify-center border-2"
                    style={[
                      getSeatStyle(seat.id),
                      seat.status === 'booked' && { opacity: 0.7 },
                    ]}
                  >
                    <Armchair size={20} color={getSeatIconColor(seat.id)} />
                    <Text className="text-xs mt-1 font-medium" style={{ color: getSeatTextColor(seat.id) }}>
                      {seat.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Aisle */}
              <View className="w-8" />

              {/* Right side seats */}
              <View className="flex-row">
                {row.slice(2, 4).map((seat: any) => (
                  <TouchableOpacity
                    key={seat.id}
                    onPress={() => handleSeatPress(seat.id)}
                    disabled={seat.status === 'booked'}
                    className="w-14 h-14 mx-1 rounded-lg items-center justify-center border-2"
                    style={[
                      getSeatStyle(seat.id),
                      seat.status === 'booked' && { opacity: 0.7 },
                    ]}
                  >
                    <Armchair size={20} color={getSeatIconColor(seat.id)} />
                    <Text className="text-xs mt-1 font-medium" style={{ color: getSeatTextColor(seat.id) }}>
                      {seat.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Back Doors */}
        <View className="flex-row justify-between mt-6">
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
        </View>

        {/* Legend */}
        <View className="flex-row justify-center mt-6 pt-4 flex-wrap" style={{ borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <View className="flex-row items-center mx-3 mb-2">
            <View className="w-5 h-5 rounded mr-2 border-2" style={{
              backgroundColor: availableColors.bg,
              borderColor: availableColors.border
            }} />
            <Text className="text-xs" style={{ color: COLORS.textSecondary }}>
              Available ({availableCount})
            </Text>
          </View>
          <View className="flex-row items-center mx-3 mb-2">
            <View className="w-5 h-5 rounded mr-2 border-2" style={{
              backgroundColor: selectedColors.bg,
              borderColor: selectedColors.border
            }} />
            <Text className="text-xs" style={{ color: COLORS.textSecondary }}>
              Selected ({selectedSeats.length})
            </Text>
          </View>
          <View className="flex-row items-center mx-3 mb-2">
            <View className="w-5 h-5 rounded mr-2 border-2 opacity-70" style={{
              backgroundColor: bookedColors.bg,
              borderColor: bookedColors.border
            }} />
            <Text className="text-xs" style={{ color: COLORS.textSecondary }}>
              Booked ({bookedCount})
            </Text>
          </View>
        </View>

        {/* Seat Info */}
        <View className="flex-row items-center justify-between mt-4 pt-2">
          <View className="flex-row items-center">
            <Info size={16} color={COLORS.primary} />
            <Text className="ml-2 text-xs" style={{ color: COLORS.textSecondary }}>
              Total {totalSeats} seats • {bookedCount} booked • {availableCount} available
            </Text>
          </View>
          <Text className="text-xs font-medium" style={{ color: COLORS.primary }}>
            {selectedSeats.length} of {maxSelectable} selected
          </Text>
        </View>

        {loading && (
          <View className="mt-4 py-2">
            <Text className="text-xs text-center" style={{ color: COLORS.textTertiary }}>
              Loading seat availability...
            </Text>
          </View>
        )}

        {error && (
          <View className="mt-4 py-2 px-3 bg-red-50 rounded-lg">
            <Text className="text-xs text-center text-red-600">
              {error}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}