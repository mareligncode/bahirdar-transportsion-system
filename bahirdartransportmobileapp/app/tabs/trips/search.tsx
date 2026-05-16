import React, { useState, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
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
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';

export default function SearchScreen() {
  const { translate } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { stations, fetchStations, loading } = useTrips();
  
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
      Alert.alert(translate('error'), translate('no_stations'));
    } finally {
      setRefreshingStations(false);
    }
  };

  const handleSearch = async () => {
    if (!formData.origin) {
      Alert.alert(translate('validation_error'), translate('select_departure_err'));
      return;
    }
    if (!formData.destination) {
      Alert.alert(translate('validation_error'), translate('select_arrival_err'));
      return;
    }
    if (formData.origin === formData.destination) {
      Alert.alert(translate('validation_error'), translate('same_station_err'));
      return;
    }

    const passengersNum = parseInt(formData.passengers);
    if (isNaN(passengersNum) || passengersNum < 1 || passengersNum > 4) {
      Alert.alert(translate('validation_error'), translate('invalid_passengers_err'));
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
      Alert.alert(translate('search_failed'), translate('something_went_wrong'));
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
    <SafeAreaView 
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} 
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 pb-3 border-b`}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText variant="h2" weight="bold" color={colors.textPrimary} className="flex-1 text-center">
            {translate('search_trips')}
          </AppText>
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
          <View className={`${isDark ? 'bg-blue-900/50' : 'bg-blue-600'} px-6 py-6`}>
            <AppText variant="h1" weight="bold" color="white" className="mb-2">
              {translate('find_your_trip')}
            </AppText>
            <AppText variant="bodyMedium" color={isDark ? colors.gray300 : "#dbeafe"}>
              {translate('search_available_trips')}
            </AppText>
          </View>

          {/* Search Form */}
          <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} mx-4 -mt-6 p-5 rounded-2xl shadow-md border`}>
            <AppText variant="bodyLarge" weight="semibold" color={colors.textPrimary} className="mb-4">
              {translate('search_available_trips')}
            </AppText>
            
            <View className="space-y-4">
              {/* Origin Station */}
              <View>
                <AppText variant="bodySmall" weight="500" color={colors.textSecondary} className="mb-2">
                  {translate('from')}
                </AppText>
                <Select
                  placeholder={translate('select_departure')}
                  value={formData.origin}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, origin: value }))}
                  items={stationOptions}
                  leftIcon={<MapPin size={20} color={colors.primary} />}
                  loading={refreshingStations}
                />
                {stationOptions.length === 0 && !refreshingStations && (
                  <AppText variant="caption" color={colors.danger} className="mt-1">
                    {translate('no_stations')}
                  </AppText>
                )}
              </View>

              {/* Swap Button */}
              <TouchableOpacity
                onPress={handleSwapLocations}
                className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} self-center p-2 rounded-full border shadow-sm`}
              >
                <ArrowRight size={22} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>

              {/* Destination Station */}
              <View>
                <AppText variant="bodySmall" weight="500" color={colors.textSecondary} className="mb-2">
                  {translate('to')}
                </AppText>
                <Select
                  placeholder={translate('select_arrival')}
                  value={formData.destination}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, destination: value }))}
                  items={stationOptions}
                  leftIcon={<MapPin size={20} color={colors.danger} />}
                  loading={refreshingStations}
                />
              </View>

              {/* Travel Date */}
              <View>
                <AppText variant="bodySmall" weight="500" color={colors.textSecondary} className="mb-2">
                  {translate('travel_date')}
                </AppText>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} flex-row items-center border rounded-xl p-3.5`}
                >
                  <Calendar size={20} color={colors.textTertiary} />
                  <AppText variant="bodyMedium" weight="500" color={colors.textPrimary} className="flex-1 ml-2">
                    {formatDate(formData.date)}
                  </AppText>
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
                <AppText variant="bodySmall" weight="500" color={colors.textSecondary} className="mb-2">
                  {translate('departure_time')}
                </AppText>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} flex-row items-center border rounded-xl p-3.5`}
                >
                  <Clock size={20} color={colors.textTertiary} />
                  <AppText variant="bodyMedium" weight="500" color={colors.textPrimary} className="flex-1 ml-2">
                    {formatTime(formData.time)}
                  </AppText>
                </TouchableOpacity>
                
                {showTimePicker && (
                  <DateTimePicker
                    value={formData.time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}
              </View>

              {/* Passengers */}
              <View>
                <AppText variant="bodySmall" weight="500" color={colors.textSecondary} className="mb-2">
                  {translate('passengers')}
                </AppText>
                <Input
                  placeholder={translate('passengers')}
                  value={formData.passengers}
                  onChangeText={(value: string) => {
                    if (/^\d*$/.test(value)) {
                      setFormData(prev => ({ ...prev, passengers: value }));
                    }
                  }}
                  keyboardType="numeric"
                  leftIcon={<Users size={20} color={colors.textTertiary} />}
                  className={isDark ? 'bg-gray-700' : 'bg-gray-50'}
                />
                <AppText variant="caption" color={colors.textTertiary} className="mt-1">
                  {translate('max_passengers')}
                </AppText>
              </View>

              {/* Search Button */}
              <Button
                title={translate('search_button')}
                onPress={handleSearch}
                loading={loading}
                disabled={loading || refreshingStations || stationOptions.length === 0}
                className="mt-2"
                variant="primary"
                size="large"
              />
            </View>
          </View>

          {/* Popular Routes */}
          {popularRoutes.length > 0 && (
            <View className="mt-6 px-4">
              <AppText variant="bodyLarge" weight="semibold" color={colors.textPrimary} className="mb-3">
                {translate('popular_routes_label')}
              </AppText>
              <View className="flex-row flex-wrap">
                {popularRoutes.map((route, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-full px-4 py-2.5 mr-2 mb-2 flex-row items-center`}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        origin: route.origin,
                        destination: route.destination
                      }));
                    }}
                  >
                    <Bus size={16} color={colors.textTertiary} />
                    <AppText variant="bodySmall" color={colors.textSecondary} className="ml-1.5">
                      {getStationName(route.origin)} → {getStationName(route.destination)}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}