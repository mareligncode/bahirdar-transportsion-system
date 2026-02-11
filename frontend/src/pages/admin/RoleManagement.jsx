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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

export default function RoleManagement() {
  const { user, authService } = useAuth();
  const { t } = useTranslation(); // ✅ ADD THIS
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
  const [newRole, setNewRole] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [stationID, setStationID] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changingRole, setChangingRole] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      if (user?.role !== 'super_admin') {
        setMessage({ type: 'error', text: t('unauthorized_access') });
        return;
      }

      const response = await authService.getAllUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      } else {
        setMessage({ type: 'error', text: response.message || t('failed_to_fetch_users') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('failed_to_load_users') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

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

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setChangingRole(true);
      setMessage({ type: '', text: '' });
      
      let licenseNumberParam = '';
      let stationIDParam = '';

      if (newRole === 'driver') {
        if (!licenseNumber.trim()) {
          setMessage({ type: 'error', text: t('license_number_required') });
          setChangingRole(false);
          return;
        }
        licenseNumberParam = licenseNumber;
      }

      if (newRole === 'station_admin') {
        if (!stationID.trim()) {
          setMessage({ type: 'error', text: t('station_id_required') });
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
      );

      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: t('role_changed_successfully', { role: getRoleDisplay(newRole) })
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
        
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('failed_to_change_role') });
    } finally {
      setChangingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

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
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('failed_to_update_user_status') });
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setNewRole('');
    setLicenseNumber('');
    setStationID('');
    setChangingRole(false);
  };

  const openChangeRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setLicenseNumber(user.licenseNumber || '');
    setStationID(user.stationID || '');
    setShowChangeRoleModal(true);
    setMessage({ type: '', text: '' });
  };

  const openConfirmDialog = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const exportToCSV = () => {
    const csvContent = [
      [t('name'), t('email'), t('phone'), t('role'), t('status'), t('created_at')],
      ...users.map(u => [
        u.fullName,
        u.email,
        u.phoneNumber,
        getRoleDisplay(u.role),
        u.isActive ? t('active') : t('inactive'),
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
            onClick={fetchUsers}
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
                  {currentUsers.map((userItem) => (
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
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowUserDetails(true) || setSelectedUser(userItem)}
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
                  {t('showing')} {indexOfFirstUser + 1} {t('to')} {Math.min(indexOfLastUser, filteredUsers.length)} {t('of')} {filteredUsers.length} {t('users')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('first_page')}
                >
                  <ChevronsLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('previous_page')}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('next_page')}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
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
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{t('user')}:</p>
                  <p className="font-medium">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400">{t('current_role')}: {getRoleDisplay(selectedUser.role)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('new_role')}
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
                )}

                {newRole === 'station_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('station_id')} *
                    </label>
                    <input
                      type="text"
                      value={stationID}
                      onChange={(e) => setStationID(e.target.value)}
                      className="input-field w-full"
                      placeholder={t('enter_station_id')}
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
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleChangeRole}
                  className="btn-primary flex items-center justify-center gap-2"
                  disabled={!newRole || changingRole}
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

              <p className="text-gray-600 mb-6">
                {actionType === 'deactivate' 
                  ? t('deactivate_confirmation', { name: selectedUser.fullName })
                  : t('activate_confirmation', { name: selectedUser.fullName })
                }
              </p>

              <div className="flex justify-end gap-3">
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