import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Divider,
  Badge,
  Avatar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  DriveEta as DriveEtaIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 'bold',
  backgroundColor: status === 'active' ? theme.palette.success.light : theme.palette.error.light,
  color: status === 'active' ? theme.palette.success.dark : theme.palette.error.dark
}));

const RoleChip = styled(Chip)(({ theme, role }) => {
  let color;
  switch (role) {
    case 'super_admin':
      color = theme.palette.error.main;
      break;
    case 'station_admin':
      color = theme.palette.warning.main;
      break;
    case 'driver':
      color = theme.palette.info.main;
      break;
    case 'passenger':
      color = theme.palette.success.main;
      break;
    default:
      color = theme.palette.grey[500];
  }
  return {
    backgroundColor: color,
    color: 'white',
    fontWeight: 'bold'
  };
});

const AllUsers = () => {
  const { t } = useTranslation(); // ✅ ADD THIS
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openChangeRoleDialog, setOpenChangeRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Edit form
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: '',
    isActive: true
  });
  
  // Change role form
  const [newRole, setNewRole] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [stationID, setStationID] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/auth/all-users');
      
      if (response.data.success) {
        setUsers(response.data.data.users || []);
        setTotalUsers(response.data.data.total || response.data.data.users?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || t('failed_to_load_users'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setError('');
      
      const response = await api.post('/api/auth/toggle-status', { userId });
      
      if (response.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isActive: !currentStatus }
            : user
        ));
        
        setSuccess(t(currentStatus ? 'user_deactivated' : 'user_activated'));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err.response?.data?.message || t('failed_to_update_user_status'));
    }
  };

  // Change user role
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      setError('');
      
      const requestData = {
        userId: selectedUser._id,
        newRole: newRole
      };
      
      // Add additional data for specific roles
      if (newRole === 'driver') {
        if (!licenseNumber) {
          setError(t('license_number_required'));
          return;
        }
        requestData.licenseNumber = licenseNumber;
      }
      
      if (newRole === 'station_admin') {
        if (!stationID) {
          setError(t('station_id_required'));
          return;
        }
        requestData.stationID = stationID;
      }
      
      const response = await api.post('/api/auth/change-role', requestData);
      
      if (response.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user._id === selectedUser._id 
            ? { ...user, role: newRole, licenseNumber, stationID }
            : user
        ));
        
        setOpenChangeRoleDialog(false);
        setSuccess(t('user_role_changed', { role: t(newRole) }));
        setTimeout(() => setSuccess(''), 3000);
        
        // Reset form
        setNewRole('');
        setLicenseNumber('');
        setStationID('');
      }
    } catch (err) {
      console.error('Error changing user role:', err);
      setError(err.response?.data?.message || t('failed_to_change_user_role'));
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || '',
      isActive: user.isActive
    });
    setOpenEditDialog(true);
  };

  // Open view dialog
  const handleOpenViewDialog = (user) => {
    setSelectedUser(user);
    setOpenViewDialog(true);
  };

  // Open change role dialog
  const handleOpenChangeRoleDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setLicenseNumber(user.licenseNumber || '');
    setStationID(user.stationID || '');
    setOpenChangeRoleDialog(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return t('na');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin': return t('super_admin');
      case 'station_admin': return t('station_admin');
      case 'driver': return t('driver');
      case 'passenger': return t('passenger');
      default: return role;
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm);
    
    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Initialize on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Get stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    superAdmin: users.filter(u => u.role === 'super_admin').length,
    stationAdmin: users.filter(u => u.role === 'station_admin').length,
    drivers: users.filter(u => u.role === 'driver').length,
    passengers: users.filter(u => u.role === 'passenger').length
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Notifications */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('user_management')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('manage_all_system_users')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchUsers}
        >
          {t('refresh')}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('total_users')}
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('active_users')}
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('super_admins')}
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.superAdmin}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('drivers')}
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.drivers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('passengers')}
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.passengers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={t('search_users_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('role')}</InputLabel>
              <Select
                value={roleFilter}
                label={t('role')}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">{t('all_roles')}</MenuItem>
                <MenuItem value="super_admin">{t('super_admin')}</MenuItem>
                <MenuItem value="station_admin">{t('station_admin')}</MenuItem>
                <MenuItem value="driver">{t('driver')}</MenuItem>
                <MenuItem value="passenger">{t('passenger')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('status')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('all_status')}</MenuItem>
                <MenuItem value="active">{t('active')}</MenuItem>
                <MenuItem value="inactive">{t('inactive')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
            >
              {t('clear_filters')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <StyledTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell><strong>{t('user')}</strong></TableCell>
              <TableCell><strong>{t('role')}</strong></TableCell>
              <TableCell><strong>{t('contact')}</strong></TableCell>
              <TableCell><strong>{t('status')}</strong></TableCell>
              <TableCell><strong>{t('joined')}</strong></TableCell>
              <TableCell align="center"><strong>{t('actions')}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                      ? t('no_users_match_filters') 
                      : t('no_users_found')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`}
                        alt={user.fullName}
                      />
                      <Box>
                        <Typography fontWeight="medium">
                          {user.fullName || t('no_name')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {t('id')}: {user._id.substring(0, 8)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <RoleChip
                      label={getRoleDisplayName(user.role)}
                      role={user.role}
                      size="small"
                    />
                    {user.licenseNumber && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {t('license')}: {user.licenseNumber}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                        <EmailIcon fontSize="small" />
                        {user.email}
                      </Typography>
                      {user.phoneNumber && (
                        <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                          <PhoneIcon fontSize="small" />
                          {user.phoneNumber}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={user.isActive ? t('active') : t('inactive')}
                      status={user.isActive ? 'active' : 'inactive'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title={t('view_details')}>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleOpenViewDialog(user)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={t('change_role')}>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenChangeRoleDialog(user)}
                        >
                          <BadgeIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={user.isActive ? t('deactivate') : t('activate')}>
                        <IconButton
                          size="small"
                          color={user.isActive ? 'error' : 'success'}
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                        >
                          {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredUsers.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* View User Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.fullName)}&background=random`}
                  alt={selectedUser.fullName}
                  sx={{ width: 60, height: 60 }}
                />
                <Box>
                  <Typography variant="h6">{selectedUser.fullName}</Typography>
                  <RoleChip
                    label={getRoleDisplayName(selectedUser.role)}
                    role={selectedUser.role}
                    size="small"
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    {t('personal_information')}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <EmailIcon fontSize="small" />
                      <strong>{t('email')}:</strong> {selectedUser.email}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" />
                      <strong>{t('phone')}:</strong> {selectedUser.phoneNumber || t('not_provided')}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>{t('emergency_contact')}:</strong> {selectedUser.emergencyContact || t('not_provided')}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    {t('account_information')}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>{t('user_id')}:</strong> {selectedUser._id}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>{t('status')}:</strong> 
                      <StatusChip
                        label={selectedUser.isActive ? t('active') : t('inactive')}
                        status={selectedUser.isActive ? 'active' : 'inactive'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>{t('member_since')}:</strong> {formatDate(selectedUser.createdAt)}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>{t('last_login')}:</strong> {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : t('never')}
                    </Typography>
                  </Box>
                </Grid>

                {/* Role-specific information */}
                {selectedUser.role === 'driver' && selectedUser.licenseNumber && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {t('driver_information')}
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                        <DriveEtaIcon fontSize="small" />
                        <strong>{t('license_number')}:</strong> {selectedUser.licenseNumber}
                      </Typography>
                    </Box>
                    {selectedUser.stationID && (
                      <Box mb={2}>
                        <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" />
                          <strong>{t('assigned_station')}:</strong> {selectedUser.stationID}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                )}

                {selectedUser.role === 'station_admin' && selectedUser.stationID && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {t('station_administrator')}
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" display="flex" alignItems="center" gap={1}>
                        <LocationIcon fontSize="small" />
                        <strong>{t('managed_station')}:</strong> {selectedUser.stationID}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenViewDialog(false)}>{t('close')}</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setOpenViewDialog(false);
                  handleOpenChangeRoleDialog(selectedUser);
                }}
              >
                {t('change_role')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog 
        open={openChangeRoleDialog} 
        onClose={() => setOpenChangeRoleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              {t('change_user_role')}: {selectedUser.fullName}
            </DialogTitle>
            <DialogContent dividers>
              <Box py={2}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>{t('new_role')}</InputLabel>
                  <Select
                    value={newRole}
                    label={t('new_role')}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <MenuItem value="passenger">{t('passenger')}</MenuItem>
                    <MenuItem value="driver">{t('driver')}</MenuItem>
                    <MenuItem value="station_admin">{t('station_administrator')}</MenuItem>
                    <MenuItem value="super_admin">{t('super_administrator')}</MenuItem>
                  </Select>
                </FormControl>

                {newRole === 'driver' && (
                  <TextField
                    fullWidth
                    label={t('license_number')}
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder={t('enter_license_number')}
                    sx={{ mb: 2 }}
                    required
                  />
                )}

                {newRole === 'station_admin' && (
                  <TextField
                    fullWidth
                    label={t('station_id')}
                    value={stationID}
                    onChange={(e) => setStationID(e.target.value)}
                    placeholder={t('enter_station_id')}
                    sx={{ mb: 2 }}
                    required
                  />
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{t('note')}:</strong> {t('changing_role_warning')}
                    {newRole === 'driver' && ` ${t('driver_role_requires_license')}`}
                    {newRole === 'station_admin' && ` ${t('station_admin_requires_station')}`}
                  </Typography>
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenChangeRoleDialog(false)}>{t('cancel')}</Button>
              <Button 
                variant="contained" 
                onClick={handleChangeRole}
                disabled={!newRole || (newRole === 'driver' && !licenseNumber) || (newRole === 'station_admin' && !stationID)}
              >
                {t('update_role')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default AllUsers;