import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
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
  UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StationDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Pagination states
  const [tripsPage, setTripsPage] = useState(1);
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
        stationUsersRes
      ] = await Promise.allSettled([
        api.get('/api/trip', { params: { limit: 100 } }),
        api.get('/api/vehicles', { params: { limit: 100 } }),
        api.get('/api/auth/station-users')
      ]);

      if (tripsRes.status === 'fulfilled') {
        const tripsData = extractData(tripsRes.value);
        const trips = Array.isArray(tripsData) ? tripsData : 
                     (tripsData?.trips || tripsData?.data || []);
        
        console.log('Trips data:', trips);
        
        const now = new Date();
        
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
        
        const upcoming = trips
          .filter(t => 
            t && t.tripStatus === 'scheduled' && 
            t.departureTime && new Date(t.departureTime) > now
          )
          .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
        
        setUpcomingTrips(upcoming);
        
        setStats(prev => ({
          ...prev,
          totalTrips: trips.length,
          activeTrips,
          completedTrips,
          cancelledTrips
        }));
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
        toast.success('Dashboard refreshed successfully');
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
      scheduled: 'bg-blue-100 text-blue-800',
      boarding: 'bg-yellow-100 text-yellow-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      delayed: 'bg-orange-100 text-orange-800',
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-orange-100 text-orange-800',
      available: 'bg-green-100 text-green-800',
      on_trip: 'bg-purple-100 text-purple-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Pagination functions
  const getPaginatedTrips = () => {
    const startIndex = (tripsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return upcomingTrips.slice(startIndex, endIndex);
  };

  const getPaginatedVehicles = () => {
    const startIndex = (vehiclesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return vehicles.slice(startIndex, endIndex);
  };

  const totalTripsPages = Math.ceil(upcomingTrips.length / itemsPerPage);
  const totalVehiclesPages = Math.ceil(vehicles.length / itemsPerPage);

  const goToTripsPage = (page) => {
    setTripsPage(Math.max(1, Math.min(page, totalTripsPages)));
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
            Page {currentPage} of {totalPages}
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
          Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, label === 'trips' ? upcomingTrips.length : vehicles.length)} of {label === 'trips' ? upcomingTrips.length : vehicles.length}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
          <p className="text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Unified Header with Blue Gradient Background - Station Name and Welcome Combined */}
        <div className="relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl"></div>
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
                    <p className="text-sm text-blue-100 font-medium">Welcome back,</p>
                    <h2 className="text-2xl font-bold">{user?.fullName || 'Station Manager'}</h2>
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
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="text-sm text-white border-l border-white/30 pl-4">
                  <p className="font-medium">Last Updated</p>
                  <p className="text-blue-100">{format(new Date(), 'PPp')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Enhanced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trips Card */}
          <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Trips</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalTrips}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-green-600 font-medium">Active</p>
                  <p className="text-lg font-bold text-green-700">{stats.activeTrips}</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 font-medium">Completed</p>
                  <p className="text-lg font-bold text-gray-700">{stats.completedTrips || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles Card */}
          <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Vehicles</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalVehicles}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <TruckIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-6">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600 font-medium">Available Now</span>
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
          <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Drivers</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalDrivers}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-green-600 font-medium">Active</p>
                  <p className="text-lg font-bold text-green-700">{stats.activeDrivers || 0}</p>
                </div>
                <div className="flex-1 bg-yellow-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-yellow-600 font-medium">Available</p>
                  <p className="text-lg font-bold text-yellow-700">{stats.availableDrivers || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout with Pagination */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Trips with Pagination */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Upcoming Trips</h2>
              </div>
              <Link to="/station/Trips" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 group">
                View All
                <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {upcomingTrips.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No upcoming trips</p>
                <p className="text-sm text-gray-400 mt-1">Schedule a new trip to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 min-h-[320px]">
                  {getPaginatedTrips().map((trip, index) => (
                    <div key={trip._id} className="group relative">
                      <div className="relative flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {(tripsPage - 1) * itemsPerPage + index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {trip.origin?.stationName || 'N/A'} → {trip.destination?.stationName || 'N/A'}
                              </p>
                              <div className="flex items-center mt-2 text-sm text-gray-600">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {trip.departureTime ? format(new Date(trip.departureTime), 'PPp') : 'N/A'}
                              </div>
                              <div className="mt-3 flex items-center gap-3 text-xs">
                                <span className="px-2 py-1 bg-white rounded-full shadow-sm">
                                  🚌 {trip.vehicle?.plateNumber || 'N/A'}
                                </span>
                                <span className="px-2 py-1 bg-white rounded-full shadow-sm">
                                  👤 {trip.driver?.fullName || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(trip.tripStatus)}`}>
                              {trip.tripStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Pagination 
                  currentPage={tripsPage}
                  totalPages={totalTripsPages}
                  onPageChange={goToTripsPage}
                  label="trips"
                />
              </>
            )}
          </div>

          {/* Vehicle Status with Pagination */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Vehicle Status</h2>
              </div>
              <Link to="/station/vehicles" className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 group">
                Manage Vehicles
                <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {vehicles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No vehicles found</p>
                <p className="text-sm text-gray-400 mt-1">Register a vehicle to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 min-h-[320px]">
                  {getPaginatedVehicles().map((vehicle, index) => (
                    <div key={vehicle._id} className="group p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-all hover:shadow-md">
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
                                {vehicle.currentStatus}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {vehicle.make || 'N/A'} {vehicle.model || 'N/A'} • {vehicle.carType || 'N/A'}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Capacity:</span> {vehicle.totalCapacity || 0} seats
                              </span>
                              {vehicle.driverID && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Driver:</span> {typeof vehicle.driverID === 'object' ? vehicle.driverID.fullName : 'Assigned'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/station/Trips"
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Create New Trip</h3>
                <p className="text-blue-100 text-sm">Schedule a new journey</p>
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
                <h3 className="text-xl font-bold mb-1">Register Vehicle</h3>
                <p className="text-green-100 text-sm">Add new vehicle to fleet</p>
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