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
  FormHelperText,
  Alert,
  CircularProgress,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  DriveEta as DriveEtaIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTranslation } from '../../hooks/useTranslation';

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
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStations, setLoadingStations] = useState(false);
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
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openChangeRoleDialog, setOpenChangeRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

  // Fetch all stations for dropdown
  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      const response = await api.get('/api/station');

      let stationsList = [];
      if (response.data.stations) {
        stationsList = response.data.stations;
      } else if (response.data.data?.stations) {
        stationsList = response.data.data.stations;
      } else if (Array.isArray(response.data)) {
        stationsList = response.data;
      }

      setStations(stationsList);
    } catch (err) {
      console.error('Error fetching stations:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setError('');

      const response = await api.post('/api/auth/toggle-status', { userId });

      if (response.data.success) {
        setUsers(users.map(user =>
          user._id === userId
            ? { ...user, isActive: !currentStatus }
            : user
        ));

        setSuccess(currentStatus ? t('user_deactivated') : t('user_activated'));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err.response?.data?.message || t('failed_to_update_user_status'));
    }
  };

  // Change user role - EXACTLY as your backend expects
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setError('');

      // Build request exactly as your backend expects
      const requestData = {
        userId: selectedUser._id,
        newRole: newRole
      };

      // Add licenseNumber ONLY for driver role
      if (newRole === 'driver') {
        if (!licenseNumber) {
          setError(t('license_number_required'));
          return;
        }
        requestData.licenseNumber = licenseNumber;
      }

      // Add stationID ONLY for station_admin role
      if (newRole === 'station_admin') {
        if (!stationID) {
          setError(t('station_id_required'));
          return;
        }
        requestData.stationID = stationID;
      }

      console.log('📤 Sending role change request:', requestData);

      const response = await api.post('/api/auth/change-role', requestData);

      if (response.data.success) {
        // Find the selected station name for display
        const selectedStation = stations.find(s => s._id === stationID);

        // Update local state
        setUsers(users.map(user =>
          user._id === selectedUser._id
            ? {
              ...user,
              role: newRole,
              // For driver: set licenseNumber, keep existing stationID or set to null
              ...(newRole === 'driver' && {
                licenseNumber,
                stationID: null // Clear stationID when becoming driver
              }),
              // For station_admin: set stationID
              ...(newRole === 'station_admin' && {
                stationID,
                licenseNumber: null // Clear licenseNumber when becoming station_admin
              }),
              // For other roles: clear both
              ...(newRole !== 'driver' && newRole !== 'station_admin' && {
                licenseNumber: null,
                stationID: null
              })
            }
            : user
        ));

        setOpenChangeRoleDialog(false);
        setSuccess(t('user_role_changed_successfully'));
        setTimeout(() => setSuccess(''), 3000);

        // Reset form
        setNewRole('');
        setLicenseNumber('');
        setStationID('');
      }
    } catch (err) {
      console.error('Error changing user role:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t('failed_to_change_user_role');
      setError(errorMsg);
    }
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

  // Get station name by ID
  const getStationName = (stationId) => {
    if (!stationId) return t('not_assigned');
    const station = stations.find(s => s._id === stationId);
    return station ? `${station.stationName} (${station.city})` : stationId;
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Export to CSV function
  const exportToCSV = () => {
    try {
      // Define CSV headers
      const headers = [
        'Full Name',
        'Email',
        'Phone Number',
        'Role',
        'Status',
        'License Number',
        'Station',
        'Created At',
        'Last Login',
        'User ID'
      ];

      // Map user data to CSV rows
      const csvData = users.map(user => [
        user.fullName || '',
        user.email || '',
        user.phoneNumber || '',
        getRoleDisplayName(user.role),
        user.isActive ? 'Active' : 'Inactive',
        user.licenseNumber || '',
        user.stationID ? getStationName(user.stationID) : '',
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '',
        user._id || ''
      ]);

      // Combine headers and data
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('Users exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      setError('Failed to export users');
    }
  };

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchUsers();
    fetchStations();
  }, []);

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
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            {t('user_management')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('manage_all_system_users')}
          </Typography>
        </Box>
        <Box display="flex" gap={2} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            disabled={users.length === 0}
            fullWidth={{ xs: true, sm: false }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchUsers();
              fetchStations();
            }}
            fullWidth={{ xs: true, sm: false }}
          >
            {t('refresh')}
          </Button>
        </Box>
      </Box>

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

      <StyledTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell><strong>{t('user')}</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>{t('role')}</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>{t('contact')}</strong></TableCell>
              <TableCell><strong>{t('status')}</strong></TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>{t('joined')}</strong></TableCell>
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
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
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
                    {user.stationID && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {t('station')}: {getStationName(user.stationID)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
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
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
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

      <TablePagination
        component="div"
        count={filteredUsers.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

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
                          <strong>{t('assigned_station')}:</strong> {getStationName(selectedUser.stationID)}
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
                        <strong>{t('managed_station')}:</strong> {getStationName(selectedUser.stationID)}
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

      {/* Change Role Dialog - MATCHES BACKEND EXACTLY */}
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

                {/* Driver Role - License Number ONLY */}
                {newRole === 'driver' && (
                  <TextField
                    fullWidth
                    label={t('license_number')}
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder={t('enter_license_number')}
                    sx={{ mb: 2 }}
                    required
                    helperText={t('license_number_required_for_driver')}
                  />
                )}

                {/* Station Admin Role - Station ID ONLY */}
                {newRole === 'station_admin' && (
                  <FormControl fullWidth sx={{ mb: 2 }} required>
                    <InputLabel>{t('select_station')}</InputLabel>
                    <Select
                      value={stationID}
                      label={t('select_station')}
                      onChange={(e) => setStationID(e.target.value)}
                      disabled={loadingStations}
                    >
                      <MenuItem value="" disabled>
                        <em>{loadingStations ? t('loading_stations') : t('select_station_placeholder')}</em>
                      </MenuItem>
                      {stations.map((station) => (
                        <MenuItem key={station._id} value={station._id}>
                          {station.stationName} - {station.city}
                        </MenuItem>
                      ))}
                    </Select>
                    {loadingStations && <CircularProgress size={20} sx={{ position: 'absolute', right: 40, top: 15 }} />}
                    <FormHelperText>{t('select_station_for_admin')}</FormHelperText>
                  </FormControl>
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{t('note')}:</strong>
                    {newRole === 'driver' && t('driver_role_change_note')}
                    {newRole === 'station_admin' && t('station_admin_role_change_note')}
                    {(!newRole || (newRole !== 'driver' && newRole !== 'station_admin')) && t('role_change_general_note')}
                  </Typography>
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenChangeRoleDialog(false)}>{t('cancel')}</Button>
              <Button
                variant="contained"
                onClick={handleChangeRole}
                disabled={
                  !newRole ||
                  (newRole === 'driver' && !licenseNumber) ||
                  (newRole === 'station_admin' && !stationID)
                }
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