// app/tabs/trips/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Calendar,
  Users,
  MapPin,
  Search,
  Filter,
  Bus,
  X,
  ArrowRight,
  Clock,
  ChevronDown,
  TrendingUp,
  Star,
  Clock3
} from 'lucide-react-native';
import { useTrips } from '../../../hooks/useTrips';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { TripCard } from '../../../components/booking/TripCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { formatDate, formatTime } from '../../../utils/helpers';
import { Trip, Station, StationOption } from '../../../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Fix: Handle case when params.id is 'index'
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
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchSummary, setShowSearchSummary] = useState(!!origin && !!destination);
  const [activeSort, setActiveSort] = useState<string>('departureTime');

  const [filters, setFilters] = useState({
    priceRange: 'all',
    busType: 'all',
    sortBy: 'departureTime',
    sortOrder: 'asc',
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

  const loadStations = async () => {
    try {
      await fetchStations();
    } catch (error) {
      console.error('Failed to load stations:', error);
    }
  };

  const loadInitialTrips = async () => {
    try {
      await fetchAllTrips({
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

      setShowSearchSummary(true);
      setShowFilters(false);
    } catch (error) {
      Alert.alert('Search Failed', 'Unable to search trips. Please try again.');
    }
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  const handleClearSearch = () => {
    setSearchParams({
      origin: '',
      destination: '',
      date: new Date(),
      passengers: 1,
    });
    setShowSearchSummary(false);
    loadInitialTrips();
  };

  const getFilteredAndSortedTrips = useCallback(() => {
    if (!trips.length) return [];

    let filtered = [...trips];

    if (filters.priceRange === 'under500') {
      filtered = filtered.filter(trip => (trip.price ?? 0) < 500);
    } else if (filters.priceRange === '500-1000') {
      filtered = filtered.filter(trip => {
        const price = trip.price ?? 0;
        return price >= 500 && price <= 1000;
      });
    } else if (filters.priceRange === 'over1000') {
      filtered = filtered.filter(trip => (trip.price ?? 0) > 1000);
    }

    if (filters.busType !== 'all') {
      filtered = filtered.filter(trip =>
        trip.vehicle?.carType?.toLowerCase() === filters.busType.toLowerCase()
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'price':
          comparison = (a.price ?? 0) - (b.price ?? 0);
          break;
        case 'availability':
          comparison = (b.availableSeats ?? 0) - (a.availableSeats ?? 0);
          break;
        case 'departureTime':
        default:
          const dateA = a.departureTime ? new Date(a.departureTime).getTime() : 0;
          const dateB = b.departureTime ? new Date(b.departureTime).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

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

  const handleQuickSearch = (originId: string, destinationId: string) => {
    router.push({
      pathname: '/tabs/trips',
      params: {
        origin: originId,
        destination: destinationId,
        date: new Date().toISOString(),
        passengers: '1'
      }
    });
  };

  const toggleSort = (sortBy: string) => {
    setActiveSort(sortBy);
    if (filters.sortBy === sortBy) {
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy,
        sortOrder: 'asc'
      }));
    }
  };

  const stationOptions: StationOption[] = stations.map(station => ({
    value: station.value,
    label: station.fullLabel || station.label,
    fullLabel: station.fullLabel || station.label,
  }));

  const displayedTrips = getFilteredAndSortedTrips();

  const getStationName = (stationId: string): string => {
    const station = stations.find(s => s.value === stationId);
    return station ? station.label.split(' (')[0] : '';
  };

  const renderSearchSummary = () => {
    if (!showSearchSummary || !origin || !destination) return null;

    const originName = getStationName(origin);
    const destName = getStationName(destination);
    const searchDate = date ? new Date(date) : new Date();

    return (
      <View className="bg-blue-50 p-4 mb-4 rounded-xl border border-blue-200">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-sm text-blue-800 font-medium mb-1">
              Search Results
            </Text>
            <Text className="text-base font-bold text-gray-900">
              {originName} → {destName}
            </Text>
            <View className="flex-row items-center mt-2">
              <Calendar size={14} color="#4b5563" />
              <Text className="text-sm text-gray-600 ml-1">
                {formatDate(searchDate)}
              </Text>
              <Users size={14} color="#4b5563" className="ml-3" />
              <Text className="text-sm text-gray-600 ml-1">
                {passengers || 1} passenger(s)
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClearSearch}
            className="bg-white p-2 rounded-full"
          >
            <X size={16} color="#4b5563" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/tabs/trips/search')}
          className="mt-3 bg-white py-2 px-3 rounded-lg self-start"
        >
          <Text className="text-blue-600 text-sm font-medium">Modify Search</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSortOptions = () => (
    <View className="flex-row justify-between mb-4">
      <TouchableOpacity
        onPress={() => toggleSort('departureTime')}
        className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${activeSort === 'departureTime' ? 'bg-blue-500' : 'bg-gray-200'
          }`}
      >
        <Clock size={16} color={activeSort === 'departureTime' ? 'white' : '#4b5563'} />
        <Text className={`ml-1 font-medium ${activeSort === 'departureTime' ? 'text-white' : 'text-gray-700'
          }`}>
          Time
        </Text>
        {activeSort === 'departureTime' && (
          <Text className="text-white ml-1">
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleSort('price')}
        className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${activeSort === 'price' ? 'bg-blue-500' : 'bg-gray-200'
          }`}
      >
        <Text className={activeSort === 'price' ? 'text-white' : 'text-gray-700'}>
          Price
        </Text>
        {activeSort === 'price' && (
          <Text className="text-white ml-1">
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleSort('availability')}
        className={`px-4 py-2 rounded-full flex-row items-center ${activeSort === 'availability' ? 'bg-blue-500' : 'bg-gray-200'
          }`}
      >
        <Users size={16} color={activeSort === 'availability' ? 'white' : '#4b5563'} />
        <Text className={`ml-1 font-medium ${activeSort === 'availability' ? 'text-white' : 'text-gray-700'
          }`}>
          Seats
        </Text>
        {activeSort === 'availability' && (
          <Text className="text-white ml-1">
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />

        {/* Header with Gradient */}
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-3"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-white">Available Trips</Text>
              <Text className="text-sm text-blue-100 mt-1">
                Find your perfect journey
              </Text>
            </View>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-2"
              >
                <Filter size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/tabs/trips/search')}
                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              >
                <Search size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-3 pt-3 border-t border-white/20">
            <View className="flex-1">
              <Text className="text-xs text-blue-200">Available Today</Text>
              <Text className="text-lg font-bold text-white">
                {displayedTrips.length}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-blue-200">Routes</Text>
              <Text className="text-lg font-bold text-white">
                {stations.length}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-blue-200">Passengers</Text>
              <Text className="text-lg font-bold text-white">
                {searchParams.passengers}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 100 + insets.bottom,
          }}
        >
          <View className="p-4">
            {renderSearchSummary()}

            {/* Quick Stats Cards */}
            <View className="flex-row mb-4">
              <View className="flex-1 bg-white rounded-xl p-3 mr-2 border border-gray-200">
                <TrendingUp size={20} color="#3b82f6" />
                <Text className="text-lg font-bold text-gray-900 mt-1">24/7</Text>
                <Text className="text-xs text-gray-500">Service</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-3 mr-2 border border-gray-200">
                <Star size={20} color="#f59e0b" />
                <Text className="text-lg font-bold text-gray-900 mt-1">4.8</Text>
                <Text className="text-xs text-gray-500">Rating</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-3 border border-gray-200">
                <Clock3 size={20} color="#10b981" />
                <Text className="text-lg font-bold text-gray-900 mt-1">On Time</Text>
                <Text className="text-xs text-gray-500">95%</Text>
              </View>
            </View>

            {/* Filters Panel */}
            {showFilters && (
              <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-200">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Filter Results
                </Text>

                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Price Range</Text>
                    <View className="flex-row flex-wrap">
                      {[
                        { id: 'all', label: 'All Prices' },
                        { id: 'under500', label: 'Under ETB 500' },
                        { id: '500-1000', label: 'ETB 500-1000' },
                        { id: 'over1000', label: 'Over ETB 1000' }
                      ].map(range => (
                        <TouchableOpacity
                          key={range.id}
                          onPress={() => setFilters(prev => ({ ...prev, priceRange: range.id }))}
                          className={`px-4 py-2 rounded-full mr-2 mb-2 ${filters.priceRange === range.id ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                        >
                          <Text className={filters.priceRange === range.id ? 'text-white' : 'text-gray-700'}>
                            {range.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Bus Type</Text>
                    <View className="flex-row flex-wrap">
                      {[
                        { id: 'all', label: 'All Types' },
                        { id: 'bus', label: 'Bus' },
                        { id: 'minibus', label: 'Minibus' },
                        { id: 'coaster', label: 'Coaster' }
                      ].map(type => (
                        <TouchableOpacity
                          key={type.id}
                          onPress={() => setFilters(prev => ({ ...prev, busType: type.id }))}
                          className={`px-4 py-2 rounded-full mr-2 mb-2 ${filters.busType === type.id ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                        >
                          <Text className={filters.busType === type.id ? 'text-white' : 'text-gray-700'}>
                            {type.label}
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
                        sortBy: 'departureTime',
                        sortOrder: 'asc',
                      });
                      setActiveSort('departureTime');
                    }}
                  />
                </View>
              </View>
            )}

            {/* Sort Options */}
            {displayedTrips.length > 0 && renderSortOptions()}

            {/* Results Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                {displayedTrips.length > 0 ? 'Available Trips' : 'No Trips Found'}
              </Text>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-sm font-medium text-blue-600">
                  {displayedTrips.length} trip{displayedTrips.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Trip List */}
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
                onButtonPress={() => router.push('/tabs/trips/search')}
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

            {/* Popular Routes */}
            {!showSearchSummary && stationOptions.length >= 4 && (
              <View className="mt-8">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Popular Routes
                </Text>
                <View className="flex-row flex-wrap">
                  {stationOptions.slice(0, 4).map((station, index) => {
                    if (index < stationOptions.length - 1) {
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleQuickSearch(station.value, stationOptions[index + 1]?.value)}
                          className="bg-white border border-gray-200 rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center"
                        >
                          <Bus size={16} color="#64748b" />
                          <Text className="ml-1.5 text-sm text-gray-700">
                            {station.label.split(' (')[0]} → {stationOptions[index + 1]?.label.split(' (')[0]}
                          </Text>
                          <ArrowRight size={14} color="#3b82f6" className="ml-1" />
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}