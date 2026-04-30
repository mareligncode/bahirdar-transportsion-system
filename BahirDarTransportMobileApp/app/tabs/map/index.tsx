import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
  StatusBar
} from 'react-native';
import MapView, { Marker, Polyline, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { 
  MapPin, 
  Navigation, 
  Locate, 
  Maximize, 
  Layers, 
  Bus, 
  ChevronRight,
  Activity,
  ArrowLeft
} from 'lucide-react-native';
import { useTrips } from '@/hooks/useTrips';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip } from '@/types/trip';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Bahir Dar Meneharia Center
const INITIAL_REGION = {
  latitude: 11.5944,
  longitude: 37.3912,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MAP_DARK_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#263c3f" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  }
];

export default function LiveMapScreen() {
  const mapRef = useRef<MapView>(null);
  const { translate } = useTranslation();
  const { colors, isDark } = useTheme();
  const { fetchAllTrips, stations, fetchStations, loading: tripsLoading } = useTrips();

  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [showTripList, setShowTripList] = useState(false);

  // 1. Fetch data
  const syncData = useCallback(async () => {
    try {
      const trips = await fetchAllTrips({ status: 'ongoing,boarding' });
      setActiveTrips(trips);
      await fetchStations();
    } catch (error) {
      console.error('Sync error:', error);
    }
  }, [fetchAllTrips, fetchStations]);

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 30000);
    return () => clearInterval(interval);
  }, [syncData]);

  // 2. Watch User Location
  useEffect(() => {
    let subscription: any;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Get initial position
      const initialLocation = await Location.getCurrentPositionAsync({});
      setUserLocation(initialLocation);
      
      // Auto-focus on start if no selected trip
      if (!selectedTrip) {
        mapRef.current?.animateToRegion({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }

      // Watch position
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setUserLocation(location);
        }
      );
    };

    startWatching();
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const handleLocateMe = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  // 3. Fit All Markers
  const handleFitAll = () => {
    const markers = [
      ...activeTrips
        .filter(t => t.currentCoordinates)
        .map(t => ({ latitude: t.currentCoordinates!.lat, longitude: t.currentCoordinates!.lng })),
      ...stations
        .filter(s => s.location && typeof s.location === 'object') // Assuming coordinates might be in location or we use the lat/lng we added
        .map(s => {
            // Check if coordinates exist in the station object (we added them to the type)
            // But let's fall back to some defaults if not found
            const coords = (s as any).coordinates || { lat: 11.5944, lng: 37.3912 };
            return { latitude: coords.lat, longitude: coords.lng };
        })
    ];

    if (markers.length > 0) {
      mapRef.current?.fitToCoordinates(markers, {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
  };

  // 4. Focus Trip
  const focusTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowTripList(false);
    if (trip.currentCoordinates) {
      mapRef.current?.animateToRegion({
        latitude: trip.currentCoordinates.lat,
        longitude: trip.currentCoordinates.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      onPress={() => focusTrip(item)}
      className={`p-4 mx-4 mb-3 rounded-2xl border ${
        selectedTrip?._id === item._id 
          ? 'bg-blue-600 border-blue-400' 
          : isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-sm`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className={`p-2 rounded-xl ${selectedTrip?._id === item._id ? 'bg-white/20' : 'bg-blue-500/10'}`}>
          <Bus size={20} color={selectedTrip?._id === item._id ? 'white' : colors.primary} />
        </View>
        <View className={`px-2 py-1 rounded-full ${item.tripStatus === 'ongoing' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
          <AppText variant="caption" weight="bold" color={item.tripStatus === 'ongoing' ? '#22c55e' : '#3b82f6'} className="uppercase">
            {item.tripStatus}
          </AppText>
        </View>
      </View>
      <AppText weight="bold" color={selectedTrip?._id === item._id ? 'white' : colors.textPrimary} className="text-lg">
        {item.vehicle?.plateNumber}
      </AppText>
      <AppText variant="caption" color={selectedTrip?._id === item._id ? 'white' : colors.textSecondary} className="mb-2">
        {item.origin?.stationName} → {item.destination?.stationName}
      </AppText>
      <View className="flex-row justify-between items-center">
        <AppText variant="caption" color={selectedTrip?._id === item._id ? 'white' : colors.textTertiary}>
          {item.driver?.fullName}
        </AppText>
        <ChevronRight size={16} color={selectedTrip?._id === item._id ? 'white' : colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="px-4 py-2 flex-row justify-between items-center z-10">
        <View className="flex-row items-center">
          <View className="p-2 bg-blue-600 rounded-xl mr-3 shadow-lg">
            <Activity size={20} color="white" />
          </View>
          <View>
            <AppText variant="h3" weight="bold" color={colors.textPrimary}>Live Fleet</AppText>
            <AppText variant="caption" color={colors.textSecondary}>{activeTrips.length} nodes active</AppText>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => setShowTripList(!showTripList)}
          className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <Navigation size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 relative">
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={INITIAL_REGION}
          customMapStyle={isDark ? MAP_DARK_STYLE : []}
          mapType={mapType}
          showsUserLocation
          followsUserLocation
          loadingEnabled
          showsMyLocationButton={false}
        >
          {/* Station Markers */}
          {stations
            .filter(s => s.city?.toLowerCase() === 'bahir dar' && s.label?.toLowerCase() !== 'lamberet')
            .map((station) => {
            const coords = (station as any).coordinates;
            if (!coords || !coords.lat || !coords.lng) return null;
            return (
              <Marker
                key={station.value}
                coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                title={station.label}
                description={station.city}
              >
                <View className="items-center">
                  <View className="bg-blue-600 p-1.5 rounded-full border-2 border-white shadow-lg">
                    <MapPin size={12} color="white" />
                  </View>
                  <View className="bg-white/90 px-2 py-0.5 rounded-full mt-1 border border-gray-100">
                    <AppText style={{ fontSize: 8 }} weight="bold" color="#1e3a8a">{station.label}</AppText>
                  </View>
                </View>
              </Marker>
            );
          })}

          {/* Vehicle Markers */}
          {activeTrips
            .filter(t => 
              t.currentCoordinates && 
              (t.origin?.city?.toLowerCase() === 'bahir dar' || t.destination?.city?.toLowerCase() === 'bahir dar')
            )
            .map((trip) => (
            <Marker
              key={trip._id}
              coordinate={{ 
                latitude: trip.currentCoordinates!.lat, 
                longitude: trip.currentCoordinates!.lng 
              }}
              onPress={() => setSelectedTrip(trip)}
            >
              <View className="items-center">
                <View className={`${trip.isRealtimeTracking ? 'bg-green-500' : 'bg-blue-500'} p-2 rounded-2xl border-2 border-white shadow-2xl`}>
                  <Bus size={18} color="white" />
                </View>
                {trip.isRealtimeTracking && (
                  <View className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border border-white" />
                )}
                <View className={`${trip.isRealtimeTracking ? 'bg-green-900/80' : 'bg-blue-900/80'} px-2 py-0.5 rounded-full mt-1`}>
                  <AppText style={{ fontSize: 9 }} weight="bold" color="white">{trip.vehicle?.plateNumber}</AppText>
                </View>
              </View>
              <Callout tooltip>
                <View className={`${isDark ? 'bg-gray-900' : 'bg-white'} p-3 rounded-2xl border border-gray-200 min-w-[150px]`}>
                  <AppText weight="bold" color={colors.textPrimary}>{trip.vehicle?.plateNumber}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {trip.origin?.stationName} → {trip.destination?.stationName}
                  </AppText>
                  <View className="h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <View className="bg-blue-600 h-full w-[60%]" />
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}

          {/* Route Line for selected trip */}
          {selectedTrip && (
            <Polyline
              coordinates={[
                { latitude: (selectedTrip.origin as any).coordinates?.lat || 11.5944, longitude: (selectedTrip.origin as any).coordinates?.lng || 37.3912 },
                { latitude: (selectedTrip.destination as any).coordinates?.lat || 11.5944, longitude: (selectedTrip.destination as any).coordinates?.lng || 37.3912 }
              ]}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[10, 10]}
            />
          )}
        </MapView>

        {/* Floating Controls */}
        <View className="absolute top-4 right-4 gap-y-3">
          <TouchableOpacity 
            onPress={handleLocateMe}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} shadow-xl border border-white/10`}
          >
            <Locate size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleFitAll}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} shadow-xl border border-white/10`}
          >
            <Maximize size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${mapType === 'satellite' ? 'bg-blue-600' : isDark ? 'bg-gray-900/90' : 'bg-white/90'} shadow-xl border border-white/10`}
          >
            <Layers size={22} color={mapType === 'satellite' ? 'white' : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Trip List Overlay */}
        {showTripList && (
          <Animated.View 
            entering={FadeInUp.duration(300)}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md"
          >
            <SafeAreaView className="flex-1">
              <View className="flex-1 mt-10 rounded-t-[3rem]" style={{ backgroundColor: colors.background }}>
                <View className="items-center py-4">
                  <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </View>
                
                <View className="flex-row items-center px-6 mb-6">
                  <TouchableOpacity onPress={() => setShowTripList(false)} className="mr-4">
                    <ArrowLeft size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <AppText variant="h2" weight="bold" color={colors.textPrimary}>Active Transports</AppText>
                </View>

                {tripsLoading ? (
                  <ActivityIndicator color={colors.primary} size="large" className="mt-20" />
                ) : (
                  <FlatList
                    data={activeTrips}
                    renderItem={renderTripItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                      <View className="items-center py-20">
                        <Navigation size={48} color={colors.textTertiary} className="opacity-20 mb-4" />
                        <AppText color={colors.textSecondary}>No active trips at the moment</AppText>
                      </View>
                    }
                  />
                )}
              </View>
            </SafeAreaView>
          </Animated.View>
        )}

        {/* Selected Trip Quick Info */}
        {selectedTrip && !showTripList && (
          <Animated.View 
            entering={FadeInDown.duration(400)}
            className="absolute bottom-6 left-4 right-4"
          >
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setShowTripList(true)}
              className={`${isDark ? 'bg-gray-900' : 'bg-white'} p-5 rounded-[2.5rem] shadow-2xl border border-white/10 flex-row items-center`}
            >
              <View className="bg-blue-600 p-4 rounded-3xl shadow-lg mr-4">
                <Bus size={24} color="white" />
              </View>
              <View className="flex-1">
                <AppText variant="caption" weight="bold" color={colors.primary} className="uppercase tracking-widest mb-1">
                  Tracking Active
                </AppText>
                <AppText weight="bold" color={colors.textPrimary} className="text-xl">
                  {selectedTrip.vehicle?.plateNumber}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {selectedTrip.origin?.stationName} → {selectedTrip.destination?.stationName}
                </AppText>
              </View>
              <TouchableOpacity 
                onPress={() => setSelectedTrip(null)}
                className="p-2"
              >
                <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                   <AppText color="#9ca3af" weight="bold">✕</AppText>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
