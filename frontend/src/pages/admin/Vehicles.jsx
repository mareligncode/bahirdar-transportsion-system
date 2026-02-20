import { useState, useEffect } from 'react';
import { Plus, Car, Wrench, Fuel, Edit, Trash2, User, MapPin, CreditCard, Phone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import VehicleModal from './VehicleModal';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-red-100 text-red-800',
  available: 'bg-blue-100 text-blue-800',
  on_trip: 'bg-purple-100 text-purple-800',
};

const carTypeLabels = {
  coaster: 'Coaster',
  bus: 'Bus',
  minibus: 'Minibus',
  'aba dulla': 'Aba Dulla',
  van: 'Van',
  other: 'Other',
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    totalCapacity: 0,
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/vehicles');
      
      if (response.data.success) {
        const vehiclesData = response.data.data.vehicles || response.data.data;
        setVehicles(vehiclesData);
        setTotalItems(vehiclesData.length);
        calculateStats(vehiclesData);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const calculateStats = (vehicleList) => {
    const total = vehicleList.length;
    const active = vehicleList.filter(v => v.currentStatus === 'active' || v.currentStatus === 'available').length;
    const maintenance = vehicleList.filter(v => v.currentStatus === 'maintenance').length;
    const totalCapacity = vehicleList.reduce((sum, v) => sum + (v.totalCapacity || 0), 0);
    
    setStats({ total, active, maintenance, totalCapacity });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await api.delete(`/api/vehicles/${id}`);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error(error.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleStatusUpdate = async (vehicleId, status) => {
    try {
      await api.post(`/api/vehicles/${vehicleId}/status`, { status });
      toast.success(`Vehicle status updated to ${status}`);
      fetchVehicles();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    return phone;
  };

  // Format bank details
  const formatBankDetails = (ownerDetails) => {
    if (!ownerDetails?.bankDetails) return 'N/A';
    const { bankName, accountNumber } = ownerDetails.bankDetails;
    if (!bankName && !accountNumber) return 'N/A';
    return `${bankName || 'Unknown Bank'} - ${accountNumber ? `****${accountNumber.slice(-4)}` : 'No Account'}`;
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = vehicles.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
          <p className="text-gray-600">Manage fleet vehicles and maintenance</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Car className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <Car className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Under Maintenance</p>
              <p className="text-2xl font-bold">{stats.maintenance}</p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold">{stats.totalCapacity}</p>
            </div>
            <Fuel className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card overflow-hidden">
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-6">Add your first vehicle to get started</p>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add New Vehicle
            </button>
          </div>
        ) : (
          <>
            {/* Table Header with Items Per Page Selector */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-semibold">{totalItems}</span> vehicles
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Specifications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Driver & Station
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Owner Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Maintenance
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
                  {currentVehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                            <Car className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                            <div className="text-sm text-gray-500">
                              {carTypeLabels[vehicle.carType] || vehicle.carType} • {vehicle.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">Capacity: {vehicle.totalCapacity} seats</div>
                          <div className="text-sm text-gray-600">
                            Fuel: {vehicle.fuelType} • {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Color: {vehicle.color || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {vehicle.driverID?.fullName || 'Not Assigned'}
                            </span>
                          </div>
                          {vehicle.stationID && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {vehicle.stationID.stationName}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {vehicle.ownerDetails ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {vehicle.ownerDetails.ownerName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatPhoneNumber(vehicle.ownerDetails.phoneNumber)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {formatBankDetails(vehicle.ownerDetails)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No owner details</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>Last: {formatDate(vehicle.lastServiceDate)}</div>
                          <div>Next: {formatDate(vehicle.nextServiceDate)}</div>
                          {vehicle.insuranceExpiry && (
                            <div className="text-xs mt-1">
                              Ins. expires: {formatDate(vehicle.insuranceExpiry)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.currentStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {vehicle.currentStatus}
                          </span>
                          <select
                            value={vehicle.currentStatus}
                            onChange={(e) => handleStatusUpdate(vehicle._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="available">Available</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="on_trip">On Trip</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleEdit(vehicle)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Edit vehicle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(vehicle._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Section */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Page <span className="font-semibold">{currentPage}</span> of{' '}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Previous Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page Number Buttons */}
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  {/* Next Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Last Page Button */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Go to Page Input */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Go to page:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page);
                      }
                    }}
                    className="w-16 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <VehicleModal
          isOpen={showModal}
          onClose={handleModalClose}
          vehicle={selectedVehicle}
        />
      )}
    </div>
  );
}