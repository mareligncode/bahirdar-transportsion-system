import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Divider,
  Badge,
  Tooltip,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  DirectionsBus as BusIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  EventAvailable as EventIcon,
  EventBusy as EventBusyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Sort as SortIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { format, parseISO, isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const Schedules = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTrips, setTotalTrips] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    origin: '',
    destination: '',
    dateRange: 'today',
    startDate: format(startOfDay(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd')
  });
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('departureTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Trip form state
  const [tripForm, setTripForm] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    vehicle: '',
    driver: '',
    price: '',
    totalSeats: '',
    station: user?.stationID || '',
    routePoints: [],
    estimatedDuration: '',
    notes: ''
  });

  // Status colors mapping
  const statusColors = {
    scheduled: 'info',
    boarding: 'warning',
    ongoing: 'primary',
    completed: 'success',
    cancelled: 'error',
    delayed: 'secondary'
  };

  const statusIcons = {
    scheduled: <EventIcon fontSize="small" />,
    boarding: <EventIcon fontSize="small" />,
    ongoing: <BusIcon fontSize="small" />,
    completed: <CheckCircleIcon fontSize="small" />,
    cancelled: <CancelIcon fontSize="small" />,
    delayed: <TimeIcon fontSize="small" />
  };

  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Fetch trips
  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(filters.status && { status: filters.status }),
        ...(filters.origin && { origin: filters.origin }),
        ...(filters.destination && { destination: filters.destination }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      const response = await api.get('/api/trip', { params });
      
      if (response.data.success) {
        setTrips(response.data.data);
        setTotalTrips(response.data.total || response.data.count);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch trips';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stations
  const fetchStations = async () => {
    try {
      const response = await api.get('/api/station');
      console.log('Stations response:', response.data); // Debug log
      if (response.data?.stations) {
        setStations(response.data.stations);
      } else if (response.data?.data?.stations) {
        setStations(response.data.data.stations);
      } else if (response.data?.data) {
        setStations(response.data.data);
      } else if (Array.isArray(response.data)) {
        setStations(response.data);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      showSnackbar('Failed to load stations', 'warning');
    }
  };

  // Fetch available vehicles - FIXED
  const fetchVehicles = async () => {
    try {
      let response;
      
      // Try the main vehicles endpoint first
      try {
        response = await api.get('/api/vehicles');
        console.log('Vehicles response:', response.data); // Debug log
        
        if (response.data.success) {
          // Filter vehicles that are active and available
          const availableVehicles = response.data.data?.vehicles?.filter(vehicle => 
            vehicle.isActive && 
            (vehicle.currentStatus === 'available' || vehicle.currentStatus === 'active' || !vehicle.currentStatus)
          ) || [];
          
          console.log('Available vehicles:', availableVehicles); // Debug log
          setVehicles(availableVehicles);
          return;
        }
      } catch (firstErr) {
        console.log('First vehicles endpoint failed:', firstErr.message);
      }
      
      // Try alternative endpoint structure
      try {
        response = await api.get('/api/vehicles');
        if (response.data && Array.isArray(response.data)) {
          const availableVehicles = response.data.filter(vehicle => 
            vehicle.isActive && 
            (vehicle.currentStatus === 'available' || vehicle.currentStatus === 'active' || !vehicle.currentStatus)
          );
          console.log('Alternative vehicles data:', availableVehicles); // Debug log
          setVehicles(availableVehicles);
          return;
        }
      } catch (secondErr) {
        console.log('Alternative endpoint failed:', secondErr.message);
      }
      
      // Show error if all attempts fail
      showSnackbar('Could not load vehicles. Please check console for details.', 'warning');
      setVehicles([]);
      
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      showSnackbar('Failed to load vehicles', 'warning');
      setVehicles([]);
    }
  };

  // Fetch drivers - FIXED
  const fetchDrivers = async () => {
    try {
      let response;
      let users = [];
      
      if (user?.role === 'super_admin') {
        // Super admin can see all drivers
        response = await api.get('/api/auth/all-users');
        console.log('Super admin drivers response:', response.data); // Debug log
        
        if (response.data.success) {
          users = response.data.data?.users || [];
        } else if (Array.isArray(response.data)) {
          users = response.data;
        }
      } else if (user?.role === 'station_admin') {
        // Station admin can see drivers from their station
        response = await api.get('/api/auth/station-users');
        console.log('Station admin drivers response:', response.data); // Debug log
        
        if (response.data.success) {
          users = response.data.data?.users || response.data.data || [];
        }
      } else {
        // For other roles, try to get all active drivers
        response = await api.get('/api/auth/all-users');
        console.log('All users drivers response:', response.data); // Debug log
        
        if (response.data.success) {
          users = response.data.data?.users || [];
        } else if (Array.isArray(response.data)) {
          users = response.data;
        }
      }
      
      // Filter active drivers
      const driversList = users.filter(u => 
        u.role === 'driver' && 
        (u.isActive === true || u.isActive === undefined)
      ) || [];
      
      console.log('Filtered drivers:', driversList); // Debug log
      setDrivers(driversList);
      
      if (driversList.length === 0) {
        showSnackbar('No active drivers found. Please add drivers first.', 'warning');
      }
      
    } catch (err) {
      console.error('Error fetching drivers:', err.response?.data || err);
      showSnackbar('Failed to load drivers', 'warning');
      setDrivers([]);
    }
  };

  // Fetch all related data
  const fetchRelatedData = async () => {
    try {
      setLoadingRelated(true);
      await Promise.all([
        fetchStations(),
        fetchVehicles(),
        fetchDrivers()
      ]);
    } catch (err) {
      console.error('Error fetching related data:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchRelatedData();
  }, [page, rowsPerPage, filters]);

  // Update date range when preset changes
  useEffect(() => {
    const today = new Date();
    switch(filters.dateRange) {
      case 'today':
        setFilters(prev => ({
          ...prev,
          startDate: format(startOfDay(today), 'yyyy-MM-dd'),
          endDate: format(endOfDay(today), 'yyyy-MM-dd')
        }));
        break;
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        setFilters(prev => ({
          ...prev,
          startDate: format(startOfDay(tomorrow), 'yyyy-MM-dd'),
          endDate: format(endOfDay(tomorrow), 'yyyy-MM-dd')
        }));
        break;
      case 'week':
        const weekStart = startOfDay(today);
        const weekEnd = endOfDay(addDays(today, 7));
        setFilters(prev => ({
          ...prev,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd')
        }));
        break;
      case 'month':
        const monthStart = startOfDay(today);
        const monthEnd = endOfDay(addDays(today, 30));
        setFilters(prev => ({
          ...prev,
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd')
        }));
        break;
    }
  }, [filters.dateRange]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (trip = null) => {
    if (trip) {
      setSelectedTrip(trip);
      setTripForm({
        origin: trip.origin?._id || trip.origin || '',
        destination: trip.destination?._id || trip.destination || '',
        departureTime: format(new Date(trip.departureTime), "yyyy-MM-dd'T'HH:mm"),
        arrivalTime: format(new Date(trip.arrivalTime), "yyyy-MM-dd'T'HH:mm"),
        vehicle: trip.vehicle?._id || trip.vehicle || '',
        driver: trip.driver?._id || trip.driver || '',
        price: trip.price || '',
        totalSeats: trip.totalSeats || '',
        station: trip.station?._id || trip.station || user?.stationID || '',
        routePoints: trip.routePoints || [],
        estimatedDuration: trip.estimatedDuration || '',
        notes: trip.notes || ''
      });
    } else {
      setSelectedTrip(null);
      setTripForm({
        origin: '',
        destination: '',
        departureTime: '',
        arrivalTime: '',
        vehicle: '',
        driver: '',
        price: '',
        totalSeats: '',
        station: user?.stationID || '',
        routePoints: [],
        estimatedDuration: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTrip(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTripForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTrip = async () => {
    try {
      // Validation
      const requiredFields = ['origin', 'destination', 'departureTime', 'arrivalTime', 
                             'vehicle', 'driver', 'price', 'totalSeats'];
      const missingFields = requiredFields.filter(field => !tripForm[field]);
      
      if (missingFields.length > 0) {
        showSnackbar(`Please fill all required fields: ${missingFields.join(', ')}`, 'error');
        return;
      }

      if (isBefore(new Date(tripForm.departureTime), new Date())) {
        showSnackbar('Departure time must be in the future', 'error');
        return;
      }

      if (isBefore(new Date(tripForm.arrivalTime), new Date(tripForm.departureTime))) {
        showSnackbar('Arrival time must be after departure time', 'error');
        return;
      }

      // Check if vehicle exists locally
      const selectedVehicle = vehicles.find(v => v._id === tripForm.vehicle);
      if (!selectedVehicle) {
        showSnackbar('Selected vehicle not found. Please refresh the list.', 'error');
        return;
      }

      // Check if driver exists locally
      const selectedDriver = drivers.find(d => d._id === tripForm.driver);
      if (!selectedDriver) {
        showSnackbar('Selected driver not found. Please refresh the list.', 'error');
        return;
      }

      // Prepare data for API - use correct field names from your backend
      const tripData = {
        origin: tripForm.origin,
        destination: tripForm.destination,
        departureTime: tripForm.departureTime,
        arrivalTime: tripForm.arrivalTime,
        vehicleID: tripForm.vehicle,  // Changed from 'vehicle' to 'vehicleID' based on your backend
        driverID: tripForm.driver,    // Changed from 'driver' to 'driverID' based on your backend
        price: parseFloat(tripForm.price),
        totalSeats: parseInt(tripForm.totalSeats),
        stationID: tripForm.station || user?.stationID,
        routePoints: tripForm.routePoints,
        estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : 0,
        notes: tripForm.notes || ''
      };

      console.log('Sending trip data:', tripData); // Debug log

      const response = await api.post('/api/trip', tripData);
      console.log('Create trip response:', response.data); // Debug log

      if (response.data.success) {
        showSnackbar('Trip created successfully!', 'success');
        fetchTrips();
        handleCloseDialog();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create trip';
      console.error('Create trip error details:', {
        error: err,
        response: err.response?.data,
        tripData: {
          origin: tripForm.origin,
          destination: tripForm.destination,
          vehicle: tripForm.vehicle,
          driver: tripForm.driver,
          station: tripForm.station
        },
        vehicles: vehicles.map(v => ({ id: v._id, plate: v.plateNumber })),
        drivers: drivers.map(d => ({ id: d._id, name: d.fullName }))
      });
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleUpdateTrip = async () => {
    try {
      // Check if vehicle exists locally
      const selectedVehicle = vehicles.find(v => v._id === tripForm.vehicle);
      if (!selectedVehicle) {
        showSnackbar('Selected vehicle not found. Please refresh the list.', 'error');
        return;
      }

      // Check if driver exists locally
      const selectedDriver = drivers.find(d => d._id === tripForm.driver);
      if (!selectedDriver) {
        showSnackbar('Selected driver not found. Please refresh the list.', 'error');
        return;
      }

      // Prepare data for API - use correct field names from your backend
      const tripData = {
        origin: tripForm.origin,
        destination: tripForm.destination,
        departureTime: tripForm.departureTime,
        arrivalTime: tripForm.arrivalTime,
        vehicleID: tripForm.vehicle,  // Changed from 'vehicle' to 'vehicleID'
        driverID: tripForm.driver,    // Changed from 'driver' to 'driverID'
        price: parseFloat(tripForm.price),
        totalSeats: parseInt(tripForm.totalSeats),
        stationID: tripForm.station,
        routePoints: tripForm.routePoints,
        estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : 0,
        notes: tripForm.notes || ''
      };

      console.log('Updating trip data:', tripData); // Debug log

      const response = await api.put(`/api/trip/${selectedTrip._id}`, tripData);

      if (response.data.success) {
        showSnackbar('Trip updated successfully!', 'success');
        fetchTrips();
        handleCloseDialog();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update trip';
      console.error('Update trip error:', err.response?.data || err);
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;

    try {
      const response = await api.delete(`/api/trip/${tripId}`);

      if (response.data.success) {
        showSnackbar('Trip deleted successfully!', 'success');
        fetchTrips();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete trip';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      const response = await api.patch(`/api/trip/${tripId}/status`, { status: newStatus });

      if (response.data.success) {
        showSnackbar(`Trip status updated to ${newStatus}`, 'success');
        fetchTrips();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update status';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleToggleActive = async (tripId, currentActive) => {
    try {
      const response = await api.patch(`/api/trip/${tripId}/toggle-active`, {});

      if (response.data.success) {
        showSnackbar(`Trip ${!currentActive ? 'activated' : 'deactivated'}`, 'success');
        fetchTrips();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to toggle trip status';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      origin: '',
      destination: '',
      dateRange: 'today',
      startDate: format(startOfDay(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfDay(new Date()), 'yyyy-MM-dd')
    });
  };

  const getAvailableSeatsPercentage = (trip) => {
    if (!trip.totalSeats || trip.totalSeats === 0) return 0;
    return Math.round((trip.availableSeats / trip.totalSeats) * 100);
  };

  const getSeatColor = (percentage) => {
    if (percentage < 10) return 'error';
    if (percentage < 30) return 'warning';
    return 'success';
  };

  const canEditDelete = (trip) => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'station_admin') {
      const tripStationId = trip.station?._id || trip.station;
      return tripStationId === user.stationID;
    }
    return false;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleTripSelection = (tripId) => {
    setSelectedTrips(prev =>
      prev.includes(tripId)
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedTrips.length === 0) {
      showSnackbar('Please select trips first', 'warning');
      return;
    }

    try {
      switch(action) {
        case 'activate':
          await Promise.all(selectedTrips.map(id => 
            api.patch(`/api/trip/${id}/toggle-active`, {})
          ));
          showSnackbar(`${selectedTrips.length} trips activated`, 'success');
          break;
        case 'delete':
          if (window.confirm(`Delete ${selectedTrips.length} trips?`)) {
            await Promise.all(selectedTrips.map(id =>
              api.delete(`/api/trip/${id}`)
            ));
            showSnackbar(`${selectedTrips.length} trips deleted`, 'success');
          }
          break;
      }
      setSelectedTrips([]);
      fetchTrips();
    } catch (err) {
      showSnackbar('Bulk action failed', 'error');
    }
  };

  const exportTrips = () => {
    const csvContent = [
      ['Trip Number', 'Origin', 'Destination', 'Departure', 'Arrival', 'Vehicle', 'Driver', 'Price', 'Available Seats', 'Status'],
      ...trips.map(trip => [
        trip.tripNumber || 'N/A',
        trip.origin?.stationName || 'N/A',
        trip.destination?.stationName || 'N/A',
        format(new Date(trip.departureTime), 'yyyy-MM-dd HH:mm'),
        format(new Date(trip.arrivalTime), 'yyyy-MM-dd HH:mm'),
        trip.vehicle?.plateNumber || 'N/A',
        trip.driver?.fullName || 'N/A',
        trip.price || 0,
        trip.availableSeats || 0,
        trip.tripStatus || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trips-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSnackbar('Trips exported successfully', 'success');
  };

  const getStats = () => {
    const stats = {
      total: trips.length,
      active: trips.filter(t => t.isActive).length,
      today: trips.filter(t => 
        format(new Date(t.departureTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).length,
      upcoming: trips.filter(t => 
        isAfter(new Date(t.departureTime), new Date()) && t.tripStatus === 'scheduled'
      ).length,
      completed: trips.filter(t => t.tripStatus === 'completed').length,
      cancelled: trips.filter(t => t.tripStatus === 'cancelled').length
    };
    
    return stats;
  };

  const stats = getStats();

  if (loading && trips.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 2, color: 'primary.main' }} />
              Trip Schedules
              <Badge badgeContent={totalTrips} color="primary" sx={{ ml: 2 }}>
                <span></span>
              </Badge>
            </Typography>
            <Typography color="textSecondary" variant="subtitle1">
              Manage and monitor all trip schedules
            </Typography>
          </Grid>
          <Grid item sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="list">
                <ViewListIcon />
              </ToggleButton>
              <ToggleButton value="grid">
                <GridViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            
            {(user?.role === 'station_admin' || user?.role === 'super_admin') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                disabled={vehicles.length === 0 || drivers.length === 0}
              >
                New Trip
                {(vehicles.length === 0 || drivers.length === 0) && ' (No data)'}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchTrips();
                fetchRelatedData();
              }}
            >
              Refresh All
            </Button>
          </Grid>
        </Grid>
        
        {/* Data Status Indicator */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Stations: ${stations.length}`} 
            color={stations.length > 0 ? "success" : "error"} 
            size="small" 
          />
          <Chip 
            label={`Vehicles: ${vehicles.length}`} 
            color={vehicles.length > 0 ? "success" : "error"} 
            size="small" 
          />
          <Chip 
            label={`Drivers: ${drivers.length}`} 
            color={drivers.length > 0 ? "success" : "error"} 
            size="small" 
          />
          <Chip 
            label={`Trips: ${totalTrips}`} 
            color="primary" 
            size="small" 
          />
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Trips
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Today
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.today}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Upcoming
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.upcoming}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Cancelled
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.cancelled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bulk Actions */}
      {selectedTrips.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'action.selected' }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="subtitle1">
                <strong>{selectedTrips.length}</strong> trips selected
              </Typography>
            </Grid>
            <Grid item>
              <Button
                size="small"
                startIcon={<EventIcon />}
                onClick={() => handleBulkAction('activate')}
                sx={{ mr: 1 }}
              >
                Activate
              </Button>
              <Button
                size="small"
                startIcon={<EventBusyIcon />}
                onClick={() => handleBulkAction('deactivate')}
                sx={{ mr: 1 }}
                color="warning"
              >
                Deactivate
              </Button>
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => handleBulkAction('delete')}
                color="error"
              >
                Delete
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              Filters & Search
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={filters.dateRange}
                label="Date Range"
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                {dateRangeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {filters.dateRange === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="boarding">Boarding</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="delayed">Delayed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Origin Station</InputLabel>
              <Select
                value={filters.origin}
                label="Origin Station"
                onChange={(e) => handleFilterChange('origin', e.target.value)}
              >
                <MenuItem value="">All Origins</MenuItem>
                {stations.map(station => (
                  <MenuItem key={station._id} value={station._id}>
                    {station.stationName} - {station.city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Destination</InputLabel>
              <Select
                value={filters.destination}
                label="Destination"
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              >
                <MenuItem value="">All Destinations</MenuItem>
                {stations.map(station => (
                  <MenuItem key={station._id} value={station._id}>
                    {station.stationName} - {station.city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Box>
              <Button
                onClick={clearFilters}
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
              >
                Clear Filters
              </Button>
            </Box>
            <Box>
              <Button
                onClick={exportTrips}
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                sx={{ mr: 1 }}
              >
                Export CSV
              </Button>
              <Button
                onClick={fetchTrips}
                variant="contained"
                size="small"
                startIcon={<SearchIcon />}
              >
                Apply Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Sort Controls */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
              <SortIcon sx={{ mr: 1 }} />
              Sort by:
            </Typography>
          </Grid>
          <Grid item>
            <Button
              size="small"
              onClick={() => handleSort('departureTime')}
              endIcon={sortBy === 'departureTime' && (sortOrder === 'asc' ? '↑' : '↓')}
              variant={sortBy === 'departureTime' ? 'contained' : 'outlined'}
            >
              Departure Time
            </Button>
          </Grid>
          <Grid item>
            <Button
              size="small"
              onClick={() => handleSort('price')}
              endIcon={sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              variant={sortBy === 'price' ? 'contained' : 'outlined'}
            >
              Price
            </Button>
          </Grid>
          <Grid item>
            <Button
              size="small"
              onClick={() => handleSort('availableSeats')}
              endIcon={sortBy === 'availableSeats' && (sortOrder === 'asc' ? '↑' : '↓')}
              variant={sortBy === 'availableSeats' ? 'contained' : 'outlined'}
            >
              Available Seats
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Trips Display */}
      {viewMode === 'list' ? (
        // List View
        <Paper sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTrips.length === trips.length && trips.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTrips(trips.map(t => t._id));
                        } else {
                          setSelectedTrips([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Trip Details</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Vehicle & Driver</TableCell>
                  <TableCell>Seats</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {loading ? 'Loading...' : 'No trips found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.map((trip) => (
                    <TableRow key={trip._id} hover selected={selectedTrips.includes(trip._id)}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTrips.includes(trip._id)}
                          onChange={() => handleTripSelection(trip._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {trip.tripNumber || 'N/A'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                              {trip.origin?.stationName || 'N/A'} → {trip.destination?.stationName || 'N/A'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="textSecondary">
                            Station: {trip.station?.stationName || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            <TimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {format(new Date(trip.departureTime), 'PPp')}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {format(new Date(trip.arrivalTime), 'PPp')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Duration: {Math.floor((trip.estimatedDuration || 0) / 60)}h {(trip.estimatedDuration || 0) % 60}m
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            <BusIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {trip.vehicle?.plateNumber || 'N/A'} ({trip.vehicle?.carType || 'N/A'})
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {trip.driver?.fullName || 'N/A'}
                          </Typography>
                          <Chip
                            label={`ETB ${trip.price || 0}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 100 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {trip.availableSeats || 0}/{trip.totalSeats || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {getAvailableSeatsPercentage(trip)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={getAvailableSeatsPercentage(trip)}
                            color={getSeatColor(getAvailableSeatsPercentage(trip))}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip
                            icon={statusIcons[trip.tripStatus]}
                            label={trip.tripStatus || 'N/A'}
                            color={statusColors[trip.tripStatus] || 'default'}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={trip.isActive ? 'Active' : 'Inactive'}
                            color={trip.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {(user?.role === 'station_admin' || user?.role === 'super_admin') && canEditDelete(trip) && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(trip)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTrip(trip._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {user?.role === 'driver' && trip.driver?._id === user._id && (
                            <Tooltip title="Start Trip">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleUpdateStatus(trip._id, 'ongoing')}
                                disabled={trip.tripStatus !== 'boarding'}
                              >
                                <ArrowForwardIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {(user?.role === 'station_admin' || user?.role === 'super_admin') && (
                            <Tooltip title={trip.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={trip.isActive ? 'warning' : 'success'}
                                onClick={() => handleToggleActive(trip._id, trip.isActive)}
                              >
                                {trip.isActive ? <EventBusyIcon fontSize="small" /> : <EventIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
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
            count={totalTrips}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        </Paper>
      ) : (
        // Grid View
        <Grid container spacing={3}>
          {trips.map((trip) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={trip._id}>
              <Card sx={{ height: '100%', borderRadius: 2, position: 'relative' }}>
                {selectedTrips.includes(trip._id) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✓
                  </Box>
                )}
                <CardContent onClick={() => handleTripSelection(trip._id)} sx={{ cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" noWrap>
                      {trip.tripNumber || 'N/A'}
                    </Typography>
                    <Chip
                      icon={statusIcons[trip.tripStatus]}
                      label={trip.tripStatus || 'N/A'}
                      color={statusColors[trip.tripStatus] || 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Route
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" fontWeight="medium">
                        {trip.origin?.stationName || 'N/A'} → {trip.destination?.stationName || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Departure
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(trip.departureTime), 'PPp')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Arrival
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(trip.arrivalTime), 'PPp')}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Vehicle
                      </Typography>
                      <Typography variant="body2">
                        {trip.vehicle?.plateNumber || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Driver
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {trip.driver?.fullName || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        Available Seats: {trip.availableSeats || 0}/{trip.totalSeats || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {getAvailableSeatsPercentage(trip)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getAvailableSeatsPercentage(trip)}
                      color={getSeatColor(getAvailableSeatsPercentage(trip))}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={`ETB ${trip.price || 0}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={trip.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={trip.isActive ? 'success' : 'error'}
                    />
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Box>
                    {canEditDelete(trip) && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(trip)}
                            sx={{ mr: 0.5 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTrip(trip._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Trip Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTrip ? 'Edit Trip' : 'Create New Trip'}
          <Typography variant="caption" display="block" color="textSecondary">
            {selectedTrip ? `Editing: ${selectedTrip.tripNumber || selectedTrip._id}` : 'Create a new trip schedule'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingRelated ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Origin Station</InputLabel>
                  <Select
                    name="origin"
                    value={tripForm.origin}
                    label="Origin Station"
                    onChange={handleInputChange}
                    disabled={stations.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {stations.length === 0 ? 'No stations available' : 'Select origin station'}
                    </MenuItem>
                    {stations.map(station => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName} - {station.city}
                      </MenuItem>
                    ))}
                  </Select>
                  {stations.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      No stations found. Please add stations first.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Destination Station</InputLabel>
                  <Select
                    name="destination"
                    value={tripForm.destination}
                    label="Destination Station"
                    onChange={handleInputChange}
                    disabled={stations.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {stations.length === 0 ? 'No stations available' : 'Select destination station'}
                    </MenuItem>
                    {stations.map(station => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName} - {station.city}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="datetime-local"
                  name="departureTime"
                  label="Departure Time"
                  value={tripForm.departureTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="datetime-local"
                  name="arrivalTime"
                  label="Arrival Time"
                  value={tripForm.arrivalTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Vehicle</InputLabel>
                  <Select
                    name="vehicle"
                    value={tripForm.vehicle}
                    label="Vehicle"
                    onChange={handleInputChange}
                    disabled={vehicles.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {vehicles.length === 0 ? 'No vehicles available' : 'Select vehicle'}
                    </MenuItem>
                    {vehicles.map(vehicle => (
                      <MenuItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNumber} - {vehicle.carType} ({vehicle.totalCapacity} seats)
                        {vehicle.currentStatus && ` - ${vehicle.currentStatus}`}
                      </MenuItem>
                    ))}
                  </Select>
                  {vehicles.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      No available vehicles found. Please add vehicles first.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Driver</InputLabel>
                  <Select
                    name="driver"
                    value={tripForm.driver}
                    label="Driver"
                    onChange={handleInputChange}
                    disabled={drivers.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {drivers.length === 0 ? 'No drivers available' : 'Select driver'}
                    </MenuItem>
                    {drivers.map(driver => (
                      <MenuItem key={driver._id} value={driver._id}>
                        {driver.fullName} ({driver.licenseNumber || 'No license'})
                      </MenuItem>
                    ))}
                  </Select>
                  {drivers.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      No active drivers found. Please add drivers first.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="price"
                  label="Price (ETB)"
                  value={tripForm.price}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 1 } }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="totalSeats"
                  label="Total Seats"
                  value={tripForm.totalSeats}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { 
                    min: 1, 
                    max: vehicles.find(v => v._id === tripForm.vehicle)?.totalCapacity || 100 
                  }}}
                  size="small"
                  helperText={tripForm.vehicle && vehicles.find(v => v._id === tripForm.vehicle)?.totalCapacity && 
                    `Vehicle capacity: ${vehicles.find(v => v._id === tripForm.vehicle)?.totalCapacity} seats`}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="estimatedDuration"
                  label="Estimated Duration (minutes)"
                  value={tripForm.estimatedDuration}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 15 } }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Station</InputLabel>
                  <Select
                    name="station"
                    value={tripForm.station}
                    label="Station"
                    onChange={handleInputChange}
                    disabled={user?.role !== 'super_admin' || stations.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {stations.length === 0 ? 'No stations available' : 'Select station'}
                    </MenuItem>
                    {stations.map(station => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName}
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
                  name="notes"
                  label="Notes"
                  value={tripForm.notes}
                  onChange={handleInputChange}
                  placeholder="Additional information about this trip..."
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={selectedTrip ? handleUpdateTrip : handleCreateTrip}
            startIcon={selectedTrip ? <EditIcon /> : <AddIcon />}
            disabled={loadingRelated || vehicles.length === 0 || drivers.length === 0 || stations.length === 0}
          >
            {selectedTrip ? 'Update Trip' : 'Create Trip'}
            {(vehicles.length === 0 || drivers.length === 0 || stations.length === 0) && ' (Missing Data)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Schedules;