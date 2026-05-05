import { useState, useEffect } from 'react';
import { X, Car, Wrench, User, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';

export default function VehicleModal({ isOpen, onClose, vehicle, onSuccess, userStation }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    plateNumber: '',
    carType: 'coaster',
    totalCapacity: '',
    stationID: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: 'white',
    insuranceExpiry: '',
    driverID: '',
    fuelType: 'diesel',
    features: [],
    ownerDetails: {
      ownerName: '',
      phoneNumber: '',
      bankDetails: {
        accountNumber: '',
        bankName: ''
      }
    }
  });

  const [stations, setStations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);

  const carTypes = ['coaster', 'bus', 'minibus', 'aba dulla', 'van', 'other'];
  const fuelTypes = ['diesel', 'petrol', 'electric', 'hybrid'];
  const featuresOptions = ['ac', 'wifi', 'entertainment', 'charging_port', 'toilet', 'refreshments'];

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      if (response.data.success) {
        setUserProfile(response.data.data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Initialize modal once when it opens
  useEffect(() => {
    if (isOpen && !initialized) {
      fetchStationsAndDrivers();
      setInitialized(true);
    }

    // Reset when modal closes
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen, initialized]);

  // Set form data when vehicle or stations data is available
  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        // EDIT MODE - Extract stationID from multiple possible locations
        let stationID = '';

        if (vehicle.stationID) {
          stationID = typeof vehicle.stationID === 'object'
            ? vehicle.stationID._id || vehicle.stationID
            : vehicle.stationID;
        } else if (vehicle.station) {
          stationID = typeof vehicle.station === 'object'
            ? vehicle.station._id || vehicle.station
            : vehicle.station;
        }

        // Extract driverID from multiple possible locations
        let driverID = '';
        if (vehicle.driverID) {
          driverID = typeof vehicle.driverID === 'object'
            ? vehicle.driverID._id || vehicle.driverID
            : vehicle.driverID;
        } else if (vehicle.driver) {
          driverID = typeof vehicle.driver === 'object'
            ? vehicle.driver._id || vehicle.driver
            : vehicle.driver;
        }

        // Extract owner details if they exist
        const ownerDetails = vehicle.ownerDetails || {
          ownerName: '',
          phoneNumber: '',
          bankDetails: {
            accountNumber: '',
            bankName: ''
          }
        };

        setFormData({
          plateNumber: vehicle.plateNumber || '',
          carType: vehicle.carType || 'coaster',
          totalCapacity: vehicle.totalCapacity || '',
          stationID: stationID,
          make: vehicle.make || '',
          model: vehicle.model || '',
          year: vehicle.year || new Date().getFullYear(),
          color: vehicle.color || 'white',
          insuranceExpiry: vehicle.insuranceExpiry ? formatDateForInput(vehicle.insuranceExpiry) : '',
          driverID: driverID,
          fuelType: vehicle.fuelType || 'diesel',
          features: vehicle.features || [],
          ownerDetails: ownerDetails
        });

        // Show owner details section if they exist
        if (ownerDetails.ownerName || ownerDetails.phoneNumber ||
          ownerDetails.bankDetails?.accountNumber || ownerDetails.bankDetails?.bankName) {
          setShowOwnerDetails(true);
        }
      } else {
        // CREATE MODE - Use station from props or user profile
        let defaultStationID = '';

        if (userStation?._id) {
          defaultStationID = userStation._id;
        } else if (userProfile?.stationID) {
          defaultStationID = userProfile.stationID;
        } else if (stations.length > 0) {
          defaultStationID = stations[0]?._id || '';
        }

        setFormData({
          plateNumber: '',
          carType: 'coaster',
          totalCapacity: '',
          stationID: defaultStationID,
          make: '',
          model: '',
          year: new Date().getFullYear(),
          color: 'white',
          insuranceExpiry: '',
          driverID: '',
          fuelType: 'diesel',
          features: [],
          ownerDetails: {
            ownerName: '',
            phoneNumber: '',
            bankDetails: {
              accountNumber: '',
              bankName: ''
            }
          }
        });
        setShowOwnerDetails(false);
      }
    }
  }, [isOpen, vehicle, stations, userStation, userProfile]);

  // Format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const fetchStationsAndDrivers = async () => {
    try {
      // Fetch stations
      const stationsRes = await api.get('/api/station');
      let stationsData = [];

      if (stationsRes.data.stations) {
        stationsData = stationsRes.data.stations;
      } else if (stationsRes.data.data?.stations) {
        stationsData = stationsRes.data.data.stations;
      } else if (Array.isArray(stationsRes.data)) {
        stationsData = stationsRes.data;
      }

      setStations(stationsData);

      // Fetch drivers from station-users endpoint
      const usersRes = await api.get('/api/auth/station-users');
      let usersData = [];

      if (usersRes.data.data?.users) {
        usersData = usersRes.data.data.users;
      } else if (usersRes.data.users) {
        usersData = usersRes.data.users;
      } else if (Array.isArray(usersRes.data.data)) {
        usersData = usersRes.data.data;
      }

      // Filter only active drivers
      const driversData = usersData
        .filter(user => user && user.role === 'driver' && user.isActive === true);

      console.log('Available drivers:', driversData);
      setDrivers(driversData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('Failed to load form data'));
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const isChecked = e.target.checked;
      const feature = e.target.value;

      setFormData(prev => ({
        ...prev,
        features: isChecked
          ? [...prev.features, feature]
          : prev.features.filter(f => f !== feature)
      }));
    } else if (name.startsWith('ownerDetails.')) {
      // Handle nested owner details fields
      const fieldPath = name.split('.');
      if (fieldPath.length === 2) {
        // ownerDetails.field
        setFormData(prev => ({
          ...prev,
          ownerDetails: {
            ...prev.ownerDetails,
            [fieldPath[1]]: value
          }
        }));
      } else if (fieldPath.length === 3) {
        // ownerDetails.bankDetails.field
        setFormData(prev => ({
          ...prev,
          ownerDetails: {
            ...prev.ownerDetails,
            bankDetails: {
              ...prev.ownerDetails.bankDetails,
              [fieldPath[2]]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.plateNumber || !formData.totalCapacity || !formData.make || !formData.model || !formData.insuranceExpiry) {
      toast.error(t('please_fill_required_fields'));
      return;
    }

    if (!formData.stationID) {
      toast.error(t('station_required'));
      return;
    }

    // Validate owner details for new vehicles
    if (!vehicle) {
      const { ownerDetails } = formData;
      if (!ownerDetails.ownerName || !ownerDetails.phoneNumber ||
        !ownerDetails.bankDetails.accountNumber || !ownerDetails.bankDetails.bankName) {
        toast.error(t('owner_details_required_new_vehicle'));
        return;
      }
    }

    try {
      setLoading(true);

      // Prepare payload according to backend expectations
      const payload = {
        plateNumber: formData.plateNumber.toUpperCase().trim(),
        carType: formData.carType,
        totalCapacity: parseInt(formData.totalCapacity),
        stationID: formData.stationID,
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        color: formData.color.trim(),
        insuranceExpiry: formData.insuranceExpiry,
        fuelType: formData.fuelType,
        features: formData.features,
        ownerDetails: formData.ownerDetails
      };

      // Add driverID only if selected
      if (formData.driverID) {
        payload.driverID = formData.driverID;
      }

      if (vehicle) {
        // Update existing vehicle
        await api.put(`/api/vehicles/${vehicle._id}`, payload);
        toast.success(t('vehicle_updated_successfully'));
      } else {
        // Create new vehicle
        await api.post('/api/vehicles/register', payload);
        toast.success(t('vehicle_created_successfully'));
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save vehicle';

      // Handle specific errors
      if (errorMsg.includes('Plate number') || errorMsg.includes('plateNumber')) {
        toast.error(t('plate_number_exists'));
      } else if (errorMsg.includes('Station') || errorMsg.includes('stationID')) {
        toast.error(t('invalid_station_selected'));
      } else if (errorMsg.includes('driverID') || errorMsg.includes('driver')) {
        toast.error(t('invalid_driver_selected'));
      } else if (errorMsg.includes('owner') || errorMsg.includes('Owner')) {
        toast.error(t('provide_owner_details'));
      } else if (errorMsg.includes('permission') || error.response?.status === 403) {
        toast.error(t('no_permission_action'));
      } else if (error.response?.status === 401) {
        toast.error(t('Session expired. Please login again.'));
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b rounded-t-lg">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {vehicle ? t('edit_vehicle') : t('create_vehicle')}
                </h2>
                <p className="text-sm text-gray-600">
                  {userStation?.stationName
                    ? `${t('station')}: ${userStation.stationName} (${userStation.city || ''})`
                    : userProfile?.stationID
                      ? t('register_new_vehicle_station_hint')
                      : t('register_new_vehicle_hint')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Basic Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('plate_number')} *
                  </label>
                  <input
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ET-1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicle_type')} *
                  </label>
                  <select
                    name="carType"
                    value={formData.carType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {carTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('total_capacity')} *
                  </label>
                  <input
                    type="number"
                    name="totalCapacity"
                    value={formData.totalCapacity}
                    onChange={handleChange}
                    required
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="45"
                  />
                </div>

                {/* Station selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('station')} *
                  </label>
                  <select
                    name="stationID"
                    value={formData.stationID}
                    onChange={handleChange}
                    required
                    disabled={stations.length <= 1 || !!userStation}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {stations.length > 0 ? (
                      stations.map(station => (
                        <option key={station._id} value={station._id}>
                          {station.stationName} ({station.city})
                        </option>
                      ))
                    ) : (
                      <option value={formData.stationID}>
                        {userStation?.stationName || t('station')}
                      </option>
                    )}
                  </select>
                  {(stations.length <= 1 || userStation) && (
                    <p className="text-xs text-gray-600 mt-1">
                      {t('only_active_drivers_hint')}
                    </p>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  {t('specifications')}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('make')} *
                    </label>
                    <input
                      type="text"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Toyota"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('model')} *
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Coaster"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('year')} *
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      required
                      min="1980"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('color')}
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="White"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('fuel_type')} *
                  </label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {fuelTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('insurance_expiry')} *
                  </label>
                  <input
                    type="date"
                    name="insuranceExpiry"
                    value={formData.insuranceExpiry}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Driver Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('assign_driver_optional')}
              </label>
              <select
                name="driverID"
                value={formData.driverID}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('no_driver_assigned')}</option>
                {drivers.map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.fullName} {driver.licenseNumber ? `(${driver.licenseNumber})` : ''}
                  </option>
                ))}
                {drivers.length === 0 && (
                  <option value="" disabled>{t('no_driver_assigned')}</option>
                )}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {t('only_active_drivers_hint')}
              </p>
            </div>

            {/* Owner Details Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('owner_details')}
                </h3>
                {!vehicle && (
                  <button
                    type="button"
                    onClick={() => setShowOwnerDetails(!showOwnerDetails)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showOwnerDetails ? t('hide_owner_details') : t('add_owner_details')}
                  </button>
                )}
              </div>

              {(showOwnerDetails || vehicle) && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    {t('owner_details_required_hint')}
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('owner_name')} *
                    </label>
                    <input
                      type="text"
                      name="ownerDetails.ownerName"
                      value={formData.ownerDetails.ownerName}
                      onChange={handleChange}
                      required={!vehicle}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('owner_phone')} *
                    </label>
                    <input
                      type="tel"
                      name="ownerDetails.phoneNumber"
                      value={formData.ownerDetails.phoneNumber}
                      onChange={handleChange}
                      required={!vehicle}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+251912345678"
                    />
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="text-md font-medium text-gray-800 flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4" />
                      {t('bank_details')}
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('bank_name')} *
                        </label>
                        <input
                          type="text"
                          name="ownerDetails.bankDetails.bankName"
                          value={formData.ownerDetails.bankDetails.bankName}
                          onChange={handleChange}
                          required={!vehicle}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Commercial Bank of Ethiopia"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('account_number')} *
                        </label>
                        <input
                          type="text"
                          name="ownerDetails.bankDetails.accountNumber"
                          value={formData.ownerDetails.bankDetails.accountNumber}
                          onChange={handleChange}
                          required={!vehicle}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="1000001234567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vehicle_features')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featuresOptions.map(feature => (
                  <label key={feature} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={feature}
                      checked={formData.features.includes(feature)}
                      onChange={handleChange}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {feature.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Form */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 bg-white border-t p-6 rounded-b-lg">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={loading}
            >
              {t('Cancel')}
            </button>

            <button
              type="submit"
              disabled={loading || !formData.stationID}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : vehicle ? t('update_vehicle') : t('create_vehicle')}
            </button>
          </div>
          {!formData.stationID && (
            <p className="text-sm text-red-600 mt-2 text-center">
              {t('station_info_required')}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}