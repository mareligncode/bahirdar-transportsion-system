import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Divider,
  Badge,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsBus as BusIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { format, parseISO, isAfter, addDays } from 'date-fns';

const Schedules = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTrips, setTotalTrips] = useState(0);
  
  // Search & Filter states
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stationFilter, setStationFilter] = useState('');
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureTime: null,
    arrivalTime: null,
    vehicleID: '',
    driverID: '',
    price: '',
    totalSeats: '',
    stationID: '',
    estimatedDuration: '',
    notes: '',
    routePoints: []
  });
  
  const [editFormData, setEditFormData] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  
  // Data for dropdowns
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userStationId, setUserStationId] = useState('');

  const statusColors = {
    scheduled: 'primary',
    boarding: 'info',
    ongoing: 'warning',
    completed: 'success',
    cancelled: 'error',
    delayed: 'secondary'
  };

  const statusIcons = {
    scheduled: <ScheduleIcon />,
    boarding: <BusIcon />,
    ongoing: <WarningIcon />,
    completed: <CheckIcon />,
    cancelled: <CancelIcon />,
    delayed: <WarningIcon />
  };

  // Fetch user role and station info
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
      // You might need to fetch user profile to get stationID
    }
  }, []);

  // Fetch trips
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/trips';
      const params = new URLSearchParams();
      
      if (searchOrigin) params.append('origin', searchOrigin);
      if (searchDestination) params.append('destination', searchDestination);
      if (searchDate) params.append('date', searchDate);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (stationFilter) params.append('stationID', stationFilter);
      
      params.append('page', page + 1);
      params.append('limit', rowsPerPage);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await api.get(url);
      setTrips(response.data.data || []);
      setFilteredTrips(response.data.data || []);
      setTotalTrips(response.data.total || 0);
      setError('');
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.response?.data?.message || 'Failed to load trips');
      setTrips([]);
      setFilteredTrips([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchOrigin, searchDestination, searchDate, statusFilter, stationFilter]);

  // Fetch stations, vehicles, drivers for forms
  const fetchFormData = useCallback(async () => {
    try {
      // Fetch stations
      const stationsRes = await api.get('/api/stations/active');
      setStations(stationsRes.data?.stations || []);
      
      // Fetch available vehicles
      const vehiclesRes = await api.get('/api/vehicles/available');
      setVehicles(vehiclesRes.data?.data?.vehicles || []);
      
      // Fetch drivers (you might need a specific endpoint for drivers)
      const driversRes = await api.get('/api/auth/all-users');
      const allUsers = driversRes.data?.data?.users || [];
      const driversList = allUsers.filter(user => user.role === 'driver' && user.isActive);
      setDrivers(driversList);
      
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
    fetchFormData();
  }, [fetchTrips, fetchFormData]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchTrips();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchOrigin('');
    setSearchDestination('');
    setSearchDate('');
    setStatusFilter('all');
    setStationFilter('');
    setPage(0);
  };

  // Handle create trip
  const handleCreateTrip = async () => {
    try {
      const tripData = {
        ...formData,
        departureTime: formData.departureTime?.toISOString(),
        arrivalTime: formData.arrivalTime?.toISOString(),
        price: parseFloat(formData.price),
        totalSeats: parseInt(formData.totalSeats),
        estimatedDuration: parseInt(formData.estimatedDuration),
        routePoints: formData.routePoints.filter(point => point.trim() !== '')
      };

      const response = await api.post('/api/trips', tripData);
      setSuccess('Trip created successfully!');
      setOpenCreateDialog(false);
      resetForm();
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip');
    }
  };

  // Handle edit trip
  const handleEditTrip = async () => {
    try {
      const tripData = {
        ...editFormData,
        departureTime: editFormData.departureTime?.toISOString?.(),
        arrivalTime: editFormData.arrivalTime?.toISOString?.(),
        price: parseFloat(editFormData.price),
        totalSeats: parseInt(editFormData.totalSeats),
        estimatedDuration: parseInt(editFormData.estimatedDuration)
      };

      const response = await api.put(`/api/trips/${editFormData._id}`, tripData);
      setSuccess('Trip updated successfully!');
      setOpenEditDialog(false);
      setEditFormData(null);
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trip');
    }
  };

  // Handle delete trip
  const handleDeleteTrip = async () => {
    try {
      await api.delete(`/api/trips/${selectedTrip._id}`);
      setSuccess('Trip deleted successfully!');
      setOpenDeleteDialog(false);
      setSelectedTrip(null);
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete trip');
    }
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    try {
      await api.patch(`/api/trips/${selectedTrip._id}/status`, { status: newStatus });
      setSuccess(`Trip status updated to ${newStatus}!`);
      setOpenStatusDialog(false);
      setSelectedTrip(null);
      setNewStatus('');
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trip status');
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (trip) => {
    try {
      await api.patch(`/api/trips/${trip._id}/toggle-active`, { isActive: !trip.isActive });
      setSuccess(`Trip ${!trip.isActive ? 'activated' : 'deactivated'}!`);
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trip status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      origin: '',
      destination: '',
      departureTime: null,
      arrivalTime: null,
      vehicleID: '',
      driverID: '',
      price: '',
      totalSeats: '',
      stationID: '',
      estimatedDuration: '',
      notes: '',
      routePoints: []
    });
  };

  // Open edit dialog
  const openEdit = (trip) => {
    setEditFormData({
      ...trip,
      departureTime: parseISO(trip.departureTime),
      arrivalTime: parseISO(trip.arrivalTime)
    });
    setOpenEditDialog(true);
  };

  // Open view dialog
  const openView = (trip) => {
    setSelectedTrip(trip);
    setOpenViewDialog(true);
  };

  // Open delete confirmation
  const openDelete = (trip) => {
    setSelectedTrip(trip);
    setOpenDeleteDialog(true);
  };

  // Open status change dialog
  const openStatus = (trip) => {
    setSelectedTrip(trip);
    setNewStatus(trip.tripStatus);
    setOpenStatusDialog(true);
  };

  // Add route point
  const addRoutePoint = () => {
    setFormData({
      ...formData,
      routePoints: [...formData.routePoints, '']
    });
  };

  // Update route point
  const updateRoutePoint = (index, value) => {
    const newRoutePoints = [...formData.routePoints];
    newRoutePoints[index] = value;
    setFormData({
      ...formData,
      routePoints: newRoutePoints
    });
  };

  // Remove route point
  const removeRoutePoint = (index) => {
    const newRoutePoints = formData.routePoints.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      routePoints: newRoutePoints
    });
  };

  // Calculate available seats percentage
  const getSeatPercentage = (trip) => {
    if (!trip.totalSeats) return 0;
    return ((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100;
  };

  // Check if user can edit/delete trip
  const canManageTrip = (trip) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'station_admin') {
      return trip.stationID === userStationId;
    }
    return false;
  };

  // Check if trip is searchable (for passengers)
  const isSearchableTrip = (trip) => {
    const now = new Date();
    const departure = parseISO(trip.departureTime);
    return (
      trip.isActive &&
      trip.tripStatus === 'scheduled' &&
      trip.availableSeats > 0 &&
      isAfter(departure, now)
    );
  };

  // Format time duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Trip Schedules
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and view all trip schedules
          </Typography>
        </Box>

        {/* Search & Filter Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Origin Station"
                value={searchOrigin}
                onChange={(e) => setSearchOrigin(e.target.value)}
                placeholder="Search by origin"
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Destination Station"
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
                placeholder="Search by destination"
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Travel Date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <TodayIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="boarding">Boarding</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="delayed">Delayed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Station</InputLabel>
                <Select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  label="Station"
                >
                  <MenuItem value="">All Stations</MenuItem>
                  {stations.map((station) => (
                    <MenuItem key={station._id} value={station._id}>
                      {station.stationName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                >
                  Search
                </Button>
                {(userRole === 'station_admin' || userRole === 'super_admin') && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateDialog(true)}
                  >
                    Create Trip
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Loading & Error States */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Trips Table */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Trip Details</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Vehicle & Driver</TableCell>
                    <TableCell>Seats</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No trips found. Try adjusting your search filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrips.map((trip) => (
                      <TableRow key={trip._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {trip.tripNumber || 'N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                              <Typography variant="body2" color="text.secondary">
                                {trip.origin?.stationName || 'Unknown'} → {trip.destination?.stationName || 'Unknown'}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Station: {trip.station?.stationName || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {format(parseISO(trip.departureTime), 'PPp')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Duration: {formatDuration(trip.estimatedDuration)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              🚗 {trip.vehicle?.plateNumber || 'N/A'} ({trip.vehicle?.carType || 'N/A'})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              👤 {trip.driver?.fullName || 'Unassigned'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {trip.availableSeats}/{trip.totalSeats} available
                            </Typography>
                            <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, mt: 0.5 }}>
                              <Box
                                sx={{
                                  width: `${getSeatPercentage(trip)}%`,
                                  height: 6,
                                  bgcolor: getSeatPercentage(trip) > 80 ? 'error.main' : 
                                           getSeatPercentage(trip) > 50 ? 'warning.main' : 'success.main',
                                  borderRadius: 1
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ETB {trip.price?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={statusIcons[trip.tripStatus]}
                            label={trip.tripStatus?.toUpperCase()}
                            color={statusColors[trip.tripStatus] || 'default'}
                            size="small"
                            variant={trip.isActive ? 'filled' : 'outlined'}
                          />
                          {!trip.isActive && (
                            <Typography variant="caption" color="error" display="block">
                              Inactive
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => openView(trip)}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {userRole === 'passenger' && isSearchableTrip(trip) && (
                              <Button
                                variant="contained"
                                size="small"
                                color="primary"
                                onClick={() => {
                                  // Navigate to booking page
                                  window.location.href = `/book/${trip._id}`;
                                }}
                              >
                                Book Now
                              </Button>
                            )}

                            {(userRole === 'station_admin' || userRole === 'super_admin') && canManageTrip(trip) && (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => openEdit(trip)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Change Status">
                                  <IconButton size="small" onClick={() => openStatus(trip)}>
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={trip.isActive ? "Deactivate" : "Activate"}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleToggleActive(trip)}
                                    color={trip.isActive ? "warning" : "success"}
                                  >
                                    {trip.isActive ? <CancelIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error" onClick={() => openDelete(trip)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={totalTrips}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}

        {/* Snackbars for notifications */}
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>

        {/* Create Trip Dialog */}
        <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Trip</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Origin Station *</InputLabel>
                  <Select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    label="Origin Station"
                    required
                  >
                    {stations.map((station) => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName} ({station.city})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Destination Station *</InputLabel>
                  <Select
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    label="Destination Station"
                    required
                  >
                    {stations.map((station) => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName} ({station.city})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Departure Date *"
                  value={formData.departureTime}
                  onChange={(newValue) => setFormData({ ...formData, departureTime: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Departure Time *"
                  value={formData.departureTime}
                  onChange={(newValue) => setFormData({ ...formData, departureTime: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Arrival Time *"
                  value={formData.arrivalTime}
                  onChange={(newValue) => setFormData({ ...formData, arrivalTime: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Duration (minutes) *"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle *</InputLabel>
                  <Select
                    value={formData.vehicleID}
                    onChange={(e) => setFormData({ ...formData, vehicleID: e.target.value })}
                    label="Vehicle"
                    required
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNumber} - {vehicle.carType} ({vehicle.totalCapacity} seats)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Driver *</InputLabel>
                  <Select
                    value={formData.driverID}
                    onChange={(e) => setFormData({ ...formData, driverID: e.target.value })}
                    label="Driver"
                    required
                  >
                    {drivers.map((driver) => (
                      <MenuItem key={driver._id} value={driver._id}>
                        {driver.fullName} - {driver.licenseNumber || 'No License'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Station *</InputLabel>
                  <Select
                    value={formData.stationID}
                    onChange={(e) => setFormData({ ...formData, stationID: e.target.value })}
                    label="Station"
                    required
                  >
                    {stations.map((station) => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Seats *"
                  value={formData.totalSeats}
                  onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                  required
                  InputProps={{
                    inputProps: { min: 1, max: 100 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price (ETB) *"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Route Points (Optional)
                </Typography>
                {formData.routePoints.map((point, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <TextField
                      fullWidth
                      value={point}
                      onChange={(e) => updateRoutePoint(index, e.target.value)}
                      placeholder={`Route point ${index + 1}`}
                    />
                    <IconButton onClick={() => removeRoutePoint(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button onClick={addRoutePoint} startIcon={<AddIcon />}>
                  Add Route Point
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTrip} variant="contained" color="primary">
              Create Trip
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Trip Dialog */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
          {selectedTrip && (
            <>
              <DialogTitle>Trip Details</DialogTitle>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        {selectedTrip.tripNumber || 'N/A'}
                      </Typography>
                      <Chip
                        label={selectedTrip.tripStatus?.toUpperCase()}
                        color={statusColors[selectedTrip.tripStatus] || 'default'}
                        variant={selectedTrip.isActive ? 'filled' : 'outlined'}
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                      Route
                    </Typography>
                    <Typography variant="body1">
                      {selectedTrip.origin?.stationName || 'Unknown'} → {selectedTrip.destination?.stationName || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Distance: {formatDuration(selectedTrip.estimatedDuration)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                      Schedule
                    </Typography>
                    <Typography variant="body2">
                      Departure: {format(parseISO(selectedTrip.departureTime), 'PPp')}
                    </Typography>
                    <Typography variant="body2">
                      Arrival: {format(parseISO(selectedTrip.arrivalTime), 'PPp')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <BusIcon fontSize="small" sx={{ mr: 1 }} />
                      Vehicle
                    </Typography>
                    <Typography variant="body2">
                      Plate: {selectedTrip.vehicle?.plateNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Type: {selectedTrip.vehicle?.carType || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Capacity: {selectedTrip.totalSeats} seats
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      Driver
                    </Typography>
                    <Typography variant="body2">
                      Name: {selectedTrip.driver?.fullName || 'Unassigned'}
                    </Typography>
                    <Typography variant="body2">
                      Contact: {selectedTrip.driver?.phoneNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <MoneyIcon fontSize="small" sx={{ mr: 1 }} />
                      Pricing & Seats
                    </Typography>
                    <Typography variant="body2">
                      Price: ETB {selectedTrip.price?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2">
                      Available Seats: {selectedTrip.availableSeats}/{selectedTrip.totalSeats}
                    </Typography>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, mt: 1 }}>
                      <Box
                        sx={{
                          width: `${getSeatPercentage(selectedTrip)}%`,
                          height: 8,
                          bgcolor: getSeatPercentage(selectedTrip) > 80 ? 'error.main' : 
                                   getSeatPercentage(selectedTrip) > 50 ? 'warning.main' : 'success.main',
                          borderRadius: 1
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Station Info
                    </Typography>
                    <Typography variant="body2">
                      Station: {selectedTrip.station?.stationName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {selectedTrip.station?._id}
                    </Typography>
                  </Grid>
                  {selectedTrip.routePoints?.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Route Points
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedTrip.routePoints.map((point, index) => (
                          <Chip key={index} label={point} size="small" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                  {selectedTrip.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2">
                        {selectedTrip.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                {userRole === 'passenger' && isSearchableTrip(selectedTrip) && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      window.location.href = `/book/${selectedTrip._id}`;
                    }}
                  >
                    Book This Trip
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Edit Trip Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
          {editFormData && (
            <>
              <DialogTitle>Edit Trip</DialogTitle>
              <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Total Seats *"
                      value={editFormData.totalSeats}
                      onChange={(e) => setEditFormData({ ...editFormData, totalSeats: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Price (ETB) *"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Departure Date *"
                      value={editFormData.departureTime}
                      onChange={(newValue) => setEditFormData({ ...editFormData, departureTime: newValue })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TimePicker
                      label="Departure Time *"
                      value={editFormData.departureTime}
                      onChange={(newValue) => setEditFormData({ ...editFormData, departureTime: newValue })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TimePicker
                      label="Arrival Time *"
                      value={editFormData.arrivalTime}
                      onChange={(newValue) => setEditFormData({ ...editFormData, arrivalTime: newValue })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Driver</InputLabel>
                      <Select
                        value={editFormData.driverID || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, driverID: e.target.value })}
                        label="Driver"
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {drivers.map((driver) => (
                          <MenuItem key={driver._id} value={driver._id}>
                            {driver.fullName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Notes"
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                <Button onClick={handleEditTrip} variant="contained" color="primary">
                  Save Changes
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
          <DialogTitle>Change Trip Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
              >
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="boarding">Boarding</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="delayed">Delayed</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} variant="contained" color="primary">
              Update Status
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete trip {selectedTrip?.tripNumber || selectedTrip?._id}?
              This action cannot be undone.
            </Typography>
            {selectedTrip?.bookings?.count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This trip has {selectedTrip.bookings.count} active bookings. 
                Deleting it will cancel all associated bookings.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteTrip} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default Schedules;