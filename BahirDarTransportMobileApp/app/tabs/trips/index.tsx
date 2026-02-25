import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Users, MapPin, Search, Filter, Bus } from 'lucide-react-native';
import { useTrips } from '../../../hooks/useTrips';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { TripCard } from '../../../components/booking/TripCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { formatDate } from '../../../utils/helpers';
import { Trip } from '../../../types/trip';

export default function TripsScreen() {
  const insets = useSafeAreaInsets(); 
  const params = useLocalSearchParams();
  

  if (params.id === 'index' || params.tripId === 'index') {
    router.replace('/tabs/trips');
    return null;
  }
  
  const { trips, loading, searchTrips, fetchAllTrips, stations, fetchStations } = useTrips();
  
 
  const origin = Array.isArray(params.origin) ? params.origin[0] : params.origin;
  const destination = Array.isArray(params.destination) ? params.destination[0] : params.destination;
  const date = Array.isArray(params.date) ? params.date[0] : params.date;
  const passengers = Array.isArray(params.passengers) ? params.passengers[0] : params.passengers;
  
  const [searchParams, setSearchParams] = useState({
    origin: origin || '',
    destination: destination || '',
    date: date ? new Date(date) : new Date(),
    passengers: passengers ? parseInt(passengers) : 1,
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(!!origin);
  
  const [filters, setFilters] = useState({
    priceRange: 'all',
    busType: 'all',
  });

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (origin && destination) {
      handleUrlSearch();
    } else {
      loadInitialTrips();
    }
  }, []);

  useEffect(() => {
    if (trips.length > 0 && !loading) {
    }
  }, [trips, loading]);

  const loadStations = async () => {
    try {
      await fetchStations();
    } catch (error) {
    }
  };

  const loadInitialTrips = async () => {
    try {
      await fetchAllTrips({
        status: 'scheduled',
        date: new Date().toISOString().split('T')[0],
        limit: 20,
      });
    } catch (error) {
      console.error('Failed to load initial trips:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStations();
    if (origin && destination) {
      await handleUrlSearch();
    } else {
      await loadInitialTrips();
    }
    setRefreshing(false);
  };

  const handleUrlSearch = async () => {
    if (!origin || !destination) {
      return;
    }

    try {
      await searchTrips({
        origin: origin,
        destination: destination,
        date: date || new Date().toISOString(),
        passengers: passengers ? parseInt(passengers) : 1,
      });
      
      setSearchParams({
        origin: origin,
        destination: destination,
        date: date ? new Date(date) : new Date(),
        passengers: passengers ? parseInt(passengers) : 1,
      });
      
      setShowFilters(false);
    } catch (error) {
      Alert.alert('Search Failed', 'Unable to search trips. Please try again.');
    }
  };

  const handleApplyFilters = () => {
    console.log('🔍 Applying FILTERS to existing trips');
    setShowFilters(false);
  };

  const getFilteredTrips = useCallback(() => {
    if (!trips.length) return [];
    
    let filtered = [...trips];
    
    // Filter by price range
    if (filters.priceRange === 'under500') {
      filtered = filtered.filter(trip => trip.price < 500);
    } else if (filters.priceRange === '500-1000') {
      filtered = filtered.filter(trip => trip.price >= 500 && trip.price <= 1000);
    } else if (filters.priceRange === 'over1000') {
      filtered = filtered.filter(trip => trip.price > 1000);
    }
    
    // Filter by bus type
    if (filters.busType !== 'all') {
      filtered = filtered.filter(trip => 
        trip.vehicle?.carType?.toLowerCase() === filters.busType.toLowerCase()
      );
    }
    
    return filtered;
  }, [trips, filters]);

  const handleSwapLocations = () => {
    setSearchParams(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSearchParams(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleTripSelect = (trip: Trip) => {
    
    const tripId = trip._id;
    console.log('🎯 trip._id:', tripId);
    
    if (!tripId) {
      Alert.alert('Error', 'Invalid trip data');
      return;
    }
    
    if (tripId === 'index') {
      Alert.alert('Error', 'Invalid trip ID format');
      return;
    }
    
    if (tripId.length !== 24) {
      Alert.alert('Error', 'Invalid trip ID format');
      return;
    }
    router.push({
      pathname: '/tabs/trips/[id]',
      params: { id: tripId }
    });
  };

  // Format stations for Select component
  const stationOptions = stations.map(station => ({
    value: station.value,
    label: station.fullLabel || station.label,
  }));

  const displayedTrips = getFilteredTrips();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-4 pb-3 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900">Available Trips</Text>
          <View className="flex-row">
            <TouchableOpacity 
              onPress={() => {
                console.log('🔍 Filter button pressed - toggling filter panel');
                setShowFilters(!showFilters);
              }}
              className="flex-row items-center px-4 py-2 bg-blue-50 rounded-lg mr-2"
            >
              <Filter size={18} color="#3b82f6" />
              <Text className="ml-2 text-blue-600 font-medium">Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/tabs/trips/search')}
              className="flex-row items-center px-4 py-2 bg-green-50 rounded-lg"
            >
              <Search size={18} color="#10b981" />
              <Text className="ml-2 text-green-600 font-medium">New Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 80, // Add bottom padding for tab bar (60px tab bar + 20px extra)
        }}
      >
        <View className="p-4">
          {/* Search Filters - Collapsible */}
          {showFilters && (
            <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Filter Results
              </Text>
              
              <View className="space-y-4">
                {/* Price Range Filter */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Price Range</Text>
                  <View className="flex-row flex-wrap">
                    {['all', 'under500', '500-1000', 'over1000'].map(range => (
                      <TouchableOpacity
                        key={range}
                        onPress={() => setFilters(prev => ({ ...prev, priceRange: range }))}
                        className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                          filters.priceRange === range ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      >
                        <Text className={filters.priceRange === range ? 'text-white' : 'text-gray-700'}>
                          {range === 'all' ? 'All' : 
                           range === 'under500' ? 'Under ETB 500' :
                           range === '500-1000' ? 'ETB 500-1000' : 'Over ETB 1000'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bus Type Filter */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Bus Type</Text>
                  <View className="flex-row flex-wrap">
                    {['all', 'bus', 'minibus'].map(type => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setFilters(prev => ({ ...prev, busType: type }))}
                        className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                          filters.busType === type ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      >
                        <Text className={filters.busType === type ? 'text-white' : 'text-gray-700'}>
                          {type === 'all' ? 'All' : type === 'bus' ? 'Bus' : 'Minibus'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Button
                  title="Apply Filters"
                  onPress={handleApplyFilters}
                  className="bg-blue-600"
                />
                
                <Button
                  title="Reset Filters"
                  variant="outline"
                  onPress={() => {
                    setFilters({
                      priceRange: 'all',
                      busType: 'all',
                    });
                  }}
                />
              </View>
            </View>
          )}

          {/* Results Count */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              {displayedTrips.length > 0 ? 'Available Trips' : 'No Trips Found'}
            </Text>
            <Text className="text-sm text-gray-600">
              {displayedTrips.length} trip{displayedTrips.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {loading && !refreshing ? (
            <View className="py-10">
              <Loader message="Loading trips..." />
            </View>
          ) : displayedTrips.length === 0 ? (
            <EmptyState
              icon={<Bus size={48} color="#94a3b8" />}
              title="No trips available"
              message={
                searchParams.origin && searchParams.destination
                  ? "No trips found for your search criteria. Try different dates or stations."
                  : "There are no trips available at the moment. Please check back later."
              }
              buttonTitle="Search Again"
              onButtonPress={() => setShowFilters(true)}
            />
          ) : (
            <View className="space-y-4">
              {displayedTrips.map((trip: Trip) => (
                <TripCard 
                  key={trip._id || trip.id} 
                  trip={trip} 
                  onSelect={handleTripSelect}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}