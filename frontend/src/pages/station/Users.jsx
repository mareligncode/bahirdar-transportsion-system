// src/components/station/Users.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Avatar,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Badge,
  Stack
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Badge as BadgeIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format, formatDistance } from 'date-fns';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stationInfo, setStationInfo] = useState(null);

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  
  // Selected user states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  
  // Form states for assign driver
  const [assignForm, setAssignForm] = useState({
    passengerId: '',
    licenseNumber: '',
    stationID: ''
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignErrors, setAssignErrors] = useState({});

  // Fetch station info for current admin
  const fetchStationInfo = async () => {
    try {
      // First get current user profile
      const response = await api.get('/api/auth/profile');
      console.log('Profile response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data?.user || response.data.data;
        
        if (userData.stationID) {
          if (typeof userData.stationID === 'object') {
            setStationInfo(userData.stationID);
          } else {
            // Fetch station details
            try {
              const stationResponse = await api.get(`/api/station/${userData.stationID}`);
              if (stationResponse.data?.station) {
                setStationInfo(stationResponse.data.station);
              }
            } catch (err) {
              console.error('Error fetching station:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching station info:', err);
    }
  };

  // Fetch users (ONLY passengers)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/auth/station-users');
      
      console.log('📊 Station Users Response:', response.data);
      
      if (response.data.success) {
        const allUsers = response.data.data?.users || [];
        
        // Filter to ONLY show passengers
        const passengers = allUsers.filter(user => user.role === 'passenger');
        
        setUsers(passengers);
        
        // Fetch station info if not already set
        if (!stationInfo) {
          await fetchStationInfo();
        }
      } else {
        setError(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('❌ Fetch users error:', err);
      
      if (err.response?.status === 403) {
        setError('Access denied. You may not have permission to view station users.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesStatus;
  });

  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  // Handle assign driver dialog open
  const handleAssignOpen = (user) => {
    setSelectedUser(user);
    setAssignForm({
      passengerId: user._id,
      licenseNumber: '',
      stationID: stationInfo?._id || ''
    });
    setAssignErrors({});
    setAssignDialogOpen(true);
  };

  // Handle view user dialog open - FIXED: Use existing data instead of API call
  const handleViewOpen = (user) => {
    console.log('🔍 Viewing passenger details:', user);
    setSelectedUserDetails(user);
    setViewDialogOpen(true);
  };

  // Handle toggle status dialog open
  const handleToggleOpen = (user) => {
    setSelectedUser(user);
    setToggleDialogOpen(true);
  };

  // Handle assign driver
  const handleAssignDriver = async () => {
    // Validation
    const errors = {};
    if (!assignForm.licenseNumber.trim()) {
      errors.licenseNumber = 'License number is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setAssignErrors(errors);
      return;
    }

    try {
      setAssignLoading(true);
      
      const formData = {
        passengerId: assignForm.passengerId,
        licenseNumber: assignForm.licenseNumber,
        stationID: stationInfo?._id || assignForm.stationID
      };
      
      console.log('📤 Assigning driver with data:', formData);
      
      const response = await api.post('/api/auth/assign-driver', formData);
      
      if (response.data.success) {
        setSuccess('✅ Passenger assigned as driver successfully');
        setAssignDialogOpen(false);
        fetchUsers(); // Refresh the list
      } else {
        setError(response.data.message || 'Failed to assign driver role');
      }
    } catch (err) {
      console.error('❌ Assign driver error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          'Failed to assign driver role. Please try again.';
      setError(errorMessage);
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      setError('');
      
      console.log('🔄 Toggling status for user:', selectedUser._id);
      
      const response = await api.post('/api/auth/toggle-status', {
        userId: selectedUser._id
      });
      
      console.log('📊 Toggle response:', response.data);
      
      if (response.data.success) {
        const action = selectedUser.isActive ? 'deactivated' : 'activated';
        setSuccess(`✅ User ${action} successfully`);
        setToggleDialogOpen(false);
        
        // Update the user in the local state immediately
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u._id === selectedUser._id 
              ? { ...u, isActive: !selectedUser.isActive }
              : u
          )
        );
        
        // Also refresh from server to be safe
        setTimeout(() => fetchUsers(), 500);
      } else {
        setError(response.data.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error('❌ Toggle status error:', err);
      
      let errorMessage = 'Failed to update user status';
      if (err.response?.status === 403) {
        if (err.response?.data?.message?.includes('Cannot manage users from other stations')) {
          errorMessage = 'Cannot manage users from other stations. This user may belong to a different station.';
        } else {
          errorMessage = 'You do not have permission to perform this action.';
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Clear error
  const clearError = () => {
    setError('');
  };

  // Clear success
  const clearSuccess = () => {
    setSuccess('');
  };

  // Stats calculations
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  return (
    <Box>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            Passenger Management
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Station Info Card */}
        {stationInfo && (
          <Alert severity="info" sx={{ mb: 3 }} icon={<LocationIcon />}>
            <Typography variant="body2">
              <strong>Station:</strong> {stationInfo.stationName} ({stationInfo.stationCode}) | 
              <strong> City:</strong> {stationInfo.city} | 
              <strong> Location:</strong> {stationInfo.location}
            </Typography>
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Passengers
                </Typography>
                <Typography variant="h4">
                  {users.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Passengers
                </Typography>
                <Typography variant="h4" color="success.main">
                  {activeCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Inactive Passengers
                </Typography>
                <Typography variant="h4" color="error.main">
                  {inactiveCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search Passengers"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone..."
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper elevation={3}>
        {loading ? (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
            <Box display="flex" justifyContent="center" p={5}>
              <CircularProgress />
            </Box>
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={clearError}>
                Dismiss
              </Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Passenger</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Emergency Contact</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <Typography color="textSecondary">
                          No passengers found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar 
                              sx={{ 
                                mr: 2, 
                                bgcolor: 'primary.main',
                                width: 40,
                                height: 40
                              }}
                            >
                              {user.fullName?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="medium">
                                {user.fullName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {user._id?.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{user.email}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{user.phoneNumber}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'error'}
                            size="small"
                            icon={user.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          {user.emergencyContact ? (
                            <Typography variant="body2">{user.emergencyContact}</Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Not provided
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={formatDate(user.lastLogin)}>
                            <Typography variant="caption">
                              {formatRelativeTime(user.lastLogin)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewOpen(user)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Assign as Driver">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleAssignOpen(user)}
                              >
                                <PersonAddIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={user.isActive ? 'error' : 'success'}
                                onClick={() => handleToggleOpen(user)}
                              >
                                {user.isActive ? <BlockIcon /> : <ActivateIcon />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Assign Driver Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Passenger as Driver
          {selectedUser && (
            <Typography variant="body2" color="textSecondary">
              {selectedUser.fullName} ({selectedUser.email})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="License Number"
              value={assignForm.licenseNumber}
              onChange={(e) => setAssignForm({
                ...assignForm,
                licenseNumber: e.target.value
              })}
              error={!!assignErrors.licenseNumber}
              helperText={assignErrors.licenseNumber}
              required
              size="small"
              sx={{ mb: 2 }}
              placeholder="Enter driver's license number"
            />
            
            {stationInfo && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Station:</strong> {stationInfo.stationName} ({stationInfo.stationCode})
                </Typography>
                <Typography variant="body2">
                  This driver will be assigned to your station automatically.
                </Typography>
              </Alert>
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Important Notes:
              </Typography>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>This will change the user's role from passenger to driver</li>
                <li>The user will need to provide license information for trips</li>
                <li>They can be assigned to vehicles after this change</li>
                <li>They will be assigned to your station automatically</li>
                <li>This action cannot be undone without super admin</li>
              </ul>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)} disabled={assignLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleAssignDriver}
            disabled={assignLoading}
            startIcon={assignLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {assignLoading ? 'Assigning...' : 'Assign as Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog - Using existing data */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUserDetails ? (
          <>
            <DialogTitle>
              Passenger Details
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center" p={2}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Chip
                          label={selectedUserDetails.isActive ? 'Active' : 'Inactive'}
                          color={selectedUserDetails.isActive ? 'success' : 'error'}
                          size="small"
                          sx={{ position: 'absolute', bottom: 0, right: 0 }}
                        />
                      }
                    >
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          fontSize: 48,
                          bgcolor: 'primary.main',
                          mb: 2
                        }}
                      >
                        {selectedUserDetails.fullName?.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                    
                    <Typography variant="h6" gutterBottom>
                      {selectedUserDetails.fullName}
                    </Typography>
                    
                    <Chip
                      label="PASSENGER"
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Contact Information
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <EmailIcon fontSize="small" color="primary" />
                        <Typography>{selectedUserDetails.email}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PhoneIcon fontSize="small" color="primary" />
                        <Typography>{selectedUserDetails.phoneNumber}</Typography>
                      </Box>
                      {selectedUserDetails.emergencyContact && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <WarningIcon fontSize="small" color="warning" />
                          <Typography>
                            Emergency: {selectedUserDetails.emergencyContact}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Account Information
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Created
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(selectedUserDetails.createdAt)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Last Login
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatRelativeTime(selectedUserDetails.lastLogin)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>

                  {selectedUserDetails.stationID && (
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Station Information
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" color="primary" />
                          <Typography>
                            {typeof selectedUserDetails.stationID === 'object' 
                              ? `${selectedUserDetails.stationID.stationName} (${selectedUserDetails.stationID.stationCode}) - ${selectedUserDetails.stationID.city}`
                              : `Station ID: ${selectedUserDetails.stationID}`}
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        ) : (
          <Box display="flex" justifyContent="center" p={5}>
            <Typography>No user data available</Typography>
          </Box>
        )}
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog
        open={toggleDialogOpen}
        onClose={() => setToggleDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {selectedUser?.isActive ? 'Deactivate Passenger' : 'Activate Passenger'}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Alert 
                severity={selectedUser.isActive ? 'warning' : 'info'} 
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  Are you sure you want to{' '}
                  <strong>{selectedUser.isActive ? 'deactivate' : 'activate'}</strong>{' '}
                  <strong>{selectedUser.fullName}</strong>?
                </Typography>
              </Alert>
              
              {selectedUser.isActive && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Warning:</strong> Deactivated passengers cannot log in to the system or make bookings.
                  </Typography>
                </Alert>
              )}
              
              {!selectedUser.isActive && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> Activated passengers will be able to log in and make bookings normally.
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggleDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedUser?.isActive ? 'error' : 'success'}
            onClick={handleToggleStatus}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {actionLoading ? 'Processing...' : (selectedUser?.isActive ? 'Deactivate' : 'Activate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars for feedback */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={clearSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={clearSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;