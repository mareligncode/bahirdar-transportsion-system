import { Plus, Car, Wrench, Fuel, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

const mockVehicles = [
  {
    id: 'VH-001',
    plateNumber: 'ET-1234',
    type: 'luxury_bus',
    capacity: 45,
    driver: 'Tsegaye Lemma',
    status: 'active',
    lastMaintenance: '2024-10-15',
    nextMaintenance: '2024-11-15',
    fuelType: 'Diesel',
    year: 2022,
  },
  {
    id: 'VH-002',
    plateNumber: 'ET-5678',
    type: 'coaster',
    capacity: 28,
    driver: 'Abeba Girma',
    status: 'active',
    lastMaintenance: '2024-10-10',
    nextMaintenance: '2024-11-10',
    fuelType: 'Diesel',
    year: 2021,
  },
  {
    id: 'VH-003',
    plateNumber: 'ET-9012',
    type: 'minibus',
    capacity: 18,
    driver: 'Not Assigned',
    status: 'maintenance',
    lastMaintenance: '2024-10-05',
    nextMaintenance: '2024-10-25',
    fuelType: 'Petrol',
    year: 2020,
  },
  {
    id: 'VH-004',
    plateNumber: 'ET-3456',
    type: 'luxury_bus',
    capacity: 45,
    driver: 'Not Assigned',
    status: 'inactive',
    lastMaintenance: '2024-09-20',
    nextMaintenance: '2024-10-20',
    fuelType: 'Diesel',
    year: 2023,
  },
];

const statusColors = {
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-red-100 text-red-800',
};

const typeLabels = {
  luxury_bus: 'Luxury Bus',
  coaster: 'Coaster',
  minibus: 'Minibus',
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
              <p className="text-2xl font-bold">{vehicles.length}</p>
            </div>
            <Car className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-bold">
                {vehicles.filter(v => v.status === 'active').length}
              </p>
            </div>
            <Car className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Under Maintenance</p>
              <p className="text-2xl font-bold">
                {vehicles.filter(v => v.status === 'maintenance').length}
              </p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold">
                {vehicles.reduce((sum, v) => sum + v.capacity, 0)}
              </p>
            </div>
            <Fuel className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card overflow-hidden">
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
                  Driver
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
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <Car className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                        <div className="text-sm text-gray-500">
                          {typeLabels[vehicle.type]} • {vehicle.year}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">Capacity: {vehicle.capacity} seats</div>
                      <div className="text-sm text-gray-600">
                        Fuel: {vehicle.fuelType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{vehicle.driver}</div>
                      <div className="text-sm text-gray-600">
                        {vehicle.driver === 'Not Assigned' ? 'Available for assignment' : 'Assigned'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm">
                        <div>Last: {formatDate(vehicle.lastMaintenance)}</div>
                        <div>Next: {formatDate(vehicle.nextMaintenance)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button className="text-primary-600 hover:text-primary-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(vehicle.id)}
                        className="text-red-600 hover:text-red-700"
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
      </div>
    </div>
  );
}