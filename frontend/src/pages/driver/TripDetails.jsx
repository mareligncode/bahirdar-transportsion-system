import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  TruckIcon as TruckSolidIcon
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import api from '../../services/api';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

const TripDetails = () => {
  const params = useParams();
  const { tripId } = params;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');

  // CRITICAL DEBUGGING - Check what's coming from the URL
  useEffect(() => {
    console.log('🔍 ===== TRIP DETAILS DEBUG ====');
    console.log('🔍 Full params object:', params);
    console.log('🔍 tripId from useParams:', tripId);
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Pathname:', window.location.pathname);
    console.log('🔍 ============================');
  }, [tripId, params]);

  // If no tripId, show error with more info
  if (!tripId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip ID Missing</h2>
          <p className="text-gray-600 mb-4">
            The trip ID is missing from the URL.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm font-mono break-all">
              Current URL: {window.location.href}
            </p>
            <p className="text-sm font-mono mt-2">
              Path: {window.location.pathname}
            </p>
          </div>
          <button
            onClick={() => navigate('/driver/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (tripId === ':tripId') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Trip ID Format</h2>
          <p className="text-gray-600 mb-4">
            The trip ID in the URL is still showing as ":tripId" which means it wasn't replaced with an actual ID.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm font-mono break-all">
              Current URL: {window.location.href}
            </p>
            <p className="text-sm font-mono mt-2">
              tripId value: "{tripId}"
            </p>
          </div>
          <button
            onClick={() => navigate('/driver/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fetch trip details
  const { data: tripData, isLoading, error, refetch } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      console.log('📡 Fetching trip details for ID:', tripId);

      try {
        const response = await api.get(`/api/trip/${tripId}`);
        console.log('✅ Trip API Response:', response.data);

        // Handle different response structures
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        if (response.data?.data) {
          return response.data.data;
        }
        return response.data;

      } catch (error) {
        console.error('❌ Error fetching trip:', error.response || error);
        throw error;
      }
    },
    enabled: !!tripId && tripId !== ':tripId',
    retry: 1
  });

  // Fetch passengers for this trip
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['tripBookings', tripId],
    queryFn: async () => {
      console.log('📡 Fetching bookings for trip:', tripId);

      try {
        const response = await api.get(`/api/booking/trip/${tripId}`);
        console.log('✅ Bookings API Response:', response.data);

        // Handle different response structures
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        if (response.data?.data) {
          return response.data.data;
        }
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data?.bookings) {
          return response.data.bookings;
        }
        return [];

      } catch (error) {
        console.error('❌ Error fetching bookings:', error.response || error);
        return [];
      }
    },
    enabled: !!tripId && tripId !== ':tripId'
  });

  // Real-time GPS Tracking Logic for Drivers
  useEffect(() => {
    if (!tripId || tripData?.tripStatus !== 'ongoing') return;

    console.log('🛰 Starting GPS Broadcasting for Trip:', tripId);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('update-location', {
          tripId,
          latitude,
          longitude,
          timestamp: new Date()
        });
      },
      (error) => console.error('GPS Error:', error),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      console.log('🛰 Stopping GPS Broadcasting');
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tripId, tripData?.tripStatus]);

  // Update trip status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      console.log('📤 Updating trip status:', { tripId, status });

      const response = await api.patch(`/api/trip/${tripId}/status`, { status });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Status update success:', data);
      queryClient.invalidateQueries(['trip', tripId]);
      toast.success('Trip status updated successfully');
    },
    onError: (error) => {
      console.error('❌ Status update error:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update status';
      toast.error(errorMessage);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <TruckSolidIcon className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Trip</h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Failed to load trip details. Please try again.'}
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/driver/dashboard')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-4">The requested trip could not be found in the database.</p>
          <button
            onClick={() => navigate('/driver/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const trip = tripData;
  const bookings = bookingsData || [];

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' },
      boarding: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Boarding' },
      ongoing: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ongoing' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      delayed: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Delayed' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return `${config.bg} ${config.text}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Scheduled',
      boarding: 'Boarding',
      ongoing: 'Ongoing',
      completed: 'Completed',
      cancelled: 'Cancelled',
      delayed: 'Delayed'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'hh:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Go back"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Trip #{trip?.tripNumber || 'Details'}
                </h1>
                <p className="text-sm text-gray-600">
                  {trip?.origin?.stationName || 'N/A'} → {trip?.destination?.stationName || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadge(trip?.tripStatus)}`}>
                {getStatusLabel(trip?.tripStatus)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['details', 'passengers', 'vehicle'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab === 'passengers' ? `Passengers (${bookings.length})` : tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Trip Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Origin</p>
                        <p className="text-base font-semibold text-gray-900">
                          {trip?.origin?.stationName || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">{trip?.origin?.city || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Destination</p>
                        <p className="text-base font-semibold text-gray-900">
                          {trip?.destination?.stationName || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">{trip?.destination?.city || ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Departure</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formatDate(trip?.departureTime)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(trip?.departureTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <ClockIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Arrival</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formatDate(trip?.arrivalTime)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(trip?.arrivalTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-500">Duration</p>
                    <p className="text-xl font-bold text-gray-900">
                      {trip?.estimatedDuration || 0} min
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-xl font-bold text-gray-900">
                      ETB {trip?.price?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-500">Available Seats</p>
                    <p className="text-xl font-bold text-gray-900">
                      {trip?.availableSeats || 0}/{trip?.totalSeats || 0}
                    </p>
                  </div>
                </div>

                {trip?.notes && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">{trip.notes}</p>
                  </div>
                )}

                {/* Status Update Buttons */}
                <div className="mt-8 flex flex-wrap gap-3">
                  {trip?.tripStatus === 'scheduled' && (
                    <button
                      onClick={() => updateStatusMutation.mutate('boarding')}
                      disabled={updateStatusMutation.isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                    >
                      {updateStatusMutation.isLoading ? 'Updating...' : 'Start Boarding'}
                    </button>
                  )}
                  {trip?.tripStatus === 'boarding' && (
                    <button
                      onClick={() => updateStatusMutation.mutate('ongoing')}
                      disabled={updateStatusMutation.isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                    >
                      {updateStatusMutation.isLoading ? 'Updating...' : 'Start Trip'}
                    </button>
                  )}
                  {trip?.tripStatus === 'ongoing' && (
                    <button
                      onClick={() => updateStatusMutation.mutate('completed')}
                      disabled={updateStatusMutation.isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                    >
                      {updateStatusMutation.isLoading ? 'Updating...' : 'Complete Trip'}
                    </button>
                  )}
                  {trip?.tripStatus === 'delayed' && (
                    <button
                      onClick={() => updateStatusMutation.mutate('boarding')}
                      disabled={updateStatusMutation.isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                    >
                      {updateStatusMutation.isLoading ? 'Updating...' : 'Resume Trip'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('passengers')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  >
                    <UserGroupIcon className="h-4 w-4 mr-3 text-gray-400" />
                    View Passenger List ({bookings.length})
                  </button>
                  <button
                    onClick={() => navigate('/driver/trips')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  >
                    <TruckIcon className="h-4 w-4 mr-3 text-gray-400" />
                    View All Trips
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'passengers' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600">
              <h2 className="text-lg font-semibold text-white">
                Passenger List ({bookings.length})
              </h2>
            </div>

            {bookingsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading passengers...</p>
              </div>
            ) : bookings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <div key={booking._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <div className="bg-blue-100 p-1.5 rounded-full">
                            <UserIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-900">
                            {booking.passengerID?.fullName || 'N/A'}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Seat #{booking.seatNumber}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking.checkedIn
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {booking.checkedIn ? '✓ Checked In' : '⏳ Not Checked In'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-7">
                          <div className="flex items-center text-sm">
                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600">{booking.passengerID?.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 truncate">{booking.passengerID?.email || 'N/A'}</span>
                          </div>
                          {booking.checkedInAt && (
                            <div className="flex items-center text-sm">
                              <ClockIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600">Checked in: {formatTime(booking.checkedInAt)}</span>
                            </div>
                          )}
                        </div>

                        {booking.specialRequests && (
                          <div className="mt-3 ml-7 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              <span className="font-medium">Note:</span> {booking.specialRequests}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                  <UserGroupIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Passengers Yet</h3>
                <p className="text-gray-500">No bookings have been made for this trip.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Vehicle Information</h2>

            {trip?.vehicle ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  {trip.vehicle.images && trip.vehicle.images.length > 0 ? (
                    <img
                      src={trip.vehicle.images.find(img => img.isPrimary)?.url || trip.vehicle.images[0].url}
                      alt={trip.vehicle.plateNumber}
                      className="w-full h-64 object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                      <TruckIcon className="h-20 w-20 text-gray-400" />
                    </div>
                  )}

                  {trip.vehicle.images && trip.vehicle.images.length > 1 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {trip.vehicle.images.slice(0, 4).map((image, idx) => (
                        <img
                          key={idx}
                          src={image.url}
                          alt={`${trip.vehicle.plateNumber} - ${idx + 1}`}
                          className="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Plate Number</p>
                      <p className="text-lg font-bold text-gray-900">{trip.vehicle.plateNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Type</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{trip.vehicle.carType || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Make/Model</p>
                      <p className="text-lg font-bold text-gray-900">
                        {trip.vehicle.make || 'N/A'} {trip.vehicle.model || ''}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Year</p>
                      <p className="text-lg font-bold text-gray-900">{trip.vehicle.year || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Color</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{trip.vehicle.color || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Capacity</p>
                      <p className="text-lg font-bold text-gray-900">{trip.vehicle.totalCapacity || 0} seats</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Fuel Type</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{trip.vehicle.fuelType || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Insurance</p>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${trip.vehicle.insuranceExpiry && new Date(trip.vehicle.insuranceExpiry) > new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {trip.vehicle.insuranceExpiry && new Date(trip.vehicle.insuranceExpiry) > new Date()
                          ? `Valid until ${format(new Date(trip.vehicle.insuranceExpiry), 'MMM d, yyyy')}`
                          : 'Expired'}
                      </span>
                    </div>
                  </div>

                  {trip.vehicle.features && trip.vehicle.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Features</p>
                      <div className="flex flex-wrap gap-2">
                        {trip.vehicle.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TruckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No vehicle information available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetails;