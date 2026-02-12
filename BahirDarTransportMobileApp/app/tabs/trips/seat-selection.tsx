import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ChevronLeft, 
  User, 
  CreditCard,
  AlertCircle,
  Check
} from 'lucide-react-native';
import { tripsApi } from '../../../lib/api/trips';
import { Button } from '../../../components/common/Button';
import SeatSelector  from '../../../components/ui/SeatSelector';
import { Loader } from '../../../components/common/Loader';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { formatCurrency } from '../../../utils/helpers';

export default function SeatSelectionScreen() {
  const { tripId, tripDetails } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [seatLoading, setSeatLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [tripInfo, setTripInfo] = useState<any>(null);
  const [totalSeats, setTotalSeats] = useState(40); // Default bus capacity

  useEffect(() => {
    loadTripAndSeats();
  }, [tripId]);

const loadTripAndSeats = async () => {
  try {
    setSeatLoading(true);
    
    // Load trip details
    if (tripDetails) {
      setTripInfo(JSON.parse(tripDetails as string));
    } else if (tripId) {
      const tripResponse = await tripsApi.getTripById(tripId as string);
      setTripInfo(tripResponse.data);
      setTotalSeats(tripResponse.data.vehicle?.totalCapacity || 40);
    }

    // Load booked seats - handle if endpoint doesn't exist
    if (tripId) {
      try {
        const seatsResponse = await tripsApi.getTripSeats(tripId as string);
        setBookedSeats(seatsResponse.data?.bookedSeats || []);
      } catch (seatError) {
        console.warn('Could not load booked seats, using empty array:', seatError);
        setBookedSeats([]);
      }
    }
  } catch (error) {
    console.error('Failed to load trip:', error);
    Alert.alert('Error', 'Failed to load trip information');
  } finally {
    setSeatLoading(false);
  }
};

  const handleSeatSelect = (seatNumber: string) => {
    if (bookedSeats.includes(seatNumber)) {
      Alert.alert('Seat Booked', 'This seat is already booked');
      return;
    }

    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Select Seats', 'Please select at least one seat');
      return;
    }

    Alert.alert(
      'Confirm Booking',
      `Book ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} (${selectedSeats.join(', ')}) for ${formatCurrency((tripInfo?.price || 0) * selectedSeats.length)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => router.push({
            pathname: '/payment',
            params: {
              tripId: tripId as string,
              seats: JSON.stringify(selectedSeats),
              totalAmount: String((tripInfo?.price || 0) * selectedSeats.length),
              tripDetails: JSON.stringify(tripInfo)
            }
          })
        }
      ]
    );
  };

  const calculateTotal = () => {
    const price = tripInfo?.price || 0;
    return price * selectedSeats.length;
  };

  if (seatLoading) {
    return (
      <ScreenLayout>
        <Loader message="Loading seat map..." />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-200">
          <View className="flex-row items-center mb-3">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                Select Seats
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {tripInfo?.from} → {tripInfo?.to}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Seat Legend */}
          <View className="bg-white p-4 mb-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Seat Legend
            </Text>
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-gray-200 rounded-md mr-2" />
                <Text className="text-gray-700">Available</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-red-200 rounded-md mr-2" />
                <Text className="text-gray-700">Booked</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-primary-500 rounded-md mr-2" />
                <Text className="text-gray-700">Selected</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-yellow-100 rounded-md mr-2" />
                <Text className="text-gray-700">Driver</Text>
              </View>
            </View>
          </View>

          {/* Seat Map */}
          <View className="bg-white p-4 mb-3">
            <View className="items-center mb-6">
              <View className="w-32 h-8 bg-gray-200 rounded-lg items-center justify-center mb-2">
                <Text className="font-medium text-gray-700">Driver</Text>
              </View>
              <Text className="text-gray-500 text-sm">Front of Bus</Text>
            </View>

            <SeatSelector
              totalSeats={totalSeats}
              bookedSeats={bookedSeats}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              seatsPerRow={4}
            />

            <View className="mt-6 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-700">Selected Seats</Text>
                <Text className="text-lg font-bold text-gray-900">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-700">Price per seat</Text>
                <Text className="text-lg font-bold text-primary-600">
                  {formatCurrency(tripInfo?.price || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Passengers Info */}
          {selectedSeats.length > 0 && (
            <View className="bg-white p-4 mb-3">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Passenger Information
              </Text>
              <View className="space-y-3">
                {selectedSeats.map((seat, index) => (
                  <View key={seat} className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                    <View className="w-10 h-10 bg-primary-100 rounded-lg items-center justify-center mr-3">
                      <User size={20} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        Passenger {index + 1}
                      </Text>
                      <Text className="text-gray-600">Seat {seat}</Text>
                    </View>
                    <TouchableOpacity className="p-2">
                      <Text className="text-primary-600 font-medium">Edit</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Booking Summary */}
        <View className="bg-white border-t border-gray-200">
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Booking Summary
              </Text>
              <View className="flex-row items-center">
                <Check size={18} color="#10b981" />
                <Text className="text-green-600 font-medium ml-1">
                  {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-700">Seat price × {selectedSeats.length}</Text>
                <Text className="text-gray-900">
                  {formatCurrency((tripInfo?.price || 0) * selectedSeats.length)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-700">Service fee</Text>
                <Text className="text-gray-900">{formatCurrency(20)}</Text>
              </View>
              <View className="flex-row justify-between py-2 border-t border-gray-200 pt-3">
                <Text className="text-lg font-bold text-gray-900">Total</Text>
                <Text className="text-2xl font-bold text-primary-600">
                  {formatCurrency(calculateTotal() + 20)}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-4 pb-8">
            <Button
              variant="primary"
              size="large"
              onPress={handleProceedToPayment}
              loading={loading}
              disabled={selectedSeats.length === 0}
              leftIcon={<CreditCard size={20} color="white" />}
            >
              Proceed to Payment
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </ScreenLayout>
  );
}