import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  LocationOn as StationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  DirectionsBus as BusIcon,
  Schedule as ScheduleIcon,
  Map as MapIcon,
  Edit as EditIcon,
  PhotoCamera as CameraIcon,
  Image as ImageIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Place as PlaceIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
  CarRental as CarRentalIcon,
  Group as GroupIcon,
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  ContactMail as ContactMailIcon
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Container,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';

const StationAdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stationData, setStationData] = useState(null);
  const [stationStats, setStationStats] = useState({
    drivers: 0,
    passengers: 0,
    vehicles: 0,
    todayTrips: 0,
    activeVehicles: 0,
    upcomingTrips: 0
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    stationName: '',
    contactPhone: '',
    contactEmail: '',
    location: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const fetchStationData = async () => {
    try {
      setLoading(true);
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        navigate('/login');
        return;
      }

      const userProfile = await api.get('/api/auth/profile');
      const userData = userProfile.data.data?.user;
      
      if (!userData) {
        showSnackbar('Failed to fetch user profile', 'error');
        return;
      }

      let station = null;
      
      if (userData.stationID) {
        try {
          const response = await api.get(`/api/station/${userData.stationID}`);
          if (response.data.station) {
            station = response.data.station;
          }
        } catch (error) {
          console.log('Could not fetch station by ID:', error.message);
        }
      }
      
      if (!station) {
        try {
          const stationsResponse = await api.get('/api/station');
          station = stationsResponse.data.stations?.find(s => 
            s.manager?._id === currentUserId || s.manager === currentUserId
          );
        } catch (error) {
          console.log('Could not fetch stations list:', error.message);
        }
      }
      
      if (station) {
        await setStationDataAndStats(station);
      } else {
        setStationData(null);
        showSnackbar('No station assigned to your account', 'warning');
      }
      
    } catch (error) {
      console.error('Error fetching station data:', error);
      showSnackbar('Failed to load station information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setStationDataAndStats = async (station) => {
    setStationData(station);
    setEditForm({
      stationName: station.stationName,
      contactPhone: station.contactPhone,
      contactEmail: station.contactEmail,
      location: station.location
    });
    
    try {
      const [usersResponse, vehiclesResponse, tripsResponse] = await Promise.all([
        api.get('/api/auth/station-users'),
        api.get(`/api/vehicles?stationID=${station._id}`),
        api.get('/api/trip')
      ]);
      
      const users = usersResponse.data.data?.users || [];
      const vehicles = vehiclesResponse.data.data?.vehicles || [];
      const allTrips = tripsResponse.data.data || [];
      
      const stationTrips = allTrips.filter(trip => 
        trip.station?._id === station._id || trip.station === station._id
      );
      
      const today = new Date().toISOString().split('T')[0];
      const todayTrips = stationTrips.filter(trip => {
        const tripDate = new Date(trip.departureTime).toISOString().split('T')[0];
        return tripDate === today;
      });
      
      const upcomingTrips = stationTrips.filter(trip => 
        new Date(trip.departureTime) > new Date()
      );
      
      const activeVehicles = vehicles.filter(v => 
        v.currentStatus === 'active' || v.currentStatus === 'on_trip'
      ).length;
      
      setStationStats({
        drivers: users.filter(user => user.role === 'driver').length,
        passengers: users.filter(user => user.role === 'passenger').length,
        vehicles: vehicles.length,
        todayTrips: todayTrips.length,
        activeVehicles,
        upcomingTrips: upcomingTrips.length
      });
      
    } catch (error) {
      console.error('Error fetching station stats:', error);
      showSnackbar('Failed to load station statistics', 'warning');
    }
  };

  useEffect(() => {
    fetchStationData();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleEditSubmit = async () => {
    try {
      const response = await api.put(`/api/station/${stationData._id}`, editForm);
      setStationData(prev => ({ ...prev, ...editForm }));
      setEditDialogOpen(false);
      showSnackbar('Station updated successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to update station', 'error');
    }
  };

  const handleImageUpload = (event) => {
    const files = event.target.files;
    if (files && files[0]) {
      showSnackbar('Image uploaded successfully', 'success');
      setUploadDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!stationData) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            No Station Assigned
          </Typography>
          <Typography variant="body2">
            Your account is not currently assigned to any station. 
            Please contact the system administrator.
          </Typography>
          <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={() => navigate('/profile')}>
            Go to Profile
          </Button>
        </Alert>
      </Container>
    );
  }

  const managerName = stationData.manager?.fullName || 'Not Assigned';
  const managerEmail = stationData.manager?.email || 'N/A';

  const statCards = [
    { label: 'Drivers', value: stationStats.drivers, icon: <PeopleIcon />, color: theme.palette.primary.main },
    { label: 'Passengers', value: stationStats.passengers, icon: <PeopleIcon />, color: theme.palette.secondary.main },
    { label: 'Vehicles', value: stationStats.vehicles, icon: <BusIcon />, color: theme.palette.success.main },
    { label: 'Today Trips', value: stationStats.todayTrips, icon: <ScheduleIcon />, color: theme.palette.warning.main },
  ];

  const quickActions = [
    { id: 1, title: 'Vehicles', icon: <CarRentalIcon />, action: () => navigate('/station/vehicles') },
    { id: 2, title: 'Trips', icon: <ScheduleIcon />, action: () => navigate('/station/trips') },
    { id: 3, title: 'Users', icon: <GroupIcon />, action: () => navigate('/station/users') },
    { id: 4, title: 'Assign Driver', icon: <AssignmentIcon />, action: () => navigate('/station/assign-driver') },
    { id: 5, title: 'Upload', icon: <CameraIcon />, action: () => setUploadDialogOpen(true) },
    { id: 6, title: 'Edit', icon: <EditIcon />, action: () => setEditDialogOpen(true) }
  ];

  const stationInfoCards = [
    { id: 1, title: 'Station Code', value: stationData.stationCode, icon: <CodeIcon />, color: theme.palette.primary.main },
    { id: 2, title: 'City', value: stationData.city, icon: <PlaceIcon />, color: theme.palette.secondary.main },
    { id: 3, title: 'Manager', value: managerName, icon: <PersonIcon />, color: theme.palette.success.main },
    { id: 4, title: 'Contact', value: stationData.contactPhone, icon: <ContactMailIcon />, color: theme.palette.warning.main }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header - Big and Centered Name */}
      <Paper sx={{ 
        p: 3, 
        mb: 2, 
        borderRadius: 2,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
      }}>
        <Typography 
          variant="h3" 
          fontWeight="bold" 
          gutterBottom
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            color: theme.palette.primary.main,
            mb: 1
          }}
        >
          {stationData.stationName}
        </Typography>
        <Typography 
          variant="h5" 
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Station Dashboard
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            icon={<StationIcon />} 
            label={`Station Code: ${stationData.stationCode}`} 
            size="medium"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            icon={<PlaceIcon />} 
            label={stationData.city} 
            size="medium"
            color="primary"
            variant="filled"
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            icon={<BusinessIcon />}
            label={stationData.isActive ? 'Active Station' : 'Inactive'} 
            size="medium"
            color={stationData.isActive ? 'success' : 'error'}
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Box>
      </Paper>

      {/* Stats Cards - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Avatar sx={{ bgcolor: alpha(stat.color, 0.1), color: stat.color, width: 36, height: 36 }}>
                    {stat.icon}
                  </Avatar>
                  <Box textAlign="right">
                    <Typography variant="h6" fontWeight="bold">{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions - Compact */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={1}>
          {quickActions.map((action) => (
            <Grid item xs={4} sm={2} key={action.id}>
              <Card 
                sx={{ 
                  borderRadius: 2, 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}
                onClick={action.action}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 0.5 }}>
                    {action.icon}
                  </Box>
                  <Typography variant="caption" fontWeight="500">{action.title}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Station Info - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {stationInfoCards.map((info) => (
          <Grid item xs={6} sm={3} key={info.id}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ bgcolor: alpha(info.color, 0.1), color: info.color, width: 32, height: 32 }}>
                    {info.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{info.title}</Typography>
                    <Typography variant="body2" fontWeight="bold">{info.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional Info - Compact */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Station Details
        </Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MapIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight="500">Address</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{stationData.location}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccessTimeIcon fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight="500">Status</Typography>
            </Box>
            <Chip 
              label={stationData.isActive ? 'Active' : 'Inactive'} 
              size="small" 
              color={stationData.isActive ? 'success' : 'error'}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Station</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Station Name"
              fullWidth
              size="small"
              value={editForm.stationName}
              onChange={(e) => setEditForm(prev => ({ ...prev, stationName: e.target.value }))}
            />
            <TextField
              label="Location"
              fullWidth
              size="small"
              value={editForm.location}
              onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
            />
            <TextField
              label="Contact Phone"
              fullWidth
              size="small"
              value={editForm.contactPhone}
              onChange={(e) => setEditForm(prev => ({ ...prev, contactPhone: e.target.value }))}
            />
            <TextField
              label="Contact Email"
              type="email"
              fullWidth
              size="small"
              value={editForm.contactEmail}
              onChange={(e) => setEditForm(prev => ({ ...prev, contactEmail: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button size="small" variant="contained" onClick={handleEditSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Images</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <ImageIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload station images (JPG, PNG, GIF)
            </Typography>
            <input accept="image/*" style={{ display: 'none' }} id="image-upload" type="file" onChange={handleImageUpload} />
            <label htmlFor="image-upload">
              <Button variant="contained" component="span" size="small" startIcon={<CameraIcon />}>
                Select Images
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setUploadDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StationAdminDashboard;