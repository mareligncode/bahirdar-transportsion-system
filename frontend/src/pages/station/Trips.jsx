import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Tooltip,
  CircularProgress,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  DirectionsBus as BusIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  MoreVert as MoreIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';

const Trips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    vehicle: '',
    driver: '',
    price: '',
    totalSeats: '',
    availableSeats: '',
    station: '',
    routePoints: '',
    estimatedDuration: '',
    notes: ''
  });
  const [newStatus, setNewStatus] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [stations, setStations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userStation, setUserStation] = useState(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTrips, setTotalTrips] = useState(0);
  const [sortField, setSortField] = useState('departureTime');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch user profile and trips on component mount
  useEffect(() => {
    fetchUserProfile();
    fetchStations();
  }, []);

  // Auto-set station for station admin when dialog opens
  useEffect(() => {
    if (openDialog && userProfile?.role === 'station_admin' && userStation) {
      setFormData(prev => ({
        ...prev,
        origin: userStation._id,
        station: userStation._id
      }));
    }
  }, [openDialog, userProfile, userStation]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/auth/profile');
      if (response.data.success) {
        setUserProfile(response.data.data.user);
        if (response.data.data.user.role === 'station_admin' && response.data.data.user.stationID) {
          await fetchUserStation(response.data.data.user.stationID);
        }
        fetchTrips();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    }
  };

  const fetchUserStation = async (stationId) => {
    try {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(stationId);
      
      if (isValidObjectId) {
        const response = await api.get(`/api/station/${stationId}`);
        if (response.data.station) {
          setUserStation(response.data.station);
          return;
        }
      }
      
      const allStations = await fetchStationsForLookup();
      const foundStation = allStations.find(station => 
        station.stationCode === stationId || 
        station._id === stationId
      );
      
      if (foundStation) {
        setUserStation(foundStation);
      } else {
        setUserStation(null);
      }
    } catch (err) {
      console.error('Error fetching user station:', err);
      setUserStation(null);
    }
  };

  const fetchStationsForLookup = async () => {
    try {
      const response = await api.get('/api/station/active');
      return response.data.stations || [];
    } catch (err) {
      console.error('Error fetching stations for lookup:', err);
      return [];
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters for pagination and sorting
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        sortBy: sortField,
        sortOrder: sortDirection
      });
      
      // For station admin, only show trips from their station
      if (userProfile?.role === 'station_admin' && userStation) {
        params.append('station', userStation._id);
      }
      
      const response = await api.get(`/api/trip?${params.toString()}`);
      
      if (response.data.success) {
        setTrips(response.data.data || []);
        setTotalTrips(response.data.total || response.data.data?.length || 0);
      } else {
        setError(response.data.message || 'Failed to fetch trips');
        setTrips([]);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.response?.data?.message || 'Failed to fetch trips. Please try again.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      const response = await api.get('/api/station/active');
      if (response.data.stations) {
        setStations(response.data.stations || []);
      } else {
        setStations([]);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError('Failed to load stations: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingStations(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      
      let url = '/api/vehicles';
      const params = new URLSearchParams();
      
      // For station admin, only show vehicles from their station
      if (userProfile?.role === 'station_admin' && userStation) {
        const actualStationId = userStation._id;
        
        if (actualStationId && /^[0-9a-fA-F]{24}$/.test(actualStationId)) {
          params.append('stationID', actualStationId); // Vehicle model uses stationID
        }
      }
      
      params.append('isActive', 'true');
      params.append('currentStatus', 'available,active');
      
      const fullUrl = `${url}?${params.toString()}`;
      
      const response = await api.get(fullUrl);
      
      if (response.data.success) {
        const vehicles = response.data.data?.vehicles || [];
        
        const filteredVehicles = vehicles.filter(vehicle => 
          vehicle.isActive && 
          ['available', 'active'].includes(vehicle.currentStatus) &&
          vehicle.totalCapacity > 0
        );
        
        setAvailableVehicles(filteredVehicles);
      } else {
        setAvailableVehicles([]);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setAvailableVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      
      let response;
      if (userProfile?.role === 'station_admin') {
        response = await api.get('/api/auth/station-users');
      } else if (userProfile?.role === 'super_admin') {
        response = await api.get('/api/auth/all-users');
      } else {
        setAvailableDrivers([]);
        return;
      }
      
      if (response.data.success) {
        const users = response.data.data?.users || response.data.data || [];
        
        const drivers = users.filter(
          user => user.role === 'driver' && user.isActive === true
        );
        
        setAvailableDrivers(drivers);
      } else {
        setAvailableDrivers([]);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setAvailableDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchAllResources = async () => {
    await Promise.all([
      fetchVehicles(),
      fetchDrivers()
    ]);
  };

  const calculateDuration = (departureTime, arrivalTime) => {
    if (!departureTime || !arrivalTime) return 0;
    
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    
    if (arrival <= departure) return 0;
    
    const diffMs = arrival - departure;
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes;
  };

  const handleTimeChange = (field, value) => {
    const updatedData = {
      ...formData,
      [field]: value
    };
    
    if (updatedData.departureTime && updatedData.arrivalTime) {
      const duration = calculateDuration(updatedData.departureTime, updatedData.arrivalTime);
      updatedData.estimatedDuration = duration > 0 ? duration : '';
    } else {
      updatedData.estimatedDuration = '';
    }
    
    setFormData(updatedData);
  };

  const handleVehicleChange = (vehicleId) => {
    const selectedVehicle = availableVehicles.find(vehicle => vehicle._id === vehicleId);
    
    if (selectedVehicle) {
      const vehicleCapacity = selectedVehicle.totalCapacity || 0;
      
      const updatedData = {
        ...formData,
        vehicle: vehicleId,
        totalSeats: vehicleCapacity,
        availableSeats: vehicleCapacity
      };

      const driverId = selectedVehicle.driverID?._id || selectedVehicle.driverID;
      
      if (driverId) {
        const assignedDriver = availableDrivers.find(driver => driver._id === driverId);
        
        if (assignedDriver) {
          updatedData.driver = assignedDriver._id;
        } else {
          fetchAssignedDriver(driverId);
        }
      } else {
        updatedData.driver = '';
      }
      
      setFormData(updatedData);
    } else {
      setFormData(prev => ({
        ...prev,
        vehicle: '',
        totalSeats: '',
        availableSeats: '',
        driver: ''
      }));
    }
  };

  const handleTotalSeatsChange = (value) => {
    const total = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      totalSeats: total,
      availableSeats: total
    }));
  };

  const fetchAssignedDriver = async (driverId) => {
    try {
      const response = await api.get(`/api/auth/user/${driverId}`);
      
      if (response.data.success && response.data.data.user) {
        const driver = response.data.data.user;
        
        if (driver.role === 'driver' && driver.isActive) {
          setAvailableDrivers(prev => {
            const exists = prev.some(d => d._id === driver._id);
            if (!exists) {
              return [...prev, driver];
            }
            return prev;
          });
          
          setFormData(prev => ({
            ...prev,
            driver: driver._id
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            driver: ''
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching assigned driver:', err);
    }
  };

  const handleOpenCreateDialog = async () => {
    try {
      let defaultOrigin = '';
      let defaultStation = '';
      
      if (userProfile?.role === 'station_admin' && userStation) {
        defaultOrigin = userStation._id || '';
        defaultStation = userStation._id || '';
      }
      
      setFormData({
        origin: defaultOrigin,
        destination: '',
        departureTime: '',
        arrivalTime: '',
        vehicle: '',
        driver: '',
        price: '',
        totalSeats: '',
        availableSeats: '',
        station: defaultStation,
        routePoints: '',
        estimatedDuration: '',
        notes: ''
      });
      
      setSelectedTrip(null);
      
      await fetchAllResources();
      setOpenDialog(true);
    } catch (err) {
      console.error('Error opening create dialog:', err);
      setError('Failed to load resources: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateTrip = async () => {
    try {
      setError('');
      
      const requiredFields = ['origin', 'destination', 'departureTime', 'arrivalTime', 
                             'vehicle', 'driver', 'price', 'totalSeats', 'station'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill all required fields: ${missingFields.join(', ')}`);
        return;
      }

      if (new Date(formData.departureTime) >= new Date(formData.arrivalTime)) {
        setError('Departure time must be before arrival time');
        return;
      }

      if (formData.availableSeats > formData.totalSeats) {
        setError('Available seats cannot exceed total seats');
        return;
      }

      let estimatedDuration = formData.estimatedDuration;
      if (!estimatedDuration || estimatedDuration <= 0) {
        estimatedDuration = calculateDuration(formData.departureTime, formData.arrivalTime);
        if (estimatedDuration <= 0) {
          setError('Please check departure and arrival times');
          return;
        }
      }

      const tripData = {
        origin: formData.origin,
        destination: formData.destination,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        vehicle: formData.vehicle,
        driver: formData.driver,
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats),
        availableSeats: Number(formData.availableSeats || formData.totalSeats),
        station: formData.station,
        routePoints: formData.routePoints ? formData.routePoints.split(',').map(point => point.trim()) : [],
        estimatedDuration: Number(estimatedDuration),
        notes: formData.notes || ''
      };

      const response = await api.post('/api/trip', tripData);
      
      if (response.data.success) {
        setSuccess('Trip created successfully!');
        setOpenDialog(false);
        fetchTrips();
      } else {
        setError(response.data.message || 'Failed to create trip');
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      setError(err.response?.data?.message || 'Failed to create trip. Please try again.');
    }
  };

  const handleUpdateTrip = async () => {
    try {
      setError('');
      
      if (!selectedTrip) return;

      if (new Date(formData.departureTime) >= new Date(formData.arrivalTime)) {
        setError('Departure time must be before arrival time');
        return;
      }

      if (formData.availableSeats > formData.totalSeats) {
        setError('Available seats cannot exceed total seats');
        return;
      }

      let estimatedDuration = formData.estimatedDuration;
      if (!estimatedDuration || estimatedDuration <= 0) {
        estimatedDuration = calculateDuration(formData.departureTime, formData.arrivalTime);
        if (estimatedDuration <= 0) {
          setError('Please check departure and arrival times');
          return;
        }
      }

      const updateData = {
        origin: formData.origin,
        destination: formData.destination,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        vehicle: formData.vehicle,
        driver: formData.driver,
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats),
        availableSeats: Number(formData.availableSeats || formData.totalSeats),
        station: formData.station,
        routePoints: formData.routePoints ? formData.routePoints.split(',').map(point => point.trim()) : [],
        estimatedDuration: Number(estimatedDuration),
        notes: formData.notes || ''
      };

      const response = await api.put(`/api/trip/${selectedTrip._id}`, updateData);
      
      if (response.data.success) {
        setSuccess('Trip updated successfully!');
        setOpenDialog(false);
        fetchTrips();
      } else {
        setError(response.data.message || 'Failed to update trip');
      }
    } catch (err) {
      console.error('Error updating trip:', err);
      setError(err.response?.data?.message || 'Failed to update trip. Please try again.');
    }
  };

  const handleDeleteTrip = async () => {
    try {
      if (!selectedTrip) return;

      const response = await api.delete(`/api/trip/${selectedTrip._id}`);
      
      if (response.data.success) {
        setSuccess('Trip deleted successfully!');
        setOpenDeleteDialog(false);
        fetchTrips();
      } else {
        setError(response.data.message || 'Failed to delete trip');
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      setError(err.response?.data?.message || 'Failed to delete trip. Please try again.');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      if (!selectedTrip || !newStatus) return;

      const response = await api.patch(`/api/trip/${selectedTrip._id}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setSuccess(`Trip status updated to ${newStatus}!`);
        setOpenStatusDialog(false);
        setNewStatus('');
        fetchTrips();
      } else {
        setError(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status. Please try again.');
    }
  };

  const handleToggleActive = async (tripId) => {
    try {
      const response = await api.patch(`/api/trip/${tripId}/toggle-active`);
      
      if (response.data.success) {
        setSuccess(response.data.message || 'Trip status updated successfully!');
        fetchTrips();
      } else {
        setError(response.data.message || 'Failed to update trip status');
      }
    } catch (err) {
      console.error('Error toggling trip active status:', err);
      
      if (err.response?.status === 403) {
        setError('Permission denied. You can only manage trips from your own station.');
      } else if (err.response?.status === 404) {
        setError('Trip not found. It may have been deleted.');
      } else {
        setError(err.response?.data?.message || 'Failed to update trip status. Please try again.');
      }
      
      fetchTrips();
    }
  };

  const openEditDialog = async (trip) => {
    try {
      setSelectedTrip(trip);
      
      await fetchAllResources();
      
      const tripOrigin = typeof trip.origin === 'object' ? trip.origin._id : trip.origin;
      const tripDestination = typeof trip.destination === 'object' ? trip.destination._id : trip.destination;
      const tripVehicle = typeof trip.vehicle === 'object' ? trip.vehicle._id : trip.vehicle;
      const tripDriver = typeof trip.driver === 'object' ? trip.driver._id : trip.driver;
      const tripStation = typeof trip.station === 'object' ? trip.station._id : trip.station;
      
      const availableSeats = trip.availableSeats || trip.totalSeats || '';
      
      setFormData({
        origin: tripOrigin || '',
        destination: tripDestination || '',
        departureTime: trip.departureTime ? new Date(trip.departureTime).toISOString().slice(0, 16) : '',
        arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime).toISOString().slice(0, 16) : '',
        vehicle: tripVehicle || '',
        driver: tripDriver || '',
        price: trip.price || '',
        totalSeats: trip.totalSeats || '',
        availableSeats: availableSeats,
        station: tripStation || '',
        routePoints: trip.routePoints?.join(', ') || '',
        estimatedDuration: trip.estimatedDuration || '',
        notes: trip.notes || ''
      });
      
      setOpenDialog(true);
    } catch (err) {
      console.error('Error opening edit dialog:', err);
      setError('Failed to load trip data: ' + (err.message || 'Unknown error'));
    }
  };

  const openDeleteConfirmation = (trip) => {
    setSelectedTrip(trip);
    setOpenDeleteDialog(true);
  };

  const openStatusUpdate = (trip) => {
    setSelectedTrip(trip);
    setNewStatus(trip.tripStatus);
    setOpenStatusDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'boarding': return 'warning';
      case 'ongoing': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'delayed': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCompactDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const getVehicleCapacity = (vehicleId) => {
    if (!vehicleId) return 0;
    const vehicle = availableVehicles.find(v => v._id === vehicleId);
    return vehicle?.totalCapacity || 0;
  };

  const getStationName = (station) => {
    if (!station) return 'N/A';
    if (typeof station === 'object') {
      return station.stationName || 'Unknown Station';
    }
    const foundStation = stations.find(s => s._id === station);
    return foundStation?.stationName || station;
  };

  const getDriverName = (driver) => {
    if (!driver) return 'No driver';
    if (typeof driver === 'object') {
      return driver.fullName || 'Unknown Driver';
    }
    const foundDriver = availableDrivers.find(d => d._id === driver);
    return foundDriver?.fullName || driver;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const SortableHeader = ({ field, label, currentField, currentDirection, children }) => (
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => handleSort(field)}>
        {children || label}
        {currentField === field && (
          currentDirection === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />
        )}
      </Box>
    </TableCell>
  );

  if (loading && trips.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading trips...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Trip Management
            <IconButton onClick={fetchTrips} sx={{ ml: 2 }}>
              <RefreshIcon />
            </IconButton>
          </Typography>
          {userStation && (
            <Typography variant="subtitle1" color="textSecondary">
              Station: {userStation.stationName} ({userStation.city})
            </Typography>
          )}
          {userProfile && (
            <Typography variant="caption" color="textSecondary">
              Logged in as: {userProfile.role}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={loadingStations || loadingVehicles || loadingDrivers}
          >
            Create New Trip
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Trips
              </Typography>
              <Typography variant="h4">
                {totalTrips}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Trips
              </Typography>
              <Typography variant="h4">
                {trips.filter(t => t.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Available Seats
              </Typography>
              <Typography variant="h4">
                {trips.reduce((sum, trip) => sum + (trip.availableSeats || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Trips
              </Typography>
              <Typography variant="h4">
                {trips.filter(t => {
                  if (!t.departureTime) return false;
                  const today = new Date().toDateString();
                  const tripDate = new Date(t.departureTime).toDateString();
                  return today === tripDate;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trips Table - Medium Size */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <SortableHeader field="origin" label="Route" currentField={sortField} currentDirection={sortDirection}>
                  <Typography variant="subtitle2" fontWeight="600">Route</Typography>
                </SortableHeader>
                <SortableHeader field="departureTime" label="Schedule" currentField={sortField} currentDirection={sortDirection}>
                  <Typography variant="subtitle2" fontWeight="600">Schedule</Typography>
                </SortableHeader>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="600">Vehicle & Driver</Typography>
                </TableCell>
                <SortableHeader field="tripStatus" label="Status" currentField={sortField} currentDirection={sortDirection}>
                  <Typography variant="subtitle2" fontWeight="600">Status</Typography>
                </SortableHeader>
                <SortableHeader field="availableSeats" label="Seats" currentField={sortField} currentDirection={sortDirection}>
                  <Typography variant="subtitle2" fontWeight="600">Seats</Typography>
                </SortableHeader>
                <SortableHeader field="price" label="Price" currentField={sortField} currentDirection={sortDirection}>
                  <Typography variant="subtitle2" fontWeight="600">Price</Typography>
                </SortableHeader>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="600">Actions</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No trips found. Create your first trip!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => (
                  <TableRow key={trip._id} hover>
                    <TableCell>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon color="primary" fontSize="small" />
                          <Typography variant="body2">
                            <strong>From:</strong> {getStationName(trip.origin)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon color="secondary" fontSize="small" />
                          <Typography variant="body2">
                            <strong>To:</strong> {getStationName(trip.destination)}
                          </Typography>
                        </Box>
                        {trip.routePoints && trip.routePoints.length > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Via: {trip.routePoints.slice(0, 2).join(', ')}
                            {trip.routePoints.length > 2 && '...'}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon fontSize="small" />
                          <Typography variant="body2">
                            <strong>Depart:</strong> {formatCompactDate(trip.departureTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon fontSize="small" />
                          <Typography variant="body2">
                            <strong>Arrive:</strong> {formatCompactDate(trip.arrivalTime)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          Duration: {formatDuration(trip.estimatedDuration)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusIcon fontSize="small" />
                          <Typography variant="body2">
                            {trip.vehicle?.plateNumber || 'No vehicle'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" />
                          <Typography variant="body2">
                            {getDriverName(trip.driver)}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Chip
                          label={trip.tripStatus}
                          color={getStatusColor(trip.tripStatus)}
                          size="medium"
                          sx={{ fontSize: '0.8rem' }}
                        />
                        <Chip
                          label={trip.isActive ? 'Active' : 'Inactive'}
                          color={trip.isActive ? 'success' : 'error'}
                          size="medium"
                          variant="outlined"
                          sx={{ fontSize: '0.8rem' }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          {trip.availableSeats || 0} / {trip.totalSeats || 0}
                        </Typography>
                        {trip.totalSeats > 0 && (
                          <LinearProgress
                            variant="determinate"
                            value={((trip.availableSeats || 0) / trip.totalSeats) * 100}
                            sx={{ height: 6, borderRadius: 3, mt: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon color="success" />
                        <Typography variant="body2" fontWeight="medium">
                          ${trip.price || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="medium"
                            onClick={() => navigate(`/trips/${trip._id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Trip">
                          <IconButton
                            size="medium"
                            onClick={() => openEditDialog(trip)}
                            disabled={!trip.isActive && userProfile?.role === 'station_admin'}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="medium"
                            onClick={() => openStatusUpdate(trip)}
                          >
                            <MoreIcon />
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
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalTrips}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider', py: 1 }}
        />
      </Paper>

      {/* Create/Edit Trip Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTrip ? 'Edit Trip' : 'Create New Trip'}
          {userStation && (
            <Typography variant="subtitle2" color="textSecondary">
              Station: {userStation.stationName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              {/* Origin Station */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required sx={{ minWidth: 200, width: '100%' }}>
                  <InputLabel>Origin Station</InputLabel>
                  {loadingStations ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Loading stations...</Typography>
                    </Box>
                  ) : (
                    <Select
                      value={formData.origin}
                      label="Origin Station"
                      onChange={(e) => setFormData({...formData, origin: e.target.value})}
                      disabled={userProfile?.role === 'station_admin' && userStation}
                    >
                      {stations.length > 0 ? (
                        stations.map((station) => (
                          <MenuItem key={station._id} value={station._id}>
                            {station.stationName} ({station.city})
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No stations available</MenuItem>
                      )}
                    </Select>
                  )}
                  {userProfile?.role === 'station_admin' && userStation && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1 }}>
                      Auto-set to your station
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Destination Station */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required sx={{ minWidth: 200, width: '100%' }}>
                  <InputLabel>Destination Station</InputLabel>
                  {loadingStations ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Loading stations...</Typography>
                    </Box>
                  ) : (
                    <Select
                      value={formData.destination}
                      label="Destination Station"
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    >
                      {stations.length > 0 ? (
                        stations
                          .filter(station => station._id !== formData.origin)
                          .map((station) => (
                            <MenuItem key={station._id} value={station._id}>
                              {station.stationName} ({station.city})
                            </MenuItem>
                          ))
                      ) : (
                        <MenuItem disabled>No stations available</MenuItem>
                      )}
                    </Select>
                  )}
                </FormControl>
              </Grid>

              {/* Departure Time */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Departure Time"
                  value={formData.departureTime}
                  onChange={(e) => handleTimeChange('departureTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={formData.departureTime && formData.arrivalTime && new Date(formData.departureTime) >= new Date(formData.arrivalTime)}
                  helperText={formData.departureTime && formData.arrivalTime && new Date(formData.departureTime) >= new Date(formData.arrivalTime) ? "Departure must be before arrival" : ""}
                />
              </Grid>
              
              {/* Arrival Time */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Arrival Time"
                  value={formData.arrivalTime}
                  onChange={(e) => handleTimeChange('arrivalTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={formData.departureTime && formData.arrivalTime && new Date(formData.departureTime) >= new Date(formData.arrivalTime)}
                  helperText={formData.departureTime && formData.arrivalTime && new Date(formData.departureTime) >= new Date(formData.arrivalTime) ? "Arrival must be after departure" : ""}
                />
              </Grid>
              
              {/* Vehicle Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required sx={{ minWidth: 200, width: '100%' }}>
                  <InputLabel>Vehicle</InputLabel>
                  {loadingVehicles ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Loading vehicles...</Typography>
                    </Box>
                  ) : (
                    <Select
                      value={formData.vehicle}
                      label="Vehicle"
                      onChange={(e) => handleVehicleChange(e.target.value)}
                    >
                      {availableVehicles.length > 0 ? (
                        availableVehicles.map((vehicle) => (
                          <MenuItem key={vehicle._id} value={vehicle._id}>
                            {vehicle.plateNumber} - {vehicle.carType} ({vehicle.totalCapacity} seats)
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          {userProfile?.role === 'station_admin' 
                            ? 'No available vehicles at your station' 
                            : 'No available vehicles'}
                        </MenuItem>
                      )}
                    </Select>
                  )}
                  {formData.vehicle && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1 }}>
                      Vehicle capacity: {getVehicleCapacity(formData.vehicle)} seats
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              {/* Driver Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required sx={{ minWidth: 200, width: '100%' }}>
                  <InputLabel>Driver</InputLabel>
                  {loadingDrivers ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Loading drivers...</Typography>
                    </Box>
                  ) : (
                    <Select
                      value={formData.driver}
                      label="Driver"
                      onChange={(e) => setFormData({...formData, driver: e.target.value})}
                    >
                      {availableDrivers.length > 0 ? (
                        availableDrivers.map((driver) => (
                          <MenuItem key={driver._id} value={driver._id}>
                            {driver.fullName} ({driver.licenseNumber || 'No license'})
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          {userProfile?.role === 'station_admin' 
                            ? 'No available drivers at your station' 
                            : 'No available drivers'}
                        </MenuItem>
                      )}
                    </Select>
                  )}
                </FormControl>
              </Grid>
              
              {/* Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              {/* Total Seats */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  sx={{ minWidth: 200, width: '100%' }}
                  type="number"
                  label="Total Seats"
                  value={formData.totalSeats}
                  onChange={(e) => handleTotalSeatsChange(e.target.value)}
                  required
                  InputProps={{ 
                    inputProps: { 
                      min: 1, 
                      max: getVehicleCapacity(formData.vehicle) || 100 
                    },
                    readOnly: !!formData.vehicle
                  }}
                  helperText={
                    formData.vehicle 
                      ? `Based on vehicle capacity: ${getVehicleCapacity(formData.vehicle)} seats`
                      : "Enter total seats"
                  }
                />
              </Grid>

              {/* Available Seats */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  sx={{ minWidth: 200, width: '100%' }}
                  type="number"
                  label="Available Seats"
                  value={formData.availableSeats}
                  onChange={(e) => setFormData({...formData, availableSeats: e.target.value})}
                  InputProps={{ 
                    inputProps: { 
                      min: 0, 
                      max: formData.totalSeats || 0 
                    } 
                  }}
                  helperText={`Max: ${formData.totalSeats || 0} seats`}
                  error={formData.availableSeats > formData.totalSeats}
                />
              </Grid>

              {/* Station field */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required sx={{ minWidth: 200, width: '100%' }}>
                  <InputLabel>Station</InputLabel>
                  {loadingStations ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Loading stations...</Typography>
                    </Box>
                  ) : (
                    <Select
                      value={formData.station}
                      label="Station"
                      onChange={(e) => setFormData({...formData, station: e.target.value})}
                      disabled={userProfile?.role === 'station_admin' && userStation}
                    >
                      {stations.length > 0 ? (
                        stations.map((station) => (
                          <MenuItem key={station._id} value={station._id}>
                            {station.stationName} ({station.city})
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No stations available</MenuItem>
                      )}
                    </Select>
                  )}
                  {userProfile?.role === 'station_admin' && userStation && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1 }}>
                      Auto-set to your station
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              {/* Estimated Duration */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Duration (minutes)"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText={
                    formData.departureTime && formData.arrivalTime 
                      ? `Auto-calculated: ${formatDuration(formData.estimatedDuration)}`
                      : "Will auto-calculate when both times are set"
                  }
                />
              </Grid>
              
              {/* Route Points */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Route Points (comma separated)"
                  value={formData.routePoints}
                  onChange={(e) => setFormData({...formData, routePoints: e.target.value})}
                  placeholder="Stop 1, Stop 2, Stop 3"
                />
              </Grid>
              
              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={selectedTrip ? handleUpdateTrip : handleCreateTrip}
            variant="contained"
            disabled={
              loadingStations || 
              loadingVehicles || 
              loadingDrivers ||
              !formData.origin || 
              !formData.destination || 
              !formData.departureTime || 
              !formData.arrivalTime || 
              !formData.vehicle || 
              !formData.driver || 
              !formData.price || 
              !formData.totalSeats ||
              !formData.station ||
              (formData.availableSeats > formData.totalSeats) ||
              (formData.departureTime && formData.arrivalTime && new Date(formData.departureTime) >= new Date(formData.arrivalTime))
            }
          >
            {selectedTrip ? 'Update Trip' : 'Create Trip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trip? This action cannot be undone.
          </Typography>
          {selectedTrip && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>From:</strong> {getStationName(selectedTrip.origin)}
              </Typography>
              <Typography variant="body2">
                <strong>To:</strong> {getStationName(selectedTrip.destination)}
              </Typography>
              <Typography variant="body2">
                <strong>Departure:</strong> {formatDate(selectedTrip.departureTime)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteTrip} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle>Update Trip Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Trip Status</InputLabel>
            <Select
              value={newStatus}
              label="Trip Status"
              onChange={(e) => setNewStatus(e.target.value)}
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
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars for notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Trips;