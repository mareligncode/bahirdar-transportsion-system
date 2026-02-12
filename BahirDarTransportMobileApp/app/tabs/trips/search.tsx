// app/tabs/trips/search.tsx - UPDATED VERSION
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Users, MapPin, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTrips } from '../../../hooks/useTrips';
import { TripCard } from '../../../components/booking/TripCard';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Loader } from '../../../components/common/Loader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { formatDate } from '../../../utils/helpers';

// Mock stations data
const STATIONS = [
  { value: '1', label: 'Bahir Dar new Station' },
  { value: '2', label: 'Bahir Dar old Station' },
];

export default function SearchScreen() {
  const { searchTrips, trips, loading } = useTrips();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: new Date(),
    passengers: '1',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!formData.origin || !formData.destination) {
      alert('Please select origin and destination stations');
      return;
    }

    // Validate passengers
    const passengersNum = parseInt(formData.passengers);
    if (isNaN(passengersNum) || passengersNum < 1) {
      alert('Please enter a valid number of passengers (minimum 1)');
      return;
    }

    try {
      await searchTrips({
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        passengers: passengersNum,
      });
      setSearchPerformed(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleTripSelect = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

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
            <Text className="text-xl font-bold text-gray-900 flex-1">
              Search Trips
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Search Form */}
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="p-4">
              <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
                <Text className="text-xl font-semibold text-gray-900 mb-4">
                  Find Your Trip
                </Text>
                
                <View className="space-y-4">
                  {/* Origin Station */}
                  <Select
                    label="From"
                    placeholder="Select origin station"
                    value={formData.origin}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}
                    items={STATIONS}
                    leftIcon={<MapPin size={20} color="#6b7280" />}
                  />

                  {/* Swap Button */}
                  <TouchableOpacity
                    className="absolute top-20 right-10 z-10 w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                    onPress={() => {
                      const temp = formData.origin;
                      setFormData(prev => ({
                        ...prev,
                        origin: prev.destination,
                        destination: temp,
                      }));
                    }}
                  >
                    <ArrowRight size={24} color="#3b82f6" className="rotate-90" />
                  </TouchableOpacity>

                  {/* Destination Station */}
                  <Select
                    label="To"
                    placeholder="Select destination station"
                    value={formData.destination}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}
                    items={STATIONS}
                    leftIcon={<MapPin size={20} color="#6b7280" />}
                  />

                  {/* Date Picker - Fixed */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Travel Date</Text>
                    <TouchableOpacity
                      className="border border-gray-300 rounded-lg p-3 bg-white flex-row items-center"
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Calendar size={20} color="#6b7280" />
                      <Text className="ml-2 text-gray-700">
                        {formatDate(formData.date)}
                      </Text>
                    </TouchableOpacity>
                    
                    {showDatePicker && (
                      <DateTimePicker
                        value={formData.date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={handleDateChange}
                      />
                    )}
                  </View>

                  {/* Passengers - No limit */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Passengers</Text>
                    <Input
                      placeholder="Number of passengers"
                      value={formData.passengers}
                      onChangeText={(value) => {
                        // Allow only numbers
                        if (/^\d*$/.test(value)) {
                          setFormData(prev => ({ ...prev, passengers: value }));
                        }
                      }}
                      keyboardType="numeric"
                      leftIcon={<Users size={20} color="#6b7280" />}
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Enter number of passengers (no limit)
                    </Text>
                  </View>

                  {/* Search Button */}
                  <Button
                    title="Search Trips"
                    variant="primary"
                    size="large"
                    onPress={handleSearch}
                    loading={loading}
                    className="mt-2"
                  />
                </View>
              </View>

              {/* Search Results */}
              {loading ? (
                <Loader message="Searching for trips..." />
              ) : searchPerformed && trips.length === 0 ? (
                <EmptyState
                  title="No trips found"
                  message="Try different dates or stations"
                  icon="🔍"
                />
              ) : trips.length > 0 ? (
                <>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-semibold text-gray-900">
                      Available Trips ({trips.length})
                    </Text>
                    <Text className="text-gray-600">
                      {formatDate(formData.date)}
                    </Text>
                  </View>

                  {trips.map(trip => (
                    <TouchableOpacity
                      key={trip.id}
                      onPress={() => handleTripSelect(trip.id)}
                      activeOpacity={0.7}
                    >
                      <TripCard trip={trip} />
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <EmptyState
                  title="Search for trips"
                  message="Enter your travel details to find available trips"
                  icon="🚌"
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenLayout>
  );
}