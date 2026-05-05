import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  TruckIcon as TruckSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';

const DriverDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);

  // Get current hour for dynamic greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return t('good_morning');
    if (currentHour < 17) return t('good_afternoon');
    return t('good_evening');
  };

  // Fetch driver's trips
  const { data: tripsData, isLoading: tripsLoading, refetch: refetchTrips } = useQuery({
    queryKey: ['driverTrips', selectedDate],
    queryFn: async () => {
      try {
        console.log('Fetching trips for driver:', user?._id);
        console.log('Selected date:', selectedDate);

        // Get all trips for this driver
        const response = await api.get('/api/trip', {
          params: {
            driverID: user?._id
          }
        });

        console.log('API Response:', response.data);

        // Extract trips from response
        let allTrips = [];
        if (response.data?.data) {
          allTrips = response.data.data;
        } else if (response.data?.trips) {
          allTrips = response.data.trips;
        } else if (Array.isArray(response.data)) {
          allTrips = response.data;
        }

        console.log('All trips fetched:', allTrips.length);

        // Log each trip for debugging
        allTrips.forEach((trip, index) => {
          console.log(`Trip ${index + 1}:`, {
            id: trip._id,
            departureTime: trip.departureTime,
            localDate: new Date(trip.departureTime).toLocaleDateString('en-CA')
          });
        });

        // FIXED: Filter trips by comparing dates properly
        const filteredTrips = allTrips.filter(trip => {
          if (!trip.departureTime) return false;

          // Create date objects for comparison
          const tripDate = new Date(trip.departureTime);
          const selectedDateObj = new Date(selectedDate + 'T00:00:00');

          // Compare year, month, and day only (ignore time)
          return tripDate.getUTCFullYear() === selectedDateObj.getUTCFullYear() &&
            tripDate.getUTCMonth() === selectedDateObj.getUTCMonth() &&
            tripDate.getUTCDate() === selectedDateObj.getUTCDate();
        });

        console.log('Filtered trips for date:', filteredTrips.length);

        return filteredTrips;

      } catch (error) {
        console.error('Error fetching trips:', error);
        toast.error('Failed to fetch trips');
        return [];
      }
    },
    enabled: !!user?._id
  });

  // Update trip status mutation
  const updateTripStatusMutation = useMutation({
    mutationFn: async ({ tripId, status }) => {
      const response = await api.patch(`/api/trip/${tripId}/status`, { status });
      return response.data;
    },
    onMutate: async ({ tripId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['driverTrips', selectedDate] });

      // Snapshot the previous value
      const previousTrips = queryClient.getQueryData(['driverTrips', selectedDate]);

      // Optimistically update to the new value
      if (previousTrips) {
        queryClient.setQueryData(['driverTrips', selectedDate], (old) =>
          old.map((t) => (t._id === tripId ? { ...t, tripStatus: status } : t))
        );
      }

      // Return a context object with the snapshotted value
      return { previousTrips };
    },
    onError: (error, variables, context) => {
      // Rollback to the previous value if mutation fails
      if (context?.previousTrips) {
        queryClient.setQueryData(['driverTrips', selectedDate], context.previousTrips);
      }
      toast.error(error.response?.data?.message || 'Failed to update trip status');
    },
    onSuccess: () => {
      toast.success('Trip status updated successfully');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we are in sync with server
      queryClient.invalidateQueries(['driverTrips', selectedDate]);
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchTrips();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleStatusChange = (tripId, newStatus) => {
    if (!tripId) {
      toast.error('Invalid trip ID');
      return;
    }
    updateTripStatusMutation.mutate({ tripId, status: newStatus });
  };

  const handleViewTrip = (tripId) => {
    console.log('Navigating to trip with ID:', tripId);
    if (tripId) {
      navigate(`/driver/trip/${tripId}`);
    } else {
      toast.error('Cannot view trip: Invalid trip ID');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: {
        lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: ClockIcon,
        label: t('scheduled')
      },
      boarding: {
        lightColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: UserGroupIcon,
        label: t('boarding')
      },
      ongoing: {
        lightColor: 'bg-green-50 text-green-700 border-green-200',
        icon: TruckIcon,
        label: t('ongoing')
      },
      completed: {
        lightColor: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: CheckCircleIcon,
        label: t('completed')
      },
      cancelled: {
        lightColor: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircleIcon,
        label: t('cancelled')
      },
      delayed: {
        lightColor: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: ExclamationTriangleIcon,
        label: t('delayed')
      }
    };
    return statusConfig[status] || statusConfig.scheduled;
  };

  // Use trips from the main query
  const schedule = tripsData || [];

  // Calculate statistics
  const todayTrips = schedule.filter(t => t.tripStatus !== 'cancelled').length;
  const completedToday = schedule.filter(t => t.tripStatus === 'completed').length;
  const ongoingNow = schedule.filter(t => t.tripStatus === 'ongoing').length;
  const boardingNow = schedule.filter(t => t.tripStatus === 'boarding').length;
  const totalPassengersToday = schedule.reduce((acc, trip) =>
    acc + (trip.totalSeats - trip.availableSeats), 0
  );

  const nextTrip = schedule
    .filter(t => ['scheduled', 'boarding'].includes(t.tripStatus))
    .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))[0];

  const completionRate = todayTrips > 0 ? Math.round((completedToday / todayTrips) * 100) : 0;

  // Loading state
  if (tripsLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className="text-center">
          <div className="relative">
            <div className={`animate-spin rounded-full h-24 w-24 border-4 ${isDark ? 'border-gray-800 border-t-blue-500' : 'border-blue-200 border-t-blue-600'} mx-auto`}></div>
            <TruckSolidIcon className={`h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <p className={`mt-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800/80' : 'glass'} backdrop-blur-md shadow-lg sticky top-0 z-20 border-b ${isDark ? 'border-white/5' : 'border-white/20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg">
                <TruckSolidIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Driver'}!
                </h1>
                <p className={`text-sm flex items-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <SparklesIcon className="h-4 w-4 mr-1 text-yellow-500" />
                  {t('overview_for')} {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
              >
                <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
              <div className={`flex items-center space-x-2 backdrop-blur-sm px-4 py-2 rounded-xl border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white/80 border-gray-200'
                }`}>
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`bg-transparent border-none focus:outline-none text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <div className={`${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-white/70 border-white/20'} backdrop-blur-xl rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border glass-card`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('todays_trips')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{todayTrips}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${todayTrips > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {todayTrips} active
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('ongoing')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{ongoingNow}</p>
                <p className="text-xs text-gray-500 mt-2">{t('currently_on_road')}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl shadow-lg">
                <TruckSolidIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('boarding')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{boardingNow}</p>
                <p className="text-xs text-gray-500 mt-2">{t('ready_to_depart')}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-amber-500 p-4 rounded-2xl shadow-lg">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('completed')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{completedToday}</p>
                <p className="text-xs text-gray-500 mt-2">{completionRate}% {t('success')}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('passengers')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalPassengersToday}</p>
                <p className="text-xs text-gray-500 mt-2">{t('todays_total')}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-2xl shadow-lg">
                <UserGroupSolidIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Next Trip Banner */}
        {nextTrip && nextTrip._id && (
          <div className="mb-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <ClockIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-100">{t('next_trip_banner')}</p>
                  <h3 className="text-xl font-bold">
                    {nextTrip.origin?.stationName || t('na')} → {nextTrip.destination?.stationName || t('na')}
                  </h3>
                  <p className="text-amber-100">
                    {nextTrip.departureTime ? `${t('departs_at')} ${format(new Date(nextTrip.departureTime), 'hh:mm a')}` : t('time_tbd')} •
                    {nextTrip.totalSeats - nextTrip.availableSeats} {t('passengers_booked')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleViewTrip(nextTrip._id)}
                className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors shadow-lg"
              >
                {t('view_details')}
              </button>
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <div className={`${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-white/70 border-white/20'} backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border glass-card`}>
          <div className={`px-6 py-5 border-b ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {t('todays_schedule')}
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {schedule.length} {schedule.length === 1 ? t('trip') : t('trips')}
                </span>
              </div>
              <button
                onClick={() => navigate('/driver/trips')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                View All
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>

          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
            {schedule.length > 0 ? (
              schedule.map((trip) => {
                if (!trip || !trip._id) return null;

                const StatusIcon = getStatusBadge(trip.tripStatus).icon;
                const isNextTrip = nextTrip?._id === trip._id;

                return (
                  <div
                    key={trip._id}
                    className={`p-6 transition-all duration-200 cursor-pointer group relative
                      ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                      ${isNextTrip ? (isDark ? 'bg-amber-900/20' : 'bg-amber-50/30') : ''}`}
                    onClick={() => {
                      console.log('Clicked trip with ID:', trip._id);
                      handleViewTrip(trip._id);
                    }}
                  >
                    {isNextTrip && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500"></div>
                    )}

                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusBadge(trip.tripStatus).lightColor} border`}>
                            <div className="flex items-center space-x-1">
                              <StatusIcon className="h-3 w-3" />
                              <span>{getStatusBadge(trip.tripStatus).label}</span>
                            </div>
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            #{trip.tripNumber || 'N/A'}
                          </span>
                          {trip.tripStatus === 'delayed' && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                              ⚠ Delayed
                            </span>
                          )}
                          {isNextTrip && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                              ⭐ Next
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                <MapPinIcon className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{t('from')}</p>
                                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{trip.origin?.stationName || t('na')}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                <MapPinIcon className="h-3 w-3 text-red-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{t('to')}</p>
                                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{trip.destination?.stationName || t('na')}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <ClockIcon className="h-3 w-3 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{t('departure')}</p>
                                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {trip.departureTime ? format(new Date(trip.departureTime), 'hh:mm a') : t('na')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                                <UserGroupIcon className="h-3 w-3 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{t('seats')}</p>
                                <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {trip.totalSeats - trip.availableSeats}/{trip.totalSeats} {t('filled')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Update Buttons */}
                        <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {trip.tripStatus === 'scheduled' && (
                            <button
                              onClick={() => handleStatusChange(trip._id, 'boarding')}
                              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              <div className="flex items-center space-x-2">
                                <UserGroupIcon className="h-4 w-4" />
                                <span>{t('start_boarding')}</span>
                              </div>
                            </button>
                          )}
                          {trip.tripStatus === 'boarding' && (
                            <button
                              onClick={() => handleStatusChange(trip._id, 'ongoing')}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              <div className="flex items-center space-x-2">
                                <TruckIcon className="h-4 w-4" />
                                <span>{t('start_trip')}</span>
                              </div>
                            </button>
                          )}
                          {trip.tripStatus === 'ongoing' && (
                            <button
                              onClick={() => handleStatusChange(trip._id, 'completed')}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-4 w-4" />
                                <span>{t('complete_trip')}</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>

                      <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors group-hover:translate-x-1 transform duration-200" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gradient-to-br from-gray-100 to-gray-200'} rounded-full w-24 h-24 mx-auto flex items-center justify-center`}>
                  <CalendarIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className={`mt-4 text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>No trips scheduled</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You have no trips assigned for {format(new Date(selectedDate), 'MMMM d, yyyy')}.
                </p>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Go to Today
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/driver/trips')}
            className={`flex-1 min-w-[150px] px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center border ${isDark ? 'bg-gray-800 text-blue-400 border-white/10 hover:bg-gray-700' : 'bg-white text-blue-600 border-gray-200 hover:bg-blue-50'
              }`}
          >
            <TruckIcon className="h-5 w-5 mr-2" />
            {t('all_trips')}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className={`flex-1 min-w-[150px] px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center border ${isDark ? 'bg-gray-800 text-pink-400 border-white/10 hover:bg-gray-700' : 'bg-white text-pink-600 border-gray-200 hover:bg-pink-50'
              }`}
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            {t('profile')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;