import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/common/Layout';
import { 
  User, 
  UserCheck, 
  UserX, 
  Shield, 
  Car, 
  Building,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export default function RoleManagement() {
  const { user, authService } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionType, setActionType] = useState(''); // 'deactivate', 'activate', 'delete'
  const [newRole, setNewRole] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [stationID, setStationID] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changingRole, setChangingRole] = useState(false);


  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      if (user?.role !== 'super_admin') {
        setMessage({ type: 'error', text: 'Unauthorized access' });
        return;
      }

      const response = await authService.getAllUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to fetch users' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  // Filter users based on search and filters
  const filteredUsers = users.filter(userItem => {
    const matchesSearch = 
      userItem.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.phoneNumber?.includes(searchTerm);

    const matchesRole = roleFilter === 'all' || userItem.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && userItem.isActive) ||
      (statusFilter === 'inactive' && !userItem.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get role icon
  const getRoleIcon = (role) => {
    switch(role) {
      case 'super_admin': return <Shield className="w-4 h-4" />;
      case 'station_admin': return <Building className="w-4 h-4" />;
      case 'driver': return <Car className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'station_admin': return 'bg-blue-100 text-blue-800';
      case 'driver': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role display name
  const getRoleDisplay = (role) => {
    const roleMap = {
      'super_admin': 'Super Admin',
      'station_admin': 'Station Admin',
      'driver': 'Driver',
      'passenger': 'Passenger'
    };
    return roleMap[role] || role;
  };

  // Handle change role
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setChangingRole(true);
      setMessage({ type: '', text: '' });
      
      let licenseNumberParam = '';
      let stationIDParam = '';

      if (newRole === 'driver') {
        if (!licenseNumber.trim()) {
          setMessage({ type: 'error', text: 'License number is required for driver role' });
          setChangingRole(false);
          return;
        }
        licenseNumberParam = licenseNumber;
      setMessage({ type: '', text: '' });
      
      // Prepare data based on role
      const data = {
        userId: selectedUser._id,
        newRole
      };

      // Add additional fields based on role
      if (newRole === 'driver') {
        if (!licenseNumber.trim()) {
          setMessage({ type: 'error', text: 'License number is required for driver role' });
          return;
        }
        data.licenseNumber = licenseNumber;
      }

      if (newRole === 'station_admin') {
        if (!stationID.trim()) {
          setMessage({ type: 'error', text: 'Station ID is required for station admin role' });
          setChangingRole(false);
          return;
        }
        stationIDParam = stationID;
      }

      const response = await authService.changeUserRole(
        selectedUser._id,
        newRole,
        licenseNumberParam,
        stationIDParam
          return;
        }
        data.stationID = stationID;
      }

      const response = await authService.changeUserRole(
        data.userId,
        data.newRole,
        data.licenseNumber,
        data.stationID
      );

      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `Role changed to ${getRoleDisplay(newRole)} successfully!` 
        });
        
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u._id === selectedUser._id) {
              const updatedUser = { ...u, role: newRole };
              
              if (newRole === 'driver') {
                updatedUser.licenseNumber = licenseNumberParam;
                updatedUser.stationID = '';
              } else if (newRole === 'station_admin') {
                updatedUser.stationID = stationIDParam;
                updatedUser.licenseNumber = '';
              } else {
                updatedUser.licenseNumber = '';
                updatedUser.stationID = '';
              }
              
              return updatedUser;
            }
            return u;
          })
        );
        
        setTimeout(() => {
          setShowChangeRoleModal(false);
          resetForm();
        }, 300);
        
        // Update local state
        setUsers(users.map(u => 
          u._id === selectedUser._id 
            ? { ...u, role: newRole, licenseNumber, stationID }
            : u
        ));
        
        setShowChangeRoleModal(false);
        resetForm();
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change role' });
    } finally {
      setChangingRole(false);
    }
  };

      console.error('Error changing role:', error);
      setMessage({ type: 'error', text: 'Failed to change role' });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      setMessage({ type: '', text: '' });
      
      const response = await authService.toggleUserStatus(selectedUser._id);

      if (response.success) {
        const newStatus = !selectedUser.isActive;
        
        setMessage({ 
          type: 'success', 
          text: `User ${newStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u._id === selectedUser._id ? { ...u, isActive: newStatus } : u
          )
        );
        // Update local state
        setUsers(users.map(u => 
          u._id === selectedUser._id ? { ...u, isActive: newStatus } : u
        ));
        
        setShowConfirmDialog(false);
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setNewRole('');
    setLicenseNumber('');
    setStationID('');
    setChangingRole(false);
  };

  };

  // Open change role modal
  const openChangeRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setLicenseNumber(user.licenseNumber || '');
    setStationID(user.stationID || '');
    setShowChangeRoleModal(true);
    setMessage({ type: '', text: '' });
  };

  // Open confirm dialog
  const openConfirmDialog = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowConfirmDialog(true);
  };

  // Export users to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'],
      ...users.map(u => [
        u.fullName,
        u.email,
        u.phoneNumber,
        getRoleDisplay(u.role),
        u.isActive ? 'Active' : 'Inactive',
        new Date(u.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access role management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Manage user roles, permissions, and status</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              {message.type === 'error' ? 'Error' : 'Success'}
            </p>
            <p className="text-sm mt-1">{message.text}</p>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="station_admin">Station Admin</option>
              <option value="driver">Driver</option>
              <option value="passenger">Passenger</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button 
            onClick={fetchUsers}
            className="btn-primary flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <UserX className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">User</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Contact</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Joined</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-primary-600">
                            {userItem.fullName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{userItem.fullName}</p>
                          <p className="text-sm text-gray-500">ID: {userItem._id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium">{userItem.email}</p>
                      <p className="text-sm text-gray-500">{userItem.phoneNumber}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded ${getRoleColor(userItem.role)}`}>
                          {getRoleIcon(userItem.role)}
                        </span>
                        <span className="font-medium">{getRoleDisplay(userItem.role)}</span>
                      </div>
                      {userItem.licenseNumber && (
                        <p className="text-xs text-gray-500 mt-1">License: {userItem.licenseNumber}</p>
                      )}
                      {userItem.stationID && (
                        <p className="text-xs text-gray-500 mt-1">Station: {userItem.stationID}</p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        userItem.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowUserDetails(true) || setSelectedUser(userItem)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => openChangeRoleModal(userItem)}
                          className="p-2 hover:bg-blue-50 rounded"
                          title="Change Role"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => openConfirmDialog(
                            userItem, 
                            userItem.isActive ? 'deactivate' : 'activate'
                          )}
                          className="p-2 hover:bg-yellow-50 rounded"
                          title={userItem.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {userItem.isActive ? (
                            <UserX className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showChangeRoleModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChangeRoleModal(false);
              resetForm();
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Change User Role</h3>
                <button
                  onClick={() => {
                    setShowChangeRoleModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
      {/* Change Role Modal */}
      {showChangeRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Change User Role</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">User:</p>
                  <p className="font-medium">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400">Current role: {getRoleDisplay(selectedUser.role)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Select Role</option>
                    <option value="passenger">Passenger</option>
                    <option value="driver">Driver</option>
                    <option value="station_admin">Station Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {newRole === 'driver' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="input-field w-full"
                      placeholder="Enter license number"
                      required
                    />
                  </div>
                )}

                {newRole === 'station_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Station ID *
                    </label>
                    <input
                      type="text"
                      value={stationID}
                      onChange={(e) => setStationID(e.target.value)}
                      className="input-field w-full"
                      placeholder="Enter station ID"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChangeRoleModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                  disabled={changingRole}
                  onClick={() => setShowChangeRoleModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeRole}
                  className="btn-primary flex items-center justify-center gap-2"
                  disabled={!newRole || changingRole}
                >
                  {changingRole ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                  className="btn-primary"
                  disabled={!newRole}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmDialog(false);
            }
          }}
        >
      {/* Confirm Dialog */}
      {showConfirmDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${
                  actionType === 'deactivate' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  {actionType === 'deactivate' ? (
                    <UserX className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <UserCheck className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold">
                  {actionType === 'deactivate' ? 'Deactivate User' : 'Activate User'}
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                {actionType === 'deactivate' 
                  ? `Are you sure you want to deactivate ${selectedUser.fullName}? They will no longer be able to access the system.`
                  : `Are you sure you want to activate ${selectedUser.fullName}? They will regain access to the system.`
                }
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`btn ${
                    actionType === 'deactivate' 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {actionType === 'deactivate' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  );
}