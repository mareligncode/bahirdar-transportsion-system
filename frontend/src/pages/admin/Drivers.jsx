import { useState, useEffect } from 'react';
import { 
  Plus, User, Phone, Car, Star, Edit, Trash2,
  Filter, Search, Shield, Calendar, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/auth.service';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

export default function Drivers() {
  const { user } = useAuth();
  const { t } = useTranslation(); // ✅ ADD THIS

  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Driver States
  const [showModal, setShowModal] = useState(false);
  const [passengerEmail, setPassengerEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [addingDriver, setAddingDriver] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);

      let usersData = [];
      if (user?.role === 'super_admin') {
        const res = await authService.getAllUsers();
        usersData = res.users || [];
      } else if (user?.role === 'station_admin') {
        const res = await authService.getStationUsers();
        usersData = res.users || [];
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
          stationID: d.stationID || t('na'),
          isActive: d.isActive,
          joinedDate: new Date(d.createdAt).toLocaleDateString(),
        }));

      setDrivers(driversList);
      setFilteredDrivers(driversList);
    } catch (err) {
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
        d.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter(d =>
        statusFilter === 'active' ? d.isActive : !d.isActive
      );
    }

    setFilteredDrivers(list);
  }, [searchTerm, statusFilter, drivers]);

  const handleAddDriver = async () => {
    if (!passengerEmail || !licenseNumber) {
      alert(t('fill_all_fields'));
      return;
    }

    try {
      setAddingDriver(true);

      const res = await authService.getStationUsers();
      const users = res.users || [];

      const passenger = users.find(
        u => u.email === passengerEmail && u.role === 'passenger'
      );

      if (!passenger) {
        alert(t('passenger_not_found'));
        return;
      }

      await authService.assignDriver({
        passengerId: passenger._id,
        licenseNumber,
        stationID: user.stationID
      });

      alert(t('driver_added_successfully'));
      setShowModal(false);
      setPassengerEmail('');
      setLicenseNumber('');
      fetchDrivers();

    } catch (err) {
      console.error(err);
      alert(t('failed_to_add_driver'));
    } finally {
      setAddingDriver(false);
    }
  };

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('drivers')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> {t('add_driver')}
        </button>
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

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('email')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('phone')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('license')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('station_id')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('joined_date')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {t('no_drivers_found')}
                </td>
              </tr>
            ) : (
              filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="font-medium">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{driver.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{driver.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{driver.licenseNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{driver.stationID}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.joinedDate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">{t('add_driver')}</h2>
            
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
                />
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
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddDriver}
                disabled={addingDriver}
                className="btn-primary px-4 py-2 text-sm font-medium flex items-center gap-2"
              >
                {addingDriver ? t('adding') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}