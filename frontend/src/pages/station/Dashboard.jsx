import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';
import {
  CalendarIcon,
  UsersIcon,
  TruckIcon,
  ClockIcon,
  ArrowPathIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  UserIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StationDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isDark = settings.themeMode === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [station, setStation] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalDrivers: 0,
    availableDrivers: 0,
    completedTrips: 0,
    cancelledTrips: 0
  });

  // Data states
  const [recentTrips, setRecentTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Pagination states
  const [routesPage, setRoutesPage] = useState(1);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const itemsPerPage = 3;

  // Helper function to safely extract data from API responses
  const extractData = (response, dataPath = '') => {
    if (!response) return null;

    if (response.data) {
      if (dataPath) {
        const paths = dataPath.split('.');
        let result = response.data;
        for (const path of paths) {
          if (result && result[path] !== undefined) {
            result = result[path];
          } else {
            return null;
          }
        }
        return result;
      }

      if (response.data.data?.users) return response.data.data.users;
      if (response.data.data?.vehicles) return response.data.data.vehicles;
      if (response.data.data?.trips) return response.data.data.trips;
      if (response.data.data && Array.isArray(response.data.data)) return response.data.data;
      if (response.data.users) return response.data.users;
      if (response.data.vehicles) return response.data.vehicles;
      if (response.data.trips) return response.data.trips;
      if (Array.isArray(response.data)) return response.data;

      return response.data;
    }

    return response;
  };

  // Fetch all dashboard data
  const fetchDashboardData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (user?.stationID) {
        try {
          const stationRes = await api.get(`/api/station/${user.stationID}`);
          console.log('Station response:', stationRes.data);

          let stationData = stationRes.data?.station || stationRes.data?.data || stationRes.data;
          setStation(stationData);
        } catch (error) {
          console.error('Error fetching station:', error);
        }
      }

      const [
        tripsRes,
        vehiclesRes,
        stationUsersRes,
        routesRes
      ] = await Promise.allSettled([
        api.get('/api/trip', { params: { limit: 100 } }),
        api.get('/api/vehicles', { params: { limit: 100 } }),
        api.get('/api/auth/station-users'),
        api.get('/api/route')
      ]);

      if (tripsRes.status === 'fulfilled') {
        const tripsData = extractData(tripsRes.value);
        const trips = Array.isArray(tripsData) ? tripsData :
          (tripsData?.trips || tripsData?.data || []);

        console.log('Trips data:', trips);

        const activeTrips = trips.filter(t =>
          t && ['scheduled', 'boarding', 'ongoing'].includes(t.tripStatus)
        ).length;

        const completedTrips = trips.filter(t =>
          t && t.tripStatus === 'completed'
        ).length;

        const cancelledTrips = trips.filter(t =>
          t && t.tripStatus === 'cancelled'
        ).length;

        const sortedTrips = [...trips].sort((a, b) =>
          new Date(b.departureTime || b.createdAt) - new Date(a.departureTime || a.createdAt)
        );

        setRecentTrips(sortedTrips.slice(0, 5));

        setStats(prev => ({
          ...prev,
          totalTrips: trips.length,
          activeTrips,
          completedTrips,
          cancelledTrips
        }));
      }

      if (routesRes.status === 'fulfilled') {
        const routesData = extractData(routesRes.value);
        const allRoutes = Array.isArray(routesData) ? routesData :
          (routesData?.routes || routesData?.data || []);
        console.log('Routes data:', allRoutes);

        let filteredRoutes = allRoutes;
        if (user?.stationID) {
          filteredRoutes = allRoutes.filter(r =>
            (r.origin?._id || r.origin) === user.stationID
          );
        }
        setRoutes(filteredRoutes);
      }

      if (vehiclesRes.status === 'fulfilled') {
        const vehiclesData = extractData(vehiclesRes.value);
        let vehiclesArray = [];

        if (Array.isArray(vehiclesData)) {
          vehiclesArray = vehiclesData;
        } else if (vehiclesData?.vehicles && Array.isArray(vehiclesData.vehicles)) {
          vehiclesArray = vehiclesData.vehicles;
        } else if (vehiclesData?.data && Array.isArray(vehiclesData.data)) {
          vehiclesArray = vehiclesData.data;
        }

        console.log('Vehicles data:', vehiclesArray);
        setVehicles(vehiclesArray);

        const availableVehicles = vehiclesArray.filter(v =>
          v && (v.currentStatus === 'available' || v.currentStatus === 'active')
        ).length;

        setStats(prev => ({
          ...prev,
          totalVehicles: vehiclesArray.length,
          availableVehicles
        }));
      }

      if (stationUsersRes.status === 'fulfilled') {
        const usersData = extractData(stationUsersRes.value);
        let usersArray = [];

        if (Array.isArray(usersData)) {
          usersArray = usersData;
        } else if (usersData?.users && Array.isArray(usersData.users)) {
          usersArray = usersData.users;
        } else if (usersData?.data && Array.isArray(usersData.data)) {
          usersArray = usersData.data;
        }

        console.log('Users data:', usersArray);

        const drivers = usersArray.filter(u => u && u.role === 'driver');
        const activeDrivers = drivers.filter(d => d && d.isActive).length;
        const availableDrivers = drivers.filter(d => d && d.isActive).length;

        setStats(prev => ({
          ...prev,
          totalDrivers: drivers.length,
          activeDrivers,
          availableDrivers
        }));
      }

      if (showRefreshToast) {
        toast.success(t('dashboard_refreshed_successfully'));
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view this dashboard');
        navigate('/unauthorized');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      scheduled: isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800',
      boarding: isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      ongoing: isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800',
      completed: isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-800',
      cancelled: isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800',
      delayed: isDark ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-800',
      active: isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800',
      maintenance: isDark ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-800',
      available: isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800',
      on_trip: isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800',
      inactive: isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-800'
    };
    return colors[status] || (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-800');
  };

  // Pagination functions
  const getPaginatedRoutes = () => {
    const startIndex = (routesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return routes.slice(startIndex, endIndex);
  };

  const getPaginatedVehicles = () => {
    const startIndex = (vehiclesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return vehicles.slice(startIndex, endIndex);
  };

  const totalRoutesPages = Math.ceil(routes.length / itemsPerPage);
  const totalVehiclesPages = Math.ceil(vehicles.length / itemsPerPage);

  const goToRoutesPage = (page) => {
    setRoutesPage(Math.max(1, Math.min(page, totalRoutesPages)));
  };

  const goToVehiclesPage = (page) => {
    setVehiclesPage(Math.max(1, Math.min(page, totalVehiclesPages)));
  };

  // Pagination component - FIXED: Now shows even when there's only 1 page
  const Pagination = ({ currentPage, totalPages, onPageChange, label }) => {
    // Don't hide pagination, always show it when there are items
    if (totalPages === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="First page"
          >
            <ChevronDoubleLeftIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          </button>

          <span className="text-sm text-gray-600 mx-2">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Last page"
          >
            <ChevronDoubleRightIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {t('showing')} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, label === 'routes' ? routes.length : vehicles.length)} {t('of')} {label === 'routes' ? routes.length : vehicles.length}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-6 font-medium`}>{t('loading_dashboard')}</p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{t('please_wait_moment')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Unified Header with Blue Gradient Background - Station Name and Welcome Combined */}
        <div className="relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/80 to-indigo-700/80 rounded-2xl backdrop-blur-md border border-white/20"></div>
          <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>

          {/* Header Content */}
          <div className="relative p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Left Side - Station Info */}
              <div className="flex-1">
                {station && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <BuildingOfficeIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{station.stationName}</h1>
                        <span className="text-sm bg-white/30 px-3 py-1 rounded-full">
                          {station.stationCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-blue-100">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{station.city}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Welcome Message with Manager Name */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-100 font-medium">{t('welcome_back')},</p>
                    <h2 className="text-2xl font-bold">{user?.fullName || t('station_manager')}</h2>
                  </div>
                </div>

                {/* Station Contact Info */}
                {station && (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100 mt-4 ml-14">
                    <div className="flex items-center gap-1">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{station.contactPhone}</span>
                    </div>
                    {station.contactEmail && (
                      <div className="flex items-center gap-1">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{station.contactEmail}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Refresh Button */}
              <div className="flex flex-wrap items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 w-full md:w-auto">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? t('refreshing') : t('refresh')}
                </button>
                <div className="text-sm text-white border-l border-white/30 pl-4">
                  <p className="font-medium">{t('last_updated')}</p>
                  <p className="text-blue-100">{format(new Date(), 'PPp')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Enhanced Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Trips Card */}
          <div className={`group backdrop-blur-xl rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-white/70 border-white/20'
            } glass-card`}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('total_trips')}</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalTrips}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-green-600 font-medium">{t('active')}</p>
                  <p className="text-lg font-bold text-green-700">{stats.activeTrips}</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 font-medium">{t('completed')}</p>
                  <p className="text-lg font-bold text-gray-700">{stats.completedTrips || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles Card */}
          <div className={`group backdrop-blur-xl rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-white/70 border-white/20'
            } glass-card`}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('vehicles')}</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalVehicles}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <TruckIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-6">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600 font-medium">{t('available_now')}</span>
                    <span className="text-2xl font-bold text-green-700">{stats.availableVehicles}</span>
                  </div>
                  <div className="w-full bg-green-200 h-2 rounded-full mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.availableVehicles / (stats.totalVehicles || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drivers Card */}
          <div className={`group backdrop-blur-xl rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-white/70 border-white/20'
            } glass-card`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('drivers')}</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalDrivers}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-green-600 font-medium">{t('active')}</p>
                  <p className="text-lg font-bold text-green-700">{stats.activeDrivers || 0}</p>
                </div>
                <div className="flex-1 bg-yellow-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-yellow-600 font-medium">{t('available')}</p>
                  <p className="text-lg font-bold text-yellow-700">{stats.availableDrivers || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout with Pagination */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Routes with Pagination */}
          <div className={`backdrop-blur-xl rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-white/70 border-white/20'
            } glass-card`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">{t('routes', 'Available Routes')}</h2>
              </div>
              <Link to="/admin/routes" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 group">
                {t('view_all')}
                <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {routes.length === 0 ? (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('no_available_routes', 'No available routes')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('routes_not_defined_yet', 'Routes not defined yet')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 min-h-[320px]">
                  {getPaginatedRoutes().map((route, index) => (
                    <div key={route._id} className="group relative">
                      <div className={`relative flex gap-4 p-4 rounded-lg transition-colors ${isDark ? 'bg-gray-700/50 hover:bg-blue-900/20' : 'bg-gray-50 hover:bg-blue-50'
                        }`}>
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {(routesPage - 1) * itemsPerPage + index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {route.routeName || `${route.origin?.stationName || 'N/A'} → ${route.destination?.stationName || 'N/A'}`}
                              </p>
                              <div className="flex items-center mt-2 text-sm text-gray-600">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {route.estimatedDuration || 'N/A'}
                              </div>
                              <div className="mt-3 flex items-center gap-3 text-xs">
                                <span className="px-2 py-1 bg-white rounded-full shadow-sm text-green-700 font-medium">
                                  ETB {route.basePrice || '0'}
                                </span>
                                <span className="px-2 py-1 bg-white rounded-full shadow-sm text-gray-600">
                                  {route.distance || 0} km
                                </span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                              {t('route', 'Route')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={routesPage}
                  totalPages={totalRoutesPages}
                  onPageChange={goToRoutesPage}
                  label="routes"
                />
              </>
            )}
          </div>

          {/* Vehicle Status with Pagination */}
          <div className={`backdrop-blur-xl rounded-xl shadow-lg p-6 border ${isDark ? 'bg-gray-800/50 border-white/5' : 'bg-white/70 border-white/20'
            } glass-card`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">{t('vehicle_status')}</h2>
              </div>
              <Link to="/station/vehicles" className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 group">
                {t('manage_vehicles')}
                <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {vehicles.length === 0 ? (
              <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('no_vehicles_found')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('register_vehicle_hint')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 min-h-[320px]">
                  {getPaginatedVehicles().map((vehicle, index) => (
                    <div key={vehicle._id} className={`group p-4 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700/50 hover:bg-green-900/20' : 'bg-gray-50 hover:bg-green-50'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img
                              src={vehicle.images[0]?.url || vehicle.thumbnailImage}
                              alt={vehicle.plateNumber}
                              className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                              <TruckIcon className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-800 text-lg">
                                {vehicle.plateNumber}
                              </p>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(vehicle.currentStatus)}`}>
                                {t(vehicle.currentStatus) || vehicle.currentStatus}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {vehicle.make || 'N/A'} {vehicle.model || 'N/A'} • {vehicle.carType || 'N/A'}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">{t('capacity')}:</span> {vehicle.totalCapacity || 0} {t('seats')}
                              </span>
                              {vehicle.driverID && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">{t('driver')}:</span> {typeof vehicle.driverID === 'object' ? vehicle.driverID.fullName : t('Assigned')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={vehiclesPage}
                  totalPages={totalVehiclesPages}
                  onPageChange={goToVehiclesPage}
                  label="vehicles"
                />
              </>
            )}
          </div>
        </div>

        {/* Quick Actions - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/station/queue"
            className="group relative overflow-hidden bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl p-6 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <ArrowPathIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{t('queue_management')}</h3>
                <p className="text-orange-100 text-sm">{t('manage_live_queue_hint')}</p>
              </div>
              <ChevronRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/routes"
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <MapIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{t('create_new_route', 'Create New Route')}</h3>
                <p className="text-blue-100 text-sm">{t('define_new_path_hint', 'Define a new path between stations')}</p>
              </div>
              <ChevronRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

          <Link
            to="/station/vehicles"
            className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <TruckIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{t('register_vehicle')}</h3>
                <p className="text-green-100 text-sm">{t('add_new_vehicle_hint')}</p>
              </div>
              <ChevronRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StationDashboard;