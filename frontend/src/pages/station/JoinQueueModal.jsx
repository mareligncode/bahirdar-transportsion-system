import React, { useState, useEffect } from 'react';
import { X, Search, Car, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

const JoinQueueModal = ({ isOpen, onClose, stationID, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedRoute, setSelectedRoute] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && stationID) {
            fetchData();
        }
    }, [isOpen, stationID]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vRes, rRes] = await Promise.all([
                api.get('/api/vehicles'), // Backend filters by station for admin
                api.get(`/api/route?origin=${stationID}`)
            ]);

            if (vRes.data.success) {
                // Filter for available vehicles
                const available = (vRes.data.data.vehicles || vRes.data.data || []).filter(
                    v => v.currentStatus === 'available' || v.currentStatus === 'active'
                );
                setVehicles(available);
            }

            if (rRes.data.success) {
                setRoutes(rRes.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching data for queue:', error);
            toast.error(t('failed_loading_vehicles_routes', 'Failed to load vehicles or routes'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVehicle || !selectedRoute) {
            toast.error(t('select_vehicle_and_route', 'Please select both a vehicle and a route'));
            return;
        }

        setSubmitting(true);
        try {
            const vehicle = vehicles.find(v => v._id === selectedVehicle);
            const route = routes.find(r => r._id === selectedRoute);

            const response = await api.post('/api/queue/join', {
                stationID,
                vehicleID: selectedVehicle,
                driverID: vehicle.driverID?._id || vehicle.driverID,
                routeID: selectedRoute,
                destinationID: route.destination._id || route.destination
            });

            if (response.data.success) {
                toast.success(t('vehicle_added_to_queue', 'Vehicle added to queue successfully'));
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error joining queue:', error);
            toast.error(error.response?.data?.message || t('failed_to_join_queue', 'Failed to join queue'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">{t('add_vehicle_to_queue', 'Add Vehicle to Queue')}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">{t('loading_available_vehicles', 'Loading available vehicles...')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Car className="w-4 h-4" /> {t('select_vehicle', 'Select Vehicle')}
                                </label>
                                <select
                                    value={selectedVehicle}
                                    onChange={(e) => setSelectedVehicle(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                >
                                    <option value="">-- {t('choose_a_vehicle', 'Choose a vehicle')} --</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>
                                            {v.plateNumber} ({v.carType}) - {t('driver', 'Driver')}: {v.driverID?.fullName || t('na', 'N/A')}
                                        </option>
                                    ))}
                                </select>
                                {vehicles.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1 italic">{t('no_available_vehicles_station', 'No available vehicles found at this station.')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {t('select_route', 'Select Route')}
                                </label>
                                <select
                                    value={selectedRoute}
                                    onChange={(e) => setSelectedRoute(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                >
                                    <option value="">-- {t('choose_a_route', 'Choose a route')} --</option>
                                    {routes.map(r => (
                                        <option key={r._id} value={r._id}>
                                            {r.routeName} (ETB {r.basePrice})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            >
                                {t('cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || vehicles.length === 0}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('join_queue', 'Join Queue')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default JoinQueueModal;
