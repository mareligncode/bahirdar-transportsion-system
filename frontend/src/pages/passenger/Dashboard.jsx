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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function PassengerDashboard() {
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

  useEffect(() => {
    const fetchPassengerData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is actually a passenger
        if (user?.role !== 'passenger') {
          setError('This dashboard is only available for passengers');
          return;
        }

        // Get current date for trip search
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Get active stations first to use as origin/destination
        const stationsResponse = await api.get('/api/station/active');
        const stations = stationsResponse.data?.stations || [];
        
        if (stations.length === 0) {
          setError('No stations available. Please try again later.');
          return;
        }

        // Use first station as default origin for search
        const defaultStationId = stations[0]?._id;

        // Fetch upcoming trips with correct parameters
        const tripsResponse = await api.get('/api/trip', {
          params: {
            status: 'scheduled,boarding',
            isActive: true,
            page: 1,
            limit: 10
          }
        });

        // Process upcoming trips - filter for available seats and future dates
        const allTrips = tripsResponse.data?.data || [];
        const currentDateTime = new Date();
        
        const availableTrips = allTrips.filter(trip => {
          const departureTime = new Date(trip.departureTime);
          return trip.availableSeats > 0 && 
                 departureTime > currentDateTime &&
                 ['scheduled', 'boarding'].includes(trip.tripStatus);
        });

        setUpcomingTrips(availableTrips.slice(0, 3)); // Show only 3 upcoming trips
        
        // For demonstration, use same trips as recent bookings
        // In production, you should fetch actual bookings from /api/bookings
        setRecentBookings(allTrips.slice(0, 3).map(trip => ({
          ...trip,
          status: trip.tripStatus
        })));

        // Calculate statistics
        const completedTrips = allTrips.filter(trip => 
          trip.tripStatus === 'completed'
        ).length;
        
        const totalSpent = allTrips.reduce((sum, trip) => 
          sum + (trip.price || 0), 0
        );
        
        const nextTrip = availableTrips.length > 0 
          ? availableTrips[0].departureTime
          : null;
        
        // Find favorite routes from all trips
        const routeCounts = {};
        allTrips.forEach(trip => {
          if (trip.origin && trip.destination) {
            const routeKey = `${trip.origin.stationName || 'Unknown'} → ${trip.destination.stationName || 'Unknown'}`;
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
          nextTripDate: nextTrip,
          favoriteRoutes
        });

      } catch (error) {
        console.error('Failed to fetch passenger data:', error);
        console.error('Error details:', error.response?.data);
        
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        
        if (error.response?.status === 403) {
          setError('Access denied. This dashboard is for passengers only.');
          return;
        }
        
        // Handle 400 errors gracefully
        if (error.response?.status === 400) {
          console.warn('API returned 400, using fallback data');
          // Use fallback data for demo purposes
          setUpcomingTrips([]);
          setRecentBookings([]);
          setPassengerStats({
            upcomingTrips: 0,
            totalSpent: 0,
            completedTrips: 0,
            nextTripDate: null,
            favoriteRoutes: []
          });
        } else {
          setError(error.response?.data?.message || 'Failed to load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPassengerData();
    }
  }, [user, logout, navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No upcoming trips';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'ETB 0';
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      boarding: 'bg-yellow-100 text-yellow-800',
      ongoing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
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
    navigate(`/passenger/trips/${tripId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading passenger dashboard...</p>
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Passenger'}
            </h1>
            <p className="text-gray-600">
              Manage your trips and bookings with Bahir Dar Transport System
            </p>
          </div>
          
          {/* Passenger Info Badge */}
          <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">
              Passenger ID: {user?._id?.slice(-8) || 'N/A'}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Trips</p>
                <p className="text-2xl font-bold">{passengerStats.upcomingTrips}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    {passengerStats.upcomingTrips > 0 ? 'Booked' : 'No trips'}
                  </span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(passengerStats.totalSpent)}</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">All bookings</span>
                </div>
              </div>
              <Ticket className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Trips</p>
                <p className="text-2xl font-bold">{passengerStats.completedTrips}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">
                    {passengerStats.completedTrips > 5 ? 'Frequent traveler' : 'Getting started'}
                  </span>
                </div>
              </div>
              <Car className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Trip</p>
                <p className="text-2xl font-bold">{formatDate(passengerStats.nextTripDate)}</p>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">
                    {passengerStats.nextTripDate ? formatTime(passengerStats.nextTripDate) : 'No trips'}
                  </span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Trips</h2>
          <Link 
            to="/passenger/search-trips" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            Search All Trips
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {upcomingTrips.length === 0 ? (
          <div className="card p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Available Trips</h3>
            <p className="text-gray-600 mb-6">There are no available trips at the moment.</p>
            <button 
              onClick={handleBookTrip}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Search for Trips
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrips.map((trip) => (
              <div key={trip._id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">
                    {getVehicleIcon(trip.vehicle?.carType)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {trip.origin?.stationName || 'Unknown'} → {trip.destination?.stationName || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(trip.tripStatus)}`}>
                      {trip.tripStatus?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className="text-lg font-bold">
                      {formatCurrency(trip.price || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Available: {trip.availableSeats || 0}/{trip.totalSeats || 0}</span>
                    </div>
                    <span>Vehicle: {trip.vehicle?.carType || 'N/A'}</span>
                  </div>
                  
                  <button
                    onClick={() => handleViewTripDetails(trip._id)}
                    className="btn-primary w-full mt-4"
                  >
                    View Details & Book
                  </button>
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
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="card p-6">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No recent bookings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">
                        {booking.origin?.stationName || 'Unknown'} → {booking.destination?.stationName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(booking.departureTime)} • {formatCurrency(booking.price || 0)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.tripStatus)}`}>
                      {booking.tripStatus}
                    </span>
                  </div>
                ))}
                <Link 
                  to="/passenger/booking-history"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1 pt-2"
                >
                  View Complete History
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleBookTrip}
              className="card p-6 text-left hover:bg-primary-50 hover:border-primary-200 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-200">
                  <PlusCircle className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Book Trip</h3>
                <p className="text-xs text-gray-600">Find and book</p>
              </div>
            </button>
            
            <Link 
              to="/passenger/my-bookings"
              className="card p-6 text-left hover:bg-blue-50 hover:border-blue-200 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">My Bookings</h3>
                <p className="text-xs text-gray-600">View all bookings</p>
              </div>
            </Link>
            
            <Link 
              to="/passenger/payments"
              className="card p-6 text-left hover:bg-green-50 hover:border-green-200 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Payments</h3>
                <p className="text-xs text-gray-600">Manage payments</p>
              </div>
            </Link>
            
            <Link 
              to="/help"
              className="card p-6 text-left hover:bg-purple-50 hover:border-purple-200 transition-colors group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Help</h3>
                <p className="text-xs text-gray-600">Get support</p>
              </div>
            </Link>
          </div>

          {/* Favorite Routes */}
          {passengerStats.favoriteRoutes.length > 0 && (
            <div className="mt-6 card p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Popular Routes</h3>
              <div className="space-y-2">
                {passengerStats.favoriteRoutes.map((route, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
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