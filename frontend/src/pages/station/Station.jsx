import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  LocationCity as CityIcon  // Correct import
} from '@mui/icons-material';
import api from '../../services/api';

const Station = () => {
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    drivers: 0,
    vehicles: 0,
    activeTrips: 0,
    completedTrips: 0,
    upcomingTrips: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    stationName: '',
    contactPhone: '',
    contactEmail: '',
    location: '',
    city: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // Get user's station ID from token or localStorage
  const getStationId = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.stationID || null;
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
    return null;
  };

  // Fetch station data - station admin's specific station
  const fetchStationData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get station ID from user's token
      const stationId = getStationId();
      if (!stationId) {
        throw new Error('No station assigned to your account');
      }

      // Fetch station information
      const stationResponse = await api.get(`/api/station/${stationId}`);
      
      if (stationResponse.data?.station) {
        const stationData = stationResponse.data.station;
        setStation(stationData);
        setEditForm({
          stationName: stationData.stationName || '',
          contactPhone: stationData.contactPhone || '',
          contactEmail: stationData.contactEmail || '',
          location: stationData.location || '',
          city: stationData.city || ''
        });
      } else {
        throw new Error('Station not found');
      }

    } catch (err) {
      console.error('Error fetching station data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load station information');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch statistics for the station admin's station
  const fetchStatistics = useCallback(async () => {
    if (!station) return;
    
    try {
      setStatsLoading(true);

      // Get drivers count for this station
      const driversResponse = await api.get('/api/auth/station-users');
      const users = driversResponse.data.data?.users || driversResponse.data?.data || [];
      const drivers = users.filter(user => user.role === 'driver');
      
      // Get vehicles count for this station
      const vehiclesResponse = await api.get('/api/vehicles');
      const vehiclesData = vehiclesResponse.data.data?.vehicles || [];
      const vehicles = vehiclesData.filter(vehicle => 
        vehicle.stationID?._id === station._id || vehicle.stationID === station._id
      );
      
      // Get trips for this station
      const tripsResponse = await api.get('/api/trip');
      const tripsData = tripsResponse.data.data || [];
      const stationTrips = tripsData.filter(trip => 
        trip.station?._id === station._id || trip.station === station._id
      );
      
      // Calculate trip statistics
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      
      const activeTrips = stationTrips.filter(trip => 
        ['scheduled', 'boarding', 'ongoing'].includes(trip.tripStatus)
      );
      
      const completedTrips = stationTrips.filter(trip => 
        trip.tripStatus === 'completed'
      );
      
      const upcomingTrips = stationTrips.filter(trip => {
        if (!trip.departureTime) return false;
        const tripDate = new Date(trip.departureTime);
        return tripDate > new Date() && trip.tripStatus === 'scheduled';
      });

      setStats({
        drivers: drivers.length,
        vehicles: vehicles.length,
        activeTrips: activeTrips.length,
        completedTrips: completedTrips.length,
        upcomingTrips: upcomingTrips.length
      });

    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [station]);

  useEffect(() => {
    fetchStationData();
  }, [fetchStationData]);

  useEffect(() => {
    if (station) {
      fetchStatistics();
    }
  }, [station, fetchStatistics]);

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleEditSubmit = async () => {
    try {
      if (!station) return;

      setFormLoading(true);
      
      // Validate required fields
      const requiredFields = ['stationName', 'location', 'city', 'contactPhone', 'contactEmail'];
      const missingFields = requiredFields.filter(field => !editForm[field]?.trim());
      
      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.contactEmail)) {
        setError('Please enter a valid email address');
        return;
      }

      const response = await api.put(`/api/station/${station._id}`, {
        stationName: editForm.stationName.trim(),
        location: editForm.location.trim(),
        city: editForm.city.trim(),
        contactPhone: editForm.contactPhone.trim(),
        contactEmail: editForm.contactEmail.trim().toLowerCase()
      });

      if (response.data?.success || response.data?.station) {
        setSuccess('Station information updated successfully');
        setStation(response.data.station || response.data.data?.station);
        setEditMode(false);
        fetchStationData(); // Refresh data
      } else {
        throw new Error('Failed to update station');
      }
    } catch (err) {
      console.error('Error updating station:', err);
      setError(err.response?.data?.message || 
              err.response?.data?.errors?.[0]?.msg || 
              'Failed to update station information');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditMode(false);
    if (station) {
      setEditForm({
        stationName: station.stationName || '',
        contactPhone: station.contactPhone || '',
        contactEmail: station.contactEmail || '',
        location: station.location || '',
        city: station.city || ''
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('251')) {
      return `+${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8)}`;
    }
    return phone;
  };

  if (loading && !station) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!station) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="warning">
            <Typography variant="h6">No station assigned</Typography>
            <Typography variant="body2">
              You are not assigned to any station. Please contact the super administrator.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with gradient */}
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
              <BusinessIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              {station.stationName}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Station Code: <strong>{station.stationCode}</strong>
              {station.city && ` • ${station.city}`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchStationData}
              sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#e0e0e0' } }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditToggle}
              sx={{ 
                background: 'rgba(255, 255, 255, 0.2)',
                '&:hover': { background: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              Edit Station
            </Button>
          </Stack>
        </Box>
        
        <Chip
          label={station.isActive ? 'ACTIVE' : 'INACTIVE'}
          color={getStatusColor(station.isActive)}
          icon={station.isActive ? <CheckCircleIcon /> : <WarningIcon />}
          size="medium"
          sx={{ 
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: station.isActive ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'
          }}
        />
      </Box>

      {/* Statistics Cards */}
      {statsLoading ? (
        <Box sx={{ mb: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <Grid container spacing={3} mb={4}>
          {[
            {
              icon: <PeopleIcon />,
              title: 'Drivers',
              value: stats.drivers,
              description: 'Assigned drivers',
              color: '#2196f3',
              bgColor: '#e3f2fd'
            },
            {
              icon: <CarIcon />,
              title: 'Vehicles',
              value: stats.vehicles,
              description: 'Available vehicles',
              color: '#4caf50',
              bgColor: '#e8f5e9'
            },
            {
              icon: <ScheduleIcon />,
              title: 'Active Trips',
              value: stats.activeTrips,
              description: 'Currently active',
              color: '#ff9800',
              bgColor: '#fff3e0'
            },
            {
              icon: <CheckCircleIcon />,
              title: 'Completed Trips',
              value: stats.completedTrips,
              description: 'Total completed',
              color: '#9c27b0',
              bgColor: '#f3e5f5'
            },
            {
              icon: <TimeIcon />,
              title: 'Upcoming Trips',
              value: stats.upcomingTrips,
              description: 'Next 7 days',
              color: '#00bcd4',
              bgColor: '#e0f7fa'
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
                  <Typography variant="body2" color="text.secondary">
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Station Details */}
      <Grid container spacing={3}>
        {/* Left Column - Station Information */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ 
            p: 3,
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
              <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Station Information
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              {[
                { icon: <LocationIcon />, label: 'Location', value: station.location },
                { icon: <CityIcon />, label: 'City', value: station.city },
                { icon: <PhoneIcon />, label: 'Contact Phone', value: formatPhoneNumber(station.contactPhone) },
                { icon: <EmailIcon />, label: 'Contact Email', value: station.contactEmail },
                { icon: <PersonIcon />, label: 'Manager', value: station.manager?.fullName || 'Not assigned' },
                { icon: <CodeIcon />, label: 'Station Code', value: station.stationCode }
              ].map((item, index) => (
                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    height: '100%'
                  }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Box sx={{ color: 'primary.main', mr: 1 }}>
                        {item.icon}
                      </Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {item.value || 'Not specified'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box mt={3} pt={2} borderTop="1px solid #e0e0e0">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(station.createdAt)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Updated
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(station.updatedAt)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Quick Actions & Status */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              {[
                { icon: <PeopleIcon />, label: 'Manage Drivers', href: '/station/drivers', color: 'primary' },
                { icon: <CarIcon />, label: 'Manage Vehicles', href: '/station/vehicles', color: 'info' },
                { icon: <ScheduleIcon />, label: 'Manage Trips', href: '/station/trips', color: 'success' },
                { icon: <PersonIcon />, label: 'Manage Passengers', href: '/station/users', color: 'warning' }
              ].map((action, index) => (
                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                  <Button
                    fullWidth
                    variant="contained"
                    color={action.color}
                    startIcon={action.icon}
                    href={action.href}
                    sx={{ 
                      mb: 2,
                      borderRadius: 2,
                      py: 1.5,
                      justifyContent: 'flex-start'
                    }}
                  >
                    {action.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper sx={{ 
            p: 3,
            borderRadius: 3,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
              Station Status
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Alert 
              severity={station.isActive ? 'success' : 'warning'} 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {station.isActive ? <CheckCircleIcon /> : <WarningIcon />}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {station.isActive 
                    ? 'Station is active and accepting bookings'
                    : 'Station is inactive - No new bookings can be made'
                  }
                </Typography>
              </Box>
            </Alert>
            
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                alignItems: 'center'
              }}
            >
              <InfoIcon />
              <Typography variant="body2" sx={{ ml: 1 }}>
                <strong>Note:</strong> Station activation/deactivation can only be done by super administrator
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Station Dialog */}
      <Dialog 
        open={editMode} 
        onClose={handleEditCancel} 
        maxWidth="sm" 
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
            <EditIcon sx={{ mr: 1 }} />
            <Typography fontWeight="bold">Edit Station Information</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              Update your station information. Station code, manager, and activation status cannot be changed.
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            label="Station Name *"
            value={editForm.stationName}
            onChange={(e) => setEditForm({...editForm, stationName: e.target.value})}
            margin="normal"
            required
            disabled={formLoading}
            size="small"
          />
          
          <TextField
            fullWidth
            label="Location *"
            value={editForm.location}
            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
            margin="normal"
            required
            disabled={formLoading}
            helperText="Full address of the station"
            size="small"
          />
          
          <TextField
            fullWidth
            label="City *"
            value={editForm.city}
            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
            margin="normal"
            required
            disabled={formLoading}
            size="small"
          />
          
          <TextField
            fullWidth
            label="Contact Phone *"
            value={editForm.contactPhone}
            onChange={(e) => setEditForm({...editForm, contactPhone: e.target.value})}
            margin="normal"
            required
            disabled={formLoading}
            size="small"
          />
          
          <TextField
            fullWidth
            label="Contact Email *"
            value={editForm.contactEmail}
            onChange={(e) => setEditForm({...editForm, contactEmail: e.target.value})}
            margin="normal"
            required
            disabled={formLoading}
            type="email"
            size="small"
            helperText="Valid email address for station communications"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleEditCancel} 
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit}
            variant="contained"
            color="primary"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <EditIcon />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {formLoading ? 'Saving...' : 'Save Changes'}
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

export default Station;