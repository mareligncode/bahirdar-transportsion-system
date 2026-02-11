import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, Card, CardContent,
  Button, Chip, IconButton, CircularProgress, Alert,
  Avatar, Divider, CardHeader
} from '@mui/material';
import {
  People as PeopleIcon,
  DirectionsBus as BusIcon,
  LocationOn as StationIcon,
  CalendarToday as TripIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

const Dashboard = () => {
  const { t } = useTranslation(); // ✅ ADD THIS
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTrips: 0,
    activeTrips: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalStations: 0,
    activeStations: 0,
    totalBookings: 0,
    revenue: 0
  });
  
  const [userRoles, setUserRoles] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [vehicleStatus, setVehicleStatus] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch current user profile
      const profileResponse = await api.get('/api/auth/profile');
      setUserData(profileResponse.data.data?.user);
      
      // Fetch all users
      const usersResponse = await api.get('/api/auth/all-users');
      const users = usersResponse.data.data?.users || [];
      
      // Fetch stations
      const stationsResponse = await api.get('/api/station');
      const stations = stationsResponse.data.stations || [];
      
      // Fetch vehicles
      const vehiclesResponse = await api.get('/api/vehicles');
      const vehicles = vehiclesResponse.data.data?.vehicles || [];
      
      // Fetch trips
      const tripsResponse = await api.get('/api/trip');
      const trips = tripsResponse.data.data || [];
      
      // Calculate statistics
      const activeUsers = users.filter(user => user.isActive).length;
      const activeStations = stations.filter(station => station.isActive).length;
      const activeTrips = trips.filter(trip => trip.isActive).length;
      const availableVehicles = vehicles.filter(vehicle => 
        vehicle.currentStatus === 'available' || vehicle.currentStatus === 'active'
      ).length;
      
      // Calculate user role distribution
      const roleCounts = {
        passenger: users.filter(u => u.role === 'passenger').length,
        driver: users.filter(u => u.role === 'driver').length,
        station_admin: users.filter(u => u.role === 'station_admin').length,
        super_admin: users.filter(u => u.role === 'super_admin').length
      };
      
      setUserRoles([
        { name: t('passengers'), value: roleCounts.passenger, color: '#8884d8' },
        { name: t('drivers'), value: roleCounts.driver, color: '#82ca9d' },
        { name: t('station_admins'), value: roleCounts.station_admin, color: '#ffc658' },
        { name: t('super_admins'), value: roleCounts.super_admin, color: '#ff8042' }
      ]);
      
      // Calculate vehicle status distribution
      const vehicleStatusCounts = {
        available: vehicles.filter(v => v.currentStatus === 'available').length,
        active: vehicles.filter(v => v.currentStatus === 'active').length,
        on_trip: vehicles.filter(v => v.currentStatus === 'on_trip').length,
        maintenance: vehicles.filter(v => v.currentStatus === 'maintenance').length,
        inactive: vehicles.filter(v => v.currentStatus === 'inactive').length
      };
      
      setVehicleStatus([
        { name: t('available'), value: vehicleStatusCounts.available, color: '#4caf50' },
        { name: t('active'), value: vehicleStatusCounts.active, color: '#2196f3' },
        { name: t('on_trip'), value: vehicleStatusCounts.on_trip, color: '#ff9800' },
        { name: t('maintenance'), value: vehicleStatusCounts.maintenance, color: '#f44336' },
        { name: t('inactive'), value: vehicleStatusCounts.inactive, color: '#9e9e9e' }
      ]);
      
      // Prepare activity data (last 7 days - mock for now)
      const activity = [
        { day: t('mon'), users: 12, trips: 8, bookings: 15 },
        { day: t('tue'), users: 19, trips: 12, bookings: 21 },
        { day: t('wed'), users: 15, trips: 9, bookings: 18 },
        { day: t('thu'), users: 25, trips: 16, bookings: 30 },
        { day: t('fri'), users: 22, trips: 14, bookings: 25 },
        { day: t('sat'), users: 18, trips: 10, bookings: 20 },
        { day: t('sun'), users: 10, trips: 5, bookings: 12 }
      ];
      setActivityData(activity);
      
      // Set overall stats
      setStats({
        totalUsers: users.length,
        activeUsers,
        totalTrips: trips.length,
        activeTrips,
        totalVehicles: vehicles.length,
        availableVehicles,
        totalStations: stations.length,
        activeStations,
        totalBookings: 0,
        revenue: 0
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || t('failed_to_load_dashboard_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('welcome')}, {userData?.fullName || t('super_admin')}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {t('super_admin_dashboard')}
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
          size="small"
        >
          {t('refresh')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6" color="textSecondary">
                  {t('total_users')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalUsers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={t('active_count', { count: stats.activeUsers })}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  {Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <BusIcon />
                </Avatar>
                <Typography variant="h6" color="textSecondary">
                  {t('total_vehicles')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalVehicles}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={t('available_count', { count: stats.availableVehicles })}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <StationIcon />
                </Avatar>
                <Typography variant="h6" color="textSecondary">
                  {t('total_stations')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalStations}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={t('active_count', { count: stats.activeStations })}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TripIcon />
                </Avatar>
                <Typography variant="h6" color="textSecondary">
                  {t('total_trips')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalTrips}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={t('active_count', { count: stats.activeTrips })}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section - Full Width Vertical Layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* User Roles Distribution */}
        <Card elevation={3}>
          <CardHeader
            title={t('user_roles_distribution')}
            subheader={t('breakdown_of_user_roles')}
          />
          <Divider />
          <CardContent sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userRoles}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userRoles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} ${t('users')}`, t('count')]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Status Distribution */}
        <Card elevation={3}>
          <CardHeader
            title={t('vehicle_status_distribution')}
            subheader={t('current_status_of_vehicles')}
          />
          <Divider />
          <CardContent sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vehicleStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} ${t('vehicles')}`, t('count')]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card elevation={3}>
          <CardHeader
            title={t('weekly_activity')}
            subheader={t('last_7_days_overview')}
          />
          <Divider />
          <CardContent sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#8884d8" name={t('new_users')} />
                <Bar dataKey="trips" fill="#82ca9d" name={t('new_trips')} />
                <Bar dataKey="bookings" fill="#ffc658" name={t('bookings')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Card elevation={3} sx={{ mt: 3 }}>
        <CardHeader
          title={t('quick_actions')}
          avatar={<SecurityIcon color="primary" />}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                href="/admin/users"
                startIcon={<PeopleIcon />}
              >
                {t('manage_users')}
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                href="/admin/vehicles"
                startIcon={<BusIcon />}
              >
                {t('manage_vehicles')}
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                href="/admin/stations"
                startIcon={<StationIcon />}
              >
                {t('manage_stations')}
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="info"
                href="/admin/Schedules"
                startIcon={<TripIcon />}
              >
                {t('manage_trips')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;