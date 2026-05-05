import { useState, useEffect } from 'react';
import { X, Car, Wrench, User, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';

export default function VehicleModal({ isOpen, onClose, vehicle }) {
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
    // New owner details fields
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

  const carTypes = ['coaster', 'bus', 'minibus', 'aba dulla', 'van', 'other'];
  const fuelTypes = ['diesel', 'petrol', 'electric', 'hybrid'];
  const featuresOptions = ['ac', 'wifi', 'entertainment', 'charging_port', 'toilet', 'refreshments'];

  useEffect(() => {
    if (isOpen) {
      fetchStationsAndDrivers();
      if (vehicle) {
        setFormData({
          plateNumber: vehicle.plateNumber || '',
          carType: vehicle.carType || 'coaster',
          totalCapacity: vehicle.totalCapacity || '',
          stationID: vehicle.stationID?._id || '',
          make: vehicle.make || '',
          model: vehicle.model || '',
          year: vehicle.year || new Date().getFullYear(),
          color: vehicle.color || 'white',
          insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '',
          driverID: vehicle.driverID?._id || '',
          fuelType: vehicle.fuelType || 'diesel',
          features: vehicle.features || [],
          // Populate owner details if they exist
          ownerDetails: vehicle.ownerDetails || {
            ownerName: '',
            phoneNumber: '',
            bankDetails: {
              accountNumber: '',
              bankName: ''
            }
          }
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, vehicle]);

  const fetchStationsAndDrivers = async () => {
    try {
      // Fetch stations
      const stationsRes = await api.get('/api/station/active');
      setStations(stationsRes.data.stations || []);

      // Fetch drivers (users with driver role)
      const driversRes = await api.get('/api/auth/all-users');
      const drivers = driversRes.data.data?.users?.filter(user => user.role === 'driver') || [];
      setDrivers(drivers);

    } catch (error) {
      console.error(t('errors.fetchData'), error);
      toast.error(t('messages.failedToLoadFormData'));
    }
  };

  const resetForm = () => {
    setFormData({
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
    } else if (name.startsWith('owner.')) {
      // Handle nested owner details
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        ownerDetails: {
          ...prev.ownerDetails,
          [field]: value
        }
      }));
    } else if (name.startsWith('bank.')) {
      // Handle nested bank details
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        ownerDetails: {
          ...prev.ownerDetails,
          bankDetails: {
            ...prev.ownerDetails.bankDetails,
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        ...formData,
        totalCapacity: parseInt(formData.totalCapacity),
        year: parseInt(formData.year),
      };

      if (vehicle) {
        // Update existing vehicle
        await api.put(`/api/vehicles/${vehicle._id}`, payload);
        toast.success(t('messages.vehicleUpdated'));
      } else {
        // Create new vehicle
        await api.post('/api/vehicles/register', payload);
        toast.success(t('messages.vehicleCreated'));
      }

      onClose();
    } catch (error) {
      console.error(t('errors.saveVehicle'), error);
      toast.error(error.response?.data?.message || t('errors.failedToSaveVehicle'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b rounded-t-lg">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {vehicle ? t('vehicles.editVehicle') : t('vehicles.addNewVehicle')}
                </h2>
                <p className="text-sm text-gray-600">
                  {vehicle ? t('vehicles.updateVehicleDetails') : t('vehicles.registerNewVehicle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title={t('common.closeModal')}
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
                  {t('vehicles.basicInformation')}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.plateNumber')} *
                  </label>
                  <input
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('vehicles.plateNumberPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.vehicleType')} *
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
                        {t(`vehicles.types.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.totalCapacity')} *
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
                    placeholder={t('vehicles.capacityPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.station')} *
                  </label>
                  <select
                    name="stationID"
                    value={formData.stationID}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('vehicles.selectStation')}</option>
                    {stations.map(station => (
                      <option key={station._id} value={station._id}>
                        {station.stationName} ({station.location?.city || station.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  {t('vehicles.specifications')}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('vehicles.make')} *
                    </label>
                    <input
                      type="text"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('vehicles.makePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('vehicles.model')} *
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('vehicles.modelPlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('vehicles.year')} *
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
                      {t('vehicles.color')}
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={t('vehicles.colorPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.fuelType')} *
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
                        {t(`vehicles.fuelTypes.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.insuranceExpiry')} *
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

            {/* Owner Details Section - NEW */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <User className="w-5 h-5" />
                {t('vehicles.ownerDetails')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.ownerName')} *
                  </label>
                  <input
                    type="text"
                    name="owner.ownerName"
                    value={formData.ownerDetails.ownerName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('vehicles.ownerNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.ownerPhone')} *
                  </label>
                  <input
                    type="tel"
                    name="owner.phoneNumber"
                    value={formData.ownerDetails.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('vehicles.ownerPhonePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Bank Details Section - NEW */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5" />
                {t('vehicles.bankDetails')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.bankName')} *
                  </label>
                  <input
                    type="text"
                    name="bank.bankName"
                    value={formData.ownerDetails.bankDetails.bankName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('vehicles.bankNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('vehicles.accountNumber')} *
                  </label>
                  <input
                    type="text"
                    name="bank.accountNumber"
                    value={formData.ownerDetails.bankDetails.accountNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('vehicles.accountNumberPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Driver Assignment */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicles.assignDriver')}
              </label>
              <select
                name="driverID"
                value={formData.driverID}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('vehicles.selectDriver')}</option>
                {drivers.map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.fullName} ({driver.licenseNumber || t('vehicles.noLicense')})
                  </option>
                ))}
              </select>
            </div>

            {/* Features */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vehicles.vehicleFeatures')}
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
                      {t(`vehicles.features.${feature}`)}
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
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.saving') : vehicle ? t('vehicles.updateVehicle') : t('vehicles.createVehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}