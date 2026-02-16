import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
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
  ChevronDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Award,
  Key,
  Info
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../services/api';

export default function RoleManagement() {
  const { user, authService } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStations, setLoadingStations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [newRole, setNewRole] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [stationID, setStationID] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changingRole, setChangingRole] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ Get initial super admin email from env or use default
  const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'superadmin@bahirdar.com';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      if (user?.role !== 'super_admin') {
        setMessage({ type: 'error', text: t('unauthorized_access') });
        return;
      }

      const response = await authService.getAllUsers();
      
      // ✅ FIXED: Handle response structure correctly
      if (response.success) {
        // authService.getAllUsers returns { success, data: { users } }
        const usersData = response.data?.users || response.data || [];
        setUsers(usersData);
      } else {
        setMessage({ type: 'error', text: response.message || t('failed_to_fetch_users') });
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setMessage({ type: 'error', text: t('failed_to_load_users') });
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Proper station fetching function
  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      console.log('Fetching stations...');
      
      const response = await api.get('/api/station');
      
      console.log('Stations API full response:', response);
      console.log('Stations API response data:', response.data);
      
      let stationsList = [];
      
      // Handle different response structures
      if (response.data?.data?.stations) {
        stationsList = response.data.data.stations;
      } else if (response.data?.stations) {
        stationsList = response.data.stations;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        stationsList = response.data.data;
      } else if (Array.isArray(response.data)) {
        stationsList = response.data;
      }
      
      console.log('Processed stations list:', stationsList);
      setStations(stationsList);
      
    } catch (err) {
      console.error('Error fetching stations:', err);
      console.error('Error details:', err.response?.data || err.message);
      setStations([]);
      
      setMessage({ 
        type: 'error', 
        text: 'Failed to load stations. Please refresh the page.' 
      });
    } finally {
      setLoadingStations(false);
    }
  };

  // Fetch stations on component mount and when user changes
  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchUsers();
      fetchStations();
    }
  }, [user]);

  // Debug: log stations when they change
  useEffect(() => {
    console.log('Current stations in state:', stations);
  }, [stations]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, rowsPerPage]);

  const getRoleIcon = (role) => {
    switch(role) {
      case 'super_admin': return <Shield className="w-4 h-4" />;
      case 'station_admin': return <Building className="w-4 h-4" />;
      case 'driver': return <Car className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'station_admin': return 'bg-blue-100 text-blue-800';
      case 'driver': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'super_admin': t('super_admin'),
      'station_admin': t('station_admin'),
      'driver': t('driver'),
      'passenger': t('passenger')
    };
    return roleMap[role] || role;
  };

  const getStationName = (stationId) => {
    if (!stationId) return t('not_assigned');
    const station = stations.find(s => s._id === stationId);
    return station ? `${station.stationName} (${station.city})` : stationId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('na');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    // ✅ Prevent self-modification
    if (selectedUser._id === user?._id) {
      setMessage({ type: 'error', text: t('cannot_change_own_role') });
      return;
    }

    // ✅ Prevent modifying initial super admin
    if (selectedUser.email === SUPER_ADMIN_EMAIL) {
      setMessage({ type: 'error', text: t('cannot_modify_super_admin') });
      return;
    }

    try {
      setChangingRole(true);
      setMessage({ type: '', text: '' });
      
      const requestData = {
        userId: selectedUser._id,
        newRole: newRole
      };
      
      // Validation for driver
      if (newRole === 'driver') {
        if (!licenseNumber.trim()) {
          setMessage({ type: 'error', text: t('license_number_required') });
          setChangingRole(false);
          return;
        }
        requestData.licenseNumber = licenseNumber;
        // Include stationID for driver if selected (OPTIONAL)
        if (stationID) {
          requestData.stationID = stationID;
        }
      }
      
      // Validation for station_admin
      if (newRole === 'station_admin') {
        if (!stationID) {
          setMessage({ type: 'error', text: t('station_id_required') });
          setChangingRole(false);
          return;
        }
        requestData.stationID = stationID;
      }

      console.log('📤 Sending role change request:', requestData);

      const response = await authService.changeUserRole(
        selectedUser._id,
        newRole,
        newRole === 'driver' ? licenseNumber : '',
        (newRole === 'driver' && stationID) ? stationID : (newRole === 'station_admin' ? stationID : '')
      );

      if (response.success) {
        const selectedStation = stations.find(s => s._id === stationID);
        
        setMessage({ 
          type: 'success', 
          text: t('role_changed_successfully', { role: getRoleDisplay(newRole) })
        });
        
        // Update users list
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u._id === selectedUser._id) {
              const updatedUser = { ...u, role: newRole };
              
              if (newRole === 'driver') {
                updatedUser.licenseNumber = licenseNumber;
                updatedUser.stationID = stationID || null;
              } else if (newRole === 'station_admin') {
                updatedUser.stationID = stationID;
                updatedUser.licenseNumber = null;
              } else {
                updatedUser.licenseNumber = null;
                updatedUser.stationID = null;
              }
              
              return updatedUser;
            }
            return u;
          })
        );
        
        setTimeout(() => {
          setShowChangeRoleModal(false);
          resetForm();
        }, 1500);
        
      } else {
        setMessage({ type: 'error', text: response.message || t('failed_to_change_role') });
      }
    } catch (error) {
      console.error('❌ Role change error:', error);
      setMessage({ type: 'error', text: t('failed_to_change_role') });
    } finally {
      setChangingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    // ✅ Prevent self-deactivation
    if (selectedUser._id === user?._id) {
      setMessage({ type: 'error', text: t('cannot_deactivate_own_account') });
      setShowConfirmDialog(false);
      return;
    }

    // ✅ Prevent deactivating initial super admin
    if (selectedUser.email === SUPER_ADMIN_EMAIL) {
      setMessage({ type: 'error', text: t('cannot_modify_super_admin') });
      setShowConfirmDialog(false);
      return;
    }

    try {
      setMessage({ type: '', text: '' });
      
      const response = await authService.toggleUserStatus(selectedUser._id);

      if (response.success) {
        const newStatus = !selectedUser.isActive;
        
        setMessage({ 
          type: 'success', 
          text: newStatus ? t('user_activated') : t('user_deactivated')
        });
        
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u._id === selectedUser._id ? { ...u, isActive: newStatus } : u
          )
        );
        
        setShowConfirmDialog(false);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: response.message || t('failed_to_update_user_status') });
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || t('failed_to_update_user_status') 
      });
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setNewRole('');
    setLicenseNumber('');
    setStationID('');
    setChangingRole(false);
    setMessage({ type: '', text: '' });
  };

  const openChangeRoleModal = (user) => {
    // ✅ Check if user can be modified
    if (!canModifyUser(user)) {
      if (user._id === user?._id) {
        setMessage({ type: 'error', text: t('cannot_change_own_role') });
      } else {
        setMessage({ type: 'error', text: t('cannot_modify_super_admin') });
      }
      return;
    }

    setSelectedUser(user);
    setNewRole(user.role);
    setLicenseNumber(user.licenseNumber || '');
    setStationID(user.stationID || '');
    setShowChangeRoleModal(true);
    setMessage({ type: '', text: '' });
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const openConfirmDialog = (user, type) => {
    // ✅ Check if user can be modified
    if (!canModifyUser(user)) {
      if (user._id === user?._id) {
        setMessage({ type: 'error', text: t('cannot_deactivate_own_account') });
      } else {
        setMessage({ type: 'error', text: t('cannot_modify_super_admin') });
      }
      return;
    }

    setSelectedUser(user);
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const openViewDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const exportToCSV = () => {
    const csvContent = [
      [t('name'), t('email'), t('phone'), t('role'), t('status'), t('created_at'), t('license_number'), t('station')],
      ...users.map(u => [
        u.fullName,
        u.email,
        u.phoneNumber || '',
        getRoleDisplay(u.role),
        u.isActive ? t('active') : t('inactive'),
        new Date(u.createdAt).toLocaleDateString(),
        u.licenseNumber || '',
        u.stationID ? getStationName(u.stationID) : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Pagination handlers
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('access_denied')}</h2>
          <p className="text-gray-600">{t('no_permission_role_management')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('role_management')}</h1>
          <p className="text-gray-600">{t('manage_roles_permissions')}</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {t('export_csv')}
        </button>
      </div>

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
              {message.type === 'error' ? t('error') : t('success')}
            </p>
            <p className="text-sm mt-1">{message.text}</p>
          </div>
          <button 
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
      )}

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_users_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              <option value="all">{t('all_roles')}</option>
              <option value="super_admin">{t('super_admin')}</option>
              <option value="station_admin">{t('station_admin')}</option>
              <option value="driver">{t('driver')}</option>
              <option value="passenger">{t('passenger')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              <option value="all">{t('all_status')}</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          <button 
            onClick={() => {
              fetchUsers();
              fetchStations();
            }}
            className="btn-primary flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('loading')}...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('refresh')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('loading_users')}...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <UserX className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t('no_users_found')}</h3>
            <p className="text-gray-600">{t('try_adjusting_filters')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">{t('user')}</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">{t('contact')}</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">{t('role')}</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">{t('status')}</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">{t('joined')}</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentUsers.map((userItem) => {
                    const canModify = canModifyUser(userItem);
                    const isOwnAccount = userItem._id === user?._id;
                    const isSuperAdminAccount = userItem.email === SUPER_ADMIN_EMAIL;
                    
                    return (
                      <tr key={userItem._id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-primary-600">
                                {userItem.fullName?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {userItem.fullName}
                                {isOwnAccount && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    {t('you')}
                                  </span>
                                )}
                                {isSuperAdminAccount && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                    {t('initial_admin')}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{t('id')}: {userItem._id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium">{userItem.email}</p>
                          <p className="text-sm text-gray-500">{userItem.phoneNumber || t('na')}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded ${getRoleColor(userItem.role)}`}>
                              {getRoleIcon(userItem.role)}
                            </span>
                            <span className="font-medium">{getRoleDisplay(userItem.role)}</span>
                          </div>
                          {userItem.licenseNumber && (
                            <p className="text-xs text-gray-500 mt-1">{t('license')}: {userItem.licenseNumber}</p>
                          )}
                          {userItem.stationID && (
                            <p className="text-xs text-gray-500 mt-1">{t('station')}: {userItem.stationID}</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            userItem.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.isActive ? t('active') : t('inactive')}
                          </span>
                          <span className="font-medium">{getRoleDisplay(userItem.role)}</span>
                        </div>
                        {userItem.licenseNumber && (
                          <p className="text-xs text-gray-500 mt-1">{t('license')}: {userItem.licenseNumber}</p>
                        )}
                        {userItem.stationID && (
                          <p className="text-xs text-gray-500 mt-1">{t('station')}: {getStationName(userItem.stationID)}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userItem.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openUserDetails(userItem)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title={t('view_details')}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => openChangeRoleModal(userItem)}
                            className="p-2 hover:bg-blue-50 rounded"
                            title={t('change_role')}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => openConfirmDialog(
                              userItem, 
                              userItem.isActive ? 'deactivate' : 'activate'
                            )}
                            className="p-2 hover:bg-yellow-50 rounded"
                            title={userItem.isActive ? t('deactivate') : t('activate')}
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

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <span className="text-sm text-gray-700">{t('rows_per_page')}:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-gray-600 ml-4">
                  {t('showing')} {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0} {t('to')} {Math.min(indexOfLastUser, filteredUsers.length)} {t('of')} {filteredUsers.length} {t('users')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1 || filteredUsers.length === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('first_page')}
                >
                  <ChevronsLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || filteredUsers.length === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('previous_page')}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex items-center gap-1">
                  {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`w-8 h-8 rounded text-sm ${
                          currentPage === pageNumber
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || filteredUsers.length === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('next_page')}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages || filteredUsers.length === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('last_page')}
                >
                  <ChevronsRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUserDetails(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">{t('user_details')}</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-600">
                    {selectedUser.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="text-2xl font-bold">{selectedUser.fullName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedUser.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.isActive ? t('active') : t('inactive')}
                    </span>
                    <span className={`p-1 rounded ${getRoleColor(selectedUser.role)}`}>
                      {getRoleIcon(selectedUser.role)}
                    </span>
                    <span className="font-medium">{getRoleDisplay(selectedUser.role)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-700 border-b pb-2">{t('personal_information')}</h5>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('email')}</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('phone')}</p>
                      <p className="font-medium">{selectedUser.phoneNumber || t('not_provided')}</p>
                    </div>
                  </div>

                  {selectedUser.emergencyContact && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">{t('emergency_contact')}</p>
                        <p className="font-medium">{selectedUser.emergencyContact}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-700 border-b pb-2">{t('account_information')}</h5>
                  
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('user_id')}</p>
                      <p className="font-medium text-sm break-all">{selectedUser._id}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('member_since')}</p>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>

                  {selectedUser.lastLogin && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">{t('last_login')}</p>
                        <p className="font-medium">{formatDate(selectedUser.lastLogin)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Role-specific information */}
              {(selectedUser.role === 'driver' || selectedUser.role === 'station_admin') && (
                <div className="mt-6 pt-6 border-t">
                  <h5 className="font-semibold text-gray-700 mb-4">
                    {selectedUser.role === 'driver' ? t('driver_information') : t('station_administrator')}
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.role === 'driver' && selectedUser.licenseNumber && (
                      <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">{t('license_number')}</p>
                          <p className="font-medium">{selectedUser.licenseNumber}</p>
                        </div>
                      </div>
                    )}

                    {selectedUser.stationID && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">{t('assigned_station')}</p>
                          <p className="font-medium">{getStationName(selectedUser.stationID)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="btn-secondary"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    openChangeRoleModal(selectedUser);
                  }}
                  className="btn-primary"
                >
                  {t('change_role')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal - NOW WITH STATION SELECTION FOR DRIVERS */}
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
                <h3 className="text-lg font-semibold">{t('change_user_role')}</h3>
                <button
                  onClick={() => {
                    setShowChangeRoleModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{t('user')}:</p>
                  <p className="font-medium">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('current_role')}: {getRoleDisplay(selectedUser.role)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('new_role')} *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">{t('select_role')}</option>
                    <option value="passenger">{t('passenger')}</option>
                    <option value="driver">{t('driver')}</option>
                    <option value="station_admin">{t('station_admin')}</option>
                    <option value="super_admin">{t('super_admin')}</option>
                  </select>
                </div>

                {newRole === 'driver' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('license_number')} *
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="input-field w-full"
                        placeholder={t('enter_license_number')}
                        required
                      />
                    </div>
                    
                    {/* NEW: Station selection for drivers (optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('assign_station')} <span className="text-xs text-gray-500 font-normal">({t('optional')})</span>
                      </label>
                      {loadingStations ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                          <span className="ml-2 text-sm text-gray-600">{t('loading_stations')}</span>
                        </div>
                      ) : stations.length > 0 ? (
                        <>
                          <select
                            value={stationID}
                            onChange={(e) => setStationID(e.target.value)}
                            className="input-field w-full"
                          >
                            <option value="">{t('no_station_assigned')}</option>
                            {stations.map((station) => (
                              <option key={station._id} value={station._id}>
                                {station.stationName} - {station.city} {station.location ? `(${station.location})` : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            {t('driver_can_be_assigned_later')}
                          </p>
                        </>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-700 font-medium">No stations found!</p>
                          <p className="text-xs text-yellow-600 mt-1">Create stations first or leave unassigned.</p>
                          <button
                            onClick={fetchStations}
                            className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry fetching stations
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {newRole === 'station_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('select_station')} *
                    </label>
                    {loadingStations ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        <span className="ml-2 text-sm text-gray-600">{t('loading_stations')}</span>
                      </div>
                    ) : stations.length > 0 ? (
                      <select
                        value={stationID}
                        onChange={(e) => setStationID(e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">{t('select_station_placeholder')}</option>
                        {stations.map((station) => (
                          <option key={station._id} value={station._id}>
                            {station.stationName} - {station.city} {station.location ? `(${station.location})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700 font-medium">No stations found!</p>
                        <p className="text-xs text-yellow-600 mt-1">Please create stations first before assigning station admin.</p>
                        <button
                          onClick={fetchStations}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry fetching stations
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {message.text && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.type === 'error' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {message.text}
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
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleChangeRole}
                  className="btn-primary flex items-center justify-center gap-2"
                  disabled={
                    !newRole || 
                    changingRole || 
                    (newRole === 'driver' && !licenseNumber) || 
                    (newRole === 'station_admin' && !stationID)
                  }
                >
                  {changingRole ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('saving')}...
                    </>
                  ) : (
                    t('save_changes')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog for Activate/Deactivate */}
      {showConfirmDialog && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmDialog(false);
            }
          }}
        >
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
                  {actionType === 'deactivate' ? t('deactivate_user') : t('activate_user')}
                </h3>
              </div>

              <p className="text-gray-600 mb-2">
                {actionType === 'deactivate' 
                  ? t('deactivate_confirmation', { name: selectedUser.fullName })
                  : t('activate_confirmation', { name: selectedUser.fullName })
                }
              </p>
              
              {actionType === 'deactivate' && selectedUser.role === 'super_admin' && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {t('deactivate_super_admin_warning')}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`btn ${
                    actionType === 'deactivate' 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {actionType === 'deactivate' ? t('deactivate') : t('activate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}