import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Autocomplete,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  EventBusy as EventBusyIcon,
  LocationOn as LocationIcon,
  DirectionsBus as DirectionsBusIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ContactPhone as ContactPhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Station = () => {
  const navigate = useNavigate();
  
  // State management
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allStations, setAllStations] = useState([]);
  const [stationManagers, setStationManagers] = useState([]); // Store potential managers
  
  // Dialog states
  const [addVehicleDialog, setAddVehicleDialog] = useState(false);
  const [addTripDialog, setAddTripDialog] = useState(false);
  const [assignDriverDialog, setAssignDriverDialog] = useState(false);
  const [userDetailsDialog, setUserDetailsDialog] = useState(false);
  const [editStationDialog, setEditStationDialog] = useState(false);
  const [createStationDialog, setCreateStationDialog] = useState(false);
  const [assignManagerDialog, setAssignManagerDialog] = useState(false);
  
  // Form states
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    carType: 'coaster',
    totalCapacity: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: 'white',
    fuelType: 'diesel',
    insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const [newTrip, setNewTrip] = useState({
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    vehicle: '',
    driver: '',
    price: '',
    totalSeats: '',
    estimatedDuration: '',
    station: ''
  });
  
  const [stationEditData, setStationEditData] = useState({
    stationName: '',
    location: '',
    contactPhone: '',
    contactEmail: '',
    manager: ''
  });
  
  const [newStationData, setNewStationData] = useState({
    stationCode: '',
    stationName: '',
    location: '',
    city: '',
    contactPhone: '',
    contactEmail: '',
    manager: ''
  });
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignData, setAssignData] = useState({
    passengerId: '',
    licenseNumber: '',
    stationID: ''
  });
  
  const [assignManagerData, setAssignManagerData] = useState({
    stationId: '',
    managerId: ''
  });
  
  // Filter states
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');
  const [tripStatusFilter, setTripStatusFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('active');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDrivers: 0,
    activeVehicles: 0,
    upcomingTrips: 0,
    todaysBookings: 0,
    totalRevenue: 0
  });

  // Fetch station data
  const fetchStationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user profile
      const profileRes = await api.get('/api/auth/profile');
      const userData = profileRes.data.data.user;
      
      console.log('Station admin user data:', userData);
      
      // Check if user is station admin or super admin
      if (!['station_admin', 'super_admin'].includes(userData.role)) {
        setError('Access denied. This page is for station administrators only.');
        setLoading(false);
        navigate('/dashboard');
        return;
      }
      
      // Fetch all stations
      const stationsRes = await api.get('/api/station');
      const stations = stationsRes.data.stations || [];
      setAllStations(stations);
      
      // If super admin, show all stations management
      if (userData.role === 'super_admin') {
        // Super admin can manage all stations
        if (stations.length > 0) {
          // For now, show the first station or let them select one
          // You might want to add station selection for super admin
          setStation(stations[0]);
          setStationEditData({
            stationName: stations[0].stationName,
            location: stations[0].location,
            contactPhone: stations[0].contactPhone,
            contactEmail: stations[0].contactEmail,
            manager: stations[0].manager?._id || ''
          });
          
          // Fetch data for this station
          await Promise.all([
            fetchStationUsers(stations[0]._id),
            fetchStationVehicles(stations[0]._id),
            fetchStationTrips(),
            fetchTodaysBookings()
          ]);
        } else {
          setError('No stations found. Please create a station first.');
          setLoading(false);
          return;
        }
      } 
      // If station admin, find their station
      else if (userData.role === 'station_admin') {
        if (!userData.stationID) {
          setError('No station assigned to this admin. Please contact super admin.');
          setLoading(false);
          return;
        }
        
        // Find station by stationCode or _id
        let userStation = stations.find(s => 
          s.stationCode === userData.stationID || 
          s._id === userData.stationID ||
          (s.manager && s.manager._id === userData._id)
        );
        
        if (!userStation) {
          setError(`Station not found. Please contact super admin. Your station ID: ${userData.stationID}`);
          setLoading(false);
          return;
        }
        
        console.log('Found station:', userStation);
        setStation(userStation);
        setStationEditData({
          stationName: userStation.stationName,
          location: userStation.location,
          contactPhone: userStation.contactPhone,
          contactEmail: userStation.contactEmail,
          manager: userStation.manager?._id || ''
        });
        
        // Fetch data for this station
        await Promise.all([
          fetchStationUsers(userStation._id),
          fetchStationVehicles(userStation._id),
          fetchStationTrips(),
          fetchTodaysBookings()
        ]);
      }
      
      // Fetch potential managers (station admins)
      await fetchPotentialManagers();
      
    } catch (err) {
      console.error('Error fetching station data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load station data');
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to access this page.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch potential managers (station admins without stations)
  const fetchPotentialManagers = async () => {
    try {
      const res = await api.get('/api/auth/all-users');
      const allUsers = res.data.data?.users || [];
      
      // Filter users who are station_admins
      const stationAdmins = allUsers.filter(user => 
        user.role === 'station_admin'
      );
      
      setStationManagers(stationAdmins);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setStationManagers([]);
    }
  };

  // Fetch station users - updated to filter by station
  const fetchStationUsers = async (stationId) => {
    try {
      let usersData = [];
      
      // For station admin, use their specific endpoint
      const res = await api.get('/api/auth/station-users');
      usersData = res.data.data?.users || [];
      
      // Filter by station if needed
      if (stationId) {
        usersData = usersData.filter(user => 
          user.stationID === stationId || 
          !user.stationID // Passengers don't have stationID
        );
      }
      
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  // Fetch station vehicles - updated to filter by station
  const fetchStationVehicles = async (stationId) => {
    try {
      const res = await api.get('/api/vehicles');
      let vehiclesData = res.data.data?.vehicles || [];
      
      // Filter by station if provided
      if (stationId) {
        vehiclesData = vehiclesData.filter(vehicle => 
          vehicle.stationID?._id === stationId
        );
      }
      
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setVehicles([]);
    }
  };

  // Fetch station trips
  const fetchStationTrips = async () => {
    try {
      const res = await api.get('/api/trip');
      let tripsData = res.data.data || [];
      
      // Filter by current station
      if (station) {
        tripsData = tripsData.filter(trip => 
          trip.station?._id === station._id ||
          trip.origin?._id === station._id
        );
      }
      
      setTrips(tripsData);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setTrips([]);
    }
  };

  // Fetch today's bookings
  const fetchTodaysBookings = async () => {
    try {
      const res = await api.get('/api/booking');
      let bookingsData = res.data.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      
      // Filter by station and today's date
      if (station) {
        bookingsData = bookingsData.filter(b => {
          const isToday = new Date(b.bookingDate).toISOString().split('T')[0] === today;
          const belongsToStation = b.tripID?.station?._id === station._id;
          return isToday && belongsToStation;
        });
      } else {
        bookingsData = bookingsData.filter(b => 
          new Date(b.bookingDate).toISOString().split('T')[0] === today
        );
      }
      
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookings([]);
    }
  };

  // Calculate statistics
  useEffect(() => {
    const calculateStats = () => {
      const today = new Date().toISOString().split('T')[0];
      
      const totalUsers = users.length;
      const activeDrivers = users.filter(u => u.role === 'driver' && u.isActive).length;
      const activeVehicles = vehicles.filter(v => 
        v.currentStatus === 'active' || v.currentStatus === 'available'
      ).length;
      
      const upcomingTrips = trips.filter(t => 
        new Date(t.departureTime) > new Date() && 
        (t.tripStatus === 'scheduled' || t.tripStatus === 'boarding')
      ).length;
      
      const todaysBookings = bookings.filter(b => 
        new Date(b.bookingDate).toISOString().split('T')[0] === today &&
        (b.status === 'confirmed' || b.status === 'completed')
      ).length;
      
      const totalRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, booking) => sum + (booking.tripID?.price || 0), 0);
      
      setStats({
        totalUsers,
        activeDrivers,
        activeVehicles,
        upcomingTrips,
        todaysBookings,
        totalRevenue
      });
    };
    
    if (station) {
      calculateStats();
    }
  }, [users, vehicles, trips, bookings, station]);

  // Handle add vehicle
  const handleAddVehicle = async () => {
    try {
      if (!station?._id) {
        setError('No station selected. Cannot add vehicle.');
        return;
      }
      
      const payload = {
        ...newVehicle,
        stationID: station._id,
        totalCapacity: parseInt(newVehicle.totalCapacity),
        year: parseInt(newVehicle.year)
      };
      
      const res = await api.post('/api/vehicles/register', payload);
      
      setSuccess('Vehicle added successfully');
      setAddVehicleDialog(false);
      setNewVehicle({
        plateNumber: '',
        carType: 'coaster',
        totalCapacity: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: 'white',
        fuelType: 'diesel',
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      fetchStationVehicles(station._id);
    } catch (err) {
      console.error('Add vehicle error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to add vehicle');
    }
  };

  // Handle add trip
  const handleAddTrip = async () => {
    try {
      if (!station?._id) {
        setError('No station selected. Cannot create trip.');
        return;
      }
      
      const payload = {
        origin: station._id,
        destination: newTrip.destination,
        departureTime: new Date(newTrip.departureTime).toISOString(),
        arrivalTime: new Date(newTrip.arrivalTime).toISOString(),
        vehicle: newTrip.vehicle,
        driver: newTrip.driver,
        price: parseFloat(newTrip.price),
        totalSeats: parseInt(newTrip.totalSeats),
        estimatedDuration: parseInt(newTrip.estimatedDuration),
        station: station._id,
        availableSeats: parseInt(newTrip.totalSeats)
      };
      
      const res = await api.post('/api/trip', payload);
      
      setSuccess('Trip created successfully');
      setAddTripDialog(false);
      setNewTrip({
        origin: '',
        destination: '',
        departureTime: '',
        arrivalTime: '',
        vehicle: '',
        driver: '',
        price: '',
        totalSeats: '',
        estimatedDuration: '',
        station: ''
      });
      
      fetchStationTrips();
    } catch (err) {
      console.error('Add trip error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create trip');
    }
  };

  // Handle assign driver
  const handleAssignDriver = async () => {
    try {
      if (!station?._id) {
        setError('No station selected. Cannot assign driver.');
        return;
      }
      
      const payload = {
        passengerId: assignData.passengerId,
        licenseNumber: assignData.licenseNumber,
        stationID: station._id
      };
      
      const res = await api.post('/api/auth/assign-driver', payload);
      
      setSuccess('Driver assigned successfully');
      setAssignDriverDialog(false);
      setAssignData({
        passengerId: '',
        licenseNumber: '',
        stationID: ''
      });
      
      fetchStationUsers(station._id);
    } catch (err) {
      console.error('Assign driver error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to assign driver');
    }
  };

  // Handle assign manager to station
  const handleAssignManager = async () => {
    try {
      const payload = {
        stationId: assignManagerData.stationId,
        managerId: assignManagerData.managerId
      };
      
      // Update station with manager
      const res = await api.put(`/api/station/${assignManagerData.stationId}`, {
        manager: assignManagerData.managerId
      });
      
      setSuccess('Manager assigned successfully');
      setAssignManagerDialog(false);
      setAssignManagerData({
        stationId: '',
        managerId: ''
      });
      
      // Refresh data
      fetchStationData();
    } catch (err) {
      console.error('Assign manager error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to assign manager');
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.post('/api/auth/toggle-status', { userId });
      
      setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchStationUsers(station?._id);
    } catch (err) {
      console.error('Toggle status error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  // Handle update station
  const handleUpdateStation = async () => {
    try {
      if (!station?._id) {
        setError('No station to update');
        return;
      }
      
      const res = await api.put(`/api/station/${station._id}`, stationEditData);
      
      setSuccess('Station updated successfully');
      setEditStationDialog(false);
      fetchStationData();
    } catch (err) {
      console.error('Update station error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update station');
    }
  };

  // Handle create new station
  const handleCreateStation = async () => {
    try {
      const res = await api.post('/api/station/register', newStationData);
      
      setSuccess('Station created successfully');
      setCreateStationDialog(false);
      setNewStationData({
        stationCode: '',
        stationName: '',
        location: '',
        city: '',
        contactPhone: '',
        contactEmail: '',
        manager: ''
      });
      
      // Refresh station data
      fetchStationData();
    } catch (err) {
      console.error('Create station error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create station');
    }
  };

  // Handle vehicle status change
  const handleVehicleStatusChange = async (vehicleId, newStatus) => {
    try {
      await api.post(`/api/vehicles/${vehicleId}/status`, { status: newStatus });
      
      setSuccess(`Vehicle status updated to ${newStatus}`);
      fetchStationVehicles(station?._id);
    } catch (err) {
      console.error('Vehicle status error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update vehicle status');
    }
  };

  // Handle trip status change
  const handleTripStatusChange = async (tripId, newStatus) => {
    try {
      await api.patch(`/api/trip/${tripId}/status`, { status: newStatus });
      
      setSuccess(`Trip status updated to ${newStatus}`);
      fetchStationTrips();
    } catch (err) {
      console.error('Trip status error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update trip status');
    }
  };

  // Handle toggle trip active
  const handleToggleTripActive = async (tripId, currentStatus) => {
    try {
      await api.patch(`/api/trip/${tripId}/toggle-active`);
      
      setSuccess(`Trip ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchStationTrips();
    } catch (err) {
      console.error('Toggle trip error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update trip status');
    }
  };

  // Filter functions
  const filteredVehicles = vehicles.filter(vehicle => {
    if (vehicleStatusFilter === 'all') return true;
    return vehicle.currentStatus === vehicleStatusFilter;
  });

  const filteredTrips = trips.filter(trip => {
    if (tripStatusFilter === 'all') return true;
    return trip.tripStatus === tripStatusFilter;
  });

  const filteredUsers = users.filter(user => {
    if (userRoleFilter !== 'all' && user.role !== userRoleFilter) return false;
    if (userStatusFilter !== 'all') {
      return userStatusFilter === 'active' ? user.isActive : !user.isActive;
    }
    return true;
  });

  // Get available vehicles for trip creation
  const availableVehicles = vehicles.filter(v => 
    v.currentStatus === 'available' || v.currentStatus === 'active'
  );

  // Get available drivers for trip creation
  const availableDrivers = users.filter(u => 
    u.role === 'driver' && u.isActive
  );

  // Initialize
  useEffect(() => {
    fetchStationData();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !station) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant="contained" onClick={fetchStationData} startIcon={<RefreshIcon />}>
            Retry
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setCreateStationDialog(true)}
            startIcon={<AddIcon />}
          >
            Create Station
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')} 
          >
            Go to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Success/Error Snackbars */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid>
            <Typography variant="h4" gutterBottom>
              {station?.stationName} Station
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              {station?.location} | {station?.city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Code: {station?.stationCode} | Phone: {station?.contactPhone} | Email: {station?.contactEmail}
            </Typography>
            
            {/* Manager Information */}
            {station?.manager && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'primary.light', borderRadius: 1, display: 'inline-flex', alignItems: 'center' }}>
                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Manager: {station.manager.fullName} | {station.manager.email}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditStationDialog(true)}
              sx={{ mr: 2 }}
            >
              Edit Station
            </Button>
            {station && (
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setAssignManagerData({
                    stationId: station._id,
                    managerId: station.manager?._id || ''
                  });
                  setAssignManagerDialog(true);
                }}
                sx={{ mr: 2 }}
              >
                {station.manager ? 'Change Manager' : 'Assign Manager'}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchStationData}
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dashboard" icon={<DirectionsBusIcon />} />
          <Tab label="Users" icon={<PeopleIcon />} />
          <Tab label="Vehicles" icon={<DirectionsBusIcon />} />
          <Tab label="Trips" icon={<ScheduleIcon />} />
        </Tabs>
      </Box>

      {/* Dashboard Tab - Same as before but with added manager section */}
      {activeTab === 0 && (
        <>
          {/* Stats Cards - Same as before */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Drivers
                  </Typography>
                  <Typography variant="h4">
                    {stats.activeDrivers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Vehicles
                  </Typography>
                  <Typography variant="h4">
                    {stats.activeVehicles}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Upcoming Trips
                  </Typography>
                  <Typography variant="h4">
                    {stats.upcomingTrips}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Today's Bookings
                  </Typography>
                  <Typography variant="h4">
                    {stats.todaysBookings}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${stats.totalRevenue.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Station Manager Card */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Station Manager
            </Typography>
            <Card>
              <CardContent>
                {station?.manager ? (
                  <Grid container spacing={2} alignItems="center">
                    <Grid>
                      <PersonIcon fontSize="large" color="primary" />
                    </Grid>
                    <Grid>
                      <Typography variant="h6">{station.manager.fullName}</Typography>
                      <Typography color="text.secondary">
                        <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        {station.manager.email}
                      </Typography>
                      <Typography color="text.secondary">
                        <ContactPhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        {station.manager.phoneNumber || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid sx={{ ml: 'auto' }}>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setAssignManagerData({
                            stationId: station._id,
                            managerId: station.manager._id
                          });
                          setAssignManagerDialog(true);
                        }}
                      >
                        Change Manager
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <PersonIcon fontSize="large" color="action" sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No Manager Assigned
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      This station doesn't have a manager assigned yet.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => {
                        setAssignManagerData({
                          stationId: station._id,
                          managerId: ''
                        });
                        setAssignManagerDialog(true);
                      }}
                    >
                      Assign Manager
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ mb: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddVehicleDialog(true)}
                  disabled={!station}
                >
                  Add Vehicle
                </Button>
              </Grid>
              <Grid>
                <Button
                  variant="contained"
                  startIcon={<ScheduleIcon />}
                  onClick={() => setAddTripDialog(true)}
                  disabled={!station}
                >
                  Create Trip
                </Button>
              </Grid>
              <Grid>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAssignDriverDialog(true)}
                  disabled={!station}
                >
                  Assign Driver
                </Button>
              </Grid>
              <Grid>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => setActiveTab(1)}
                >
                  Manage Users
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Recent Activity - Same as before */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recent Bookings
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Booking #</TableCell>
                    <TableCell>Passenger</TableCell>
                    <TableCell>Trip</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.slice(0, 5).map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.bookingNumber || 'N/A'}</TableCell>
                      <TableCell>{booking.passengerID?.fullName || 'N/A'}</TableCell>
                      <TableCell>
                        {booking.tripID?.origin?.stationName || 'N/A'} → {booking.tripID?.destination?.stationName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          size="small"
                          color={
                            booking.status === 'confirmed' ? 'success' :
                            booking.status === 'completed' ? 'primary' :
                            booking.status === 'cancelled' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No recent bookings
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      {/* Users, Vehicles, and Trips tabs remain the same as before */}
      {/* ... (Rest of the tabs remain unchanged from your original code) */}

      {/* Dialog for Assign Manager */}
      <Dialog open={assignManagerDialog} onClose={() => setAssignManagerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Station Manager</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Station: {station?.stationName}
              </Typography>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Manager</InputLabel>
                <Select
                  value={assignManagerData.managerId}
                  label="Select Manager"
                  onChange={(e) => setAssignManagerData({...assignManagerData, managerId: e.target.value})}
                >
                  <MenuItem value="">None (Remove Manager)</MenuItem>
                  {stationManagers.map(manager => (
                    <MenuItem key={manager._id} value={manager._id}>
                      {manager.fullName} ({manager.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Only station_admin users can be assigned as managers
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignManagerDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignManager} variant="contained">
            Assign Manager
          </Button>
        </DialogActions>
      </Dialog>

      {/* Updated Dialog for Edit Station - Now includes Manager field */}
      <Dialog open={editStationDialog} onClose={() => setEditStationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Station Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Station Name"
                value={stationEditData.stationName}
                onChange={(e) => setStationEditData({...stationEditData, stationName: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Location"
                value={stationEditData.location}
                onChange={(e) => setStationEditData({...stationEditData, location: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={stationEditData.contactPhone}
                onChange={(e) => setStationEditData({...stationEditData, contactPhone: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={stationEditData.contactEmail}
                onChange={(e) => setStationEditData({...stationEditData, contactEmail: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Manager</InputLabel>
                <Select
                  value={stationEditData.manager || ''}
                  label="Manager"
                  onChange={(e) => setStationEditData({...stationEditData, manager: e.target.value})}
                >
                  <MenuItem value="">None (Remove Manager)</MenuItem>
                  {stationManagers.map(manager => (
                    <MenuItem key={manager._id} value={manager._id}>
                      {manager.fullName} ({manager.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Assign a station_admin user as manager
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStationDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateStation} variant="contained">Update Station</Button>
        </DialogActions>
      </Dialog>

      {/* Updated Dialog for Create Station - Now includes Manager field */}
      <Dialog open={createStationDialog} onClose={() => setCreateStationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Station</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Station Code"
                value={newStationData.stationCode}
                onChange={(e) => setNewStationData({...newStationData, stationCode: e.target.value.toUpperCase()})}
                required
                helperText="Unique code for the station"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Station Name"
                value={newStationData.stationName}
                onChange={(e) => setNewStationData({...newStationData, stationName: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Location"
                value={newStationData.location}
                onChange={(e) => setNewStationData({...newStationData, location: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="City"
                value={newStationData.city}
                onChange={(e) => setNewStationData({...newStationData, city: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={newStationData.contactPhone}
                onChange={(e) => setNewStationData({...newStationData, contactPhone: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={newStationData.contactEmail}
                onChange={(e) => setNewStationData({...newStationData, contactEmail: e.target.value})}
                required
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Manager</InputLabel>
                <Select
                  value={newStationData.manager || ''}
                  label="Manager"
                  onChange={(e) => setNewStationData({...newStationData, manager: e.target.value})}
                >
                  <MenuItem value="">None (No Manager)</MenuItem>
                  {stationManagers.map(manager => (
                    <MenuItem key={manager._id} value={manager._id}>
                      {manager.fullName} ({manager.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Optional: Assign a station_admin user as manager
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateStationDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateStation} variant="contained">Create Station</Button>
        </DialogActions>
      </Dialog>

      {/* Other dialogs remain the same */}
      {/* ... (Keep your existing dialogs for add vehicle, add trip, assign driver, user details) */}
    </Container>
  );
};

export default Station;