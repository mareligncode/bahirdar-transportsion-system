import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { AppText } from '@/components/common/AppText';
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
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { TripCard } from '../../../components/booking/TripCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { useTheme } from '../../../context/ThemeContext';
import { formatDate, formatTime } from '../../../utils/helpers';
import { Trip, Station, StationOption } from '../../../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { translate } = useTranslation();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();

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

  // Handle case when params.id is 'index' - moved to useEffect
  useEffect(() => {
    if (params.id === 'index' || params.tripId === 'index') {
      router.replace('/tabs/trips');
    }
  }, [params.id, params.tripId]);

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
      Alert.alert(translate('error'), translate('something_went_wrong'));
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

  // Early return after all hooks are declared
  if (params.id === 'index' || params.tripId === 'index') {
    return null;
  }

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
      Alert.alert(translate('error'), translate('invalid_trip_id'));
      return;
    }

    if (tripId === 'index') {
      Alert.alert(translate('error'), translate('invalid_trip_id'));
      return;
    }

    if (tripId.length !== 24) {
      Alert.alert(translate('error'), translate('invalid_trip_id'));
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
      <View className={`${isDark ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} p-4 mb-4 rounded-xl border`}>
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <AppText variant="caption" weight="500" color="#1e40af" className="mb-1">
              {translate('search_results')}
            </AppText>
            <AppText variant="bodyLarge" weight="bold" color={isDark ? 'white' : 'black'}>
              {originName} → {destName}
            </AppText>
            <View className="flex-row items-center mt-2">
              <Calendar size={14} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary} className="ml-1">
                {formatDate(searchDate)}
              </AppText>
              <Users size={14} color={colors.textSecondary} className="ml-3" />
              <AppText variant="caption" color={colors.textSecondary} className="ml-1">
                {searchParams.passengers} {translate(searchParams.passengers > 1 ? 'passengers' : 'passenger')}
              </AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClearSearch}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-2 rounded-full`}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/tabs/trips/search')}
          className={`mt-3 ${isDark ? 'bg-gray-800' : 'bg-white'} py-2 px-3 rounded-lg self-start`}
        >
          <AppText variant="label" color={colors.primary}>{translate('modify_search')}</AppText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSortOptions = () => (
    <View className="flex-row justify-between mb-4">
      <TouchableOpacity
        onPress={() => toggleSort('departureTime')}
        className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${activeSort === 'departureTime' ? 'bg-blue-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
      >
        <Clock size={16} color={activeSort === 'departureTime' ? 'white' : colors.textSecondary} />
        <AppText 
          variant="label" 
          weight="500"
          color={activeSort === 'departureTime' ? 'white' : isDark ? '#d1d5db' : '#374151'}
          className="ml-1"
        >
          {translate('time')}
        </AppText>
        {activeSort === 'departureTime' && (
          <AppText variant="label" color="white" className="ml-1">
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </AppText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleSort('price')}
        className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${activeSort === 'price' ? 'bg-blue-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
      >
        <AppText 
          variant="label"
          weight="500"
          color={activeSort === 'price' ? 'white' : isDark ? '#d1d5db' : '#374151'}
        >
          {translate('price')}
        </AppText>
        {activeSort === 'price' && (
          <AppText variant="label" color="white" className="ml-1">
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </AppText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleSort('availability')}
        className={`px-4 py-2 rounded-full flex-row items-center ${activeSort === 'availability' ? 'bg-blue-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
      >
        <Users size={16} color={activeSort === 'availability' ? 'white' : colors.textSecondary} />
        <AppText 
          variant="label" 
          weight="500"
          color={activeSort === 'availability' ? 'white' : isDark ? '#d1d5db' : '#374151'}
          className="ml-1"
        >
          {translate('seats')}
        </AppText>
        {activeSort === 'availability' && (
          <AppText variant="label" color="white" className="ml-1">
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </AppText>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
              <AppText variant="h1" color="white">{translate('available_trips')}</AppText>
              <AppText variant="bodySmall" color="#dbeafe" className="mt-1">
                {translate('find_journey_sub')}
              </AppText>
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
              <AppText variant="caption" color="#bfdbfe">{translate('available_today')}</AppText>
              <AppText variant="h2" color="white">
                {displayedTrips.length} {displayedTrips.length === 1 ? translate('trip') : translate('trips')}
              </AppText>
            </View>
            <View className="flex-1">
              <AppText variant="caption" color="#bfdbfe">{translate('routes')}</AppText>
              <AppText variant="h2" color="white">
                {stations.length}
              </AppText>
            </View>
            <View className="flex-1">
              <AppText variant="caption" color="#bfdbfe">{translate('passengers')}</AppText>
              <AppText variant="h2" color="white">
                {searchParams.passengers}
              </AppText>
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
              <View className={`flex-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-3 mr-2 border`}>
                <TrendingUp size={20} color={colors.primary} />
                <AppText variant="h3" color={isDark ? 'white' : 'black'} className="mt-1">24/7</AppText>
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('service')}</AppText>
              </View>
              <View className={`flex-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-3 mr-2 border`}>
                <Star size={20} color={colors.accent} />
                <AppText variant="h3" color={isDark ? 'white' : 'black'} className="mt-1">4.8</AppText>
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('rating')}</AppText>
              </View>
              <View className={`flex-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-3 border`}>
                <Clock3 size={20} color={colors.success} />
                <AppText variant="h3" color={isDark ? 'white' : 'black'} className="mt-1">95%</AppText>
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('on_time')}</AppText>
              </View>
            </View>

            {/* Filters Panel */}
            {showFilters && (
              <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-5 mb-6 shadow-sm border`}>
                <AppText variant="h3" color={isDark ? 'white' : 'black'} className="mb-4">
                  {translate('filter_results')}
                </AppText>

                <View className="space-y-4">
                  <View>
                    <AppText variant="bodySmall" weight="500" color={isDark ? colors.gray300 : colors.gray700} className="mb-2">
                      {translate('price_range')}
                    </AppText>
                    <View className="flex-row flex-wrap">
                      {[
                        { id: 'all', label: translate('all_prices') },
                        { id: 'under500', label: translate('under_500') },
                        { id: '500-1000', label: translate('between_500_1000') },
                        { id: 'over1000', label: translate('over_1000') }
                      ].map(range => (
                        <TouchableOpacity
                          key={range.id}
                          onPress={() => setFilters(prev => ({ ...prev, priceRange: range.id }))}
                          className={`px-4 py-2 rounded-full mr-2 mb-2 ${filters.priceRange === range.id ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                            }`}
                        >
                          <AppText 
                            variant="label" 
                            color={filters.priceRange === range.id ? 'white' : isDark ? '#d1d5db' : '#4b5563'}
                          >
                            {range.label}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <AppText variant="bodySmall" weight="500" color={isDark ? colors.gray300 : colors.gray700} className="mb-2">
                      {translate('bus_type')}
                    </AppText>
                    <View className="flex-row flex-wrap">
                      {[
                        { id: 'all', label: translate('all_types') },
                        { id: 'bus', label: translate('bus') },
                        { id: 'minibus', label: translate('minibus') },
                        { id: 'coaster', label: translate('coaster') }
                      ].map(type => (
                        <TouchableOpacity
                          key={type.id}
                          onPress={() => setFilters(prev => ({ ...prev, busType: type.id }))}
                          className={`px-4 py-2 rounded-full mr-2 mb-2 ${filters.busType === type.id ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                            }`}
                        >
                          <AppText 
                            variant="label" 
                            color={filters.busType === type.id ? 'white' : isDark ? '#d1d5db' : '#4b5563'}
                          >
                            {type.label}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <Button
                    title={translate('apply_filters')}
                    onPress={handleApplyFilters}
                    className="bg-blue-600"
                  />

                  <Button
                    title={translate('reset_filters')}
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
              <AppText variant="h3" weight="semibold" color={isDark ? 'white' : '#111827'}>
                {displayedTrips.length > 0 ? translate('available_trips') : translate('no_trips_found')}
              </AppText>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <AppText variant="caption" weight="500" color="#2563eb">
                  {translate('trip_count', { count: displayedTrips.length })}
                </AppText>
              </View>
            </View>

            {/* Trip List */}
            {loading && !refreshing ? (
              <View className="py-10">
                <Loader message={translate('loading_trips')} />
              </View>
            ) : displayedTrips.length === 0 ? (
              <EmptyState
                icon={<Bus size={48} color="#94a3b8" />}
                title={translate('no_trips_available')}
                message={
                  searchParams.origin && searchParams.destination
                    ? translate('no_search_results_desc')
                    : translate('no_trips_general_desc')
                }
                buttonTitle={translate('search_again')}
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
                <AppText variant="h3" weight="semibold" color={isDark ? 'white' : '#111827'} className="mb-3">
                  {translate('popular_routes')}
                </AppText>
                <View className="flex-row flex-wrap">
                  {stationOptions.slice(0, 4).map((station, index) => {
                    if (index < stationOptions.length - 1) {
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleQuickSearch(station.value, stationOptions[index + 1]?.value)}
                          className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center`}
                        >
                          <Bus size={16} color={colors.textSecondary} />
                          <AppText variant="bodySmall" color={isDark ? '#d1d5db' : '#4b5563'} className="ml-1.5">
                            {station.label.split(' (')[0]} → {stationOptions[index + 1]?.label.split(' (')[0]}
                          </AppText>
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