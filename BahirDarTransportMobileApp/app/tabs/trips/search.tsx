import React, { useState, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  Calendar, 
  Users, 
  MapPin, 
  ArrowRight, 
  ChevronLeft,
  Bus,
  Clock
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTrips } from '../../../hooks/useTrips';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { formatDate, formatTime } from '../../../utils/helpers';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { searchTrips, stations, fetchStations, loading } = useTrips();
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: new Date(),
    time: new Date(),
    passengers: '1',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [refreshingStations, setRefreshingStations] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    setRefreshingStations(true);
    try {
      await fetchStations();
    } catch (error) {
      Alert.alert('Error', 'Failed to load stations. Please try again.');
    } finally {
      setRefreshingStations(false);
    }
  };

  const handleSearch = async () => {
    if (!formData.origin) {
      Alert.alert('Validation Error', 'Please select departure station');
      return;
    }
    if (!formData.destination) {
      Alert.alert('Validation Error', 'Please select arrival station');
      return;
    }
    if (formData.origin === formData.destination) {
      Alert.alert('Validation Error', 'Departure and arrival stations cannot be the same');
      return;
    }

    const passengersNum = parseInt(formData.passengers);
    if (isNaN(passengersNum) || passengersNum < 1 || passengersNum > 4) {
      Alert.alert('Validation Error', 'Please enter a valid number of passengers (1-4)');
      return;
    }

    try {
      const searchDateTime = new Date(formData.date);
      searchDateTime.setHours(formData.time.getHours());
      searchDateTime.setMinutes(formData.time.getMinutes());
      
      router.push({
        pathname: '/tabs/trips',
        params: {
          origin: formData.origin,
          destination: formData.destination,
          date: searchDateTime.toISOString(),
          passengers: passengersNum.toString(),
        }
      });
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Search Failed', 'Unable to search trips. Please try again.');
    }
  };

  const handleSwapLocations = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ 
        ...prev, 
        date: selectedDate 
      }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ 
        ...prev, 
        time: selectedTime 
      }));
    }
  };

  // Format stations for Select component
  const stationOptions = stations.map(station => ({
    value: station.value,
    label: station.fullLabel || station.label,
  }));

  // Get popular routes from actual stations
  const popularRoutes = stationOptions.length > 0 
    ? [
        { origin: stationOptions[0]?.value, destination: stationOptions[1]?.value },
        { origin: stationOptions[0]?.value, destination: stationOptions[2]?.value },
        { origin: stationOptions[1]?.value, destination: stationOptions[3]?.value },
      ].filter(route => route.origin && route.destination)
    : [];

  const getStationName = (stationId: string): string => {
    const station = stations.find(s => s.value === stationId);
    return station ? station.label.split(' (')[0] : '';
  };

  const tabBarHeight = 60 + insets.bottom;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-4 pb-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-gray-900">
            Search Trips
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: tabBarHeight,
          }}
        >
          {/* Hero Banner */}
          <View className="bg-blue-600 px-6 py-6">
            <Text className="text-2xl font-bold text-white mb-2">
              Find Your Trip
            </Text>
            <Text className="text-blue-100 text-base">
              Search available trips to your destination
            </Text>
          </View>

          {/* Search Form */}
          <View className="bg-white mx-4 -mt-6 p-5 rounded-2xl shadow-md border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Search Available Trips
            </Text>
            
            <View className="space-y-4">
              {/* Origin Station */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  From
                </Text>
                <Select
                  placeholder="Select departure station"
                  value={formData.origin}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, origin: value }))}
                  items={stationOptions}
                  leftIcon={<MapPin size={20} color="#3b82f6" />}
                  loading={refreshingStations}
                />
                {stationOptions.length === 0 && !refreshingStations && (
                  <Text className="text-xs text-red-500 mt-1">
                    No stations available. Pull down to refresh.
                  </Text>
                )}
              </View>

              {/* Swap Button */}
              <TouchableOpacity
                onPress={handleSwapLocations}
                className="self-center bg-white p-2 rounded-full border border-gray-200 shadow-sm"
              >
                <ArrowRight size={22} color="#3b82f6" style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>

              {/* Destination Station */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  To
                </Text>
                <Select
                  placeholder="Select arrival station"
                  value={formData.destination}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, destination: value }))}
                  items={stationOptions}
                  leftIcon={<MapPin size={20} color="#ef4444" />}
                  loading={refreshingStations}
                />
              </View>

              {/* Travel Date */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Travel Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center border border-gray-300 rounded-xl p-3.5 bg-gray-50"
                >
                  <Calendar size={20} color="#64748b" />
                  <Text className="flex-1 ml-2 text-gray-900 font-medium">
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

              {/* Travel Time */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Preferred Departure Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className="flex-row items-center border border-gray-300 rounded-xl p-3.5 bg-gray-50"
                >
                  <Clock size={20} color="#64748b" />
                  <Text className="flex-1 ml-2 text-gray-900 font-medium">
                    {formatTime(formData.time)}
                  </Text>
                </TouchableOpacity>
                
                {showTimePicker && (
                  <DateTimePicker
                    value={formData.time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}
                <Text className="text-xs text-gray-500 mt-1">
                  Select your preferred departure time
                </Text>
              </View>

              {/* Passengers */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Passengers
                </Text>
                <Input
                  placeholder="Number of passengers"
                  value={formData.passengers}
                  onChangeText={(value: string) => {
                    if (/^\d*$/.test(value)) {
                      setFormData(prev => ({ ...prev, passengers: value }));
                    }
                  }}
                  keyboardType="numeric"
                  leftIcon={<Users size={20} color="#64748b" />}
                  className="bg-gray-50"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Maximum 4 passengers per booking
                </Text>
              </View>

              {/* Search Button */}
              <Button
                title="Search Available Trips"
                onPress={handleSearch}
                loading={loading}
                disabled={loading || refreshingStations || stationOptions.length === 0}
                className="mt-2 bg-blue-600"
                size="large"
              />
            </View>
          </View>

          {/* Popular Routes */}
          {popularRoutes.length > 0 && (
            <View className="mt-6 px-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Popular Routes
              </Text>
              <View className="flex-row flex-wrap">
                {popularRoutes.map((route, index) => (
                  <TouchableOpacity
                    key={index}
                    className="bg-white border border-gray-200 rounded-full px-4 py-2.5 mr-2 mb-2 flex-row items-center"
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        origin: route.origin,
                        destination: route.destination
                      }));
                    }}
                  >
                    <Bus size={16} color="#64748b" />
                    <Text className="ml-1.5 text-sm text-gray-700">
                      {getStationName(route.origin)} → {getStationName(route.destination)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Travel Tips */}
          <View className="mt-6 px-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Travel Tips
            </Text>
            <View className="bg-white p-4 rounded-xl border border-gray-200">
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <Clock size={20} color="#3b82f6" />
                  <Text className="ml-3 text-gray-700 flex-1">
                    Arrive at least 30 minutes before departure
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Users size={20} color="#3b82f6" />
                  <Text className="ml-3 text-gray-700 flex-1">
                    Maximum 4 passengers per booking
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Calendar size={20} color="#3b82f6" />
                  <Text className="ml-3 text-gray-700 flex-1">
                    Book at least 2 hours before departure
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}