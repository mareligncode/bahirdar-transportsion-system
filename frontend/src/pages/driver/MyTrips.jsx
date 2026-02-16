import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ClockIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const MyTrips = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  });

  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['driverAllTrips', filter, dateRange],
    queryFn: async () => {
      const params = {
        driverID: true, // Will be set by backend based on token
        ...(filter !== 'all' && { status: filter }),
        startDate: dateRange.start,
        endDate: dateRange.end
      };
      const response = await api.get('/api/trip', { params });
      return response.data;
    }
  });

  const trips = tripsData?.data || tripsData?.trips || [];

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      boarding: 'bg-yellow-100 text-yellow-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      delayed: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Trips</option>
              <option value="scheduled">Scheduled</option>
              <option value="boarding">Boarding</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="delayed">Delayed</option>
            </select>
            
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Trips List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {trips.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => navigate(`/driver/trip/${trip._id}`)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(trip.tripStatus)}`}>
                          {trip.tripStatus}
                        </span>
                        <span className="text-sm text-gray-500">
                          Trip #{trip.tripNumber}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center text-sm">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium text-gray-700">From:</span>
                            <span className="ml-2 text-gray-600">{trip.origin?.stationName}</span>
                          </div>
                          <div className="flex items-center text-sm mt-2">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium text-gray-700">To:</span>
                            <span className="ml-2 text-gray-600">{trip.destination?.stationName}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center text-sm">
                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium text-gray-700">Departure:</span>
                            <span className="ml-2 text-gray-600">
                              {format(new Date(trip.departureTime), 'MMM dd, yyyy hh:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center text-sm mt-2">
                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium text-gray-700">Arrival:</span>
                            <span className="ml-2 text-gray-600">
                              {format(new Date(trip.arrivalTime), 'MMM dd, yyyy hh:mm a')}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center text-sm">
                            <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium text-gray-700">Seats:</span>
                            <span className="ml-2 text-gray-600">
                              {trip.totalSeats - trip.availableSeats}/{trip.totalSeats} occupied
                            </span>
                          </div>
                          <div className="flex items-center text-sm mt-2">
                            <span className="font-medium text-gray-700">Vehicle:</span>
                            <span className="ml-2 text-gray-600">{trip.vehicle?.plateNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No trips found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No trips match your selected filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTrips;