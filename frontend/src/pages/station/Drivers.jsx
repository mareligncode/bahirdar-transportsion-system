import React, { useState, useEffect } from 'react';
import api from '../../services/api';
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
  Select
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Drivers = () => {
  const navigate = useNavigate();
  
  // State management
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [addDriverDialog, setAddDriverDialog] = useState(false);
  const [driverDetailsDialog, setDriverDetailsDialog] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  
  // Form states
  const [newDriver, setNewDriver] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    licenseNumber: ''
  });
  
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    onDuty: 0,
    available: 0,
    assignedVehicles: 0,
    totalTripsToday: 0
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch station users (passengers and drivers)
      const usersRes = await api.get('/api/auth/station-users');
      const allUsers = usersRes.data.data.users || [];
      
      // Filter only drivers
      const driverUsers = allUsers.filter(user => user.role === 'driver');
      setDrivers(driverUsers);
      
      // Fetch vehicles for the station
      const vehiclesRes = await api.get('/api/vehicles');
      const stationVehicles = vehiclesRes.data.data.vehicles || [];
      setVehicles(stationVehicles);
      
      // Fetch trips
      const tripsRes = await api.get('/api/trip');
      const stationTrips = tripsRes.data.data || [];
      setTrips(stationTrips);
      
      // Calculate stats
      calculateStats(driverUsers, stationVehicles, stationTrips);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      let errorMessage = 'Failed to load drivers data. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view drivers.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        navigate('/login');
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (driverList, vehicleList, tripList) => {
    const today = new Date().toISOString().split('T')[0];
    
    const totalDrivers = driverList.length;
    const activeDrivers = driverList.filter(d => d.isActive).length;
    
    // On duty = drivers with vehicles currently on trip
    const onDuty = driverList.filter(d => 
      d.isActive && 
      vehicleList.some(v => 
        v.driverID && 
        v.driverID._id === d._id && 
        v.currentStatus === 'on_trip'
      )
    ).length;
    
    const available = driverList.filter(d => 
      d.isActive && 
      !vehicleList.some(v => v.driverID && v.driverID._id === d._id)
    ).length;
    
    const assignedVehicles = vehicleList.filter(v => v.driverID).length;
    
    const totalTripsToday = tripList.filter(t => 
      new Date(t.departureTime).toISOString().split('T')[0] === today
    ).length;
    
    setStats({
      totalDrivers,
      activeDrivers,
      onDuty,
      available,
      assignedVehicles,
      totalTripsToday
    });
  };

  // Handle add driver
  const handleAddDriver = async () => {
    try {
      // Validate required fields
      if (!newDriver.fullName || !newDriver.email || !newDriver.phoneNumber || !newDriver.password || !newDriver.licenseNumber) {
        setError('All fields are required');
        return;
      }

      // First create the user as passenger
      const userRes = await api.post('/api/auth/register', {
        fullName: newDriver.fullName,
        email: newDriver.email,
        phoneNumber: newDriver.phoneNumber,
        password: newDriver.password,
        role: 'passenger'
      });
      
      // Then assign as driver
      await api.post('/api/auth/assign-driver', {
        passengerId: userRes.data.data.user._id,
        licenseNumber: newDriver.licenseNumber
      });
      
      setSuccess('Driver added successfully');
      setAddDriverDialog(false);
      setNewDriver({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        licenseNumber: ''
      });
      
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add driver');
    }
  };

  // Handle toggle driver status
  const handleToggleStatus = async () => {
    if (!selectedDriver) return;

    try {
      await api.post('/api/auth/toggle-status', { userId: selectedDriver._id });
      
      setSuccess(`Driver ${selectedDriver.isActive ? 'deactivated' : 'activated'} successfully`);
      setToggleDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update driver status');
    }
  };

  // Get driver's assigned vehicle
  const getDriverVehicle = (driverId) => {
    return vehicles.find(vehicle => vehicle.driverID && vehicle.driverID._id === driverId);
  };

  // Get driver's trips
  const getDriverTrips = (driverId) => {
    return trips.filter(trip => trip.driver && trip.driver._id === driverId);
  };

  // Get today's trips for driver
  const getTodaysTrips = (driverId) => {
    const today = new Date().toISOString().split('T')[0];
    return trips.filter(trip => 
      trip.driver && 
      trip.driver._id === driverId && 
      new Date(trip.departureTime).toISOString().split('T')[0] === today
    );
  };

  // Filter drivers based on search and status
  const filteredDrivers = drivers.filter(driver => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        driver.fullName?.toLowerCase().includes(searchLower) ||
        driver.email?.toLowerCase().includes(searchLower) ||
        driver.phoneNumber?.includes(searchTerm) ||
        (driver.licenseNumber && driver.licenseNumber.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') return driver.isActive;
      if (statusFilter === 'inactive') return !driver.isActive;
      
      const vehicle = getDriverVehicle(driver._id);
      
      if (statusFilter === 'available') return driver.isActive && !vehicle;
      if (statusFilter === 'assigned') return driver.isActive && vehicle;
      if (statusFilter === 'on_trip') {
        return driver.isActive && vehicle && vehicle.currentStatus === 'on_trip';
      }
    }
    
    return true;
  });

  // Paginate drivers
  const paginatedDrivers = filteredDrivers.slice(
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

  // Initialize
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            Drivers Management
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddDriverDialog(true)}
            >
              Add Driver
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Drivers
                </Typography>
                <Typography variant="h4">
                  {stats.totalDrivers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Drivers
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.activeDrivers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  On Duty
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.onDuty}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Available (No Vehicle)
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.available}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Assigned Vehicles
                </Typography>
                <Typography variant="h4">
                  {stats.assignedVehicles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Today's Trips
                </Typography>
                <Typography variant="h4">
                  {stats.totalTripsToday}
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
              label="Search Drivers"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or license..."
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
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
                <MenuItem value="available">Available (No Vehicle)</MenuItem>
                <MenuItem value="assigned">Assigned (With Vehicle)</MenuItem>
                <MenuItem value="on_trip">Currently On Trip</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Drivers Table */}
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
                    <TableCell>Driver</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Vehicle & Status</TableCell>
                    <TableCell>Trips</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          No drivers found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDrivers.map((driver) => {
                      const vehicle = getDriverVehicle(driver._id);
                      const driverTrips = getDriverTrips(driver._id);
                      const todaysTrips = getTodaysTrips(driver._id);
                      
                      return (
                        <TableRow key={driver._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, bgcolor: driver.isActive ? 'primary.main' : 'grey.500' }}>
                                {driver.fullName?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography fontWeight="medium">
                                  {driver.fullName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  ID: {driver._id?.substring(0, 8)}...
                                </Typography>
                                <Chip
                                  label={driver.isActive ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={driver.isActive ? 'success' : 'error'}
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography>{driver.email}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {driver.phoneNumber}
                            </Typography>
                            {driver.licenseNumber && (
                              <Typography variant="body2" color="textSecondary">
                                License: {driver.licenseNumber}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {vehicle ? (
                              <Box>
                                <Typography fontWeight="medium">
                                  {vehicle.plateNumber} ({vehicle.carType})
                                </Typography>
                                <Chip
                                  label={vehicle.currentStatus}
                                  size="small"
                                  color={
                                    vehicle.currentStatus === 'active' || vehicle.currentStatus === 'on_trip' ? 'success' :
                                    vehicle.currentStatus === 'available' ? 'primary' : 'default'
                                  }
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            ) : (
                              <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                No vehicle assigned
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography>
                              Today: {todaysTrips.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total: {driverTrips.length}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(driver.createdAt)}
                            {driver.lastLogin && (
                              <Typography variant="body2" color="textSecondary">
                                Last login: {formatDate(driver.lastLogin)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => {
                                    setSelectedDriver(driver);
                                    setDriverDetailsDialog(true);
                                  }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title={driver.isActive ? 'Deactivate' : 'Activate'}>
                                <IconButton
                                  size="small"
                                  color={driver.isActive ? 'error' : 'success'}
                                  onClick={() => {
                                    setSelectedDriver(driver);
                                    setToggleDialogOpen(true);
                                  }}
                                >
                                  {driver.isActive ? <BlockIcon /> : <ActivateIcon />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredDrivers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Add Driver Dialog */}
      <Dialog
        open={addDriverDialog}
        onClose={() => setAddDriverDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Driver</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  value={newDriver.fullName}
                  onChange={(e) => setNewDriver({...newDriver, fullName: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  value={newDriver.phoneNumber}
                  onChange={(e) => setNewDriver({...newDriver, phoneNumber: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password *"
                  type="password"
                  value={newDriver.password}
                  onChange={(e) => setNewDriver({...newDriver, password: e.target.value})}
                  required
                  helperText="Minimum 8 characters with uppercase, lowercase, number, and special character"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="License Number *"
                  value={newDriver.licenseNumber}
                  onChange={(e) => setNewDriver({...newDriver, licenseNumber: e.target.value})}
                  required
                />
              </Grid>
            </Grid>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> This will:
                <ul>
                  <li>Create the user as a passenger first</li>
                  <li>Then assign them as a driver with the provided license number</li>
                  <li>Automatically assign them to your station</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDriverDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddDriver}
            disabled={!newDriver.fullName || !newDriver.email || !newDriver.phoneNumber || !newDriver.password || !newDriver.licenseNumber}
          >
            Add Driver
          </Button>
        </DialogActions>
      </Dialog>

      {/* Driver Details Dialog */}
      <Dialog
        open={driverDetailsDialog}
        onClose={() => setDriverDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedDriver ? (
          <>
            <DialogTitle>
              Driver Details
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
                      {selectedDriver.fullName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {selectedDriver.fullName}
                    </Typography>
                    <Chip
                      label={selectedDriver.role}
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                    <Chip
                      label={selectedDriver.isActive ? 'Active' : 'Inactive'}
                      color={selectedDriver.isActive ? 'success' : 'error'}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography>Email: {selectedDriver.email}</Typography>
                    <Typography>Phone: {selectedDriver.phoneNumber}</Typography>
                    {selectedDriver.licenseNumber && (
                      <Typography>License: {selectedDriver.licenseNumber}</Typography>
                    )}
                    {selectedDriver.emergencyContact && (
                      <Typography>
                        Emergency Contact: {selectedDriver.emergencyContact}
                      </Typography>
                    )}
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Assignment Information
                    </Typography>
                    {(() => {
                      const vehicle = getDriverVehicle(selectedDriver._id);
                      const driverTrips = getDriverTrips(selectedDriver._id);
                      const todaysTrips = getTodaysTrips(selectedDriver._id);
                      
                      return (
                        <>
                          <Typography>
                            Assigned Vehicle: {vehicle ? `${vehicle.plateNumber} (${vehicle.carType})` : 'Not assigned'}
                          </Typography>
                          {vehicle && (
                            <Typography>
                              Vehicle Status: {vehicle.currentStatus}
                            </Typography>
                          )}
                          <Typography>
                            Total Trips: {driverTrips.length}
                          </Typography>
                          <Typography>
                            Today's Trips: {todaysTrips.length}
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Account Information
                    </Typography>
                    <Typography>
                      Created: {formatDate(selectedDriver.createdAt)}
                    </Typography>
                    {selectedDriver.lastLogin && (
                      <Typography>
                        Last Login: {formatDate(selectedDriver.lastLogin)}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDriverDetailsDialog(false)}>
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
          {selectedDriver?.isActive ? 'Deactivate Driver' : 'Activate Driver'}
        </DialogTitle>
        <DialogContent>
          {selectedDriver && (
            <Alert 
              severity={selectedDriver.isActive ? 'warning' : 'info'} 
              sx={{ mt: 2 }}
            >
              <Typography>
                Are you sure you want to{' '}
                <strong>{selectedDriver.isActive ? 'deactivate' : 'activate'}</strong>{' '}
                the driver <strong>{selectedDriver.fullName}</strong>?
              </Typography>
              {selectedDriver.isActive && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Deactivated drivers cannot log in to the system.
                </Typography>
              )}
              {!selectedDriver.isActive && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Activated drivers will be able to log in and use the system.
                </Typography>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggleDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedDriver?.isActive ? 'error' : 'success'}
            onClick={handleToggleStatus}
          >
            {selectedDriver?.isActive ? 'Deactivate' : 'Activate'}
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

export default Drivers;