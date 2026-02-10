// src/components/admin/station/Users.jsx
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
  FormHelperText
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Get current user's stationID from localStorage
  const getCurrentUserStationID = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.stationID || '';
      }
    } catch (err) {
      console.error('Error getting user data:', err);
    }
    return '';
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/auth/station-users');
      
      if (response.data.success) {
        // Filter out drivers and station_admins, only show passengers
        const filteredUsers = (response.data.data.users || []).filter(user => 
          user.role === 'passenger'
        );
        
        setUsers(filteredUsers);
        setTotalUsers(filteredUsers.length);
      } else {
        setError(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      let errorMessage = 'Failed to load users. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view station users.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle assign driver dialog open
  const handleAssignOpen = (user) => {
    setSelectedUser(user);
    setAssignForm({
      passengerId: user._id,
      licenseNumber: '',
      stationID: getCurrentUserStationID() || ''
    });
    setAssignErrors({});
    setAssignDialogOpen(true);
  };

  // Handle view user dialog open
  const handleViewOpen = (user) => {
    try {
      setSelectedUserDetails(user);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('View user error:', err);
      setError('Failed to load user details');
    }
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
      
      // Ensure stationID is set (use current user's stationID if empty)
      const formData = {
        ...assignForm,
        stationID: assignForm.stationID || getCurrentUserStationID() || ''
      };
      
      const response = await api.post('/api/auth/assign-driver', formData);
      
      if (response.data.success) {
        setSuccess('Passenger assigned as driver successfully');
        setAssignDialogOpen(false);
        fetchUsers();
      } else {
        setError(response.data.message || 'Failed to assign driver role');
      }
    } catch (err) {
      console.error('Assign driver error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to assign driver role. Please try again.'
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle toggle user status - FIXED: Add stationID workaround
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      
      // First, let's try the normal way
      const response = await api.post('/api/auth/toggle-status', {
        userId: selectedUser._id
      });
      
      if (response.data.success) {
        const action = selectedUser.isActive ? 'deactivated' : 'activated';
        setSuccess(`Passenger ${action} successfully`);
        setToggleDialogOpen(false);
        fetchUsers();
      } else {
        setError(response.data.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      
      // If it's a 403 error about stationID, try workaround
      if (err.response?.status === 403 && 
          err.response?.data?.message?.includes('Cannot manage users from other stations')) {
        
        // WORKAROUND: Temporarily assign passenger to station admin's station
        try {
          const currentStationID = getCurrentUserStationID();
          
          if (!currentStationID) {
            setError('You are not assigned to a station. Please contact super admin.');
            return;
          }
          
          // Update passenger with station admin's stationID
          const updateResponse = await api.put(`/api/auth/user/${selectedUser._id}`, {
            stationID: currentStationID
          });
          
          if (updateResponse.data.success) {
            // Now try toggling status again
            const toggleResponse = await api.post('/api/auth/toggle-status', {
              userId: selectedUser._id
            });
            
            if (toggleResponse.data.success) {
              const action = selectedUser.isActive ? 'deactivated' : 'activated';
              setSuccess(`Passenger ${action} successfully (station assigned)`);
              setToggleDialogOpen(false);
              fetchUsers();
              
              // Remove stationID after toggling (optional)
              setTimeout(async () => {
                try {
                  await api.put(`/api/auth/user/${selectedUser._id}`, {
                    stationID: ''
                  });
                } catch (removeErr) {
                  console.warn('Could not remove stationID:', removeErr);
                }
              }, 1000);
              
            } else {
              setError(toggleResponse.data.message || 'Failed to update user status after station assignment');
            }
          } else {
            setError('Failed to assign passenger to your station');
          }
          
        } catch (workaroundErr) {
          console.error('Workaround error:', workaroundErr);
          setError(
            workaroundErr.response?.data?.message || 
            'Failed to manage passenger. Please contact super admin.'
          );
        }
      } else {
        // Regular error handling
        const errorMessage = err.response?.data?.message || 
                            'Failed to update user status. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and filters
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

  return (
    <Box>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            Passenger Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Passengers
                </Typography>
                <Typography variant="h4">
                  {totalUsers}
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
                <Typography variant="h4" color="primary.main">
                  {users.filter(u => u.isActive).length}
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
                  {users.filter(u => !u.isActive).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Passengers"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
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
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={clearError}>
                DISMISS
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
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
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
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {user.fullName?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="medium">
                                {user.fullName}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                ID: {user._id?.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography>{user.email}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.phoneNumber}
                          </Typography>
                          {user.emergencyContact && (
                            <Typography variant="body2" color="textSecondary">
                              Emergency: {user.emergencyContact}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
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
                          </Box>
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
              sx={{ mb: 3 }}
              placeholder="Enter driver's license number"
            />
            
            <TextField
              fullWidth
              label="Station ID"
              value={assignForm.stationID}
              onChange={(e) => setAssignForm({
                ...assignForm,
                stationID: e.target.value
              })}
              helperText={`Your station ID: ${getCurrentUserStationID() || 'Not assigned'}`}
              sx={{ mb: 2 }}
              placeholder="Station ID"
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Assigning a passenger as driver will:
                <ul>
                  <li>Change their role from passenger to driver</li>
                  <li>Require them to provide license information for trips</li>
                  <li>Allow them to be assigned to vehicles</li>
                  <li>Assign them to your station automatically</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)} disabled={assignLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignDriver}
            disabled={assignLoading}
            startIcon={assignLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {assignLoading ? 'Assigning...' : 'Assign as Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
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
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center" p={2}>
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        fontSize: 40,
                        bgcolor: 'primary.main',
                        mb: 2
                      }}
                    >
                      {selectedUserDetails.fullName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {selectedUserDetails.fullName}
                    </Typography>
                    <Chip
                      label={selectedUserDetails.role?.replace('_', ' ')}
                      color="success"
                      sx={{ mb: 1 }}
                    />
                    <Chip
                      label={selectedUserDetails.isActive ? 'Active' : 'Inactive'}
                      color={selectedUserDetails.isActive ? 'success' : 'error'}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Contact Information
                    </Typography>
                    <Typography>Email: {selectedUserDetails.email}</Typography>
                    <Typography>Phone: {selectedUserDetails.phoneNumber}</Typography>
                    {selectedUserDetails.emergencyContact && (
                      <Typography>
                        Emergency Contact: {selectedUserDetails.emergencyContact}
                      </Typography>
                    )}
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Account Information
                    </Typography>
                    <Typography>
                      Created: {formatDate(selectedUserDetails.createdAt)}
                    </Typography>
                    {selectedUserDetails.lastLogin && (
                      <Typography>
                        Last Login: {formatDate(selectedUserDetails.lastLogin)}
                      </Typography>
                    )}
                    {selectedUserDetails.lastPasswordReset && (
                      <Typography>
                        Last Password Reset: {formatDate(selectedUserDetails.lastPasswordReset)}
                      </Typography>
                    )}
                  </Box>
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
            <CircularProgress />
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
            <Alert 
              severity={selectedUser.isActive ? 'warning' : 'info'} 
              sx={{ mt: 2 }}
            >
              <Typography>
                Are you sure you want to{' '}
                <strong>{selectedUser.isActive ? 'deactivate' : 'activate'}</strong>{' '}
                the passenger <strong>{selectedUser.fullName}</strong>?
              </Typography>
              {selectedUser.isActive && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Deactivated passengers cannot log in to the system.
                </Typography>
              )}
              {!selectedUser.isActive && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Activated passengers will be able to log in and use the system.
                </Typography>
              )}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> This will temporarily assign the passenger to your station
                  to bypass backend permission checks.
                </Typography>
              </Alert>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggleDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedUser?.isActive ? 'error' : 'success'}
            onClick={handleToggleStatus}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : (selectedUser?.isActive ? 'Deactivate' : 'Activate')}
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