import { useState, useEffect } from 'react';
import { 
  Plus, User, Phone, Car, Star, Edit, Trash2,
  Filter, Search, Shield, Calendar, RefreshCw,
  Eye, ToggleLeft, ToggleRight, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/auth.service';
import { useTranslation } from '../../hooks/useTranslation';

export default function Drivers() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add Driver States
  const [showModal, setShowModal] = useState(false);
  const [passengerEmail, setPassengerEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [addingDriver, setAddingDriver] = useState(false);

  // View Driver Details
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Toggle Status
  const [togglingId, setTogglingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);

      let usersData = [];
      
      if (user?.role === 'super_admin') {
        const res = await authService.getAllUsers();
        usersData = res.data?.users || res.data || [];
      } else if (user?.role === 'station_admin') {
        // ✅ Check if station_admin has stationID
        if (!user.stationID) {
          setError(t('no_station_assigned'));
          setLoading(false);
          return;
        }
        const res = await authService.getStationUsers();
        usersData = res.users || res.data?.users || [];
      } else {
        setError(t('access_denied'));
        return;
      }

      const driversList = usersData
        .filter(u => u.role === 'driver')
        .map(d => ({
          id: d._id,
          name: d.fullName,
          email: d.email,
          phone: d.phoneNumber || t('na'),
          licenseNumber: d.licenseNumber || t('na'),
          stationID: d.stationID || (d.stationId?.toString()) || t('na'),
          isActive: d.isActive,
          joinedDate: new Date(d.createdAt).toLocaleDateString(),
          lastLogin: d.lastLogin ? new Date(d.lastLogin).toLocaleDateString() : t('never'),
          emergencyContact: d.emergencyContact || t('na'),
          profileImage: d.profileImage
        }));

      setDrivers(driversList);
      setFilteredDrivers(driversList);
    } catch (err) {
      console.error('Fetch drivers error:', err);
      setError(t('failed_to_load_drivers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDrivers();
  }, [user]);

  useEffect(() => {
    let list = [...drivers];

    if (searchTerm) {
      list = list.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter(d =>
        statusFilter === 'active' ? d.isActive : !d.isActive
      );
    }

    setFilteredDrivers(list);
  }, [searchTerm, statusFilter, drivers]);

  // ✅ FIXED: Handle add driver with correct parameter format
  const handleAddDriver = async () => {
    if (!passengerEmail || !licenseNumber) {
      setError(t('fill_all_fields'));
      return;
    }

    try {
      setAddingDriver(true);
      setError(null);

      // Get station users to find passenger
      const res = await authService.getStationUsers();
      const users = res.users || res.data?.users || [];

      const passenger = users.find(
        u => u.email === passengerEmail && u.role === 'passenger'
      );

      if (!passenger) {
        setError(t('passenger_not_found'));
        return;
      }

      // ✅ FIXED: Call with correct parameters (not object)
      const response = await authService.assignDriver(
        passenger._id,
        licenseNumber,
        user.stationID // Pass stationID for station_admin
      );

      if (response.success !== false) {
        setSuccess(t('driver_added_successfully'));
        setShowModal(false);
        setPassengerEmail('');
        setLicenseNumber('');
        fetchDrivers();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Add driver error:', err);
      setError(err.response?.data?.message || t('failed_to_add_driver'));
    } finally {
      setAddingDriver(false);
    }
  };

  // ✅ NEW: Toggle driver status
  const handleToggleStatus = async (driverId, currentStatus) => {
    try {
      setTogglingId(driverId);
      setError(null);
      
      const response = await authService.toggleUserStatus(driverId);
      
      if (response.success !== false) {
        setSuccess(currentStatus ? t('driver_deactivated') : t('driver_activated'));
        
        // Update local state
        setDrivers(drivers.map(d => 
          d.id === driverId ? { ...d, isActive: !currentStatus } : d
        ));
        
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(err.response?.data?.message || t('failed_to_toggle_status'));
    } finally {
      setTogglingId(null);
    }
  };

  // ✅ NEW: View driver details
  const handleViewDriver = (driver) => {
    setSelectedDriver(driver);
    setShowViewModal(true);
  };

  const clearNotifications = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  useEffect(() => {
    if (error || success) {
      clearNotifications();
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('drivers')}</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchDrivers}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title={t('refresh')}
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> {t('add_driver')}
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_drivers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-40"
        >
          <option value="all">{t('all_status')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>

      {/* Drivers Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('total_drivers')}</p>
              <p className="text-2xl font-bold">{drivers.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('active_drivers')}</p>
              <p className="text-2xl font-bold text-green-600">
                {drivers.filter(d => d.isActive).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('inactive_drivers')}</p>
              <p className="text-2xl font-bold text-red-600">
                {drivers.filter(d => !d.isActive).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('driver')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('contact')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('license')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('station')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('joined')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? t('no_drivers_match_filters') 
                    : t('no_drivers_found')}
                </td>
              </tr>
            ) : (
              filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mr-3">
                        {driver.profileImage ? (
                          <img 
                            src={driver.profileImage} 
                            alt={driver.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{driver.name}</span>
                        <div className="text-sm text-gray-500">{driver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-700">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {driver.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {driver.licenseNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {driver.stationID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      driver.isActive 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {driver.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {driver.joinedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDriver(driver)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('view_details')}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(driver.id, driver.isActive)}
                        disabled={togglingId === driver.id}
                        className={`p-1.5 rounded-lg transition-colors ${
                          driver.isActive
                            ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title={driver.isActive ? t('deactivate') : t('activate')}
                      >
                        {togglingId === driver.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : driver.isActive ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('add_new_driver')}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('passenger_email')}
                  </label>
                  <input
                    type="email"
                    className="input-field w-full"
                    placeholder={t('enter_passenger_email')}
                    value={passengerEmail}
                    onChange={e => setPassengerEmail(e.target.value)}
                    disabled={addingDriver}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('passenger_email_hint')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('license_number')}
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder={t('enter_license_number')}
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    disabled={addingDriver}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={addingDriver}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddDriver}
                  disabled={addingDriver || !passengerEmail || !licenseNumber}
                  className="btn-primary px-4 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingDriver ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('adding')}...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {t('add_driver')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Driver Details Modal */}
      {showViewModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('driver_details')}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Driver Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                    {selectedDriver.profileImage ? (
                      <img 
                        src={selectedDriver.profileImage} 
                        alt={selectedDriver.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDriver.name}</h3>
                    <p className="text-sm text-gray-500">{selectedDriver.email}</p>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedDriver.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedDriver.isActive ? t('active') : t('inactive')}
                      </span>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Driver Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">
                      {t('phone_number')}
                    </label>
                    <p className="font-medium flex items-center gap-1 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedDriver.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">
                      {t('license_number')}
                    </label>
                    <p className="font-medium font-mono mt-1">
                      {selectedDriver.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">
                      {t('station_id')}
                    </label>
                    <p className="font-medium mt-1">
                      {selectedDriver.stationID}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">
                      {t('emergency_contact')}
                    </label>
                    <p className="font-medium mt-1">
                      {selectedDriver.emergencyContact}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">
                      {t('joined_date')}
                    </label>
                    <p className="font-medium flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {selectedDriver.joinedDate}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">
                      {t('last_login')}
                    </label>
                    <p className="font-medium mt-1">
                      {selectedDriver.lastLogin}
                    </p>
                  </div>
                </div>

                {/* Driver ID */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">
                    {t('driver_id')}
                  </label>
                  <p className="font-mono text-sm mt-1 break-all">
                    {selectedDriver.id}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleToggleStatus(selectedDriver.id, selectedDriver.isActive);
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    selectedDriver.isActive
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {selectedDriver.isActive ? t('deactivate') : t('activate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Divider component
const Divider = () => (
  <div className="border-t border-gray-200 my-4"></div>
);