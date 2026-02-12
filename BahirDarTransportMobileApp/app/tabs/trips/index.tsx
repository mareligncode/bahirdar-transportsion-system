// app/tabs/trips/index.tsx - Updated with working date picker
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, Link } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Users, MapPin, Clock, Car, Search } from 'lucide-react-native';
import { useTrips } from '../../../hooks/useTrips';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { TripCard } from '../../../components/booking/TripCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { formatDate, formatTime } from '../../../utils/helpers';

// Mock stations data
const STATIONS = [
  { value: 'bahir_dar_main', label: 'Bahir Dar Main Station' },
  { value: 'bahir_dar_south', label: 'Bahir Dar South Station' },
  { value: 'gondar', label: 'Gondar Station' },
  { value: 'addis_ababa', label: 'Addis Ababa Station' },
  { value: 'debre_markos', label: 'Debre Markos Station' },
];

export default function BookTrip() {
  const { tripId } = useLocalSearchParams();
  const { trips, loading, searchTrips, fetchTrips } = useTrips();
  const [searchData, setSearchData] = useState<any>(null);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: new Date(),
    passengers: '1',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load initial trips when component mounts
    loadInitialTrips();
  }, []);

  const loadInitialTrips = async () => {
    try {
      await fetchTrips({
        status: 'scheduled',
        page: 1,
        limit: 10,
      });
    } catch (error) {
      console.error('Failed to load initial trips:', error);
    }
  };

  const handleSearch = async () => {
    if (!formData.from || !formData.to) {
      alert('Please select origin and destination stations');
      return;
    }

    const searchParams = {
      origin: formData.from,
      destination: formData.to,
      date: formData.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      passengers: parseInt(formData.passengers),
    };

    setSearchData(searchParams);
    
    try {
      await searchTrips(searchParams);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('date', selectedDate);
    }
  };

  // Filter trips based on search query
  const filteredTrips = trips.filter(trip => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      trip.origin?.stationName?.toLowerCase().includes(query) ||
      trip.destination?.stationName?.toLowerCase().includes(query) ||
      trip.vehicle?.plateNumber?.toLowerCase().includes(query) ||
      trip.driver?.fullName?.toLowerCase().includes(query)
    );
  });

  // If tripId is provided, show seat selection for that specific trip
  if (tripId) {
    const trip = trips.find(t => t.id === tripId);
    
    if (!trip) {
      return (
        <ScreenLayout>
          <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <View className="flex-1 justify-center items-center p-8">
              <Text className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</Text>
              <Text className="text-gray-600 text-center">
                The trip you're looking for doesn't exist.
              </Text>
              <Link href="/trips" asChild className="mt-6">
                <Button title="Browse Trips" variant="outline" />
              </Link>
            </View>
          </SafeAreaView>
        </ScreenLayout>
      );
    }

    // For trip details, redirect to seat selection
    return (
      <ScreenLayout>
        <SafeAreaView className="flex-1 bg-gray-50">
          <StatusBar style="dark" />
          <ScrollView className="flex-1">
            <View className="p-6">
              <View className="mb-8">
                <Text className="text-3xl font-bold text-gray-900 mb-2">Book Your Trip</Text>
                <Text className="text-gray-600">
                  {trip.origin?.stationName} → {trip.destination?.stationName} |{' '}
                  {formatDate(trip.departureTime)} | {trip.vehicle?.carType}
                </Text>
              </View>

              <TripCard trip={trip} />
              
              <View className="mt-8">
                <Link href={`/trips/${trip.id}`} asChild>
                  <Button 
                    title="Select Seats" 
                    variant="primary" 
                    size="large"
                    className="w-full"
                  />
                </Link>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ScreenLayout>
    );
  }

  // Otherwise show trip search and results
  return (
    <ScreenLayout>
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        
        {/* Header with search */}
        <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-gray-900">Available Trips</Text>
            <Link href="/trips/search" asChild>
              <TouchableOpacity className="flex-row items-center px-3 py-2 bg-primary-50 rounded-lg">
                <Search size={18} color="#3b82f6" />
                <Text className="ml-2 text-primary-600 font-medium">Search</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Quick Search Bar */}
          <View className="mb-3">
            <Input
              placeholder="Search trips, stations, or drivers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={20} color="#9ca3af" />}
            />
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Search Form */}
            <View className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
              <Text className="text-xl font-semibold text-gray-900 mb-4">Search Trips</Text>
              
              <View className="space-y-4">
                <Select
                  label="From"
                  placeholder="Select origin station"
                  value={formData.from}
                  onValueChange={(value) => handleInputChange('from', value)}
                  items={STATIONS}
                  leftIcon={<MapPin size={20} color="#6b7280" />}
                />

                <Select
                  label="To"
                  placeholder="Select destination station"
                  value={formData.to}
                  onValueChange={(value) => handleInputChange('to', value)}
                  items={STATIONS}
                  leftIcon={<MapPin size={20} color="#6b7280" />}
                />

                {/* Date Picker */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Date</Text>
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

                {/* Passengers - No restriction, allow any number */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Passengers</Text>
                  <Input
                    placeholder="Number of passengers"
                    value={formData.passengers}
                    onChangeText={(value) => {
                      // Allow only numbers
                      if (/^\d*$/.test(value)) {
                        handleInputChange('passengers', value);
                      }
                    }}
                    keyboardType="numeric"
                    leftIcon={<Users size={20} color="#6b7280" />}
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Enter number of passengers (no limit)
                  </Text>
                </View>

                <Button
                  title="Search Trips"
                  variant="primary"
                  size="large"
                  onPress={handleSearch}
                  loading={loading}
                  className="mt-4"
                />
              </View>
            </View>

            {/* Search Results OR Browse All Trips */}
            {searchData ? (
              <>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-semibold text-gray-900">
                    Trips from {STATIONS.find(s => s.value === searchData.origin)?.label || searchData.origin} to{' '}
                    {STATIONS.find(s => s.value === searchData.destination)?.label || searchData.destination}
                  </Text>
                  <Text className="text-gray-600">
                    {formatDate(searchData.date)} • {searchData.passengers} passenger
                    {searchData.passengers > 1 ? 's' : ''}
                  </Text>
                </View>

                {loading ? (
                  <Loader message="Searching for trips..." />
                ) : filteredTrips.length === 0 ? (
                  <EmptyState
                    title="No trips found"
                    message="Try different dates or stations"
                    icon="🚌"
                  />
                ) : (
                  <View className="space-y-4">
                    {filteredTrips.map(trip => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Browse All Available Trips */}
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-semibold text-gray-900">
                    Available Trips
                  </Text>
                  <Text className="text-gray-600">
                    {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {loading ? (
                  <Loader message="Loading available trips..." />
                ) : filteredTrips.length === 0 ? (
                  <EmptyState
                    title="No trips available"
                    message="Check back later for new trips"
                    icon="🚌"
                  />
                ) : (
                  <View className="space-y-4">
                    {filteredTrips.map(trip => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
}