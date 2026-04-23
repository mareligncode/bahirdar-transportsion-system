import React, { useState, useEffect, useCallback } from 'react';
import {
    Car,
    MapPin,
    Clock,
    RefreshCw,
    LogOut,
    LogIn,
    AlertTriangle,
    Trophy,
    CheckCircle,
    Timer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const DriverQueue = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [inQueue, setInQueue] = useState(false);
    const [queueID, setQueueID] = useState(null);
    const [position, setPosition] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [vehicle, setVehicle] = useState(null);
    const [activeQueue, setActiveQueue] = useState(null);

    const fetchRoutes = useCallback(async () => {
        try {
            const response = await api.get('/api/route');
            if (response.data.success) {
                setRoutes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    }, []);

    const checkQueueStatus = useCallback(async (showToast = false) => {
        if (!user?._id) return;

        try {
            if (showToast) setRefreshing(true);

            const response = await api.get('/api/queue/my-status');

            if (response.data.success) {
                if (response.data.inQueue) {
                    const entry = response.data.data;
                    setInQueue(true);
                    setQueueID(entry._id);
                    setPosition(entry.queuePosition);
                    setActiveQueue(entry);
                    // Update selectedRoute to reflect the current queue route
                    setSelectedRoute(entry.route?._id || entry.route);
                } else {
                    setInQueue(false);
                    setQueueID(null);
                    setPosition(null);
                    setActiveQueue(null);
                }
            }
        } catch (error) {
            console.error('Error checking queue status:', error);
            if (showToast) toast.error('Failed to update status');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?._id]);

    const fetchVehicle = useCallback(async () => {
        try {
            const response = await api.get('/api/vehicles/my-vehicle');
            if (response.data.success) {
                setVehicle(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching vehicle:', error);
        }
    }, []);

    useEffect(() => {
        fetchRoutes();
        fetchVehicle();
        checkQueueStatus();

        const interval = setInterval(() => checkQueueStatus(), 15000);
        return () => clearInterval(interval);
    }, [fetchRoutes, fetchVehicle, checkQueueStatus]);

    const handleJoinQueue = async () => {
        if (!selectedRoute) {
            toast.error('Please select a route');
            return;
        }

        const route = routes.find(r => r._id === selectedRoute);
        const originID = route?.origin?._id || route?.origin;
        const destinationID = route?.destination?._id || route?.destination;

        try {
            const response = await api.post('/api/queue/join', {
                stationID: originID,
                routeID: selectedRoute,
                destinationID: destinationID,
                vehicleID: vehicle?._id,
                driverID: user?._id
            });

            if (response.data.success) {
                toast.success('Successfully joined the queue!');
                checkQueueStatus();
            }
        } catch (error) {
            console.error('Error joining queue:', error);
            toast.error(error.response?.data?.message || 'Failed to join queue');
        }
    };

    const handleLeaveQueue = async () => {
        if (!window.confirm('Are you sure you want to leave the queue? You will lose your position!')) return;

        try {
            const response = await api.post(`/api/queue/leave/${queueID}`);
            if (response.data.success) {
                toast.success('You have left the queue');
                setInQueue(false);
                setPosition(null);
                checkQueueStatus();
            }
        } catch (error) {
            console.error('Error leaving queue:', error);
            toast.error('Failed to leave queue');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Vehicle Queue</h1>
                <p className="text-gray-600">Manage your position in the station queue to receive your next trip</p>
            </div>

            {!vehicle && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-600 w-6 h-6" />
                        <div>
                            <p className="font-bold text-red-900">No Vehicle Assigned</p>
                            <p className="text-red-700 text-sm">You must have an active vehicle assigned to your profile to join the queue.</p>
                        </div>
                    </div>
                </div>
            )}

            {inQueue ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <p className="text-blue-100 font-medium uppercase tracking-wider text-sm mb-2">Current Position</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-8xl font-black">{position}</h2>
                                <p className="text-2xl font-bold text-blue-200">of many</p>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <MapPin className="w-5 h-5 text-blue-300" />
                                    <span className="font-medium">
                                        {activeQueue?.station?.stationName || 'Loading...'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <Car className="w-5 h-5 text-blue-300" />
                                    <span className="font-medium">{vehicle?.plateNumber} ({vehicle?.carType})</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                                <button
                                    onClick={() => checkQueueStatus(true)}
                                    disabled={refreshing}
                                    className="flex items-center gap-2 text-sm font-bold text-blue-100 hover:text-white transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh Status
                                </button>

                                <button
                                    onClick={handleLeaveQueue}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 border border-red-500/30 rounded-lg text-sm font-bold transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Leave Queue
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                    <Timer className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Estimated Dispatch</h3>
                                    <p className="text-sm text-gray-500">Based on current station traffic</p>
                                </div>
                            </div>

                            <div className="text-3xl font-black text-gray-800 mb-2">~{position * 8} min</div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-1000"
                                    style={{ width: `${Math.max(5, 100 - (position * 10))}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 italic">Values are estimates and can change based on passenger demand.</p>
                        </div>

                        {position === 1 && (
                            <div className="bg-green-600 rounded-2xl p-6 text-white shadow-lg animate-bounce">
                                <div className="flex items-center gap-4">
                                    <Trophy className="w-10 h-10" />
                                    <div>
                                        <h3 className="text-xl font-bold">You're up next!</h3>
                                        <p className="text-green-100 text-sm">Please stay near your vehicle and be ready for dispatch.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                How it works
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li>• You are currently in the live dispatch queue.</li>
                                <li>• Do not leave the station area while in queue.</li>
                                <li>• If you leave the queue, you will lose your position.</li>
                                <li>• The station admin will dispatch you when it's your turn.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/2 p-8 md:p-12">
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl w-fit mb-6">
                                <Car className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to work?</h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Join the station queue to be assigned your next trip. Your vehicle must be in 'Available' status and you must be present at the station.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Your Route</label>
                                    <select
                                        value={selectedRoute}
                                        onChange={(e) => setSelectedRoute(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    >
                                        <option value="">-- Choose a route and destination --</option>
                                        {routes.map(route => (
                                            <option key={route._id} value={route._id}>
                                                {route.origin?.stationName} → {route.destination?.stationName} (ETB {route.basePrice})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleJoinQueue}
                                    disabled={!vehicle || !selectedRoute}
                                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-200 transition-all active:scale-95 mt-4"
                                >
                                    <LogIn className="w-5 h-5" />
                                    Join Vehicle Queue
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 bg-gray-50 p-8 md:p-12 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100">
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex-shrink-0 shadow-sm flex items-center justify-center font-bold text-blue-600">1</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Join Station</h4>
                                        <p className="text-sm text-gray-500 mt-1">Select the meneharia (station) where you are currently located.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex-shrink-0 shadow-sm flex items-center justify-center font-bold text-blue-600">2</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Wait for turn</h4>
                                        <p className="text-sm text-gray-500 mt-1">Track your live position. Rest or prepare your vehicle while you wait.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex-shrink-0 shadow-sm flex items-center justify-center font-bold text-blue-600">3</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Go on Trip</h4>
                                        <p className="text-sm text-gray-500 mt-1">When your position hits #1, you will be assigned the next available trip.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverQueue;
