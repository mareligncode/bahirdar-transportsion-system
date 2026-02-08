import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Avatar,
  Stack,
  Divider,
  Modal,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import api from '../../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDriverDialog, setOpenDriverDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userRole, setUserRole] = useState('');
  const [userStationId, setUserStationId] = useState('');
  const [stationName, setStationName] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form state for driver assignment
  const [driverForm, setDriverForm] = useState({
    licenseNumber: '',
    stationID: ''
  });

  // User stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    driversAssigned: 0
  });

  // Get user data from token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        setUserStationId(payload.stationID || '');
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  // Fetch station name
  const fetchStationName = useCallback(async () => {
    if (userStationId) {
      try {
        const response = await api.get(`/api/station/${userStationId}`);
        if (response.data?.station) {
          setStationName(response.data.station.stationName);
        }
      } catch (err) {
        console.error('Error fetching station name:', err);
      }
    }
  }, [userStationId]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch station users (passengers and drivers)
      const response = await api.get('/api/auth/station-users');
      
      let usersData = [];
      if (response.data?.success) {
        usersData = response.data.data?.users || [];
      } else if (response.data?.data?.users) {
        usersData = response.data.data.users;
      } else if (response.data?.users) {
        usersData = response.data.users;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      }
      
      // For station admin: filter to show only passengers from their station or all passengers
      // According to backend, station users include passengers (who don't have stationID) and drivers from the station
      const filteredData = usersData.filter(user => {
        // Show passengers (role = 'passenger')
        // And drivers assigned to this station (role = 'driver' and stationID matches)
        if (user.role === 'passenger') {
          return true; // Show all passengers
        }
        return false; // Don't show drivers in this list
      });
      
      setUsers(filteredData);
      setFilteredUsers(filteredData);
      
      // Calculate statistics
      calculateStats(filteredData);
      
      // Fetch station name
      await fetchStationName();

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [fetchStationName]);

  const calculateStats = (usersData) => {
    const stats = {
      total: usersData.length,
      active: usersData.filter(u => u.isActive).length,
      inactive: usersData.filter(u => !u.isActive).length,
      driversAssigned: 0 // Will be calculated separately
    };
    
    // Count assigned drivers (from the station)
    const assignedDrivers = usersData.filter(user => 
      user.role === 'driver' && user.stationID === userStationId
    ).length;
    stats.driversAssigned = assignedDrivers;
    
    setStats(stats);
  };

  useEffect(() => {
    if (userRole) {
      fetchUsers();
    }
  }, [fetchUsers, userRole]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
    setPage(0); // Reset to first page when filters change
  }, [users, searchTerm, statusFilter]);

  // Dialog handlers
  const handleOpenDriverDialog = (user) => {
    setSelectedUser(user);
    // Auto-populate stationID for station admin
    const stationID = userStationId || '';
    setDriverForm({
      licenseNumber: '',
      stationID: stationID
    });
    setOpenDriverDialog(true);
  };

  const handleOpenStatusDialog = (user) => {
    setSelectedUser(user);
    setOpenStatusDialog(true);
  };

  const handleOpenDetailModal = (user) => {
    setSelectedUser(user);
    setOpenDetailModal(true);
  };

  const handleCloseAllDialogs = () => {
    setOpenDriverDialog(false);
    setOpenStatusDialog(false);
    setOpenDetailModal(false);
    setSelectedUser(null);
    setDriverForm({ licenseNumber: '', stationID: '' });
    setError('');
    setFormLoading(false);
  };

  // API Actions
  const handleAssignDriver = async () => {
    try {
      if (!driverForm.licenseNumber.trim()) {
        setError('License number is required');
        return;
      }

      setFormLoading(true);

      const response = await api.post('/api/auth/assign-driver', {
        passengerId: selectedUser._id,
        licenseNumber: driverForm.licenseNumber,
        stationID: driverForm.stationID || userStationId
      });

      if (response.data?.success) {
        setSuccess(`Successfully assigned ${selectedUser.fullName} as driver`);
        
        // Remove the user from the list immediately
        setUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
        setFilteredUsers(prevFiltered => prevFiltered.filter(user => user._id !== selectedUser._id));
        
        handleCloseAllDialogs();
        
        // Recalculate stats
        const updatedUsers = users.filter(user => user._id !== selectedUser._id);
        calculateStats(updatedUsers);
        
        // Refresh the users list
        setTimeout(() => fetchUsers(), 500);
      } else {
        throw new Error('Failed to assign driver');
      }
    } catch (err) {
      console.error('Error assigning driver:', err);
      setError(err.response?.data?.message || err.message || 'Failed to assign driver role');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setFormLoading(true);

      const response = await api.post('/api/auth/toggle-status', {
        userId: selectedUser._id
      });

      if (response.data?.success) {
        const newStatus = !selectedUser.isActive;
        setSuccess(`User ${selectedUser.isActive ? 'deactivated' : 'activated'} successfully`);
        
        // Update user status in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === selectedUser._id 
              ? { ...user, isActive: newStatus } 
              : user
          )
        );
        
        setFilteredUsers(prevFiltered => 
          prevFiltered.map(user => 
            user._id === selectedUser._id 
              ? { ...user, isActive: newStatus } 
              : user
          )
        );
        
        handleCloseAllDialogs();
        
        // Recalculate stats
        const updatedUsers = users.map(user => 
          user._id === selectedUser._id 
            ? { ...user, isActive: newStatus } 
            : user
        );
        calculateStats(updatedUsers);
      } else {
        throw new Error('Failed to toggle status');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to change user status');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never logged in';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('251')) {
      return `+${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8)}`;
    }
    return phone;
  };

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: 3
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold">
          <PersonIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Passenger Management
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Manage passengers and assign driver roles for {stationName || 'your station'}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            icon: <PersonIcon />,
            title: 'Total Passengers',
            value: stats.total,
            color: '#3f51b5',
            bgColor: '#e8eaf6'
          },
          {
            icon: <CheckCircleIcon />,
            title: 'Active Passengers',
            value: stats.active,
            color: '#4caf50',
            bgColor: '#e8f5e9'
          },
          {
            icon: <BlockIcon />,
            title: 'Inactive Passengers',
            value: stats.inactive,
            color: '#f44336',
            bgColor: '#ffebee'
          },
          {
            icon: <AssignmentIcon />,
            title: 'Drivers Assigned',
            value: stats.driversAssigned,
            color: '#ff9800',
            bgColor: '#fff3e0'
          }
        ].map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderLeft: `4px solid ${stat.color}`,
              height: '100%'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: stat.bgColor, color: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography color="text.secondary" variant="caption" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
          <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          Filter Passengers
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search passengers by name, email, or phone..."
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleClearFilters}
                sx={{ flex: 1, borderRadius: 2 }}
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchUsers}
                sx={{ 
                  flex: 1, 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ 
        mb: 3, 
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
            Passengers List ({filteredUsers.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Passenger Details</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Contact Information</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Last Activity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No passengers found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm 
                          ? 'Try changing your search term' 
                          : users.length === 0 
                            ? 'No passengers registered yet' 
                            : 'No passengers match the selected filter'
                        }
                      </Typography>
                      {users.length === 0 && (
                        <Button 
                          variant="outlined" 
                          startIcon={<RefreshIcon />}
                          onClick={fetchUsers}
                          sx={{ mt: 2, borderRadius: 2 }}
                        >
                          Refresh List
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow 
                    key={user._id} 
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: '#f8f9fa' },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar 
                          sx={{ 
                            mr: 2, 
                            bgcolor: user.isActive ? 'primary.main' : '#9e9e9e',
                            color: 'white'
                          }}
                        >
                          {user.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {user.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatPhoneNumber(user.phoneNumber)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'ACTIVE' : 'INACTIVE'}
                        color={getStatusColor(user.isActive)}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          borderRadius: 1
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(user.lastLogin)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDetailModal(user)}
                              sx={{ 
                                bgcolor: '#e3f2fd',
                                '&:hover': { bgcolor: '#bbdefb' }
                              }}
                            >
                              <VisibilityIcon fontSize="small" color="primary" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Assign as Driver">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDriverDialog(user)}
                              sx={{ 
                                bgcolor: '#e8f5e9',
                                '&:hover': { bgcolor: '#c8e6c9' }
                              }}
                            >
                              <AssignmentIcon fontSize="small" color="success" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenStatusDialog(user)}
                              sx={{ 
                                bgcolor: user.isActive ? '#fff3e0' : '#e8f5e9',
                                '&:hover': { bgcolor: user.isActive ? '#ffe0b2' : '#c8e6c9' }
                              }}
                            >
                              {user.isActive ? (
                                <BlockIcon fontSize="small" color="warning" />
                              ) : (
                                <CheckCircleIcon fontSize="small" color="success" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {paginatedUsers.length > 0 && (
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              borderTop: '1px solid #e0e0e0',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontWeight: 500
              }
            }}
          />
        )}
      </Paper>

      {/* Assign Driver Dialog */}
      <Dialog 
        open={openDriverDialog} 
        onClose={handleCloseAllDialogs} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'success.main', 
          color: 'white',
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }}>
          <Box display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 1 }} />
            <Typography fontWeight="bold">Assign Driver Role</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2">
              Assigning driver role to <strong>{selectedUser?.fullName}</strong>
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            label="License Number *"
            value={driverForm.licenseNumber}
            onChange={(e) => setDriverForm({...driverForm, licenseNumber: e.target.value})}
            required
            disabled={formLoading}
            margin="normal"
            helperText="Valid driver's license number"
            size="small"
          />
          
          <TextField
            fullWidth
            label="Station ID"
            value={driverForm.stationID || userStationId}
            onChange={(e) => setDriverForm({...driverForm, stationID: e.target.value})}
            disabled={true} // Auto-populated for station admin
            margin="normal"
            helperText={`Auto-assigned to your station: ${stationName}`}
            size="small"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              What happens next?
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Passenger will be converted to driver" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Will be removed from passengers list" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Will appear in drivers management section" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Will gain access to driver dashboard" />
              </ListItem>
            </List>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseAllDialogs} 
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignDriver}
            variant="contained"
            color="success"
            disabled={formLoading || !driverForm.licenseNumber.trim()}
            startIcon={formLoading ? <CircularProgress size={20} /> : <AssignmentIcon />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
            }}
          >
            {formLoading ? 'Assigning...' : 'Confirm & Assign as Driver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog 
        open={openStatusDialog} 
        onClose={handleCloseAllDialogs} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: selectedUser?.isActive ? 'warning.main' : 'success.main', 
          color: 'white',
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }}>
          <Box display="flex" alignItems="center">
            {selectedUser?.isActive ? (
              <BlockIcon sx={{ mr: 1 }} />
            ) : (
              <CheckCircleIcon sx={{ mr: 1 }} />
            )}
            <Typography fontWeight="bold">
              {selectedUser?.isActive ? 'Deactivate Passenger' : 'Activate Passenger'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Alert severity={selectedUser?.isActive ? 'warning' : 'success'} sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              {selectedUser?.isActive ? 'Deactivate' : 'Activate'} <strong>{selectedUser?.fullName}</strong>?
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedUser?.isActive 
                ? 'Deactivated passengers cannot log in or book trips.'
                : 'Activated passengers will be able to log in and book trips.'
              }
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseAllDialogs} 
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleToggleStatus}
            variant="contained"
            color={selectedUser?.isActive ? 'warning' : 'success'}
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : 
              (selectedUser?.isActive ? <BlockIcon /> : <CheckCircleIcon />)}
            sx={{ 
              borderRadius: 2,
              background: selectedUser?.isActive 
                ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
            }}
          >
            {formLoading ? 'Processing...' : 
              (selectedUser?.isActive ? 'Confirm & Deactivate' : 'Confirm & Activate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Detail Modal */}
      <Modal
        open={openDetailModal}
        onClose={handleCloseAllDialogs}
        aria-labelledby="user-detail-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: 600 },
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 4
        }}>
          {selectedUser && (
            <>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Passenger Details
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  mr: 2, 
                  fontSize: '2rem',
                  bgcolor: selectedUser.isActive ? 'primary.main' : '#9e9e9e'
                }}>
                  {selectedUser.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.fullName}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label="Passenger"
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={selectedUser.isActive ? 'Active' : 'Inactive'}
                      color={getStatusColor(selectedUser.isActive)}
                      size="small"
                    />
                  </Stack>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Email Address
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedUser.email}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Phone Number
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {formatPhoneNumber(selectedUser.phoneNumber)}
                    </Typography>
                  </Card>
                </Grid>
                
                {selectedUser.emergencyContact && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Emergency Contact
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedUser.emergencyContact}
                      </Typography>
                    </Card>
                  </Grid>
                )}
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Last Login
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(selectedUser.lastLogin)}
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Account Created
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(selectedUser.createdAt)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
              
              <Box mt={4} display="flex" justifyContent="space-between" gap={2}>
                <Button 
                  onClick={() => {
                    handleCloseAllDialogs();
                    handleOpenDriverDialog(selectedUser);
                  }}
                  variant="contained" 
                  color="success"
                  startIcon={<AssignmentIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Assign as Driver
                </Button>
                <Button 
                  onClick={handleCloseAllDialogs} 
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Snackbars for notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError('')}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 26 }
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {error}
          </Typography>
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess('')}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 26 }
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {success}
          </Typography>
        </Alert>
      </Snackbar>
    </Container>
  );
};

 export default Users;