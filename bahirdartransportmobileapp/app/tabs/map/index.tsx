import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function LiveMapScreen() {
  const webViewRef = useRef<WebView>(null);
  const { translate } = useTranslation();
  const { colors, isDark } = useTheme();
  const { fetchAllTrips, stations, fetchStations, loading: tripsLoading } = useTrips();

  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [showTripList, setShowTripList] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Use ref to avoid useEffect dependency issues with selectedTrip
  const selectedTripRef = useRef(selectedTrip);
  useEffect(() => {
    selectedTripRef.current = selectedTrip;
  }, [selectedTrip]);

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
      if (!selectedTripRef.current && isMapLoaded) {
        webViewRef.current?.injectJavaScript(`
          try {
            if (window.map) {
              window.map.setView([${initialLocation.coords.latitude}, ${initialLocation.coords.longitude}], 14);
            }
          } catch(e) {}
          true;
        `);
      }

      // Watch position
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
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
  }, [isMapLoaded]);

  // Send update to map whenever activeTrips or stations change
  useEffect(() => {
    if (!isMapLoaded || !webViewRef.current) return;

    const filteredStations = stations
      .filter(s => s.city?.toLowerCase() === 'bahir dar' && s.label?.toLowerCase() !== 'lamberet')
      .map(s => {
        const coords = (s as any).coordinates || { lat: 11.5944, lng: 37.3912 };
        return { id: s.value, label: s.label, city: s.city, lat: coords.lat, lng: coords.lng };
      });

    const filteredTrips = activeTrips
      .filter(t => t.currentCoordinates && (t.origin?.city?.toLowerCase() === 'bahir dar' || t.destination?.city?.toLowerCase() === 'bahir dar'))
      .map(t => ({
        id: t._id,
        plateNumber: t.vehicle?.plateNumber,
        origin: t.origin?.stationName,
        destination: t.destination?.stationName,
        lat: t.currentCoordinates!.lat,
        lng: t.currentCoordinates!.lng,
        isRealtime: t.isRealtimeTracking
      }));

    let selectedTripRoute = null;
    if (selectedTrip) {
      selectedTripRoute = {
        origin: { lat: (selectedTrip.origin as any).coordinates?.lat || 11.5944, lng: (selectedTrip.origin as any).coordinates?.lng || 37.3912 },
        dest: { lat: (selectedTrip.destination as any).coordinates?.lat || 11.5944, lng: (selectedTrip.destination as any).coordinates?.lng || 37.3912 }
      };
    }

    const payload = {
      type: 'updateData',
      stations: filteredStations,
      trips: filteredTrips,
      selectedTripRoute,
      selectedTripId: selectedTrip ? selectedTrip._id : null
    };

    webViewRef.current.injectJavaScript(`
      try {
        window.postMessage(JSON.stringify(${JSON.stringify(payload)}), '*');
      } catch(e) {}
      true;
    `);

  }, [activeTrips, stations, isMapLoaded, selectedTrip]);

  // Update Theme
  useEffect(() => {
    if (!isMapLoaded || !webViewRef.current) return;
    
    const payload = { type: 'setTheme', isDark, mapType };
    webViewRef.current.injectJavaScript(`
      try {
        window.postMessage(JSON.stringify(${JSON.stringify(payload)}), '*');
      } catch(e) {}
      true;
    `);
  }, [isDark, mapType, isMapLoaded]);


  const handleLocateMe = () => {
    if (userLocation && isMapLoaded) {
      webViewRef.current?.injectJavaScript(`
        try {
          if (window.map) {
            window.map.flyTo([${userLocation.coords.latitude}, ${userLocation.coords.longitude}], 15, { duration: 1 });
          }
        } catch(e) {}
        true;
      `);
    }
  };

  const handleFitAll = () => {
    if (!isMapLoaded) return;
    
    const bounds = [
      ...activeTrips
        .filter(t => t.currentCoordinates)
        .map(t => [t.currentCoordinates!.lat, t.currentCoordinates!.lng]),
      ...stations
        .filter(s => s.city?.toLowerCase() === 'bahir dar')
        .map(s => {
            const coords = (s as any).coordinates || { lat: 11.5944, lng: 37.3912 };
            return [coords.lat, coords.lng];
        })
    ];

    if (bounds.length > 0) {
      webViewRef.current?.injectJavaScript(`
        try {
          if (window.map) {
            window.map.fitBounds(${JSON.stringify(bounds)}, { padding: [50, 50], duration: 1 });
          }
        } catch(e) {}
        true;
      `);
    }
  };

  const focusTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowTripList(false);
    if (trip.currentCoordinates && isMapLoaded) {
      webViewRef.current?.injectJavaScript(`
        try {
          if (window.map) {
            window.map.flyTo([${trip.currentCoordinates.lat}, ${trip.currentCoordinates.lng}], 15, { duration: 1 });
          }
        } catch(e) {}
        true;
      `);
    }
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'tripSelected') {
        const trip = activeTrips.find(t => t._id === data.tripId);
        if (trip) {
          setSelectedTrip(trip);
        }
      }
    } catch(e) {}
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
            {translate(item.tripStatus as any) || item.tripStatus}
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

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100vw; background-color: ${isDark ? '#111827' : '#f9fafb'}; }
        
        .station-marker {
            background-color: #2563eb;
            color: white;
            border-radius: 50%;
            border: 2px solid white;
            text-align: center;
            line-height: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .vehicle-marker {
            background-color: #3b82f6;
            color: white;
            border-radius: 8px;
            border: 2px solid white;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            white-space: nowrap;
            transition: all 0.3s ease;
        }
        .vehicle-marker.active {
            background-color: #22c55e;
        }
        .vehicle-marker.selected {
            background-color: #f59e0b;
            transform: scale(1.1);
            z-index: 1000 !important;
        }
        
        /* Hide leaflet controls for cleaner UI */
        .leaflet-control-attribution { display: none; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false }).setView([11.5944, 37.3912], 13);
        
        var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        var markersGroup = L.layerGroup().addTo(map);
        var routeLine = null;

        window.addEventListener("message", function(event) {
            try {
                var data = JSON.parse(event.data);
                
                if (data.type === 'setTheme') {
                    var isDark = data.isDark;
                    var mapType = data.mapType;
                    
                    var url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                    
                    if (mapType === 'satellite') {
                        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                    } else if (isDark) {
                        url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
                    }
                    
                    tileLayer.setUrl(url);
                }
                
                if (data.type === 'updateData') {
                    markersGroup.clearLayers();
                    
                    // Add Stations
                    data.stations.forEach(function(station) {
                        var icon = L.divIcon({
                            className: 'station-marker',
                            html: 'S',
                            iconSize: [24, 24]
                        });
                        L.marker([station.lat, station.lng], {icon: icon})
                         .bindPopup('<b style="font-size:14px; color:#1e3a8a;">' + station.label + '</b><br>' + station.city)
                         .addTo(markersGroup);
                    });

                    // Add Vehicles
                    data.trips.forEach(function(trip) {
                        var isSelected = trip.id === data.selectedTripId;
                        var className = 'vehicle-marker';
                        if (trip.isRealtime) className += ' active';
                        if (isSelected) className += ' selected';
                        
                        var icon = L.divIcon({
                            className: className,
                            html: '🚌 ' + trip.plateNumber,
                            iconSize: [70, 24]
                        });
                        
                        var marker = L.marker([trip.lat, trip.lng], {icon: icon, zIndexOffset: isSelected ? 1000 : 0})
                         .addTo(markersGroup);
                         
                        // Send message back to React Native when tapped
                        marker.on('click', function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'tripSelected',
                                tripId: trip.id
                            }));
                        });
                    });

                    // Draw Route if selectedTrip exists
                    if (routeLine) {
                        map.removeLayer(routeLine);
                        routeLine = null;
                    }

                    if (data.selectedTripRoute) {
                        var route = data.selectedTripRoute;
                        routeLine = L.polyline([
                            [route.origin.lat, route.origin.lng],
                            [route.dest.lat, route.dest.lng]
                        ], {color: '#3b82f6', weight: 4, dashArray: '10, 10'}).addTo(map);
                    }
                }

            } catch(e) {}
        });
    </script>
</body>
</html>
  `;

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
            <AppText variant="h3" weight="bold" color={colors.textPrimary}>{translate('live_fleet') || 'Live Fleet'}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>{activeTrips.length} {translate('nodes_active') || 'nodes active'}</AppText>
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
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}
          onMessage={onMessage}
          onLoadEnd={() => {
            setIsMapLoaded(true);
            // Initial theme setup
            webViewRef.current?.injectJavaScript(`
              try {
                window.postMessage(JSON.stringify({ type: 'setTheme', isDark: ${isDark}, mapType: '${mapType}' }), '*');
              } catch(e) {}
              true;
            `);
          }}
          originWhitelist={['*']}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          javaScriptEnabled={true}
          scrollEnabled={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />

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
                  <AppText variant="h2" weight="bold" color={colors.textPrimary}>{translate('active_transports') || 'Active Transports'}</AppText>
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
                        <AppText color={colors.textSecondary}>{translate('no_active_trips') || 'No active trips at the moment'}</AppText>
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
                  {translate('tracking_active') || 'Tracking Active'}
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
