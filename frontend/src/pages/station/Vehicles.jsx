import { useState, useEffect } from 'react';
import { Plus, Car, Wrench, Fuel, Edit, Trash2, User, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, Eye, Image as ImageIcon, CreditCard, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import VehicleModal from './VehicleModal';
import VehicleImagesModal from './VehicleImagesModal';

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
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentUserStation, setCurrentUserStation] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    totalCapacity: 0,
    available: 0,
    onTrip: 0,
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Get user profile
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      if (response.data.success) {
        setUserProfile(response.data.data.user);
        return response.data.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Get station admin's assigned station
  const fetchStationAdminStation = async () => {
    try {
      // Get user profile first
      const user = await fetchUserProfile();
      
      if (!user) {
        toast.error('Failed to fetch user profile');
        return null;
      }
      
      if (user.role !== 'station_admin') {
        toast.error('Only station admins can access this page');
        return null;
      }
      
      // IMPORTANT: User model has stationID field
      if (!user.stationID) {
        toast.error('You are not assigned to any station. Please contact super admin.');
        return null;
      }
      
      // Create basic station object from user's stationID
      const stationObject = {
        _id: user.stationID,
        stationName: 'Your Station',
        stationCode: user.stationID.toString().substring(0, 8),
        city: 'Unknown'
      };
      
      // Try to fetch real station details
      try {
        const stationRes = await api.get(`/api/station/${user.stationID}`);
        if (stationRes.data.station) {
          return stationRes.data.station;
        }
      } catch (stationError) {
        console.warn('Could not fetch station details, using basic station object');
      }
      
      return stationObject;
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
      } else {
        toast.error('Failed to fetch user information');
      }
      return null;
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      const station = await fetchStationAdminStation();
      
      if (!station) {
        setVehicles([]);
        setTotalItems(0);
        setStats({ total: 0, active: 0, maintenance: 0, totalCapacity: 0, available: 0, onTrip: 0 });
        setLoading(false);
        return;
      }
      
      setCurrentUserStation(station);
      
      // Fetch vehicles - backend automatically filters by stationID
      const response = await api.get('/api/vehicles');
      console.log('Vehicles API response:', response.data);
      
      if (response.data.success) {
        let vehiclesData = [];
        
        // Extract vehicles from different response structures
        if (response.data.data && response.data.data.vehicles) {
          vehiclesData = response.data.data.vehicles;
        } else if (response.data.vehicles) {
          vehiclesData = response.data.vehicles;
        } else if (Array.isArray(response.data.data)) {
          vehiclesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          vehiclesData = response.data;
        }
        
        console.log('Raw vehicles data:', vehiclesData);
        
        // Normalize vehicle objects
        vehiclesData = vehiclesData.map(vehicle => {
          // Extract station ID
          let stationId = null;
          if (vehicle.stationID) {
            stationId = typeof vehicle.stationID === 'object' 
              ? vehicle.stationID._id || vehicle.stationID 
              : vehicle.stationID;
          } else if (vehicle.station) {
            stationId = typeof vehicle.station === 'object'
              ? vehicle.station._id || vehicle.station
              : vehicle.station;
          }
          
          // Extract driver info
          let driverId = null;
          let driverName = null;
          let driverPhone = null;
          
          if (vehicle.driverID) {
            if (typeof vehicle.driverID === 'object') {
              driverId = vehicle.driverID._id;
              driverName = vehicle.driverID.fullName;
              driverPhone = vehicle.driverID.phoneNumber;
            } else {
              driverId = vehicle.driverID;
            }
          } else if (vehicle.driver) {
            if (typeof vehicle.driver === 'object') {
              driverId = vehicle.driver._id;
              driverName = vehicle.driver.fullName;
              driverPhone = vehicle.driver.phoneNumber;
            } else {
              driverId = vehicle.driver;
            }
          }
          
          // Extract owner details
          const ownerDetails = vehicle.ownerDetails || {};
          
          return {
            ...vehicle,
            stationID: stationId,
            driverID: {
              _id: driverId,
              fullName: driverName,
              phoneNumber: driverPhone
            },
            ownerDetails: {
              ownerName: ownerDetails.ownerName || 'Not specified',
              phoneNumber: ownerDetails.phoneNumber || 'Not specified',
              bankDetails: ownerDetails.bankDetails || {
                bankName: 'Not specified',
                accountNumber: 'Not specified'
              }
            }
          };
        });
        
        console.log('✅ Normalized vehicles:', vehiclesData);
        
        setVehicles(vehiclesData);
        setTotalItems(vehiclesData.length);
        calculateStats(vehiclesData);
      } else {
        toast.error(response.data.message || 'Failed to fetch vehicles');
        setVehicles([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch vehicles';
      
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view vehicles');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
      } else {
        toast.error(errorMsg);
      }
      
      setVehicles([]);
      setTotalItems(0);
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
    const available = vehicleList.filter(v => v.currentStatus === 'available').length;
    const onTrip = vehicleList.filter(v => v.currentStatus === 'on_trip').length;
    const totalCapacity = vehicleList.reduce((sum, v) => sum + (v.totalCapacity || 0), 0);
    
    setStats({ total, active, maintenance, totalCapacity, available, onTrip });
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${vehicle.plateNumber}?`)) return;

    try {
      await api.delete(`/api/vehicles/${vehicle._id}`);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete vehicle';
      
      if (errorMsg.includes('on_trip')) {
        toast.error('Cannot delete a vehicle that is currently on a trip');
      } else if (errorMsg.includes('permission')) {
        toast.error('You do not have permission to delete this vehicle');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleViewImages = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowImagesModal(true);
  };

  const handleStatusUpdate = async (vehicle, status) => {
    try {
      await api.post(`/api/vehicles/${vehicle._id}/status`, { status });
      toast.success(`Vehicle status updated to ${status}`);
      fetchVehicles();
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update status';
      toast.error(errorMsg);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  const handleImagesModalClose = () => {
    setShowImagesModal(false);
    setSelectedVehicle(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Check insurance expiry
  const checkInsuranceStatus = (insuranceExpiry) => {
    if (!insuranceExpiry) return { status: 'unknown', label: 'No insurance' };
    
    const expiryDate = new Date(insuranceExpiry);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (expiryDate < today) {
      return { status: 'expired', label: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: 'Expiring soon' };
    } else {
      return { status: 'valid', label: 'Valid' };
    }
  };

  // Mask account number for display
  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber || accountNumber === 'Not specified') return 'Not specified';
    if (accountNumber.length <= 4) return '****';
    return '****' + accountNumber.slice(-4);
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
          <p className="text-gray-600">
            {currentUserStation ? 
              `Managing vehicles for ${currentUserStation.stationName || 'your station'}` : 
              'Manage fleet vehicles and maintenance'}
          </p>
        </div>
        {currentUserStation && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Vehicle
          </button>
        )}
      </div>

      {/* Station Info Alert */}
      {!currentUserStation ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {userProfile?.stationID 
                  ? 'Your assigned station could not be found. Please contact super admin.'
                  : 'You are not assigned to any station. Please contact super admin to get stationID assigned.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
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
                  <p className="text-sm text-gray-600">Active & Available</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found in your station</h3>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Station: {currentUserStation.stationName || 'Your Station'}
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
                          Driver Assignment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Owner Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Maintenance & Insurance
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
                      {currentVehicles.map((vehicle) => {
                        const insuranceStatus = checkInsuranceStatus(vehicle.insuranceExpiry);
                        
                        return (
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
                                  {/* Image indicator */}
                                  {vehicle.images && vehicle.images.length > 0 && (
                                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      {vehicle.images.length} image(s)
                                    </div>
                                  )}
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
                                {vehicle.driverID?.phoneNumber && (
                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {vehicle.driverID.phoneNumber}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">
                                    {vehicle.ownerDetails.ownerName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {vehicle.ownerDetails.phoneNumber}
                                </div>
                                <div className="mt-1 pt-1 border-t border-gray-100">
                                  <div className="flex items-center gap-1 text-xs">
                                    <CreditCard className="w-3 h-3 text-gray-400" />
                                    <span className="font-medium">{vehicle.ownerDetails.bankDetails.bankName}:</span>
                                    <span className="text-gray-600">
                                      {maskAccountNumber(vehicle.ownerDetails.bankDetails.accountNumber)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm space-y-1">
                                <div>Last Service: {formatDate(vehicle.lastServiceDate)}</div>
                                <div>Next Service: {formatDate(vehicle.nextServiceDate)}</div>
                                {vehicle.insuranceExpiry && (
                                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                    insuranceStatus.status === 'expired' ? 'bg-red-100 text-red-800' :
                                    insuranceStatus.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    Ins. {insuranceStatus.label}: {formatDate(vehicle.insuranceExpiry)}
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
                                  onChange={(e) => handleStatusUpdate(vehicle, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
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
                                  onClick={() => handleViewImages(vehicle)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="View images"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEdit(vehicle)}
                                  className="text-primary-600 hover:text-primary-700"
                                  title="Edit vehicle"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(vehicle)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete vehicle"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
        </>
      )}

      {/* Vehicle Modal */}
      {showModal && (
        <VehicleModal
          isOpen={showModal}
          onClose={handleModalClose}
          vehicle={selectedVehicle}
          onSuccess={fetchVehicles}
          userStation={currentUserStation}
        />
      )}

      {/* Vehicle Images Modal */}
      {showImagesModal && selectedVehicle && (
        <VehicleImagesModal
          isOpen={showImagesModal}
          onClose={handleImagesModalClose}
          vehicle={selectedVehicle}
          userStation={currentUserStation}
        />
      )}
    </div>
  );
}