import { Car, Clock, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TripResults({ trips, isLoading }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Searching for trips...</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No trips found for your search criteria.</p>
      </div>
    );
  }

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Showing {trips.length} trips
        </h3>
        <select className="input-field w-auto">
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Departure: Earliest</option>
          <option>Departure: Latest</option>
        </select>
      </div>

      {trips.map((trip) => (
        <div key={trip.id} className="card p-6 hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Car className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold capitalize">{trip.vehicleType.replace('_', ' ')}</h4>
                  <p className="text-sm text-gray-600">{trip.availableSeats} Seats Available</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(trip.departureTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{trip.availableSeats} seats left</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="font-medium">{trip.from}</p>
                <div className="flex items-center justify-center my-2">
                  <div className="w-24 h-0.5 bg-gray-300"></div>
                  <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                  <div className="w-24 h-0.5 bg-gray-300"></div>
                </div>
                <p className="font-medium">{trip.to}</p>
                <p className="text-sm text-gray-500 mt-1">{trip.duration}</p>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(trip.price)}</p>
                <p className="text-sm text-gray-600">per person</p>
              </div>
              <Link
                to={`/passenger/book-trip/${trip.id}`}
                className="btn-primary px-6 mt-4"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}