// components/booking/SeatMap.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crown, Armchair, Info, AlertCircle } from 'lucide-react-native';
import { COLORS, getSeatColors } from '../../constants/colors';
import { Trip } from '../../types/trip';
import { tripsApi } from '../../lib/api/trips';

interface SeatMapProps {
  trip: any; 
  selectedSeats: string[];
  onSeatSelect: (seats: string[]) => void;
  maxSelectable?: number;
  bookedSeats?: string[]; 
}

export default function SeatMap({ 
  trip, 
  selectedSeats, 
  onSeatSelect, 
  maxSelectable = 4,
  bookedSeats: externalBookedSeats 
}: SeatMapProps) {
  const insets = useSafeAreaInsets();
  const [bookedSeats, setBookedSeats] = useState<string[]>(externalBookedSeats || []);
  const [seatLayout, setSeatLayout] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSeats = useMemo(() => {
    if (!trip) return 0;
    
    console.log('🔍 Checking trip for seat count:', trip);
    
    const possibleSeatCount = 
      trip.totalSeats || 
      trip.vehicle?.totalCapacity ||
      trip.capacity ||              
      trip.seatCount ||            
      trip.maxSeats ||              
      trip.seats?.length ||       
      trip.availableSeats + (bookedSeats?.length || 0) || 
      (trip as any).vehicle?.capacity || 
      (trip as any).vehicle?.seats ||    
      (trip as any).bus?.capacity ||     
      (trip as any).bus?.totalSeats ||    
      40; 
    
    return possibleSeatCount;
  }, [trip, bookedSeats]);

  useEffect(() => {
    if (externalBookedSeats) {
      setBookedSeats(externalBookedSeats);
    } else if (trip?._id) {
      fetchBookedSeats();
    }
  }, [trip?._id]);

  useEffect(() => {
    if (totalSeats > 0) {
      generateSeatLayout();
    }
  }, [bookedSeats, selectedSeats, totalSeats]);

  const fetchBookedSeats = async () => {
    if (!trip?._id) return;
    
    setLoading(true);
    try {
      const response = await tripsApi.getBookedSeatsForTrip(trip._id);
      const seats = response?.data?.bookedSeats || [];
      setBookedSeats(seats);
    } catch (error) {
      console.log('⚠️ Could not load booked seats');
      setBookedSeats([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSeatLayout = () => {
    const columns = 4; // Default 4 columns
    const rows = Math.ceil(totalSeats / columns);
    const columnsArray = ['A', 'B', 'C', 'D'];
    
    const layout = [];
    let seatCounter = 0;
    
    for (let i = 1; i <= rows; i++) {
      const row = [];
      for (let j = 0; j < columnsArray.length; j++) {
        seatCounter++;
        if (seatCounter <= totalSeats) {
          const seatNumber = `${i}${columnsArray[j]}`;
          row.push({
            id: seatNumber,
            number: seatNumber,
            row: i.toString(),
            column: columnsArray[j],
            status: getSeatStatus(seatNumber),
          });
        }
      }
      if (row.length > 0) {
        layout.push(row);
      }
    }
    
    setSeatLayout(layout);
  };

  const getSeatStatus = (seatId: string): 'available' | 'selected' | 'booked' | 'driver' => {
    if (bookedSeats.includes(seatId)) return 'booked';
    if (selectedSeats.includes(seatId)) return 'selected';
    return 'available';
  };

  const handleSeatPress = (seatId: string) => {
    const status = getSeatStatus(seatId);
    if (status === 'booked') return;
    
    if (selectedSeats.includes(seatId)) {
      onSeatSelect(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= maxSelectable) {
        alert(`You can only select up to ${maxSelectable} seats`);
        return;
      }
      onSeatSelect([...selectedSeats, seatId]);
    }
  };

  const getSeatStyle = (seatId: string) => {
    const status = getSeatStatus(seatId);
    const colors = getSeatColors(status);
    return {
      backgroundColor: colors.bg,
      borderColor: colors.border,
    };
  };

  const getSeatTextColor = (seatId: string) => {
    const status = getSeatStatus(seatId);
    const colors = getSeatColors(status);
    return colors.text;
  };

  const getSeatIconColor = (seatId: string) => {
    const status = getSeatStatus(seatId);
    if (status === 'selected') return COLORS.white;
    if (status === 'booked') return COLORS.gray400;
    return COLORS.gray600;
  };

  if (!trip) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
        <View className="flex-1 items-center justify-center p-8">
          <AlertCircle size={48} color="#ef4444" />
          <Text className="text-lg font-semibold text-gray-900 mt-4">No Trip Data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="bg-white mx-4 mt-2 p-4 rounded-xl">
          
          {/* Driver Section */}
          <View className="items-center mb-6">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center border-2"
              style={{ 
                backgroundColor: getSeatColors('driver').bg,
                borderColor: getSeatColors('driver').border 
              }}
            >
              <Crown size={32} color="#10b981" />
            </View>
            <Text className="text-sm font-medium text-gray-600 mt-2">Driver</Text>
          </View>

          {/* Front Doors */}
          <View className="flex-row justify-between mb-6">
            <View className="bg-gray-200 px-4 py-2 rounded-lg">
              <Text className="text-xs font-medium text-gray-700">FRONT DOOR</Text>
            </View>
            <View className="bg-gray-200 px-4 py-2 rounded-lg">
              <Text className="text-xs font-medium text-gray-700">FRONT DOOR</Text>
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
                      className={`
                        w-14 h-14 mx-1 rounded-lg border-2 items-center justify-center
                        ${seat.status === 'booked' ? 'opacity-50' : ''}
                      `}
                      style={getSeatStyle(seat.id)}
                    >
                      <Armchair size={20} color={getSeatIconColor(seat.id)} />
                      <Text 
                        className="text-xs mt-1"
                        style={{ color: getSeatTextColor(seat.id) }}
                      >
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
                      className={`
                        w-14 h-14 mx-1 rounded-lg border-2 items-center justify-center
                        ${seat.status === 'booked' ? 'opacity-50' : ''}
                      `}
                      style={getSeatStyle(seat.id)}
                    >
                      <Armchair size={20} color={getSeatIconColor(seat.id)} />
                      <Text 
                        className="text-xs mt-1"
                        style={{ color: getSeatTextColor(seat.id) }}
                      >
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
            <View className="bg-gray-200 px-4 py-2 rounded-lg">
              <Text className="text-xs font-medium text-gray-700">BACK DOOR</Text>
            </View>
            <View className="bg-gray-200 px-4 py-2 rounded-lg">
              <Text className="text-xs font-medium text-gray-700">BACK DOOR</Text>
            </View>
          </View>

          {/* Legend */}
          <View className="flex-row justify-center mt-6 pt-4 border-t border-gray-200">
            <View className="flex-row items-center mx-3">
              <View className="w-4 h-4 rounded-sm mr-2 border-2 bg-white border-gray-300" />
              <Text className="text-xs text-gray-600">Available</Text>
            </View>
            <View className="flex-row items-center mx-3">
              <View className="w-4 h-4 rounded-sm mr-2 border-2 bg-blue-600 border-blue-800" />
              <Text className="text-xs text-gray-600">Selected</Text>
            </View>
            <View className="flex-row items-center mx-3">
              <View className="w-4 h-4 rounded-sm mr-2 border-2 bg-gray-200 border-gray-400" />
              <Text className="text-xs text-gray-600">Booked</Text>
            </View>
          </View>

          {/* Seat Info */}
          <View className="flex-row items-center justify-between mt-4 pt-2">
            <View className="flex-row items-center">
              <Info size={16} color="#3b82f6" />
              <Text className="ml-2 text-xs text-gray-600">
                Total {totalSeats} seats • {bookedSeats.length} booked
              </Text>
            </View>
            <Text className="text-xs font-medium text-blue-600">
              {selectedSeats.length} of {maxSelectable} selected
            </Text>
          </View>

          {loading && (
            <View className="mt-4 py-2">
              <Text className="text-xs text-center text-gray-500">
                Loading seat availability...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}