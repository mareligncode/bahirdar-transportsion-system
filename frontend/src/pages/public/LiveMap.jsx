import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Info, Bus, Navigation, Map as MapIcon, Crosshair, ZoomIn, Layers, Activity, ChevronRight, Locate } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../services/api';

const LiveMap = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const polylinesRef = useRef({});

    const [activeTrips, setActiveTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ online: false, count: 0 });

    // Advanced features state
    const [mapType, setMapType] = useState('street');
    const [userLocation, setUserLocation] = useState(null);
    const [destination, setDestination] = useState(null);
    const [distanceInfo, setDistanceInfo] = useState(null);
    const userMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const routeLineRef = useRef(null);
    const layerRef = useRef(null);

    // 1. Initialize Map (Once)
    useEffect(() => {
        if (!window.L || mapInstance.current) return;

        const defaultPos = [11.5944, 37.3912]; // Exact Meneharia Coordinates
        const map = window.L.map(mapRef.current, {
            center: defaultPos,
            zoom: 14,
            zoomControl: false,
            attributionControl: false
        });

        // Use a more professional gray/dark tile set style via filter
        layerRef.current = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        mapInstance.current = map;

        // Add map click listener for destination
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            setDestination({ lat, lng });
        });

        // CRITICAL: Ensure map fills container
        setTimeout(() => {
            if (mapInstance.current) mapInstance.current.invalidateSize();
        }, 1000);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // 2. Fetch & Sync Logic
    const syncTrips = useCallback(async () => {
        try {
            const response = await api.get('/api/trip?tripStatus=ongoing,boarding');
            const trips = response.data.data || [];
            setActiveTrips(trips);
            setStats(prev => ({ ...prev, count: trips.length, online: true }));

            trips.forEach(updateMapElements);
        } catch (error) {
            console.error('Map Sync Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        syncTrips();
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

        socket.on('connect', () => {
            setStats(prev => ({ ...prev, online: true }));
            console.log('Telemetry Uplink Established');
        });

        socket.on('trip-location-update', (data) => {
            updateMapElements(data);
        });

        const pollInterval = setInterval(syncTrips, 30000); // 30s background sync
        return () => {
            socket.disconnect();
            clearInterval(pollInterval);
        };
    }, [syncTrips]);

    const updateMapElements = (data) => {
        if (!mapInstance.current || !window.L) return;

        const id = data.tripId || data._id;
        const coords = data.coordinates || data.currentCoordinates || [11.5944, 37.3912];
        const lat = Array.isArray(coords) ? coords[0] : (coords.lat || 11.59);
        const lng = Array.isArray(coords) ? coords[1] : (coords.lng || 37.39);

        // A. Draw/Update Route Polyline
        if (data.origin && data.destination && !polylinesRef.current[id]) {
            const getPos = (obj) => {
                const c = obj.coordinates;
                return Array.isArray(c) ? [c[0], c[1]] : [c.lat || 11.59, c.lng || 37.39];
            };
            const p1 = getPos(data.origin);
            const p2 = getPos(data.destination);

            polylinesRef.current[id] = window.L.polyline([p1, p2], {
                color: '#2563eb',
                weight: 3,
                dashArray: '8, 12',
                opacity: 0.4
            }).addTo(mapInstance.current);

            // Add Station Markers (A & B)
            const iconA = window.L.divIcon({ className: '', html: `<div class="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold">A</div>` });
            const iconB = window.L.divIcon({ className: '', html: `<div class="w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold">B</div>` });
            window.L.marker(p1, { icon: iconA }).addTo(mapInstance.current);
            window.L.marker(p2, { icon: iconB }).addTo(mapInstance.current);
        }

        // B. Update Vehicle Marker
        if (markersRef.current[id]) {
            markersRef.current[id].setLatLng([lat, lng]);
        } else {
            const busIcon = window.L.divIcon({
                className: 'bus-node',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                html: `
                    <div class="relative group cursor-pointer">
                        <div class="bg-blue-600 text-white p-2.5 rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.5)] border-2 border-white transform transition-all group-hover:scale-125 z-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10c0-1.1.9-2 2-2z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                        </div>
                    </div>
                `
            });

            const marker = window.L.marker([lat, lng], { icon: busIcon }).addTo(mapInstance.current);
            marker.bindPopup(`
                <div class="p-3 font-sans min-w-[150px]">
                    <p class="text-[10px] font-black text-blue-500 uppercase mb-1">Fleet Signal detected</p>
                    <h4 class="font-black text-gray-900 m-0 text-md truncate">${data.vehicle?.plateNumber || 'T-LIVE'}</h4>
                    <p class="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-tighter">${data.origin?.stationName} → ${data.destination?.stationName}</p>
                    <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                        <div class="bg-blue-600 h-full w-[65%] shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
                    </div>
                    <p class="text-[8px] text-right text-gray-400 mt-1 uppercase font-bold tracking-widest">In Transit</p>
                </div>
            `);
            markersRef.current[id] = marker;
        }
    };

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                mapInstance.current.flyTo([latitude, longitude], 16, { duration: 2 });
                if (userMarkerRef.current) userMarkerRef.current.remove();
                const userIcon = window.L.divIcon({ html: `<div class="w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-2xl animate-pulse ring-4 ring-blue-500/20"></div>`, className: '' });
                userMarkerRef.current = window.L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstance.current).bindPopup("<b>Your Location</b>");
            });
        }
    };

    const fitAll = () => {
        const markers = Object.values(markersRef.current);
        if (markers.length > 0) {
            const group = new window.L.featureGroup(markers);
            mapInstance.current.fitBounds(group.getBounds(), { padding: [80, 80] });
        } else {
            mapInstance.current.flyTo([11.5944, 37.3912], 14);
        }
    };

    const focusTrip = (trip) => {
        setSelectedTrip(trip);
        const marker = markersRef.current[trip._id];
        if (marker) {
            mapInstance.current.flyTo(marker.getLatLng(), 15, { duration: 1.5 });
            marker.openPopup();
        }
    };

    // Calculate Distance & Bearing Helper
    const calculateDistanceAndBearing = (pos1, pos2) => {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371; // Earth's radius in km
        const dLat = toRad(pos2.lat - pos1.lat);
        const dLng = toRad(pos2.lng - pos1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = (R * c).toFixed(2);

        const y = Math.sin(toRad(pos2.lng - pos1.lng)) * Math.cos(toRad(pos2.lat));
        const x = Math.cos(toRad(pos1.lat)) * Math.sin(toRad(pos2.lat)) - Math.sin(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) * Math.cos(toRad(pos2.lng - pos1.lng));
        let brng = (Math.atan2(y, x) * 180) / Math.PI;
        brng = (brng + 360) % 360;

        const directions = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
        const index = Math.round((brng % 360) / 45);
        return { distance, direction: directions[index === 8 ? 0 : index] };
    };

    // destination hook
    useEffect(() => {
        if (!mapInstance.current || !window.L) return;
        if (destMarkerRef.current) destMarkerRef.current.remove();
        if (routeLineRef.current) routeLineRef.current.remove();

        if (destination) {
            const destIcon = window.L.divIcon({ html: `<div class="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`, className: '' });
            destMarkerRef.current = window.L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(mapInstance.current);

            if (userLocation) {
                const info = calculateDistanceAndBearing(userLocation, destination);
                setDistanceInfo(info);
                routeLineRef.current = window.L.polyline([[userLocation.lat, userLocation.lng], [destination.lat, destination.lng]], { color: '#ef4444', weight: 4, dashArray: '5, 10', opacity: 0.8 }).addTo(mapInstance.current);
            } else {
                setDistanceInfo({ msg: "Locate yourself first to measure!" });
            }
        } else {
            setDistanceInfo(null);
        }
    }, [destination, userLocation]);

    // Layer switch hook
    useEffect(() => {
        if (!mapInstance.current || !window.L || !layerRef.current) return;
        layerRef.current.remove();
        if (mapType === 'satellite') {
            layerRef.current = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(mapInstance.current);
            document.querySelector('.leaflet-tile-pane').style.filter = 'none';
        } else {
            layerRef.current = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
            document.querySelector('.leaflet-tile-pane').style.filter = 'brightness(0.65) invert(1) contrast(1.2) hue-rotate(200deg) saturate(0.6) brightness(0.85)';
        }
    }, [mapType]);

    return (
        <div className="flex h-[calc(100vh-100px)] bg-[#0f172a] rounded-[2.5rem] overflow-hidden border-[6px] border-[#1e293b] relative shadow-[0_25px_80px_rgba(0,0,0,0.5)]">
            {/* Professional Sidebar */}
            <div className="w-85 bg-[#1e293b]/50 backdrop-blur-3xl border-r border-white/5 z-20 flex flex-col hidden lg:flex">
                <div className="p-8 border-b border-white/5 bg-gradient-to-br from-blue-600/20 to-transparent">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-600 rounded-[1.2rem] shadow-2xl ring-4 ring-blue-600/15">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter leading-tight">Master Console</h2>
                            <p className="text-[10px] text-blue-400/80 font-black uppercase tracking-[0.2em]">Fleet Intelligence</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-black/10">
                    {activeTrips.length > 0 ? activeTrips.map(trip => (
                        <div
                            key={trip._id}
                            onClick={() => focusTrip(trip)}
                            className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer group hover:scale-[1.03] active:scale-95 ${selectedTrip?._id === trip._id ? 'bg-blue-600 border-blue-400 shadow-[0_10px_35px_rgba(37,99,235,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl ${selectedTrip?._id === trip._id ? 'bg-white/20' : 'bg-blue-600/10'}`}>
                                    <Bus className={`w-5 h-5 ${selectedTrip?._id === trip._id ? 'text-white' : 'text-blue-500'}`} />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedTrip?._id === trip._id ? 'bg-white/30 text-white' : 'bg-green-500/20 text-green-400'}`}>
                                    LIVE
                                </div>
                            </div>
                            <h3 className={`text-lg font-black ${selectedTrip?._id === trip._id ? 'text-white' : 'text-gray-100'} tracking-tight`}>{trip.vehicle?.plateNumber}</h3>
                            <p className={`text-[10px] font-black ${selectedTrip?._id === trip._id ? 'text-blue-100' : 'text-gray-500'} uppercase tracking-tight mb-5`}>
                                {trip.origin?.city || trip.origin?.stationName} → {trip.destination?.city || trip.destination?.stationName}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTrip?._id === trip._id ? 'text-blue-200' : 'text-gray-600'}`}>Tracking ID: {trip._id.slice(-6)}</span>
                                <ChevronRight className={`w-5 h-5 ${selectedTrip?._id === trip._id ? 'text-white' : 'text-gray-600'} group-hover:translate-x-1.5 transition-transform`} />
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-28 opacity-40">
                            <Navigation className="w-16 h-16 text-gray-700 mx-auto mb-5 animate-pulse" />
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Awaiting Telemetry</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-black/40">
                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                        <span>Active Fleet Nodes</span>
                        <span className={`${stats.online ? 'text-green-400' : 'text-red-400'}`}>{stats.count} ACTIVE</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div
                            className="bg-blue-600 h-full rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] transition-all duration-1000"
                            style={{ width: `${Math.min(stats.count * 10, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <div ref={mapRef} className="w-full h-full z-0" style={{ background: '#0f172a' }} />

                {/* Advanced Controls */}
                <div className="absolute top-8 right-8 z-10 flex flex-col gap-5">
                    <button onClick={handleLocateMe} className="w-14 h-14 bg-white/90 backdrop-blur-xl text-gray-900 rounded-2xl shadow-3xl transition-all hover:scale-110 active:scale-90 border-2 border-white flex items-center justify-center group">
                        <Crosshair className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
                    </button>
                    <button onClick={fitAll} className="w-14 h-14 bg-white/90 backdrop-blur-xl text-gray-900 rounded-2xl shadow-3xl transition-all hover:scale-110 active:scale-90 border-2 border-white flex items-center justify-center group">
                        <ZoomIn className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
                    </button>
                    <button onClick={() => setMapType(t => t === 'street' ? 'satellite' : 'street')} className={`w-14 h-14 ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-900'} backdrop-blur-xl rounded-2xl shadow-3xl transition-all hover:scale-110 active:scale-90 border-2 border-white flex items-center justify-center group`}>
                        <Layers className={`w-6 h-6 ${mapType === 'satellite' ? '' : 'group-hover:text-blue-600'} transition-colors`} />
                    </button>
                </div>

                {/* Distance Information Popup */}
                {distanceInfo && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-none">
                        <div className="bg-[#0f172a]/95 backdrop-blur-2xl px-6 py-3 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] inline-flex items-center gap-5 pointer-events-auto ring-1 ring-white/5">
                            <div className="p-2.5 bg-red-500/20 rounded-2xl text-red-400">
                                <MapPin className="w-5 h-5" />
                            </div>
                            {distanceInfo.msg ? (
                                <div>
                                    <p className="text-xs font-black text-white">{distanceInfo.msg}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Target Assessment</p>
                                    <div className="flex gap-4 items-baseline">
                                        <p className="text-xl font-black text-white">{distanceInfo.distance} <span className="text-[10px] text-gray-500 uppercase tracking-widest">km</span></p>
                                        <p className="text-sm font-black text-blue-400 uppercase tracking-widest">{distanceInfo.direction}</p>
                                    </div>
                                </div>
                            )}
                            <button onClick={() => { setDestination(null); setDistanceInfo(null); }} className="ml-2 w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Status Dashboard */}
                <div className="absolute bottom-12 left-12 right-12 lg:right-auto z-10 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-3xl px-12 py-7 rounded-[3rem] border border-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.7)] inline-flex items-center gap-16 pointer-events-auto ring-1 ring-white/10">
                        <div className="flex items-center gap-5">
                            <div className={`w-5 h-5 rounded-full ${stats.online ? 'bg-green-500 shadow-[0_0_25px_rgba(34,197,94,1)] animate-pulse' : 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,1)]'}`}></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] leading-none mb-2">Network Status</p>
                                <p className="text-[13px] font-black text-white tracking-widest uppercase">{stats.online ? 'Interlink Active' : 'Uplink Failed'}</p>
                            </div>
                        </div>
                        <div className="w-px h-12 bg-white/10"></div>
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.4)]">
                                <Bus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] leading-none mb-2">Fleet Count</p>
                                <p className="text-[13px] font-black text-white tracking-widest uppercase">{stats.count} Transports</p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="absolute inset-0 z-50 bg-[#0f172a] flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-28 h-28 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-10 shadow-[0_0_60px_rgba(37,99,235,0.5)]"></div>
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] mb-2">Establishing Link</h2>
                            <p className="text-blue-500/50 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">Scanning Meneharia Satellite Array...</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .leaflet-tile { filter: brightness(0.65) invert(1) contrast(1.2) hue-rotate(200deg) saturate(0.6) brightness(0.85); }
                .bus-node { transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1); filter: drop-shadow(0 0 15px rgba(37,99,235,0.5)); }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .leaflet-popup-content-wrapper { background: rgba(15, 23, 42, 0.85) !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 2rem !important; backdrop-filter: blur(15px); padding: 0 !important; }
                .leaflet-popup-tip { background: rgba(15, 23, 42, 0.85) !important; }
                .leaflet-container { font-family: inherit !important; }
            `}</style>
        </div>
    );
};

export default LiveMap;
