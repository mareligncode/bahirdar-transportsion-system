import { useState, useEffect } from 'react';
import { 
  Plus, User, Phone, Car, Star, Edit, Trash2,
  Filter, Search, Shield, Calendar, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/auth.service';

export default function Drivers() {
  const { user } = useAuth();

  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 👉 ADD DRIVER STATES (ONLY NEW PART)
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
      if (user?.role !== 'super_admin') {
  setError('Access denied. Station admin only.');
  return;
}

const response = await authService.getStationUsers();
usersData = response.data?.users || [];

    

      const driversList = usersData
        .filter(u => u.role === 'driver')
        .map(d => ({
          id: d._id,
          name: d.fullName,
          email: d.email,
          phone: d.phoneNumber || 'N/A',
          licenseNumber: d.licenseNumber || 'N/A',
          stationID: d.stationID || 'N/A',
          isActive: d.isActive,
          joinedDate: new Date(d.createdAt).toLocaleDateString(),
        }));

      setDrivers(driversList);
      setFilteredDrivers(driversList);
    } catch (err) {
      setError('Failed to load drivers');
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

  // 👉 ADD DRIVER HANDLER (ONLY NEW LOGIC)
 const handleAddDriver = async () => {
  if (!passengerEmail || !licenseNumber) {
    alert('Fill all fields');
    return;
  }

  try {
    setAddingDriver(true);

    // 1️⃣ Get users (station admin can do this)
    const res = await authService.getStationUsers();
    const users = res.users || [];

    // 2️⃣ Find passenger by email
    const passenger = users.find(
      u => u.email === passengerEmail && u.role === 'passenger'
    );

    if (!passenger) {
      alert('Passenger not found');
      return;
    }

    // 3️⃣ Assign passenger as driver (WHAT BACKEND EXPECTS)
   await authService.assignDriver(
  passenger._id,
  licenseNumber,
  user.stationID
);


    alert('Driver added successfully');
    setShowModal(false);
    setPassengerEmail('');
    setLicenseNumber('');
    fetchDrivers();

  } catch (err) {
    console.error(err);
    alert('Failed to add driver');
  } finally {
    setAddingDriver(false);
  }
};


  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Driver
        </button>
      </div>

      <table className="min-w-full border">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>License</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredDrivers.map(d => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.email}</td>
              <td>{d.licenseNumber}</td>
              <td>{d.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 👉 ADD DRIVER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-lg font-bold mb-4">Add Driver</h2>

            <input
              className="input-field w-full mb-3"
              placeholder="Passenger Email"
              value={passengerEmail}
              onChange={e => setPassengerEmail(e.target.value)}
            />

            <input
              className="input-field w-full mb-4"
              placeholder="License Number"
              value={licenseNumber}
              onChange={e => setLicenseNumber(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={handleAddDriver}
                className="btn-primary"
                disabled={addingDriver}
              >
                {addingDriver ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
