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
  TextField,
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  FormControlLabel,
  Switch,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CarRental as CarRentalIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openCreateDriverDialog, setOpenCreateDriverDialog] = useState(false);
  const [openAssignVehicleDialog, setOpenAssignVehicleDialog] = useState(false);
  
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Driver stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withVehicle: 0,
    withoutVehicle: 0
  });

  // For creating new driver
  const [passengers, setPassengers] = useState([]);
  const [createForm, setCreateForm] = useState({
    passengerId: '',
    licenseNumber: '',
    stationID: ''
  });
  
  // For vehicle assignment
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    vehicleId: '',
    action: 'assign' // 'assign' or 'remove'
  });

  // Fetch drivers from API - CORRECTED ENDPOINT
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Station admin can only see their station's drivers
      const response = await api.get('/api/auth/station-users');
      
      if (response.data.success) {
        // Filter to show only drivers from this station
        const usersData = response.data.data.users;
        const driversData = usersData.filter(user => user.role === 'driver');
        
        setDrivers(driversData);
        setFilteredDrivers(driversData);
        
        // Calculate statistics
        calculateStats(driversData);
      } else {
        setError('Failed to load drivers');
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(err.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available vehicles for assignment
  const fetchAvailableVehicles = useCallback(async () => {
    try {
      const response = await api.get('/api/vehicles/available');
      if (response.data.success) {
        setAvailableVehicles(response.data.data.vehicles || []);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  }, []);

  // Fetch passengers for driver creation
  const fetchPassengers = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/station-users');
      if (response.data.success) {
        const usersData = response.data.data.users;
        const passengersData = usersData.filter(user => 
          user.role === 'passenger' && 
          user.isActive === true
        );
        setPassengers(passengersData);
      }
    } catch (err) {
      console.error('Error fetching passengers:', err);
    }
  }, []);

  const calculateStats = (driversData) => {
    const stats = {
      total: driversData.length,
      active: driversData.filter(d => d.isActive).length,
      inactive: driversData.filter(d => !d.isActive).length,
      withVehicle: driversData.filter(d => d.driverID || d.vehicleID).length,
      withoutVehicle: driversData.filter(d => !d.driverID && !d.vehicleID).length
    };
    setStats(stats);
  };

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Filter drivers based on search and filters
  useEffect(() => {
    let filtered = drivers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phoneNumber?.includes(searchTerm) ||
        driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(driver => 
        statusFilter === 'active' ? driver.isActive : !driver.isActive
      );
    }

    // Vehicle assignment filter
    if (vehicleFilter !== 'all') {
      filtered = filtered.filter(driver => 
        vehicleFilter === 'assigned' ? (driver.driverID || driver.vehicleID) : (!driver.driverID && !driver.vehicleID)
      );
    }

    setFilteredDrivers(filtered);
    setPage(0); // Reset to first page when filters change
  }, [drivers, searchTerm, statusFilter, vehicleFilter]);

  // Dialog handlers
  const handleOpenStatusDialog = (driver) => {
    setSelectedDriver(driver);
    setOpenStatusDialog(true);
  };

  const handleOpenDetailModal = (driver) => {
    setSelectedDriver(driver);
    setOpenDetailModal(true);
  };

  const handleOpenAssignDialog = (driver) => {
    setSelectedDriver(driver);
    setAssignmentForm({
      vehicleId: driver.vehicleID || driver.driverID || '',
      action: (driver.vehicleID || driver.driverID) ? 'remove' : 'assign'
    });
    fetchAvailableVehicles();
    setOpenAssignDialog(true);
  };

  const handleOpenCreateDriverDialog = () => {
    fetchPassengers();
    setCreateForm({
      passengerId: '',
      licenseNumber: '',
      stationID: '' // Will be populated from station admin's station
    });
    setOpenCreateDriverDialog(true);
  };

  const handleOpenAssignVehicleDialog = (driver) => {
    setSelectedDriver(driver);
    fetchAvailableVehicles();
    setOpenAssignVehicleDialog(true);
  };

  const handleCloseAllDialogs = () => {
    setOpenStatusDialog(false);
    setOpenDetailModal(false);
    setOpenAssignDialog(false);
    setOpenCreateDriverDialog(false);
    setOpenAssignVehicleDialog(false);
    setSelectedDriver(null);
  };

  // API Actions
  const handleToggleStatus = async () => {
    try {
      const response = await api.post('/api/auth/toggle-status', {
        userId: selectedDriver._id
      });

      if (response.data.success) {
        const newStatus = !selectedDriver.isActive;
        setSuccess(`Driver ${selectedDriver.isActive ? 'deactivated' : 'activated'} successfully`);
        
        // Update driver status in local state
        setDrivers(prevDrivers => 
          prevDrivers.map(driver => 
            driver._id === selectedDriver._id 
              ? { ...driver, isActive: newStatus } 
              : driver
          )
        );
        
        handleCloseAllDialogs();
        fetchDrivers(); // Refresh list
      }
    } catch (err) {
      console.error('Error toggling driver status:', err);
      setError(err.response?.data?.message || 'Failed to change driver status');
    }
  };

  // Create new driver from passenger
  const handleCreateDriver = async () => {
    if (!createForm.passengerId || !createForm.licenseNumber) {
      setError('Please select a passenger and enter license number');
      return;
    }

    try {
      const response = await api.post('/api/auth/assign-driver', {
        passengerId: createForm.passengerId,
        licenseNumber: createForm.licenseNumber
        // stationID is automatically set from station admin's station
      });

      if (response.data.success) {
        setSuccess('Driver created successfully!');
        setOpenCreateDriverDialog(false);
        setCreateForm({ passengerId: '', licenseNumber: '', stationID: '' });
        fetchDrivers(); // Refresh list
      }
    } catch (err) {
      console.error('Error creating driver:', err);
      setError(err.response?.data?.message || 'Failed to create driver');
    }
  };

  // Assign/remove vehicle from driver
  const handleAssignVehicle = async () => {
    if (assignmentForm.action === 'assign' && !assignmentForm.vehicleId) {
      setError('Please select a vehicle');
      return;
    }

    try {
      let response;
      if (assignmentForm.action === 'assign') {
        response = await api.post(`/api/vehicles/${assignmentForm.vehicleId}/assign-driver/${selectedDriver._id}`);
      } else {
        response = await api.post(`/api/vehicles/${selectedDriver.vehicleID || selectedDriver.driverID}/remove-driver`);
      }

      if (response.data.success) {
        setSuccess(`Vehicle ${assignmentForm.action === 'assign' ? 'assigned' : 'removed'} successfully`);
        setOpenAssignDialog(false);
        fetchDrivers(); // Refresh list
      }
    } catch (err) {
      console.error('Error assigning vehicle:', err);
      setError(err.response?.data?.message || `Failed to ${assignmentForm.action} vehicle`);
    }
  };

  // Assign specific vehicle to driver (alternative method)
  const handleAssignSpecificVehicle = async (vehicleId) => {
    try {
      const response = await api.post(`/api/vehicles/${vehicleId}/assign-driver/${selectedDriver._id}`);
      if (response.data.success) {
        setSuccess('Vehicle assigned successfully');
        setOpenAssignVehicleDialog(false);
        fetchDrivers(); // Refresh list
      }
    } catch (err) {
      console.error('Error assigning specific vehicle:', err);
      setError(err.response?.data?.message || 'Failed to assign vehicle');
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
    setVehicleFilter('all');
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getAssignmentColor = (hasVehicle) => {
    return hasVehicle ? 'success' : 'warning';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'PPpp');
  };

  // Check if driver has vehicle assignment
  const hasVehicleAssignment = (driver) => {
    return driver.driverID || driver.vehicleID;
  };

  // Get vehicle assignment info
  const getVehicleInfo = (driver) => {
    if (driver.vehicle) {
      return `${driver.vehicle.plateNumber} (${driver.vehicle.carType})`;
    }
    if (driver.vehicleID) {
      return `Vehicle ID: ${driver.vehicleID}`;
    }
    return 'Not assigned';
  };

  // Pagination
  const paginatedDrivers = filteredDrivers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && drivers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Driver Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage drivers and their assignments for your station
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenCreateDriverDialog}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Create New Driver
          </Button>
        </Box>
      </Box>

      {/* Stats Cards - Updated to Grid v2 syntax */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #3f51b5' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Drivers
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active Drivers
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #f44336' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Inactive Drivers
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.inactive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                With Vehicle
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.withVehicle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={{ borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Without Vehicle
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {stats.withoutVehicle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters - Updated to Grid v2 syntax */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search drivers by name, email, phone, or license..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="medium"
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="medium">
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
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="medium">
              <InputLabel>Vehicle</InputLabel>
              <Select
                value={vehicleFilter}
                label="Vehicle"
                onChange={(e) => setVehicleFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="assigned">With Vehicle</MenuItem>
                <MenuItem value="unassigned">Without Vehicle</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
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
                onClick={fetchDrivers}
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

      {/* Drivers Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main', '& th': { color: 'white', fontWeight: 'bold' } }}>
              <TableCell>Driver</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>License</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedDrivers.map((driver) => (
              <TableRow key={driver._id} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                      {driver.fullName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {driver.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {driver._id.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                      <EmailIcon fontSize="small" /> {driver.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <PhoneIcon fontSize="small" /> {driver.phoneNumber}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={driver.licenseNumber ? `License: ${driver.licenseNumber}` : 'No license assigned'}>
                    <Chip
                      label={driver.licenseNumber || 'No License'}
                      color={driver.licenseNumber ? "primary" : "default"}
                      size="small"
                      variant={driver.licenseNumber ? "filled" : "outlined"}
                      icon={<BadgeIcon />}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip
                    label={driver.isActive ? 'Active' : 'Inactive'}
                    color={getStatusColor(driver.isActive)}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={hasVehicleAssignment(driver) ? 'Assigned' : 'Not Assigned'}
                      color={getAssignmentColor(hasVehicleAssignment(driver))}
                      size="small"
                      icon={<CarIcon />}
                    />
                    {hasVehicleAssignment(driver) && (
                      <Tooltip title={getVehicleInfo(driver)}>
                        <InfoIcon color="info" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(driver.lastLogin)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {/* View Details button */}
                    <Tooltip title="View Details">
                      <IconButton
                        color="info"
                        size="small"
                        onClick={() => handleOpenDetailModal(driver)}
                        sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>

                    {/* Assign/Remove Vehicle button */}
                    <Tooltip title={hasVehicleAssignment(driver) ? "Manage Vehicle" : "Assign Vehicle"}>
                      <IconButton
                        color={hasVehicleAssignment(driver) ? "warning" : "success"}
                        size="small"
                        onClick={() => handleOpenAssignDialog(driver)}
                        sx={{ 
                          bgcolor: hasVehicleAssignment(driver) ? '#fff3e0' : '#e8f5e9',
                          '&:hover': { 
                            bgcolor: hasVehicleAssignment(driver) ? '#ffe0b2' : '#c8e6c9' 
                          }
                        }}
                      >
                        {hasVehicleAssignment(driver) ? <AssignmentIcon /> : <CarRentalIcon />}
                      </IconButton>
                    </Tooltip>

                    {/* Toggle Status button */}
                    <Tooltip title={driver.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        color={driver.isActive ? "error" : "success"}
                        size="small"
                        onClick={() => handleOpenStatusDialog(driver)}
                        sx={{ 
                          bgcolor: driver.isActive ? '#ffebee' : '#e8f5e9',
                          '&:hover': { 
                            bgcolor: driver.isActive ? '#ffcdd2' : '#c8e6c9' 
                          }
                        }}
                      >
                        {driver.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Empty state */}
        {paginatedDrivers.length === 0 && !loading && (
          <Box p={6} textAlign="center">
            <CarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {drivers.length === 0 ? 'No Drivers Found' : 'No Matching Drivers'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {searchTerm 
                ? 'Try changing your search term' 
                : drivers.length === 0 
                  ? 'No drivers are assigned to your station yet.' 
                  : 'No drivers match the selected filter criteria.'
              }
            </Typography>
            {drivers.length === 0 && (
              <Button 
                variant="contained" 
                startIcon={<PersonAddIcon />}
                onClick={handleOpenCreateDriverDialog}
                sx={{ mt: 2 }}
              >
                Create Your First Driver
              </Button>
            )}
          </Box>
        )}
      </TableContainer>

      {/* Pagination */}
      {filteredDrivers.length > 0 && (
        <TablePagination
          component="div"
          count={filteredDrivers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ mt: 2 }}
        />
      )}

      {/* Create Driver Dialog */}
      <Dialog open={openCreateDriverDialog} onClose={handleCloseAllDialogs} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" alignItems="center">
            <PersonAddIcon sx={{ mr: 2 }} />
            Create New Driver
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              Convert a passenger to a driver by assigning a license number.
            </Typography>
          </Alert>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Passenger *</InputLabel>
            <Select
              value={createForm.passengerId}
              onChange={(e) => setCreateForm({ ...createForm, passengerId: e.target.value })}
              label="Select Passenger *"
            >
              <MenuItem value="">
                <Typography color="text.secondary">Select a passenger</Typography>
              </MenuItem>
              {passengers.map((passenger) => (
                <MenuItem key={passenger._id} value={passenger._id}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {passenger.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {passenger.email} • {passenger.phoneNumber}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {passengers.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                No active passengers available in your station
              </Typography>
            )}
          </FormControl>
          
          <TextField
            fullWidth
            label="License Number *"
            value={createForm.licenseNumber}
            onChange={(e) => setCreateForm({ ...createForm, licenseNumber: e.target.value.toUpperCase() })}
            placeholder="Enter driver's license number"
            sx={{ mb: 3 }}
          />
          
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This passenger will be converted to a driver role and will have access to driver features.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseAllDialogs} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateDriver}
            variant="contained"
            disabled={!createForm.passengerId || !createForm.licenseNumber}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Create Driver
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign/Remove Vehicle Dialog */}
      <Dialog open={openAssignDialog} onClose={handleCloseAllDialogs} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: assignmentForm.action === 'assign' ? 'primary.main' : 'warning.main', 
          color: 'white' 
        }}>
          <Box display="flex" alignItems="center">
            {assignmentForm.action === 'assign' ? <CarRentalIcon sx={{ mr: 2 }} /> : <AssignmentIcon sx={{ mr: 2 }} />}
            {assignmentForm.action === 'assign' ? 'Assign Vehicle' : 'Remove Vehicle'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Driver: {selectedDriver?.fullName}
          </Typography>
          
          {assignmentForm.action === 'assign' ? (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Vehicle *</InputLabel>
              <Select
                value={assignmentForm.vehicleId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, vehicleId: e.target.value })}
                label="Select Vehicle *"
              >
                <MenuItem value="">
                  <Typography color="text.secondary">Select a vehicle</Typography>
                </MenuItem>
                {availableVehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.carType} • Capacity: {vehicle.totalCapacity}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {availableVehicles.length === 0 && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2">
                    No available vehicles in your station. All vehicles are already assigned.
                  </Typography>
                </Alert>
              )}
            </FormControl>
          ) : (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Are you sure you want to remove the vehicle assignment?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This driver will no longer be assigned to any vehicle.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseAllDialogs} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignVehicle}
            variant="contained"
            color={assignmentForm.action === 'assign' ? 'primary' : 'warning'}
            disabled={assignmentForm.action === 'assign' && !assignmentForm.vehicleId}
            sx={{ borderRadius: 2 }}
          >
            {assignmentForm.action === 'assign' ? 'Assign Vehicle' : 'Remove Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Driver Detail Modal */}
      <Modal
        open={openDetailModal}
        onClose={handleCloseAllDialogs}
        aria-labelledby="driver-detail-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 800,
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 4
        }}>
          {selectedDriver && (
            <>
              <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                Driver Profile
              </Typography>
              
              <Box display="flex" alignItems="center" mb={4} gap={3}>
                <Avatar sx={{ width: 100, height: 100, fontSize: '2.5rem', bgcolor: 'primary.main' }}>
                  {selectedDriver.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h3" fontWeight="bold">
                    {selectedDriver.fullName}
                  </Typography>
                  <Stack direction="row" spacing={2} mt={1}>
                    <Chip label="Driver" color="primary" />
                    <Chip 
                      label={selectedDriver.isActive ? 'Active' : 'Inactive'} 
                      color={getStatusColor(selectedDriver.isActive)} 
                    />
                    <Chip 
                      label={hasVehicleAssignment(selectedDriver) ? 'Vehicle Assigned' : 'No Vehicle'} 
                      color={getAssignmentColor(hasVehicleAssignment(selectedDriver))}
                      icon={<CarIcon />}
                    />
                  </Stack>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={4}>
                {/* Personal Information */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" color="text.secondary">
                    Personal Information
                  </Typography>
                  <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom display="flex" alignItems="center" gap={1}>
                          <EmailIcon /> Email Address
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedDriver.email}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom display="flex" alignItems="center" gap={1}>
                          <PhoneIcon /> Phone Number
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedDriver.phoneNumber}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom display="flex" alignItems="center" gap={1}>
                          <BadgeIcon /> License Number
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedDriver.licenseNumber || 'Not Provided'}
                        </Typography>
                      </Box>
                      
                      {selectedDriver.emergencyContact && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom display="flex" alignItems="center" gap={1}>
                            <PersonIcon /> Emergency Contact
                          </Typography>
                          <Typography variant="body1">
                            {selectedDriver.emergencyContact}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                </Grid>
                
                {/* Assignment & Activity */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" color="text.secondary">
                    Assignment & Activity
                  </Typography>
                  <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom display="flex" alignItems="center" gap={1}>
                          <LocationIcon /> Station ID
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedDriver.stationID || 'Not Assigned'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom display="flex" alignItems="center" gap={1}>
                          <CarIcon /> Vehicle Assignment
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {getVehicleInfo(selectedDriver)}
                        </Typography>
                        {hasVehicleAssignment(selectedDriver) && (
                          <Button 
                            size="small" 
                            startIcon={<AssignmentIcon />}
                            onClick={() => {
                              handleCloseAllDialogs();
                              handleOpenAssignDialog(selectedDriver);
                            }}
                            sx={{ mt: 1 }}
                          >
                            Manage Assignment
                          </Button>
                        )}
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom display="flex" alignItems="center" gap={1}>
                          <CalendarTodayIcon /> Last Login
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedDriver.lastLogin)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Account Created
                        </Typography>
                        <Typography variant="body1">
                          {selectedDriver.createdAt ? format(new Date(selectedDriver.createdAt), 'PPpp') : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                
                {/* Driver ID */}
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Driver ID
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                      {selectedDriver._id}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Action Buttons */}
              <Box mt={4} display="flex" justifyContent="space-between">
                <Button 
                  onClick={() => {
                    handleCloseAllDialogs();
                    handleOpenAssignDialog(selectedDriver);
                  }}
                  variant="contained" 
                  color={hasVehicleAssignment(selectedDriver) ? "warning" : "primary"}
                  startIcon={hasVehicleAssignment(selectedDriver) ? <AssignmentIcon /> : <CarRentalIcon />}
                >
                  {hasVehicleAssignment(selectedDriver) ? 'Manage Vehicle' : 'Assign Vehicle'}
                </Button>
                
                <Stack direction="row" spacing={2}>
                  <Button 
                    onClick={() => {
                      handleCloseAllDialogs();
                      handleOpenStatusDialog(selectedDriver);
                    }}
                    variant="contained" 
                    color={selectedDriver.isActive ? "error" : "success"}
                    startIcon={selectedDriver.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                  >
                    {selectedDriver.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button onClick={handleCloseAllDialogs} variant="outlined">
                    Close
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Toggle Status Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseAllDialogs} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: selectedDriver?.isActive ? '#f44336' : '#4caf50', 
          color: 'white',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          <Box display="flex" alignItems="center">
            {selectedDriver?.isActive ? (
              <BlockIcon sx={{ mr: 2 }} />
            ) : (
              <CheckCircleIcon sx={{ mr: 2 }} />
            )}
            <Typography variant="h6">
              {selectedDriver?.isActive ? 'Deactivate Driver' : 'Activate Driver'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert 
            severity={selectedDriver?.isActive ? 'warning' : 'success'} 
            sx={{ mb: 2, borderRadius: 2 }}
          >
            <Typography variant="body1" fontWeight="bold">
              Are you sure you want to {selectedDriver?.isActive ? 'deactivate' : 'activate'} 
              <strong> {selectedDriver?.fullName}</strong>?
            </Typography>
          </Alert>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              {selectedDriver?.isActive 
                ? 'Deactivated drivers cannot log in or access driver features.'
                : 'Activated drivers will be able to log in and access driver dashboard.'
              }
            </Typography>
          </Alert>

          {selectedDriver?.isActive && hasVehicleAssignment(selectedDriver) && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> This driver is currently assigned to a vehicle. 
                Deactivating them will not automatically unassign the vehicle.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseAllDialogs} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleToggleStatus}
            variant="contained"
            color={selectedDriver?.isActive ? 'error' : 'success'}
            startIcon={selectedDriver?.isActive ? <BlockIcon /> : <CheckCircleIcon />}
            sx={{ borderRadius: 2 }}
          >
            {selectedDriver?.isActive ? 'Deactivate Driver' : 'Activate Driver'}
          </Button>
        </DialogActions>
      </Dialog>

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
          variant="filled"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 24 }
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
          variant="filled"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 24 }
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

export default Drivers;