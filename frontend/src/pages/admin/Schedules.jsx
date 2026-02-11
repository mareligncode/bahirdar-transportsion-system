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
  ToggleButtonGroup,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';

// Import Timeline components from @mui/lab
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
} from '@mui/lab';

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
  ViewList as ViewListIcon,
  ExpandMore as ExpandMoreIcon,
  AccountCircle as AccountCircleIcon,
  Build as BuildIcon,
  Speed as SpeedIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  Map as MapIcon,
  Route as RouteIcon,
  Timelapse as TimelapseIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  DriveEta as DriveEtaIcon
} from '@mui/icons-material';
import { format, parseISO, isAfter, isBefore, addDays, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

const Schedules = () => {
  const { user } = useAuth();
  const { t } = useTranslation(); // ✅ ADD THIS
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
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('departureTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // View Details state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewedTrip, setViewedTrip] = useState(null);

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
    { value: 'today', label: t('today') },
    { value: 'tomorrow', label: t('tomorrow') },
    { value: 'week', label: t('this_week') },
    { value: 'month', label: t('this_month') },
    { value: 'custom', label: t('custom_range') }
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
      const errorMsg = err.response?.data?.message || t('failed_to_fetch_trips');
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
      console.log('Stations response:', response.data);
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
      showSnackbar(t('failed_to_load_stations'), 'warning');
    }
  };

  // Fetch available vehicles
  const fetchVehicles = async () => {
    try {
      let response;
      
      try {
        response = await api.get('/api/vehicles');
        console.log('Vehicles response:', response.data);
        
        if (response.data.success) {
          const availableVehicles = response.data.data?.vehicles?.filter(vehicle => 
            vehicle.isActive && 
            (vehicle.currentStatus === 'available' || vehicle.currentStatus === 'active' || !vehicle.currentStatus)
          ) || [];
          
          console.log('Available vehicles:', availableVehicles);
          setVehicles(availableVehicles);
          return;
        }
      } catch (firstErr) {
        console.log('First vehicles endpoint failed:', firstErr.message);
      }
      
      try {
        response = await api.get('/api/vehicles');
        if (response.data && Array.isArray(response.data)) {
          const availableVehicles = response.data.filter(vehicle => 
            vehicle.isActive && 
            (vehicle.currentStatus === 'available' || vehicle.currentStatus === 'active' || !vehicle.currentStatus)
          );
          console.log('Alternative vehicles data:', availableVehicles);
          setVehicles(availableVehicles);
          return;
        }
      } catch (secondErr) {
        console.log('Alternative endpoint failed:', secondErr.message);
      }
      
      showSnackbar(t('could_not_load_vehicles'), 'warning');
      setVehicles([]);
      
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      showSnackbar(t('failed_to_load_vehicles'), 'warning');
      setVehicles([]);
    }
  };

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      let response;
      let users = [];
      
      if (user?.role === 'super_admin') {
        response = await api.get('/api/auth/all-users');
        console.log('Super admin drivers response:', response.data);
        
        if (response.data.success) {
          users = response.data.data?.users || [];
        } else if (Array.isArray(response.data)) {
          users = response.data;
        }
      } else if (user?.role === 'station_admin') {
        response = await api.get('/api/auth/station-users');
        console.log('Station admin drivers response:', response.data);
        
        if (response.data.success) {
          users = response.data.data?.users || response.data.data || [];
        }
      } else {
        response = await api.get('/api/auth/all-users');
        console.log('All users drivers response:', response.data);
        
        if (response.data.success) {
          users = response.data.data?.users || [];
        } else if (Array.isArray(response.data)) {
          users = response.data;
        }
      }
      
      const driversList = users.filter(u => 
        u.role === 'driver' && 
        (u.isActive === true || u.isActive === undefined)
      ) || [];
      
      console.log('Filtered drivers:', driversList);
      setDrivers(driversList);
      
      if (driversList.length === 0) {
        showSnackbar(t('no_active_drivers_found'), 'warning');
      }
      
    } catch (err) {
      console.error('Error fetching drivers:', err.response?.data || err);
      showSnackbar(t('failed_to_load_drivers'), 'warning');
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

  // Handle View Details
  const handleViewDetails = (trip) => {
    setViewedTrip(trip);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setViewedTrip(null);
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
    
    const updatedForm = {
      ...tripForm,
      [name]: value
    };
    
    if (name === 'vehicle' && value) {
      const selectedVehicle = vehicles.find(v => v._id === value);
      if (selectedVehicle) {
        if (selectedVehicle.driverID) {
          updatedForm.driver = selectedVehicle.driverID._id || selectedVehicle.driverID;
        }
        updatedForm.totalSeats = selectedVehicle.totalCapacity || '';
      }
    }
    
    if ((name === 'departureTime' || name === 'arrivalTime') && updatedForm.departureTime && updatedForm.arrivalTime) {
      const departure = new Date(updatedForm.departureTime);
      const arrival = new Date(updatedForm.arrivalTime);
      
      if (departure < arrival) {
        const durationMinutes = differenceInMinutes(arrival, departure);
        updatedForm.estimatedDuration = durationMinutes > 0 ? durationMinutes : '';
      }
    }
    
    setTripForm(updatedForm);
  };

  const handleCreateTrip = async () => {
    try {
      const requiredFields = ['origin', 'destination', 'departureTime', 'arrivalTime', 
                             'vehicle', 'driver', 'price', 'totalSeats'];
      const missingFields = requiredFields.filter(field => !tripForm[field]);
      
      if (missingFields.length > 0) {
        showSnackbar(t('fill_required_fields', { fields: missingFields.join(', ') }), 'error');
        return;
      }

      if (isBefore(new Date(tripForm.departureTime), new Date())) {
        showSnackbar(t('departure_time_future'), 'error');
        return;
      }

      if (isBefore(new Date(tripForm.arrivalTime), new Date(tripForm.departureTime))) {
        showSnackbar(t('arrival_after_departure'), 'error');
        return;
      }

      const selectedVehicle = vehicles.find(v => v._id === tripForm.vehicle);
      if (!selectedVehicle) {
        showSnackbar(t('vehicle_not_found'), 'error');
        return;
      }

      const selectedDriver = drivers.find(d => d._id === tripForm.driver);
      if (!selectedDriver) {
        showSnackbar(t('driver_not_found'), 'error');
        return;
      }

      const tripData = {
        origin: tripForm.origin,
        destination: tripForm.destination,
        departureTime: tripForm.departureTime,
        arrivalTime: tripForm.arrivalTime,
        vehicleID: tripForm.vehicle,
        driverID: tripForm.driver,
        price: parseFloat(tripForm.price),
        totalSeats: parseInt(tripForm.totalSeats),
        stationID: tripForm.station || user?.stationID,
        routePoints: tripForm.routePoints,
        estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : 0,
        notes: tripForm.notes || ''
      };

      console.log('Sending trip data:', tripData);

      const response = await api.post('/api/trip', tripData);
      console.log('Create trip response:', response.data);

      if (response.data.success) {
        showSnackbar(t('trip_created_successfully'), 'success');
        fetchTrips();
        handleCloseDialog();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('failed_to_create_trip');
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
      const selectedVehicle = vehicles.find(v => v._id === tripForm.vehicle);
      if (!selectedVehicle) {
        showSnackbar(t('vehicle_not_found'), 'error');
        return;
      }

      const selectedDriver = drivers.find(d => d._id === tripForm.driver);
      if (!selectedDriver) {
        showSnackbar(t('driver_not_found'), 'error');
        return;
      }

      const tripData = {
        origin: tripForm.origin,
        destination: tripForm.destination,
        departureTime: tripForm.departureTime,
        arrivalTime: tripForm.arrivalTime,
        vehicleID: tripForm.vehicle,
        driverID: tripForm.driver,
        price: parseFloat(tripForm.price),
        totalSeats: parseInt(tripForm.totalSeats),
        stationID: tripForm.station,
        routePoints: tripForm.routePoints,
        estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : 0,
        notes: tripForm.notes || ''
      };

      console.log('Updating trip data:', tripData);

      const response = await api.put(`/api/trip/${selectedTrip._id}`, tripData);

      if (response.data.success) {
        showSnackbar(t('trip_updated_successfully'), 'success');
        fetchTrips();
        handleCloseDialog();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('failed_to_update_trip');
      console.error('Update trip error:', err.response?.data || err);
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm(t('confirm_delete_trip'))) return;

    try {
      const response = await api.delete(`/api/trip/${tripId}`);

      if (response.data.success) {
        showSnackbar(t('trip_deleted_successfully'), 'success');
        fetchTrips();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('failed_to_delete_trip');
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      const response = await api.patch(`/api/trip/${tripId}/status`, { status: newStatus });

      if (response.data.success) {
        showSnackbar(t('trip_status_updated', { status: t(newStatus) }), 'success');
        fetchTrips();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('failed_to_update_status');
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleToggleActive = async (tripId, currentActive) => {
    try {
      const response = await api.patch(`/api/trip/${tripId}/toggle-active`, {});

      if (response.data.success) {
        showSnackbar(currentActive ? t('trip_deactivated') : t('trip_activated'), 'success');
        fetchTrips();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('failed_to_toggle_trip_status');
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
      showSnackbar(t('select_trips_first'), 'warning');
      return;
    }

    try {
      switch(action) {
        case 'activate':
          await Promise.all(selectedTrips.map(id => 
            api.patch(`/api/trip/${id}/toggle-active`, {})
          ));
          showSnackbar(t('trips_activated', { count: selectedTrips.length }), 'success');
          break;
        case 'deactivate':
          await Promise.all(selectedTrips.map(id => 
            api.patch(`/api/trip/${id}/toggle-active`, {})
          ));
          showSnackbar(t('trips_deactivated', { count: selectedTrips.length }), 'success');
          break;
        case 'delete':
          if (window.confirm(t('confirm_delete_trips', { count: selectedTrips.length }))) {
            await Promise.all(selectedTrips.map(id =>
              api.delete(`/api/trip/${id}`)
            ));
            showSnackbar(t('trips_deleted', { count: selectedTrips.length }), 'success');
          }
          break;
      }
      setSelectedTrips([]);
      fetchTrips();
    } catch (err) {
      showSnackbar(t('bulk_action_failed'), 'error');
    }
  };

  const exportTrips = () => {
    const csvContent = [
      [t('trip_number'), t('origin'), t('destination'), t('departure'), t('arrival'), t('vehicle'), t('driver'), t('price'), t('available_seats'), t('status')],
      ...trips.map(trip => [
        trip.tripNumber || t('na'),
        trip.origin?.stationName || t('na'),
        trip.destination?.stationName || t('na'),
        format(new Date(trip.departureTime), 'yyyy-MM-dd HH:mm'),
        format(new Date(trip.arrivalTime), 'yyyy-MM-dd HH:mm'),
        trip.vehicle?.plateNumber || t('na'),
        trip.driver?.fullName || t('na'),
        trip.price || 0,
        trip.availableSeats || 0,
        t(trip.tripStatus) || t('na')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trips-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSnackbar(t('trips_exported_successfully'), 'success');
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

  const getStatusStep = (status) => {
    switch(status) {
      case 'scheduled': return 0;
      case 'boarding': return 1;
      case 'ongoing': return 2;
      case 'completed': return 3;
      case 'cancelled': return 4;
      case 'delayed': return 5;
      default: return 0;
    }
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
          <Grid>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 2, color: 'primary.main' }} />
              {t('trip_schedules')}
              <Badge badgeContent={totalTrips} color="primary" sx={{ ml: 2 }}>
                <span></span>
              </Badge>
            </Typography>
            <Typography color="textSecondary" variant="subtitle1">
              {t('manage_and_monitor_trips')}
            </Typography>
          </Grid>
          <Grid sx={{ display: 'flex', gap: 2 }}>
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
                {t('new_trip')}
                {(vehicles.length === 0 || drivers.length === 0) && ` (${t('no_data')})`}
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
              {t('refresh_all')}
            </Button>
          </Grid>
        </Grid>
        
        {/* Data Status Indicator */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={t('stations_count', { count: stations.length })} 
            color={stations.length > 0 ? "success" : "error"} 
            size="small" 
          />
          <Chip 
            label={t('vehicles_count', { count: vehicles.length })} 
            color={vehicles.length > 0 ? "success" : "error"} 
            size="small" 
          />
          <Chip 
            label={t('drivers_count', { count: drivers.length })} 
            color={drivers.length > 0 ? "success" : "error"} 
            size="small" 
          />
          <Chip 
            label={t('trips_count', { count: totalTrips })} 
            color="primary" 
            size="small" 
          />
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {t('total_trips')}
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {t('active')}
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {t('today')}
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.today}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {t('upcoming')}
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.upcoming}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {t('completed')}
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {t('cancelled')}
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
            <Grid>
              <Typography variant="subtitle1">
                <strong>{selectedTrips.length}</strong> {t('trips_selected')}
              </Typography>
            </Grid>
            <Grid>
              <Button
                size="small"
                startIcon={<EventIcon />}
                onClick={() => handleBulkAction('activate')}
                sx={{ mr: 1 }}
              >
                {t('activate')}
              </Button>
              <Button
                size="small"
                startIcon={<EventBusyIcon />}
                onClick={() => handleBulkAction('deactivate')}
                sx={{ mr: 1 }}
                color="warning"
              >
                {t('deactivate')}
              </Button>
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => handleBulkAction('delete')}
                color="error"
              >
                {t('delete')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              {t('filters_and_search')}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('date_range')}</InputLabel>
              <Select
                value={filters.dateRange}
                label={t('date_range')}
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
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('start_date')}
                  InputLabelProps={{ shrink: true }}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('end_date')}
                  InputLabelProps={{ shrink: true }}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('status')}</InputLabel>
              <Select
                value={filters.status}
                label={t('status')}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">{t('all_status')}</MenuItem>
                <MenuItem value="scheduled">{t('scheduled')}</MenuItem>
                <MenuItem value="boarding">{t('boarding')}</MenuItem>
                <MenuItem value="ongoing">{t('ongoing')}</MenuItem>
                <MenuItem value="completed">{t('completed')}</MenuItem>
                <MenuItem value="cancelled">{t('cancelled')}</MenuItem>
                <MenuItem value="delayed">{t('delayed')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('origin_station')}</InputLabel>
              <Select
                value={filters.origin}
                label={t('origin_station')}
                onChange={(e) => handleFilterChange('origin', e.target.value)}
              >
                <MenuItem value="">{t('all_origins')}</MenuItem>
                {stations.map(station => (
                  <MenuItem key={station._id} value={station._id}>
                    {station.stationName} - {station.city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('destination')}</InputLabel>
              <Select
                value={filters.destination}
                label={t('destination')}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              >
                <MenuItem value="">{t('all_destinations')}</MenuItem>
                {stations.map(station => (
                  <MenuItem key={station._id} value={station._id}>
                    {station.stationName} - {station.city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Box>
              <Button
                onClick={clearFilters}
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
              >
                {t('clear_filters')}
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
                {t('export_csv')}
              </Button>
              <Button
                onClick={fetchTrips}
                variant="contained"
                size="small"
                startIcon={<SearchIcon />}
              >
                {t('apply_filters')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Sort Controls */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
              <SortIcon sx={{ mr: 1 }} />
              {t('sort_by')}:
            </Typography>
          </Grid>
          <Grid>
            <Button
              size="small"
              onClick={() => handleSort('departureTime')}
              endIcon={sortBy === 'departureTime' && (sortOrder === 'asc' ? '↑' : '↓')}
              variant={sortBy === 'departureTime' ? 'contained' : 'outlined'}
            >
              {t('departure_time')}
            </Button>
          </Grid>
          <Grid>
            <Button
              size="small"
              onClick={() => handleSort('price')}
              endIcon={sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              variant={sortBy === 'price' ? 'contained' : 'outlined'}
            >
              {t('price')}
            </Button>
          </Grid>
          <Grid>
            <Button
              size="small"
              onClick={() => handleSort('availableSeats')}
              endIcon={sortBy === 'availableSeats' && (sortOrder === 'asc' ? '↑' : '↓')}
              variant={sortBy === 'availableSeats' ? 'contained' : 'outlined'}
            >
              {t('available_seats')}
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
                  <TableCell>{t('trip_details')}</TableCell>
                  <TableCell>{t('schedule')}</TableCell>
                  <TableCell>{t('vehicle_and_driver')}</TableCell>
                  <TableCell>{t('seats')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                  <TableCell>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {loading ? t('loading') + '...' : t('no_trips_found')}
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
                            {trip.tripNumber || t('na')}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                              {trip.origin?.stationName || t('na')} → {trip.destination?.stationName || t('na')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="textSecondary">
                            {t('station')}: {trip.station?.stationName || t('na')}
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
                            {t('duration')}: {Math.floor((trip.estimatedDuration || 0) / 60)}h {(trip.estimatedDuration || 0) % 60}m
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            <BusIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {trip.vehicle?.plateNumber || t('na')} ({trip.vehicle?.carType || t('na')})
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {trip.driver?.fullName || t('na')}
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
                            label={t(trip.tripStatus) || t('na')}
                            color={statusColors[trip.tripStatus] || 'default'}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={trip.isActive ? t('active') : t('inactive')}
                            color={trip.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={t('view_details')}>
                            <IconButton 
                              size="small"
                              onClick={() => handleViewDetails(trip)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {(user?.role === 'station_admin' || user?.role === 'super_admin') && canEditDelete(trip) && (
                            <>
                              <Tooltip title={t('edit')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(trip)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('delete')}>
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
                            <Tooltip title={t('start_trip')}>
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
                            <Tooltip title={trip.isActive ? t('deactivate') : t('activate')}>
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
            <Grid key={trip._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
                      {trip.tripNumber || t('na')}
                    </Typography>
                    <Chip
                      icon={statusIcons[trip.tripStatus]}
                      label={t(trip.tripStatus) || t('na')}
                      color={statusColors[trip.tripStatus] || 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {t('route')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" fontWeight="medium">
                        {trip.origin?.stationName || t('na')} → {trip.destination?.stationName || t('na')}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid size={6}>
                      <Typography variant="caption" color="textSecondary">
                        {t('departure')}
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(trip.departureTime), 'PPp')}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="textSecondary">
                        {t('arrival')}
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(trip.arrivalTime), 'PPp')}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid size={6}>
                      <Typography variant="caption" color="textSecondary">
                        {t('vehicle')}
                      </Typography>
                      <Typography variant="body2">
                        {trip.vehicle?.plateNumber || t('na')}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="textSecondary">
                        {t('driver')}
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {trip.driver?.fullName || t('na')}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        {t('available_seats')}: {trip.availableSeats || 0}/{trip.totalSeats || 0}
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
                      label={trip.isActive ? t('active') : t('inactive')}
                      size="small"
                      color={trip.isActive ? 'success' : 'error'}
                    />
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                  <Tooltip title={t('view_details')}>
                    <IconButton 
                      size="small"
                      onClick={() => handleViewDetails(trip)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Box>
                    {canEditDelete(trip) && (
                      <>
                        <Tooltip title={t('edit')}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(trip)}
                            sx={{ mr: 0.5 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('delete')}>
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
          {selectedTrip ? t('edit_trip') : t('create_new_trip')}
          <Typography variant="caption" display="block" color="textSecondary">
            {selectedTrip 
              ? `${t('editing')}: ${selectedTrip.tripNumber || selectedTrip._id}` 
              : t('create_new_trip_schedule')}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingRelated ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>{t('origin_station')}</InputLabel>
                  <Select
                    name="origin"
                    value={tripForm.origin}
                    label={t('origin_station')}
                    onChange={handleInputChange}
                    disabled={stations.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {stations.length === 0 ? t('no_stations_available') : t('select_origin_station')}
                    </MenuItem>
                    {stations.map(station => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName} - {station.city}
                      </MenuItem>
                    ))}
                  </Select>
                  {stations.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {t('no_stations_found_add_first')}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>{t('destination_station')}</InputLabel>
                  <Select
                    name="destination"
                    value={tripForm.destination}
                    label={t('destination_station')}
                    onChange={handleInputChange}
                    disabled={stations.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {stations.length === 0 ? t('no_stations_available') : t('select_destination_station')}
                    </MenuItem>
                    {stations.map(station => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName} - {station.city}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="datetime-local"
                  name="departureTime"
                  label={t('departure_time')}
                  value={tripForm.departureTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="datetime-local"
                  name="arrivalTime"
                  label={t('arrival_time')}
                  value={tripForm.arrivalTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>{t('vehicle')}</InputLabel>
                  <Select
                    name="vehicle"
                    value={tripForm.vehicle}
                    label={t('vehicle')}
                    onChange={handleInputChange}
                    disabled={vehicles.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {vehicles.length === 0 ? t('no_vehicles_available') : t('select_vehicle')}
                    </MenuItem>
                    {vehicles.map(vehicle => (
                      <MenuItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNumber} - {vehicle.carType} ({vehicle.totalCapacity} {t('seats')})
                        {vehicle.driverID && ` - ${t('assigned')}: ${vehicle.driverID.fullName || t('driver')}`}
                        {vehicle.currentStatus && ` - ${t(vehicle.currentStatus)}`}
                      </MenuItem>
                    ))}
                  </Select>
                  {vehicles.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {t('no_vehicles_found_add_first')}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>{t('driver')}</InputLabel>
                  <Select
                    name="driver"
                    value={tripForm.driver}
                    label={t('driver')}
                    onChange={handleInputChange}
                    disabled={drivers.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {drivers.length === 0 ? t('no_drivers_available') : t('select_driver')}
                    </MenuItem>
                    {drivers.map(driver => (
                      <MenuItem key={driver._id} value={driver._id}>
                        {driver.fullName} ({driver.licenseNumber || t('no_license')})
                      </MenuItem>
                    ))}
                  </Select>
                  {drivers.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {t('no_drivers_found_add_first')}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="price"
                  label={`${t('price')} (ETB)`}
                  value={tripForm.price}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 1 } }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth 
                  required
                  type="number"
                  name="totalSeats"
                  label={t('total_seats')}
                  value={tripForm.totalSeats}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { 
                    min: 1, 
                    max: vehicles.find(v => v._id === tripForm.vehicle)?.totalCapacity || 100 
                  }}}
                  size="small"
                  helperText={tripForm.vehicle && vehicles.find(v => v._id === tripForm.vehicle)?.totalCapacity && 
                    `${t('vehicle_capacity')}: ${vehicles.find(v => v._id === tripForm.vehicle)?.totalCapacity} ${t('seats')}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="estimatedDuration"
                  label={t('estimated_duration_minutes')}
                  value={tripForm.estimatedDuration}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 15 } }}
                  size="small"
                  helperText={t('auto_calculated_from_times')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>{t('station')}</InputLabel>
                  <Select
                    name="station"
                    value={tripForm.station}
                    label={t('station')}
                    onChange={handleInputChange}
                    disabled={user?.role !== 'super_admin' || stations.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {stations.length === 0 ? t('no_stations_available') : t('select_station')}
                    </MenuItem>
                    {stations.map(station => (
                      <MenuItem key={station._id} value={station._id}>
                        {station.stationName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="notes"
                  label={t('notes')}
                  value={tripForm.notes}
                  onChange={handleInputChange}
                  placeholder={t('additional_trip_info')}
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={selectedTrip ? handleUpdateTrip : handleCreateTrip}
            startIcon={selectedTrip ? <EditIcon /> : <AddIcon />}
            disabled={loadingRelated || vehicles.length === 0 || drivers.length === 0 || stations.length === 0}
          >
            {selectedTrip ? t('update_trip') : t('create_trip')}
            {(vehicles.length === 0 || drivers.length === 0 || stations.length === 0) && ` (${t('missing_data')})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Trip Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        {viewedTrip && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {t('trip_details')}: {viewedTrip.tripNumber || t('na')}
                </Typography>
                <Chip 
                  label={t(viewedTrip.tripStatus) || t('na')}
                  color={statusColors[viewedTrip.tripStatus] || 'default'}
                  sx={{ color: 'white', fontWeight: 'bold' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {viewedTrip.origin?.stationName || t('na')} → {viewedTrip.destination?.stationName || t('na')}
              </Typography>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0 }}>
              {/* Quick Stats Bar */}
              <Box sx={{ 
                display: 'flex', 
                bgcolor: 'grey.50', 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider' 
              }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">{t('price')}</Typography>
                      <Typography variant="h6" color="primary">
                        ETB {viewedTrip.price || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">{t('seats')}</Typography>
                      <Typography variant="h6" color={getSeatColor(getAvailableSeatsPercentage(viewedTrip))}>
                        {viewedTrip.availableSeats || 0}/{viewedTrip.totalSeats || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">{t('duration')}</Typography>
                      <Typography variant="h6">
                        {Math.floor((viewedTrip.estimatedDuration || 0) / 60)}h {(viewedTrip.estimatedDuration || 0) % 60}m
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">{t('status')}</Typography>
                      <Chip
                        label={viewedTrip.isActive ? t('active') : t('inactive')}
                        color={viewedTrip.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Main Content */}
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Left Column - Trip Information */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Route Information */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <RouteIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {t('route_information')}
                      </Typography>
                      
                      <Timeline position="alternate">
                        <TimelineItem>
                          <TimelineOppositeContent color="textSecondary">
                            {format(new Date(viewedTrip.departureTime), 'PPp')}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color="primary">
                              <LocationIcon />
                            </TimelineDot>
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {t('origin')}
                            </Typography>
                            <Typography>
                              {viewedTrip.origin?.stationName || t('na')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {viewedTrip.origin?.city || ''}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                        
                        <TimelineItem>
                          <TimelineOppositeContent color="textSecondary">
                            {format(new Date(viewedTrip.arrivalTime), 'PPp')}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color="success">
                              <LocationIcon />
                            </TimelineDot>
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {t('destination')}
                            </Typography>
                            <Typography>
                              {viewedTrip.destination?.stationName || t('na')}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {viewedTrip.destination?.city || ''}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      </Timeline>
                    </Paper>

                    {/* Vehicle Information */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <DriveEtaIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {t('vehicle_details')}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <List dense>
                            <ListItem>
                              <ListItemIcon>
                                <BusIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={t('plate_number')} 
                                secondary={viewedTrip.vehicle?.plateNumber || t('na')} 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <InfoIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={t('type')} 
                                secondary={viewedTrip.vehicle?.carType || t('na')} 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <SpeedIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={t('capacity')} 
                                secondary={`${viewedTrip.totalSeats || 0} ${t('seats')}`} 
                              />
                            </ListItem>
                          </List>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          {viewedTrip.vehicle?.images && viewedTrip.vehicle.images.length > 0 && (
                            <Box sx={{ textAlign: 'center' }}>
                              <Avatar
                                src={viewedTrip.vehicle.images.find(img => img.isPrimary)?.url || viewedTrip.vehicle.images[0]?.url}
                                variant="rounded"
                                sx={{ width: 120, height: 80, margin: '0 auto', mb: 1 }}
                              />
                              <Typography variant="caption" color="textSecondary">
                                {t('vehicle_image')}
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Notes */}
                    {viewedTrip.notes && (
                      <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                          <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {t('additional_notes')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          {viewedTrip.notes}
                        </Typography>
                      </Paper>
                    )}
                  </Grid>

                  {/* Right Column - Driver & Additional Info */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    {/* Driver Information */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {t('driver_information')}
                      </Typography>
                      
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Avatar
                            src={viewedTrip.driver?.profileImage}
                            sx={{ width: 80, height: 80, margin: '0 auto' }}
                          >
                            {viewedTrip.driver?.fullName?.charAt(0) || 'D'}
                          </Avatar>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <List dense>
                            <ListItem>
                              <ListItemText 
                                primary={t('full_name')} 
                                secondary={viewedTrip.driver?.fullName || t('na')} 
                                primaryTypographyProps={{ fontWeight: 'bold' }}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <PhoneIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={t('phone')} 
                                secondary={viewedTrip.driver?.phoneNumber || t('na')} 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon>
                                <AccountCircleIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={t('license')} 
                                secondary={viewedTrip.driver?.licenseNumber || t('no_license')} 
                              />
                            </ListItem>
                          </List>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Station Information */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {t('station_information')}
                      </Typography>
                      
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary={t('station_name')} 
                            secondary={viewedTrip.station?.stationName || t('na')} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary={t('station_code')} 
                            secondary={viewedTrip.station?.stationCode || t('na')} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary={t('created_by')} 
                            secondary={viewedTrip.createdBy?.fullName || t('na')} 
                          />
                        </ListItem>
                      </List>
                    </Paper>

                    {/* Status Timeline */}
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelapseIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {t('trip_status_timeline')}
                      </Typography>
                      
                      <Stepper orientation="vertical" activeStep={getStatusStep(viewedTrip.tripStatus)}>
                        <Step>
                          <StepLabel>{t('scheduled')}</StepLabel>
                          <StepContent>
                            <Typography variant="caption">
                              {t('trip_scheduled_desc')}
                            </Typography>
                          </StepContent>
                        </Step>
                        <Step>
                          <StepLabel>{t('boarding')}</StepLabel>
                          <StepContent>
                            <Typography variant="caption">
                              {t('trip_boarding_desc')}
                            </Typography>
                          </StepContent>
                        </Step>
                        <Step>
                          <StepLabel>{t('ongoing')}</StepLabel>
                          <StepContent>
                            <Typography variant="caption">
                              {t('trip_ongoing_desc')}
                            </Typography>
                          </StepContent>
                        </Step>
                        <Step>
                          <StepLabel>{t('completed')}</StepLabel>
                          <StepContent>
                            <Typography variant="caption">
                              {t('trip_completed_desc')}
                            </Typography>
                          </StepContent>
                        </Step>
                      </Stepper>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseViewDialog} color="inherit">
                {t('close')}
              </Button>
              {(user?.role === 'station_admin' || user?.role === 'super_admin') && canEditDelete(viewedTrip) && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    handleCloseViewDialog();
                    handleOpenDialog(viewedTrip);
                  }}
                >
                  {t('edit_trip')}
                </Button>
              )}
            </DialogActions>
          </>
        )}
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