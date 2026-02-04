import { Calendar, MapPin, Users, CreditCard, Download } from 'lucide-react';

// Mock bookings data
const mockBookings = [
  {
    id: 'BK-001',
    tripId: 'BD-GD-001',
    from: 'Bahir Dar',
    to: 'Gondar',
    departureTime: '2024-10-28T06:00:00',
    seats: ['A1', 'A2'],
    totalPrice: 575,
    status: 'confirmed',
    paymentStatus: 'paid',
    bookingDate: '2024-10-25',
    passengerCount: 2,
  },
  {
    id: 'BK-002',
    tripId: 'BD-AA-002',
    from: 'Bahir Dar',
    to: 'Addis Ababa',
    departureTime: '2024-11-01T08:00:00',
    seats: ['B3'],
    totalPrice: 1200,
    status: 'confirmed',
    paymentStatus: 'paid',
    bookingDate: '2024-10-26',
    passengerCount: 1,
  },
  {
    id: 'BK-003',
    tripId: 'BD-DS-003',
    from: 'Bahir Dar',
    to: 'Dessie',
    departureTime: '2024-10-20T07:30:00',
    seats: ['C1', 'C2', 'C3'],
    totalPrice: 1050,
    status: 'cancelled',
    paymentStatus: 'refunded',
    bookingDate: '2024-10-18',
    passengerCount: 3,
  },
];

const statusColors = {
  confirmed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

export default function MyBookings() {
  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage all your trip bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold">{mockBookings.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Trips</p>
              <p className="text-2xl font-bold">
                {mockBookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(mockBookings.reduce((sum, b) => sum + b.totalPrice, 0))}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Booking History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trip Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Passengers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(booking.bookingDate)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {booking.from} → {booking.to}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(booking.departureTime)} at {formatTime(booking.departureTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Seats: {booking.seats.join(', ')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{booking.passengerCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold">
                      {formatCurrency(booking.totalPrice)}
                    </div>
                    <div className="text-xs">
                      <span className={`px-2 py-1 rounded-full ${paymentStatusColors[booking.paymentStatus]}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View Details
                      </button>
                      {booking.status === 'confirmed' && (
                        <>
                          <button className="text-gray-600 hover:text-gray-700 text-sm">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-4">
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg">
          All Bookings
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          Upcoming
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          Past Trips
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          Cancelled
        </button>
      </div>
    </div>
  );
}