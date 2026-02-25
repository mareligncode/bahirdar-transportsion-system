import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TruckIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../services/api';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DriverReports = () => {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [reportType, setReportType] = useState('summary');

  // Fetch trip statistics
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['driverStats', dateRange],
    queryFn: async () => {
      const response = await api.get('/api/trip', {
        params: {
          driverID: true,
          startDate: dateRange.start,
          endDate: dateRange.end,
          limit: 1000
        }
      });
      return response.data;
    }
  });

  const trips = statsData?.data || statsData?.trips || [];

  // Calculate statistics
  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.tripStatus === 'completed').length;
  const cancelledTrips = trips.filter(t => t.tripStatus === 'cancelled').length;
  const totalPassengers = trips.reduce((acc, trip) => 
    acc + (trip.totalSeats - trip.availableSeats), 0
  );
  const totalRevenue = trips.reduce((acc, trip) => 
    acc + (trip.price * (trip.totalSeats - trip.availableSeats)), 0
  );

  // Prepare chart data
  const statusData = [
    { name: 'Completed', value: completedTrips },
    { name: 'Cancelled', value: cancelledTrips },
    { name: 'Ongoing', value: trips.filter(t => t.tripStatus === 'ongoing').length },
    { name: 'Scheduled', value: trips.filter(t => t.tripStatus === 'scheduled').length }
  ].filter(item => item.value > 0);

  const dailyTrips = trips.reduce((acc, trip) => {
    const date = format(new Date(trip.departureTime), 'MMM dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dailyData = Object.entries(dailyTrips).map(([date, count]) => ({
    date,
    trips: count
  }));

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Trip #', 'Route', 'Status', 'Passengers', 'Revenue'];
    const rows = trips.map(trip => [
      format(new Date(trip.departureTime), 'yyyy-MM-dd'),
      trip.tripNumber,
      `${trip.origin?.stationName} → ${trip.destination?.stationName}`,
      trip.tripStatus,
      trip.totalSeats - trip.availableSeats,
      trip.price * (trip.totalSeats - trip.availableSeats)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Reports</h1>
              <p className="text-sm text-gray-600 mt-1">
                View your performance and earnings
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
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
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="summary">Summary</option>
              <option value="details">Detailed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-semibold text-gray-900">{totalTrips}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{completedTrips}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <UserGroupIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Passengers</p>
                <p className="text-2xl font-semibold text-gray-900">{totalPassengers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ETB {totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-lg p-3">
                <TruckIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Pass/Trip</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalTrips ? Math.round(totalPassengers / totalTrips) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Trip Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trips" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        {reportType === 'details' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Trip Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passengers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(trip.departureTime), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.tripNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.origin?.stationName} → {trip.destination?.stationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          trip.tripStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          trip.tripStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          trip.tripStatus === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trip.tripStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.totalSeats - trip.availableSeats}/{trip.totalSeats}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ETB {trip.price * (trip.totalSeats - trip.availableSeats)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverReports;