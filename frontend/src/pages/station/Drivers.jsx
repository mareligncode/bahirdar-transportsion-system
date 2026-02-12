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
import { useTranslation } from '../../hooks/useTranslation';

const Drivers = () => {
  const { t } = useTranslation();
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
      let errorMessage = t('Failed to load drivers data. Please try again.');
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = t('Access denied. You may not have permission to view drivers.');
      } else if (err.response?.status === 401) {
        errorMessage = t('Session expired. Please login again.');
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

  // Handle toggle driver status
  const handleToggleStatus = async () => {
    if (!selectedDriver) return;

    try {
      await api.post('/api/auth/toggle-status', { userId: selectedDriver._id });
      
      setSuccess(t(`Driver ${selectedDriver.isActive ? 'deactivated' : 'activated'} successfully`));
      setToggleDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to update driver status'));
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
    if (!dateString) return t('N/A');
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
  }, []); // ⚠️ NO 't' here!

  return (
    <Box>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            {t('Drivers Management')}
          </Typography>
          <Box display="flex" gap={2}>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              {t('Refresh')}
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('Total Drivers')}
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
                  {t('Active Drivers')}
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
                  {t('On Duty')}
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
                  {t('Available (No Vehicle)')}
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
                  {t('Assigned Vehicles')}
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
                  {t('Today\'s Trips')}
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
              label={t('Search Drivers')}
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Search by name, email, phone, or license...')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('Status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('Status')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('All Status')}</MenuItem>
                <MenuItem value="active">{t('Active Only')}</MenuItem>
                <MenuItem value="inactive">{t('Inactive Only')}</MenuItem>
                <MenuItem value="available">{t('Available (No Vehicle)')}</MenuItem>
                <MenuItem value="assigned">{t('Assigned (With Vehicle)')}</MenuItem>
                <MenuItem value="on_trip">{t('Currently On Trip')}</MenuItem>
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
                {t('DISMISS')}
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
                    <TableCell>{t('Driver')}</TableCell>
                    <TableCell>{t('Contact')}</TableCell>
                    <TableCell>{t('Vehicle & Status')}</TableCell>
                    <TableCell>{t('Trips')}</TableCell>
                    <TableCell>{t('Created')}</TableCell>
                    <TableCell>{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          {t('No drivers found')}
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
                                  {t('ID')}: {driver._id?.substring(0, 8)}...
                                </Typography>
                                <Chip
                                  label={driver.isActive ? t('Active') : t('Inactive')}
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
                                {t('License')}: {driver.licenseNumber}
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
                                {t('No vehicle assigned')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography>
                              {t('Today')}: {todaysTrips.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {t('Total')}: {driverTrips.length}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(driver.createdAt)}
                            {driver.lastLogin && (
                              <Typography variant="body2" color="textSecondary">
                                {t('Last login')}: {formatDate(driver.lastLogin)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title={t('View Details')}>
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

                              <Tooltip title={driver.isActive ? t('Deactivate') : t('Activate')}>
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
              {t('Driver Details')}
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
                      label={selectedDriver.isActive ? t('Active') : t('Inactive')}
                      color={selectedDriver.isActive ? 'success' : 'error'}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {t('Contact Information')}
                    </Typography>
                    <Typography>{t('Email')}: {selectedDriver.email}</Typography>
                    <Typography>{t('Phone')}: {selectedDriver.phoneNumber}</Typography>
                    {selectedDriver.licenseNumber && (
                      <Typography>{t('License')}: {selectedDriver.licenseNumber}</Typography>
                    )}
                    {selectedDriver.emergencyContact && (
                      <Typography>
                        {t('Emergency Contact')}: {selectedDriver.emergencyContact}
                      </Typography>
                    )}
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {t('Assignment Information')}
                    </Typography>
                    {(() => {
                      const vehicle = getDriverVehicle(selectedDriver._id);
                      const driverTrips = getDriverTrips(selectedDriver._id);
                      const todaysTrips = getTodaysTrips(selectedDriver._id);
                      
                      return (
                        <>
                          <Typography>
                            {t('Assigned Vehicle')}: {vehicle ? `${vehicle.plateNumber} (${vehicle.carType})` : t('Not assigned')}
                          </Typography>
                          {vehicle && (
                            <Typography>
                              {t('Vehicle Status')}: {vehicle.currentStatus}
                            </Typography>
                          )}
                          <Typography>
                            {t('Total Trips')}: {driverTrips.length}
                          </Typography>
                          <Typography>
                            {t('Today\'s Trips')}: {todaysTrips.length}
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {t('Account Information')}
                    </Typography>
                    <Typography>
                      {t('Created')}: {formatDate(selectedDriver.createdAt)}
                    </Typography>
                    {selectedDriver.lastLogin && (
                      <Typography>
                        {t('Last Login')}: {formatDate(selectedDriver.lastLogin)}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDriverDetailsDialog(false)}>
                {t('Close')}
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
          {selectedDriver?.isActive ? t('Deactivate Driver') : t('Activate Driver')}
        </DialogTitle>
        <DialogContent>
          {selectedDriver && (
            <Alert 
              severity={selectedDriver.isActive ? 'warning' : 'info'} 
              sx={{ mt: 2 }}
            >
              <Typography>
                {t('Are you sure you want to')}{' '}
                <strong>{selectedDriver.isActive ? t('deactivate') : t('activate')}</strong>{' '}
                {t('the driver')} <strong>{selectedDriver.fullName}</strong>?
              </Typography>
              {selectedDriver.isActive && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('Deactivated drivers cannot log in to the system.')}
                </Typography>
              )}
              {!selectedDriver.isActive && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('Activated drivers will be able to log in and use the system.')}
                </Typography>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggleDialogOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            color={selectedDriver?.isActive ? 'error' : 'success'}
            onClick={handleToggleStatus}
          >
            {selectedDriver?.isActive ? t('Deactivate') : t('Activate')}
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