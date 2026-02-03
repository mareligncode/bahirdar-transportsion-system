import { useState } from 'react';
import { useParams } from 'react-router-dom';
import TripSearch from '../../components/passenger/TripSearch';
import TripResults from '../../components/passenger/TripResults';
import SeatSelection from '../../components/passenger/SeatSelection';

// Mock data for trips - UPDATED to match TripResults interface
const mockTrips = [
  {
    id: '1',
    from: 'Bahir Dar',
    to: 'Gondar',
    departureTime: '2024-10-28T06:00:00',
    arrivalTime: '2024-10-28T09:15:00',
    vehicleType: 'minibus',
    availableSeats: 12,
    price: 250,
    duration: '3h 15m',
  },
  {
    id: '2',
    from: 'Bahir Dar',
    to: 'Gondar',
    departureTime: '2024-10-28T07:30:00',
    arrivalTime: '2024-10-28T10:30:00',
    vehicleType: 'coaster',
    availableSeats: 5,
    price: 275,
    duration: '3h 00m',
  },
  {
    id: '3',
    from: 'Bahir Dar',
    to: 'Gondar',
    departureTime: '2024-10-28T09:00:00',
    arrivalTime: '2024-10-28T11:45:00',
    vehicleType: 'luxury_bus',
    availableSeats: 2,
    price: 350,
    duration: '2h 45m',
  },
];

// Mock booked seats
const mockBookedSeats = ['A1', 'B2', 'C3', 'D4'];

export default function BookTrip() {
  const { tripId } = useParams();
  const [searchData, setSearchData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  const handleSearch = (data) => {
    setSearchData(data);
  };

  const handleSeatsSelected = (seats) => {
    setSelectedSeats(seats);
  };

  // If tripId is provided, show seat selection for that specific trip
  if (tripId) {
    const trip = mockTrips.find(t => t.id === tripId);
    
    if (!trip) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h2>
          <p className="text-gray-600">The trip you're looking for doesn't exist.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Trip</h1>
          <p className="text-gray-600">
            {trip.from} → {trip.to} | {new Date(trip.departureTime).toLocaleDateString()} | {trip.vehicleType}
          </p>
        </div>

        <SeatSelection
          totalSeats={24}
          bookedSeats={mockBookedSeats}
          pricePerSeat={trip.price}
          onSeatsSelected={handleSeatsSelected}
        />
      </div>
    );
  }

  // Otherwise show trip search and results
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Trip</h1>
        <p className="text-gray-600">Find and book your perfect ride</p>
      </div>

      <TripSearch onSearch={handleSearch} />
      
      {searchData && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Trips from {searchData.from} to {searchData.to}
            </h2>
            <p className="text-gray-600">
              {new Date(searchData.date).toLocaleDateString()} • {searchData.passengers} passenger{searchData.passengers > 1 ? 's' : ''}
            </p>
          </div>
          <TripResults trips={mockTrips} isLoading={false} />
        </>
      )}
    </div>
  );
}