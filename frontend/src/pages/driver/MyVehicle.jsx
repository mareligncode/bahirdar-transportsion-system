import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import {
  TruckIcon,
  CalendarIcon,
  WrenchIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const MyVehicle = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: vehicleData, isLoading } = useQuery({
    queryKey: ['myVehicle'],
    queryFn: async () => {
      const response = await api.get('/api/vehicles', {
        params: { driverID: user?._id }
      });
      return response.data;
    }
  });

  const vehicle = vehicleData?.data?.vehicles?.[0] || vehicleData?.vehicles?.[0];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {t('Back')}
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('No vehicle assigned')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t("You don't have any vehicle assigned to you yet.")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('Back')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('My Vehicle')}</h1>
          <p className="text-sm text-gray-600 mt-1">{vehicle.plateNumber}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Image */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {vehicle.images && vehicle.images.length > 0 ? (
                <img
                  src={vehicle.images.find(img => img.isPrimary)?.url || vehicle.images[0].url}
                  alt={vehicle.plateNumber}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <TruckIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}

              <div className="p-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">{t('Vehicle Gallery')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {vehicle.images?.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`${vehicle.plateNumber} - ${index + 1}`}
                      className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('Basic Information')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Make')}</p>
                  <p className="text-base text-gray-900">{vehicle.make}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Model')}</p>
                  <p className="text-base text-gray-900">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Year')}</p>
                  <p className="text-base text-gray-900">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Color')}</p>
                  <p className="text-base text-gray-900 capitalize">{t(vehicle.color)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Type')}</p>
                  <p className="text-base text-gray-900 capitalize">{t(vehicle.carType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('Capacity')}</p>
                  <p className="text-base text-gray-900">{vehicle.totalCapacity} {t('seats')}</p>
                </div>
              </div>
            </div>

            {/* Status & Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('Status & Documents')}</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-full ${vehicle.currentStatus === 'active' ? 'bg-green-100' :
                        vehicle.currentStatus === 'maintenance' ? 'bg-red-100' :
                          vehicle.currentStatus === 'on_trip' ? 'bg-blue-100' :
                            'bg-gray-100'
                      }`}>
                      <TruckIcon className={`h-5 w-5 ${vehicle.currentStatus === 'active' ? 'text-green-600' :
                          vehicle.currentStatus === 'maintenance' ? 'text-red-600' :
                            vehicle.currentStatus === 'on_trip' ? 'text-blue-600' :
                              'text-gray-600'
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Current Status')}</p>
                      <p className="text-base font-semibold text-gray-900 capitalize">
                        {t(vehicle.currentStatus)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Mileage')}</p>
                      <p className="text-base font-semibold text-gray-900">
                        {vehicle.mileage?.toLocaleString()} {t('km')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-full ${new Date(vehicle.insuranceExpiry) > new Date() ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <ShieldCheckIcon className={`h-5 w-5 ${new Date(vehicle.insuranceExpiry) > new Date() ? 'text-green-600' : 'text-red-600'
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Insurance')}</p>
                      <p className="text-base font-semibold text-gray-900">
                        {format(new Date(vehicle.insuranceExpiry), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(vehicle.insuranceExpiry) > new Date()
                          ? `${Math.ceil((new Date(vehicle.insuranceExpiry) - new Date()) / (1000 * 60 * 60 * 24))} ${t('days remaining')}`
                          : t('Expired')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${vehicle.nextServiceDate && new Date(vehicle.nextServiceDate) > new Date()
                        ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                      <WrenchIcon className={`h-5 w-5 ${vehicle.nextServiceDate && new Date(vehicle.nextServiceDate) > new Date()
                          ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('Next Service')}</p>
                      <p className="text-base font-semibold text-gray-900">
                        {vehicle.nextServiceDate
                          ? format(new Date(vehicle.nextServiceDate), 'MMM dd, yyyy')
                          : t('Not scheduled')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('Features')}</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {t(feature)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance History */}
            {vehicle.maintenanceLog && vehicle.maintenanceLog.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('Maintenance History')}</h2>
                <div className="space-y-4">
                  {vehicle.maintenanceLog.slice(0, 5).map((record, index) => (
                    <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{record.description}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {t('ETB')} {record.cost?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{record.mileage?.toLocaleString()} {t('km')}</p>
                        </div>
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyVehicle;