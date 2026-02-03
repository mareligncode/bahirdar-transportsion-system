import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function PassengerDashboard() {
  const { user } = useAuth();
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [passengerStats, setPassengerStats] = useState({
    upcomingTrips: 0,
    totalSpent: 0,
    completedTrips: 0,
    nextTripDate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This is temporary - replace with real API when you add trip booking
  const mockTrips = [
    {
      id: '1',
      from: 'Bahir Dar',
      to: 'Addis Ababa',
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      price: 1200,
      status: 'confirmed',
      seats: ['A1', 'A2'],
      vehicleType: 'luxury_bus'
    },
    {
      id: '2',
      from: 'Bahir Dar',
      to: 'Gondar',
      departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      price: 350,
      status: 'confirmed',
      seats: ['B3'],
      vehicleType: 'minibus'
    },
  ];

  useEffect(() => {
    const fetchPassengerData = async () => {
      try {
        setLoading(true);
        
        // Check if user is actually a passenger
        if (user?.role !== 'passenger') {
          setError('This dashboard is only available for passengers');
          return;
        }

        // TODO: Replace with real API calls when trip booking is added
        // For now, use mock data
        setUpcomingTrips(mockTrips);
        
        // Calculate mock statistics
        const totalSpent = mockTrips.reduce((sum, trip) => 
          sum + (trip.price * trip.seats.length), 0
        );
        
        const nextTrip = mockTrips.length > 0 
          ? new Date(mockTrips[0].departureTime)
          : null;
        
        const stats = {
          upcomingTrips: mockTrips.length,
          totalSpent: totalSpent,
          completedTrips: 5, // Mock data
          nextTripDate: nextTrip
        };
        
        setPassengerStats(stats);

      } catch (error) {
        console.error('Failed to fetch passenger data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPassengerData();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No upcoming trips';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getVehicleIcon = (vehicleType) => {
    const icons = {
      luxury_bus: '🚌',
      coaster: '🚎',
      minibus: '🚐'
    };
    return icons[vehicleType] || '🚗';
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
        <p className="text-sm text-gray-500">Only passengers can access this dashboard.</p>
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
              Here's what's happening with your trips today
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
                  <span className="text-sm text-green-600">+{passengerStats.upcomingTrips} this month</span>
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
                  <Ticket className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">All time</span>
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
                  <Car className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">Loyal customer</span>
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
                    {passengerStats.nextTripDate ? 'Coming up' : 'No trips'}
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
          <h2 className="text-xl font-semibold">Upcoming Trips</h2>
          <span className="text-sm text-gray-600">
            {upcomingTrips.length} trip{upcomingTrips.length !== 1 ? 's' : ''} scheduled
          </span>
        </div>
        
        {upcomingTrips.length === 0 ? (
          <div className="card p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Upcoming Trips</h3>
            <p className="text-gray-600 mb-6">You don't have any trips scheduled yet.</p>
            <Link to="/passenger/book-trip" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Book Your First Trip
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl mt-1">{getVehicleIcon(trip.vehicleType)}</div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {trip.from} → {trip.to}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(trip.departureTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(trip.departureTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Seats: {trip.seats.join(', ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        Vehicle: {trip.vehicleType?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <p className="text-2xl font-bold">{formatCurrency(trip.price * trip.seats.length)}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      {trip.seats.length} seat{trip.seats.length !== 1 ? 's' : ''} × {formatCurrency(trip.price)}
                    </p>
                    <div className="flex gap-2">
                      <Link 
                        to={`/passenger/book-trip/${trip.id}`}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </Link>
                      <button className="btn-primary text-sm">
                        Check In
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/passenger/book-trip"
            className="card p-6 text-left hover:bg-primary-50 hover:border-primary-200 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200">
                <PlusCircle className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Book New Trip</h3>
            </div>
            <p className="text-sm text-gray-600">Find and book your next journey</p>
          </Link>
          
          <Link 
            to="/passenger/my-bookings"
            className="card p-6 text-left hover:bg-blue-50 hover:border-blue-200 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Booking History</h3>
            </div>
            <p className="text-sm text-gray-600">See all your past trips</p>
          </Link>
          
          <Link 
            to="/passenger/payments"
            className="card p-6 text-left hover:bg-green-50 hover:border-green-200 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Payment Methods</h3>
            </div>
            <p className="text-sm text-gray-600">Manage your payment options</p>
          </Link>
          
          <Link 
            to="/help"
            className="card p-6 text-left hover:bg-purple-50 hover:border-purple-200 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Help Center</h3>
            </div>
            <p className="text-sm text-gray-600">Get assistance and support</p>
          </Link>
        </div>
      </div>

      {/* Development Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Trip booking APIs are not yet implemented. 
          This dashboard currently shows mock data. 
          Contact the development team when booking features are added to the backend.
        </p>
      </div>
    </div>
  );
}