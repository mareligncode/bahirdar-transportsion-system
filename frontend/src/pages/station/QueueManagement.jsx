import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Car,
    ArrowRight,
    Clock,
    RefreshCw,
    MoveUp,
    MoveDown,
    UserCheck,
    AlertCircle,
    Search,
    CheckCircle2,
    Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import JoinQueueModal from './JoinQueueModal';

const QueueManagement = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [queue, setQueue] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [stationInfo, setStationInfo] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [showJoinModal, setShowJoinModal] = useState(false);

    const fetchQueue = useCallback(async (showToast = false) => {
        if (!user?.stationID) return;

        try {
            if (showToast) setRefreshing(true);

            // Build query params
            let url = `/api/queue/station/${user.stationID}`;
            if (selectedRoute !== 'all') {
                const route = routes.find(r => r._id === selectedRoute);
                if (route) {
                    url += `?destinationID=${route.destination._id || route.destination}`;
                }
            }

            const response = await api.get(url);
            if (response.data.success) {
                setQueue(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching queue:', error);
            toast.error('Failed to fetch queue data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.stationID, selectedRoute, routes]);

    const fetchStation = useCallback(async () => {
        if (!user?.stationID) return;
        try {
            const response = await api.get(`/api/station/${user.stationID}`);
            if (response.data.success) {
                setStationInfo(response.data.station);
            }
        } catch (error) {
            console.error('Error fetching station:', error);
        }
    }, [user?.stationID]);

    const fetchRoutes = useCallback(async () => {
        if (!user?.stationID) return;
        try {
            const response = await api.get(`/api/route?origin=${user.stationID}`);
            if (response.data.success) {
                setRoutes(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    }, [user?.stationID]);

    useEffect(() => {
        fetchQueue();
        fetchStation();
        fetchRoutes();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchQueue(), 30000);
        return () => clearInterval(interval);
    }, [fetchQueue, fetchStation, fetchRoutes]);

    const handleGetNext = async () => {
        try {
            // Build dispatch URL with optional route filter
            let url = `/api/queue/dispatch/${user.stationID}`;
            if (selectedRoute !== 'all') {
                url += `?routeID=${selectedRoute}`;
            }

            const response = await api.post(url);
            if (response.data.success) {
                const trip = response.data.trip;
                toast.success(`Successfully dispatched! Trip ${trip.tripNumber} created.`);
                fetchQueue();
            }
        } catch (error) {
            console.error('Error dispatching next vehicle:', error);
            const errorMsg = error.response?.data?.message || 'No vehicles available in queue';
            toast.error(errorMsg);
        }
    };

    const handleReorder = async (queueID, direction) => {
        // Find current index
        const index = queue.findIndex(q => q._id === queueID);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= queue.length) return;

        try {
            const response = await api.put(`/api/queue/reorder/${queueID}`, { newPosition: newIndex + 1 });
            if (response.data.success) {
                toast.success('Queue reordered');
                fetchQueue();
            }
        } catch (error) {
            console.error('Error reordering queue:', error);
            toast.error('Failed to reorder queue');
        }
    };

    const handleLeaveQueue = async (queueID) => {
        if (!window.confirm('Remove this vehicle from the queue?')) return;

        try {
            const response = await api.post(`/api/queue/leave/${queueID}`);
            if (response.data.success) {
                toast.success('Vehicle removed from queue');
                fetchQueue();
            }
        } catch (error) {
            console.error('Error removing vehicle:', error);
            toast.error('Failed to remove vehicle');
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
                    <p className="text-gray-600">Manage vehicle dispatching for {stationInfo?.stationName || 'your station'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <select
                            value={selectedRoute}
                            onChange={(e) => setSelectedRoute(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none min-w-[180px] cursor-pointer"
                        >
                            <option value="all">All Routes (Wait Order)</option>
                            {routes.map(r => (
                                <option key={r._id} value={r._id}>
                                    {r.routeName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => fetchQueue(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        Add Vehicle to Queue
                    </button>

                    <button
                        onClick={handleGetNext}
                        className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                    >
                        <UserCheck className="w-5 h-5" />
                        Dispatch {selectedRoute === 'all' ? 'Next' : 'Route'} Vehicle
                    </button>
                </div>
            </div>

            <JoinQueueModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                stationID={user?.stationID}
                onSuccess={fetchQueue}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-lg text-white">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">In Queue</p>
                            <p className="text-2xl font-bold text-blue-900">{queue.length}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-600 rounded-lg text-white">
                            <Car className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-green-600 font-medium">Ready for Dispatch</p>
                            <p className="text-2xl font-bold text-green-900">
                                {queue.length > 0 ? (queue[0].vehicle?.plateNumber || queue[0].vehicleID?.plateNumber || 'N/A') : 'None'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-lg text-white">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-indigo-600 font-medium">Average Wait</p>
                            <p className="text-2xl font-bold text-indigo-900">14 min</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Live Vehicle Queue</h2>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Updated just now</span>
                </div>

                {queue.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">The queue is empty</h3>
                        <p className="text-gray-500 mt-1">Vehicles will appear here as they join the station queue.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">Position</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Driver</th>
                                    <th className="px-6 py-4">Joined At</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {queue.map((item, index) => (
                                    <tr key={item._id} className={`hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                {index === 0 && <CheckCircle2 className="w-4 h-4 text-blue-600 animate-pulse" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {item.vehicle?.plateNumber || item.vehicleID?.plateNumber || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    {item.vehicle?.carType || item.vehicleID?.carType || 'Unknown'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs">
                                                    {(item.driver?.fullName || item.driverID?.fullName)?.charAt(0) || 'D'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    {item.driver?.fullName || item.driverID?.fullName || 'Anonymous'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(item.checkInTime || item.joinedAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${index === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {index === 0 ? 'Next Up' : 'Waiting'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleReorder(item._id, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    title="Move Up"
                                                >
                                                    <MoveUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleReorder(item._id, 'down')}
                                                    disabled={index === queue.length - 1}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    title="Move Down"
                                                >
                                                    <MoveDown className="w-4 h-4" />
                                                </button>
                                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                                <button
                                                    onClick={() => handleLeaveQueue(item._id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Remove From Queue"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700 h-fit">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900">Queue Policy Reminder</h4>
                    <p className="text-sm text-amber-700 mt-1">
                        Dispatching a vehicle will automatically change its status to 'On Trip' and notify the driver.
                        Removing a vehicle from the queue will notify the driver of the cancellation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QueueManagement;
