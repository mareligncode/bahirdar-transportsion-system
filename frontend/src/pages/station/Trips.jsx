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
  Menu,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Checkbox,
  ListItemSecondaryAction,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  EventAvailable as AvailableIcon,
  EventBusy as BusyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  AccessTime as TimeIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  Route as RouteIcon,
  Code as CodeIcon,
  LocationCity as CityIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import api from '../../services/api';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [anchorEl, setAnchorEl] = useState(null);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userStationId, setUserStationId] = useState('');
  const [stationName, setStationName] = useState('');

  // Form state for create/edit
  const [tripForm, setTripForm] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    vehicle: '',
    driver: '',
    price: '',
    totalSeats: '',
    station: '',
    estimatedDuration: '',
    notes: '',
    routePoints: []
  });

  const [formLoading, setFormLoading] = useState(false);

  // Trip stats
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    boarding: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    availableSeats: 0
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

  // Fetch trips and related data
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch trips based on user role
      let url = '/api/trip';
      const params = new URLSearchParams();
      
      // Station admin can only see their station's trips
      if (userRole === 'station_admin' && userStationId) {
        params.append('stationID', userStationId);
      }
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await api.get(url);
      const tripsData = response.data?.data || response.data?.trips || [];
      
      setTrips(tripsData);
      setFilteredTrips(tripsData);
      
      // Calculate statistics
      calculateStats(tripsData);

      // Fetch related data for forms
      await fetchRelatedData();

    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [userRole, userStationId]);

  const fetchRelatedData = async () => {
    try {
      // Get station admin's station
      if (userRole === 'station_admin' && userStationId) {
        const stationResponse = await api.get(`/api/station/${userStationId}`);
        const stationData = stationResponse.data?.station;
        if (stationData) {
          setStations([stationData]);
          setStationName(stationData.stationName);
        }
      } else if (userRole === 'super_admin') {
        // Super admin can see all active stations
        const stationsResponse = await api.get('/api/station/active');
        setStations(stationsResponse.data?.stations || []);
      }

      // Fetch available vehicles (filter by station for station admin)
      let vehiclesUrl = '/api/vehicles';
      if (userRole === 'station_admin' && userStationId) {
        vehiclesUrl += `?stationID=${userStationId}`;
      }
      const vehiclesResponse = await api.get(vehiclesUrl);
      const vehiclesData = vehiclesResponse.data?.data?.vehicles || [];
      
      // Filter vehicles by availability (currentStatus: 'available' or 'active')
      const availableVehicles = vehiclesData.filter(vehicle => 
        ['available', 'active'].includes(vehicle.currentStatus)
      );
      setVehicles(availableVehicles);

      // Fetch drivers (filter by station for station admin)
      let driversUrl = '/api/auth/station-users';
      if (userRole === 'station_admin') {
        driversUrl = '/api/auth/station-users';
      } else {
        driversUrl = '/api/auth/all-users';
      }
      
      const driversResponse = await api.get(driversUrl);
      let driversData = [];
      
      // Handle different response structures
      if (driversResponse.data?.success) {
        driversData = driversResponse.data.data?.users || [];
      } else if (Array.isArray(driversResponse.data)) {
        driversData = driversResponse.data;
      } else if (driversResponse.data?.data?.users) {
        driversData = driversResponse.data.data.users;
      } else if (driversResponse.data?.users) {
        driversData = driversResponse.data.users;
      }
      
      // Filter for active drivers only
      const activeDrivers = driversData.filter(driver => 
        driver.role === 'driver' && 
        driver.isActive === true &&
        (userRole !== 'station_admin' || driver.stationID === userStationId)
      );
      setDrivers(activeDrivers);

    } catch (err) {
      console.error('Error fetching related data:', err);
      setError('Failed to load related data');
    }
  };

  const calculateStats = (tripsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: tripsData.length,
      scheduled: tripsData.filter(t => t.tripStatus === 'scheduled').length,
      boarding: tripsData.filter(t => t.tripStatus === 'boarding').length,
      ongoing: tripsData.filter(t => t.tripStatus === 'ongoing').length,
      completed: tripsData.filter(t => t.tripStatus === 'completed').length,
      cancelled: tripsData.filter(t => t.tripStatus === 'cancelled').length,
      today: tripsData.filter(t => {
        const tripDate = new Date(t.departureTime);
        return tripDate >= today && tripDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }).length,
      availableSeats: tripsData.reduce((sum, trip) => sum + (trip.availableSeats || 0), 0)
    };
    setStats(stats);
  };

  useEffect(() => {
    if (userRole) {
      fetchTrips();
    }
  }, [fetchTrips, userRole]);

  // Filter trips based on search and filters
  useEffect(() => {
    let filtered = trips;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.origin?.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination?.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driver?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.vehicle?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.tripStatus === statusFilter);
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.departureTime);
        return tripDate >= today && tripDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });
    } else if (dateFilter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.departureTime);
        return tripDate >= today && trip.tripStatus === 'scheduled';
      });
    } else if (dateFilter === 'past') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.departureTime);
        return tripDate < today;
      });
    }

    setFilteredTrips(filtered);
    setPage(0);
  }, [trips, searchTerm, statusFilter, dateFilter]);

  // Dialog handlers
  const handleOpenCreateDialog = () => {
    // Default form with user's station for station admin
    const defaultForm = {
      origin: '',
      destination: '',
      departureTime: '',
      arrivalTime: '',
      vehicle: '',
      driver: '',
      price: '',
      totalSeats: '',
      station: userStationId || '',
      estimatedDuration: '',
      notes: '',
      routePoints: []
    };
    
    // If station admin has only one station, pre-fill origin/destination
    if (userRole === 'station_admin' && stations.length === 1) {
      defaultForm.station = stations[0]._id;
    }
    
    setTripForm(defaultForm);
    setOpenCreateDialog(true);
  };

  const handleOpenEditDialog = (trip) => {
    setSelectedTrip(trip);
    setTripForm({
      origin: trip.origin?._id || trip.origin || '',
      destination: trip.destination?._id || trip.destination || '',
      departureTime: new Date(trip.departureTime).toISOString().slice(0, 16),
      arrivalTime: new Date(trip.arrivalTime).toISOString().slice(0, 16),
      vehicle: trip.vehicle?._id || trip.vehicle || '',
      driver: trip.driver?._id || trip.driver || '',
      price: trip.price,
      totalSeats: trip.totalSeats,
      station: trip.station?._id || trip.station || userStationId || '',
      estimatedDuration: trip.estimatedDuration,
      notes: trip.notes || '',
      routePoints: trip.routePoints || []
    });
    setOpenEditDialog(true);
  };

  const handleOpenDetailModal = (trip) => {
    setSelectedTrip(trip);
    setOpenDetailModal(true);
  };

  const handleOpenDeleteDialog = (trip) => {
    setSelectedTrip(trip);
    setOpenDeleteDialog(true);
  };

  const handleMenuClick = (event, trip) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrip(trip);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCloseAllDialogs = () => {
    setOpenCreateDialog(false);
    setOpenEditDialog(false);
    setOpenDetailModal(false);
    setOpenStatusDialog(false);
    setOpenDeleteDialog(false);
    setSelectedTrip(null);
    setAnchorEl(null);
    setError('');
    setFormLoading(false);
  };

  // API Actions
  const handleCreateTrip = async () => {
    try {
      // Validate required fields
      const requiredFields = ['origin', 'destination', 'departureTime', 'arrivalTime', 
                             'vehicle', 'driver', 'price', 'totalSeats', 'station'];
      const missingFields = requiredFields.filter(field => !tripForm[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate station for station admins
      if (userRole === 'station_admin' && tripForm.station !== userStationId) {
        setError('You can only create trips for your assigned station');
        return;
      }

      setFormLoading(true);
      
      // Prepare payload according to backend (field names must match backend)
      const payload = {
        origin: tripForm.origin,
        destination: tripForm.destination,
        departureTime: new Date(tripForm.departureTime).toISOString(),
        arrivalTime: new Date(tripForm.arrivalTime).toISOString(),
        vehicleID: tripForm.vehicle,  // Backend expects vehicleID
        driverID: tripForm.driver,    // Backend expects driverID
        price: parseFloat(tripForm.price),
        totalSeats: parseInt(tripForm.totalSeats),
        stationID: tripForm.station,  // Backend expects stationID
        estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : 0,
        notes: tripForm.notes || '',
        routePoints: tripForm.routePoints || []
      };

      const response = await api.post('/api/trip', payload);

      if (response.data?.success || response.data?.trip) {
        setSuccess('Trip created successfully');
        fetchTrips();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to create trip');
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 
               err.response?.data?.error || 
               err.message || 
               'Failed to create trip');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTrip = async () => {
    try {
      if (!selectedTrip) return;

      setFormLoading(true);
      
      // Prepare payload
      const payload = {
        origin: tripForm.origin,
        destination: tripForm.destination,
        departureTime: new Date(tripForm.departureTime).toISOString(),
        arrivalTime: new Date(tripForm.arrivalTime).toISOString(),
        vehicle: tripForm.vehicle,
        driver: tripForm.driver,
        price: parseFloat(tripForm.price),
        totalSeats: parseInt(tripForm.totalSeats),
        station: tripForm.station,
        estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : 0,
        notes: tripForm.notes || '',
        routePoints: tripForm.routePoints || []
      };

      const response = await api.put(`/api/trip/${selectedTrip._id}`, payload);

      if (response.data?.success || response.data?.trip) {
        setSuccess('Trip updated successfully');
        fetchTrips();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to update trip');
      }
    } catch (err) {
      console.error('Error updating trip:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update trip');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    try {
      setFormLoading(true);
      const response = await api.delete(`/api/trip/${selectedTrip._id}`);

      if (response.data?.success) {
        setSuccess('Trip deleted successfully');
        fetchTrips();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to delete trip');
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete trip');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setFormLoading(true);
      const response = await api.patch(`/api/trip/${selectedTrip._id}/status`, {
        status: newStatus
      });

      if (response.data?.success) {
        setSuccess(`Trip status updated to ${newStatus}`);
        fetchTrips();
        handleMenuClose();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to update trip status');
      }
    } catch (err) {
      console.error('Error updating trip status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update trip status');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setFormLoading(true);
      const response = await api.patch(`/api/trip/${selectedTrip._id}/toggle-active`);

      if (response.data?.success) {
        setSuccess(`Trip ${selectedTrip.isActive ? 'deactivated' : 'activated'}`);
        fetchTrips();
        handleMenuClose();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to toggle trip status');
      }
    } catch (err) {
      console.error('Error toggling trip active status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to toggle trip status');
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
    setDateFilter('all');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'boarding': return 'info';
      case 'ongoing': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'delayed': return 'warning';
      default: return 'default';
    }
  };

  const getActiveColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination
  const paginatedTrips = filteredTrips.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const canManageTrips = () => {
    return ['station_admin', 'super_admin'].includes(userRole);
  };

  if (loading && trips.length === 0) {
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              <ScheduleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Trip Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {userRole === 'station_admin' 
                ? `Manage trips for ${stationName || 'your station'}` 
                : 'Schedule and manage all trips'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiToggleButton-root': {
                  color: 'white',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)'
                  }
                }
              }}
            >
              <ToggleButton value="list">
                List View
              </ToggleButton>
              <ToggleButton value="calendar">
                Calendar View
              </ToggleButton>
            </ToggleButtonGroup>
            {canManageTrips() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                disabled={!userStationId && stations.length === 0}
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.3)' }
                }}
              >
                New Trip
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            icon: <ScheduleIcon />,
            title: 'Total Trips',
            value: stats.total,
            color: '#3f51b5',
            bgColor: '#e8eaf6'
          },
          {
            icon: <TimeIcon />,
            title: "Today's Trips",
            value: stats.today,
            color: '#2196f3',
            bgColor: '#e3f2fd'
          },
          {
            icon: <CheckCircleIcon />,
            title: 'Scheduled',
            value: stats.scheduled,
            color: '#4caf50',
            bgColor: '#e8f5e9'
          },
          {
            icon: <ArrowForwardIcon />,
            title: 'Ongoing',
            value: stats.ongoing,
            color: '#ff9800',
            bgColor: '#fff3e0'
          },
          {
            icon: <TrendingUpIcon />,
            title: 'Available Seats',
            value: stats.availableSeats,
            color: '#9c27b0',
            bgColor: '#f3e5f5'
          }
        ].map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={index}>
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
          Filter Trips
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search trips by trip number, station, or driver..."
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
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
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
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Filter</InputLabel>
              <Select
                value={dateFilter}
                label="Date Filter"
                onChange={(e) => setDateFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Dates</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="past">Past Trips</MenuItem>
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
                onClick={fetchTrips}
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

      {/* Trips Table */}
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
            <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
            Trips List ({filteredTrips.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Trip Details</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Schedule</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Vehicle & Driver</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Seats & Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <ScheduleIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No trips found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm 
                          ? 'Try changing your search term' 
                          : trips.length === 0 
                            ? canManageTrips() 
                              ? 'No trips scheduled yet' 
                              : 'No trips available'
                            : 'No trips match the selected filter'
                        }
                      </Typography>
                      {trips.length === 0 && canManageTrips() && (
                        <Button 
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreateDialog}
                          sx={{ mt: 2 }}
                        >
                          Create Your First Trip
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrips.map((trip) => (
                  <TableRow 
                    key={trip._id} 
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: '#f8f9fa' },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CodeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight="bold">
                            {trip.tripNumber || 'TRIP-' + trip._id.slice(-6).toUpperCase()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip
                            label={trip.isActive ? 'Active' : 'Inactive'}
                            color={getActiveColor(trip.isActive)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {trip.origin?.stationName || 'Unknown'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <ArrowForwardIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {trip.destination?.stationName || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(trip.departureTime)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}
                        </Typography>
                        {trip.estimatedDuration && (
                          <Typography variant="caption" color="text.secondary">
                            {trip.estimatedDuration} min
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <CarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {trip.vehicle?.plateNumber || 'No vehicle'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {trip.driver?.fullName || 'No driver'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <AvailableIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {trip.availableSeats}/{trip.totalSeats} seats
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MoneyIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="medium">
                            ETB {trip.price}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.tripStatus?.toUpperCase()}
                        color={getStatusColor(trip.tripStatus)}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          borderRadius: 1
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDetailModal(trip)}
                              sx={{ 
                                bgcolor: '#e3f2fd',
                                '&:hover': { bgcolor: '#bbdefb' }
                              }}
                            >
                              <VisibilityIcon fontSize="small" color="primary" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        {canManageTrips() && (
                          <>
                            <Tooltip title="Edit Trip">
                              <span>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleOpenEditDialog(trip)}
                                  sx={{ 
                                    bgcolor: '#e8f5e9',
                                    '&:hover': { bgcolor: '#c8e6c9' }
                                  }}
                                >
                                  <EditIcon fontSize="small" color="success" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="More Actions">
                              <span>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleMenuClick(e, trip)}
                                  sx={{ 
                                    bgcolor: '#fff3e0',
                                    '&:hover': { bgcolor: '#ffe0b2' }
                                  }}
                                >
                                  <MoreVertIcon fontSize="small" color="warning" />
                                </IconButton>
                              </span>
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
        {paginatedTrips.length > 0 && (
          <TablePagination
            component="div"
            count={filteredTrips.length}
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

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 180 }
        }}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          handleOpenEditDialog(selectedTrip);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit Trip</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleToggleActive();
        }}>
          <ListItemIcon>
            {selectedTrip?.isActive ? 
              <CancelIcon fontSize="small" color="warning" /> : 
              <CheckCircleIcon fontSize="small" color="success" />
            }
          </ListItemIcon>
          <ListItemText>
            {selectedTrip?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleUpdateStatus('boarding');
        }}>
          <ListItemIcon>
            <ScheduleIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Mark as Boarding</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleUpdateStatus('ongoing');
        }}>
          <ListItemIcon>
            <ArrowForwardIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Mark as Ongoing</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleUpdateStatus('completed');
        }}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Mark as Completed</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleOpenDeleteDialog(selectedTrip);
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Trip</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Trip Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseAllDialogs} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }}>
          <Box display="flex" alignItems="center">
            <AddIcon sx={{ mr: 1 }} />
            <Typography fontWeight="bold">Create New Trip</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          
          {userRole === 'station_admin' && userStationId && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                Trip will be created for your station: <strong>{stationName || 'Your Station'}</strong>
              </Typography>
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required size="small">
                <InputLabel>Origin Station *</InputLabel>
                <Select
                  value={tripForm.origin}
                  label="Origin Station *"
                  onChange={(e) => setTripForm({...tripForm, origin: e.target.value})}
                  disabled={formLoading}
                >
                  <MenuItem value="">
                    <Typography color="text.secondary" fontStyle="italic">
                      Select origin station
                    </Typography>
                  </MenuItem>
                  {stations.map((station) => (
                    <MenuItem key={station._id} value={station._id}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {station.stationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {station.city} • {station.stationCode}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required size="small">
                <InputLabel>Destination Station *</InputLabel>
                <Select
                  value={tripForm.destination}
                  label="Destination Station *"
                  onChange={(e) => setTripForm({...tripForm, destination: e.target.value})}
                  disabled={formLoading}
                >
                  <MenuItem value="">
                    <Typography color="text.secondary" fontStyle="italic">
                      Select destination station
                    </Typography>
                  </MenuItem>
                  {stations.map((station) => (
                    <MenuItem key={station._id} value={station._id}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {station.stationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {station.city} • {station.stationCode}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Departure Date & Time *"
                type="datetime-local"
                value={tripForm.departureTime}
                onChange={(e) => setTripForm({...tripForm, departureTime: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Arrival Date & Time *"
                type="datetime-local"
                value={tripForm.arrivalTime}
                onChange={(e) => setTripForm({...tripForm, arrivalTime: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required size="small">
                <InputLabel>Vehicle *</InputLabel>
                <Select
                  value={tripForm.vehicle}
                  label="Vehicle *"
                  onChange={(e) => setTripForm({...tripForm, vehicle: e.target.value})}
                  disabled={formLoading}
                >
                  <MenuItem value="">
                    <Typography color="text.secondary" fontStyle="italic">
                      Select vehicle
                    </Typography>
                  </MenuItem>
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle._id} value={vehicle._id}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {vehicle.plateNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.carType} • {vehicle.totalCapacity} seats • {vehicle.currentStatus}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required size="small">
                <InputLabel>Driver *</InputLabel>
                <Select
                  value={tripForm.driver}
                  label="Driver *"
                  onChange={(e) => setTripForm({...tripForm, driver: e.target.value})}
                  disabled={formLoading}
                >
                  <MenuItem value="">
                    <Typography color="text.secondary" fontStyle="italic">
                      Select driver
                    </Typography>
                  </MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver._id} value={driver._id}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {driver.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {driver.phoneNumber} • {driver.licenseNumber || 'No license'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Price (ETB) *"
                type="number"
                value={tripForm.price}
                onChange={(e) => setTripForm({...tripForm, price: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                inputProps={{ min: 1 }}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Total Seats *"
                type="number"
                value={tripForm.totalSeats}
                onChange={(e) => setTripForm({...tripForm, totalSeats: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                inputProps={{ min: 1 }}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes) *"
                type="number"
                value={tripForm.estimatedDuration}
                onChange={(e) => setTripForm({...tripForm, estimatedDuration: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                inputProps={{ min: 15 }}
                size="small"
                helperText="Minimum 15 minutes"
              />
            </Grid>
            
            {userRole === 'super_admin' && stations.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth margin="normal" required size="small">
                  <InputLabel>Station *</InputLabel>
                  <Select
                    value={tripForm.station}
                    label="Station *"
                    onChange={(e) => setTripForm({...tripForm, station: e.target.value})}
                    disabled={formLoading}
                  >
                    <MenuItem value="">
                      <Typography color="text.secondary" fontStyle="italic">
                        Select station
                      </Typography>
                    </MenuItem>
                    {stations.map((station) => (
                      <MenuItem key={station._id} value={station._id}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {station.stationName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {station.city} • {station.stationCode}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Route Points (comma separated)"
                value={tripForm.routePoints.join(', ')}
                onChange={(e) => setTripForm({...tripForm, routePoints: e.target.value.split(',').map(point => point.trim()).filter(point => point !== '')})}
                margin="normal"
                disabled={formLoading}
                helperText="Optional intermediate stops"
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                value={tripForm.notes}
                onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                margin="normal"
                disabled={formLoading}
                multiline
                rows={2}
                size="small"
              />
            </Grid>
          </Grid>
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
            onClick={handleCreateTrip}
            variant="contained"
            color="primary"
            disabled={formLoading || (!userStationId && stations.length === 0)}
            startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {formLoading ? 'Creating...' : 'Create Trip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trip Detail Modal - (Keep existing modal code, just fix field names if needed) */}
      {/* Delete Confirmation Dialog - (Keep existing code) */}

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

export default Trips;