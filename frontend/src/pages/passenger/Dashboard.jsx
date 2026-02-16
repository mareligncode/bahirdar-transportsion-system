import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Ticket, 
  MapPin, 
  Clock, 
  Car, 
  User, 
  TrendingUp,
  AlertCircle,
  PlusCircle,
  History,
  CreditCard,
  HelpCircle,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import toast from 'react-hot-toast';

export default function PassengerDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [passengerStats, setPassengerStats] = useState({
    upcomingTrips: 0,
    totalSpent: 0,
    completedTrips: 0,
    nextTripDate: null,
    favoriteRoutes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPassengerData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Check if user is actually a passenger
      if (user?.role !== 'passenger') {
        setError(t('This dashboard is only available for passengers'));
        return;
      }

      // Get current date for filtering
      const now = new Date();

      // Fetch available trips
      const tripsResponse = await api.get('/api/trip', {
        params: {
          status: ['scheduled', 'boarding'],
          isActive: true,
          limit: 10,
          _t: Date.now() // Cache busting
        }
      });

      console.log('Trips API Response:', tripsResponse.data);

      // Extract trips from response (handle multiple response formats)
      let allTrips = [];
      if (tripsResponse.data?.data) {
        allTrips = tripsResponse.data.data;
      } else if (tripsResponse.data?.trips) {
        allTrips = tripsResponse.data.trips;
      } else if (Array.isArray(tripsResponse.data)) {
        allTrips = tripsResponse.data;
      }

      console.log('All trips fetched:', allTrips.length);

      // Filter for available trips (future dates + available seats)
      const availableTrips = allTrips.filter(trip => {
        const departureTime = new Date(trip.departureTime);
        return trip.availableSeats > 0 && 
               departureTime > now &&
               ['scheduled', 'boarding'].includes(trip.tripStatus);
      });

      console.log('Available trips:', availableTrips.length);
      setUpcomingTrips(availableTrips.slice(0, 3));

      // Fetch user's bookings
      try {
        const bookingsResponse = await api.get('/api/booking/my-bookings', {
          params: { _t: Date.now() } // Cache busting
        });
        console.log('Bookings Response:', bookingsResponse.data);
        
        let bookings = [];
        if (bookingsResponse.data?.data) {
          bookings = bookingsResponse.data.data;
        } else if (Array.isArray(bookingsResponse.data)) {
          bookings = bookingsResponse.data;
        }

        // Get recent bookings (last 3)
        setRecentBookings(bookings.slice(0, 3));

        // Calculate statistics from bookings
        const completedTrips = bookings.filter(b => 
          b.status === 'completed' || b.tripStatus === 'completed'
        ).length;
        
        const totalSpent = bookings.reduce((sum, booking) => 
          sum + (booking.totalPrice || booking.amount || 0), 0
        );
        
        // Find next upcoming booking
        const upcomingBooking = bookings
          .filter(b => {
            const departureTime = b.tripID?.departureTime ? new Date(b.tripID.departureTime) : null;
            return departureTime && departureTime > now && 
                   ['pending', 'confirmed'].includes(b.status);
          })
          .sort((a, b) => new Date(a.tripID?.departureTime) - new Date(b.tripID?.departureTime))[0];

        // Find favorite routes from bookings
        const routeCounts = {};
        bookings.forEach(booking => {
          if (booking.tripID?.origin?.stationName && booking.tripID?.destination?.stationName) {
            const routeKey = `${booking.tripID.origin.stationName} → ${booking.tripID.destination.stationName}`;
            routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
          }
        });
        
        const favoriteRoutes = Object.entries(routeCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2)
          .map(([route]) => route);

        setPassengerStats({
          upcomingTrips: availableTrips.length,
          totalSpent,
          completedTrips,
          nextTripDate: upcomingBooking?.tripID?.departureTime || null,
          favoriteRoutes
        });

        if (showRefreshToast) {
          toast.success(t('Dashboard data refreshed successfully'));
        }

      } catch (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        
        // If bookings fail, still show available trips with default stats
        setRecentBookings([]);
        setPassengerStats({
          upcomingTrips: availableTrips.length,
          totalSpent: 0,
          completedTrips: 0,
          nextTripDate: null,
          favoriteRoutes: []
        });
        
        if (showRefreshToast) {
          toast.error(t('Failed to load booking data'));
        }
      }

    } catch (error) {
      console.error('Failed to fetch passenger data:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error(t('Session expired. Please login again.'));
        logout();
        navigate('/login');
        return;
      }
      
      if (error.response?.status === 403) {
        setError(t('Access denied. This dashboard is for passengers only.'));
        return;
      }
      
      const errorMessage = error.response?.data?.message || t('Failed to load dashboard data. Please try again.');
      setError(errorMessage);
      
      if (showRefreshToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPassengerData();
    }
  }, [user]);

  const handleRefresh = () => {
    fetchPassengerData(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Good Morning');
    if (hour < 18) return t('Good Afternoon');
    return t('Good Evening');
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('No upcoming trips');
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) return t('Today');
      if (date.toDateString() === tomorrow.toDateString()) return t('Tomorrow');
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return t('Invalid date');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return `${t('ETB')} 0`;
    return `${t('ETB')} ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      boarding: 'bg-yellow-100 text-yellow-800',
      ongoing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getVehicleIcon = (carType) => {
    const icons = {
      coaster: '🚌',
      bus: '🚎',
      minibus: '🚐',
      van: '🚗',
      'aba dulla': '🚙',
      other: '🚙'
    };
    return icons[carType] || '🚗';
  };

  const handleBookTrip = () => {
    navigate('/passenger/book-trip');
  };

  const handleViewTripDetails = (tripId) => {
    if (tripId) {
      navigate(`/passenger/book-trip/${tripId}`);
    } else {
      toast.error(t('Invalid trip ID'));
    }
  };

  const handleViewBookingDetails = (bookingId) => {
    if (bookingId) {
      navigate(`/passenger/my-booking/${bookingId}`);
    } else {
      toast.error(t('Invalid booking ID'));
    }
  };

  const handleSearchTrips = () => {
    navigate('/passenger/book-trip');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('Loading passenger dashboard...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('Error Loading Dashboard')}</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => fetchPassengerData()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {t('Retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section with Refresh Button */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || t('Passenger')}!
            </h1>
            <p className="text-gray-600">
              {t('Manage your trips and bookings with Bahir Dar Transport System')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={t('Refresh data')}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">{refreshing ? t('Refreshing...') : t('Refresh')}</span>
            </button>
            
            {/* Passenger Info Badge */}
            <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t('Passenger ID')}: {user?._id?.slice(-8).toUpperCase() || t('N/A')}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('Available Trips')}</p>
                <p className="text-2xl font-bold text-gray-900">{passengerStats.upcomingTrips}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    {passengerStats.upcomingTrips > 0 ? t('Ready to book') : t('No trips')}
                  </span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('Total Spent')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(passengerStats.totalSpent)}</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{t('Lifetime total')}</span>
                </div>
              </div>
              <Ticket className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('Completed Trips')}</p>
                <p className="text-2xl font-bold text-gray-900">{passengerStats.completedTrips}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">
                    {passengerStats.completedTrips > 5 ? t('Frequent traveler') : t('Getting started')}
                  </span>
                </div>
              </div>
              <Car className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('Next Trip')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatDate(passengerStats.nextTripDate)}</p>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">
                    {passengerStats.nextTripDate ? formatTime(passengerStats.nextTripDate) : t('No trips')}
                  </span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Available Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('Available Trips')}</h2>
          <button
            onClick={handleSearchTrips}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            {t('Search All Trips')}
          </button>
        </div>
        
        {upcomingTrips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('No Available Trips')}</h3>
            <p className="text-gray-600 mb-6">{t('There are no available trips at the moment.')}</p>
            <button 
              onClick={handleSearchTrips}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {t('Search for Trips')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrips.map((trip) => (
              <div key={trip._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">
                      {getVehicleIcon(trip.vehicle?.carType)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {trip.origin?.stationName || t('Unknown')} → {trip.destination?.stationName || t('Unknown')}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(trip.departureTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(trip.departureTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.tripStatus)}`}>
                        {trip.tripStatus?.toUpperCase() || t('SCHEDULED')}
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(trip.price || 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{t('Available')}: {trip.availableSeats || 0}/{trip.totalSeats || 0}</span>
                      </div>
                      <span>{t('Vehicle')}: {trip.vehicle?.carType || t('N/A')}</span>
                    </div>
                    
                    <button
                      onClick={() => handleViewTripDetails(trip._id)}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mt-4 flex items-center justify-center gap-2"
                    >
                      {t('View Details & Book')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('Recent Bookings')}</h2>
          <div className="bg-white rounded-xl shadow-sm p-6">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">{t('No recent bookings')}</p>
                <button
                  onClick={handleSearchTrips}
                  className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {t('Book your first trip')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div 
                    key={booking._id} 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleViewBookingDetails(booking._id)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.tripID?.origin?.stationName || t('Unknown')} → {booking.tripID?.destination?.stationName || t('Unknown')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(booking.tripID?.departureTime)} • {formatCurrency(booking.totalPrice || booking.amount || 0)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
                <Link 
                  to="/passenger/my-booking"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1 pt-2 border-t"
                >
                  {t('View Complete History')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('Quick Actions')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleBookTrip}
              className="bg-white rounded-xl shadow-sm p-6 text-left hover:bg-primary-50 hover:border-primary-200 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                  <Search className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('Search Trips')}</h3>
                <p className="text-xs text-gray-600">{t('Find and book trips')}</p>
              </div>
            </button>
            
            <Link 
              to="/passenger/my-booking"
              className="bg-white rounded-xl shadow-sm p-6 text-left hover:bg-blue-50 hover:border-blue-200 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('My Bookings')}</h3>
                <p className="text-xs text-gray-600">{t('View all bookings')}</p>
              </div>
            </Link>
            
            <Link 
              to="/passenger/payments"
              className="bg-white rounded-xl shadow-sm p-6 text-left hover:bg-green-50 hover:border-green-200 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('Payments')}</h3>
                <p className="text-xs text-gray-600">{t('Payment history')}</p>
              </div>
            </Link>
            
            <Link 
              to="/help"
              className="bg-white rounded-xl shadow-sm p-6 text-left hover:bg-purple-50 hover:border-purple-200 transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('Help')}</h3>
                <p className="text-xs text-gray-600">{t('Get support')}</p>
              </div>
            </Link>
          </div>

          {/* Favorite Routes */}
          {passengerStats.favoriteRoutes.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('Your Favorite Routes')}</h3>
              <div className="space-y-2">
                {passengerStats.favoriteRoutes.map((route, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600 p-2 hover:bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 mr-2 text-primary-500" />
                    <span>{route}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}