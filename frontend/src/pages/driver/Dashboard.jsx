import { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Car, DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/auth.service';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [driverStats, setDriverStats] = useState({
    totalTripsToday: 0,
    completedTrips: 0,
    totalDistance: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This is temporary - replace with real API when you add trip management
  const mockTrips = [
    {
      id: 'BD-GND-045',
      from: 'Bahir Dar',
      to: 'Gondar',
      departureTime: new Date().toISOString(),
      arrivalTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      vehiclePlate: 'ET 54321A',
      vehicleType: 'minibus',
      status: 'assigned',
      passengers: 3,
      price: 850,
    },
    {
      id: 'BD-AA-0600',
      from: 'Bahir Dar',
      to: 'Addis Ababa',
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      arrivalTime: new Date(Date.now() + 31 * 60 * 60 * 1000).toISOString(),
      vehiclePlate: 'ET 12345B',
      vehicleType: 'luxury_bus',
      status: 'upcoming',
      passengers: 0,
      price: 1200,
    },
  ];

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        setLoading(true);
        
        // Check if user is actually a driver
        if (user?.role !== 'driver') {
          setError('This dashboard is only available for drivers');
          return;
        }

        // TODO: Replace with real API calls when trip management is added
        // For now, use mock data
        setAssignedTrips(mockTrips);
        
        // Calculate mock statistics
        const stats = {
          totalTripsToday: mockTrips.filter(trip => 
            new Date(trip.departureTime).toDateString() === new Date().toDateString()
          ).length,
          completedTrips: 2, // Mock data
          totalDistance: 76, // Mock data in km
          totalEarnings: mockTrips.reduce((sum, trip) => sum + trip.price, 0)
        };
        
        setDriverStats(stats);

      } catch (error) {
        console.error('Failed to fetch driver data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDriverData();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  const handleStartTrip = async (tripId) => {
    // TODO: Implement trip start API when available
    alert(`Starting trip ${tripId}`);
    console.log('Start trip:', tripId);
  };

  const handleUpdateStatus = async (status) => {
    // TODO: Implement driver status update API
    alert(`Status updated to: ${status}`);
    console.log('Update status:', status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver dashboard...</p>
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
        <p className="text-sm text-gray-500">Only drivers can access this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Driver'}
        </h1>
        <p className="text-gray-600">Here are your assignments for {formatDate(new Date())}</p>
        
        {/* Driver Info Badge */}
        <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
          <Car className="w-4 h-4" />
          <span className="text-sm font-medium">
            License: {user?.licenseNumber || 'Not provided'}
            {user?.stationID && ` • Station: ${user.stationID}`}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trips Today</p>
                <p className="text-2xl font-bold">{driverStats.totalTripsToday}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+2 from yesterday</span>
                </div>
              </div>
              <Car className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Trips</p>
                <p className="text-2xl font-bold">{driverStats.completedTrips}</p>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">On track</span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold">{driverStats.totalDistance} km</p>
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">Today</span>
                </div>
              </div>
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(driverStats.totalEarnings)}</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">Estimate</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleUpdateStatus('available')}
            className="btn-primary py-3 flex items-center justify-center gap-2"
          >
            <Car className="w-4 h-4" />
            Go Online
          </button>
          <button 
            onClick={() => handleUpdateStatus('on_trip')}
            className="btn-primary py-3 flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Start Trip
          </button>
          <button 
            onClick={() => handleUpdateStatus('break')}
            className="btn-primary py-3 flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Take Break
          </button>
          <button 
            onClick={() => handleUpdateStatus('offline')}
            className="btn-primary py-3 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            End Shift
          </button>
        </div>
      </div>

      {/* Today's Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Trips</h2>
          <span className="text-sm text-gray-600">
            {assignedTrips.length} trip{assignedTrips.length !== 1 ? 's' : ''} assigned
          </span>
        </div>
        
        {assignedTrips.length === 0 ? (
          <div className="card p-12 text-center">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Trips Assigned</h3>
            <p className="text-gray-600 mb-4">You don't have any trips scheduled for today.</p>
            <p className="text-sm text-gray-500">Check back later or contact your station manager.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedTrips.map((trip) => (
              <div key={trip.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{trip.id}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trip.status === 'assigned' 
                          ? 'bg-blue-100 text-blue-800'
                          : trip.status === 'in_progress'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(trip.price)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartTrip(trip.id)}
                    className="btn-primary"
                    disabled={trip.status !== 'assigned'}
                  >
                    {trip.status === 'assigned' ? 'Start Trip' : 'View Details'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{trip.from} → {trip.to}</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium capitalize">{trip.vehicleType?.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">{trip.vehiclePlate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{trip.passengers} Passenger{trip.passengers !== 1 ? 's' : ''}</p>
                      <p className="text-sm text-gray-600">
                        {trip.passengers > 0 ? 'Ready to go' : 'Awaiting passengers'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Progress (if in progress) */}
                {trip.status === 'in_progress' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Trip Progress</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Trips */}
      {assignedTrips.filter(trip => trip.status === 'upcoming').length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Trips</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Trip management APIs are not yet implemented. 
              This dashboard currently shows mock data. 
              Contact the development team when trip management features are added to the backend.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}