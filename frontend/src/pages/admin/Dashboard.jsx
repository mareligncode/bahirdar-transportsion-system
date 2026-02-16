import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Error as ErrorIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

const Dashboard = () => {
  const { t } = useTranslation();
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
    pendingPayments: 0,
    revenue: 0,
    todayRevenue: 0
  });
  
  const [userRoles, setUserRoles] = useState([]);
  const [vehicleStatus, setVehicleStatus] = useState([]);
  const [tripStatus, setTripStatus] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  // ✅ Check if user is super admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
  }, [user, isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ Use authService for authenticated endpoints
      const profileResponse = await authService.getProfile();
      setUserData(profileResponse);
      
      // ✅ Get all users via authService
      const usersResponse = await authService.getAllUsers();
      const users = usersResponse.data?.users || usersResponse.data || [];
      
      // Fetch stations - ✅ FIXED: Correct endpoint path
      const stationsResponse = await api.get('/api/station');
      const stations = stationsResponse.data.stations || stationsResponse.data || [];
      
      // Fetch vehicles
      const vehiclesResponse = await api.get('/api/vehicles');
      const vehicles = vehiclesResponse.data.data?.vehicles || vehiclesResponse.data?.vehicles || [];
      
      // Fetch trips - ✅ Add query params for super admin
      const tripsResponse = await api.get('/api/trip');
      const trips = tripsResponse.data.data || tripsResponse.data || [];
      
      // ✅ Fetch bookings
      const bookingsResponse = await api.get('/api/booking');
      const bookings = bookingsResponse.data.data || bookingsResponse.data || [];
      
      // ✅ Fetch payments
      const paymentsResponse = await api.get('/api/payment/status?role=super_admin');
      const payments = paymentsResponse.data.data || paymentsResponse.data || [];
      
      // Calculate statistics
      const activeUsers = users.filter(user => user.isActive).length;
      const activeStations = stations.filter(station => station.isActive).length;
      
      // ✅ FIXED: Trip status logic based on your Trip model
      const scheduledTrips = trips.filter(trip => trip.tripStatus === 'scheduled').length;
      const ongoingTrips = trips.filter(trip => trip.tripStatus === 'ongoing').length;
      const completedTrips = trips.filter(trip => trip.tripStatus === 'completed').length;
      const cancelledTrips = trips.filter(trip => trip.tripStatus === 'cancelled').length;
      const delayedTrips = trips.filter(trip => trip.tripStatus === 'delayed').length;
      
      // ✅ FIXED: Vehicle status logic based on your Vehicle model
      const availableVehicles = vehicles.filter(vehicle => 
        vehicle.currentStatus === 'available' || vehicle.currentStatus === 'active'
      ).length;
      
      // ✅ Calculate booking stats
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      
      // ✅ Calculate payment stats
      const successfulPayments = payments.filter(p => p.paymentStatus === 'success');
      const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRevenue = successfulPayments
        .filter(p => new Date(p.createdAt) >= today)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
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
      ].filter(item => item.value > 0)); // Only show roles that exist
      
      // ✅ Vehicle status distribution - matches your backend enum
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
      ].filter(item => item.value > 0));
      
      // ✅ Trip status distribution - matches your backend enum
      const tripStatusCounts = {
        scheduled: trips.filter(t => t.tripStatus === 'scheduled').length,
        boarding: trips.filter(t => t.tripStatus === 'boarding').length,
        ongoing: trips.filter(t => t.tripStatus === 'ongoing').length,
        completed: trips.filter(t => t.tripStatus === 'completed').length,
        cancelled: trips.filter(t => t.tripStatus === 'cancelled').length,
        delayed: trips.filter(t => t.tripStatus === 'delayed').length
      };
      
      setTripStatus([
        { name: t('scheduled'), value: tripStatusCounts.scheduled, color: '#2196f3' },
        { name: t('boarding'), value: tripStatusCounts.boarding, color: '#ff9800' },
        { name: t('ongoing'), value: tripStatusCounts.ongoing, color: '#4caf50' },
        { name: t('completed'), value: tripStatusCounts.completed, color: '#9c27b0' },
        { name: t('cancelled'), value: tripStatusCounts.cancelled, color: '#f44336' },
        { name: t('delayed'), value: tripStatusCounts.delayed, color: '#ffc107' }
      ].filter(item => item.value > 0));
      
      // ✅ Set recent bookings for activity
      setRecentBookings(bookings.slice(0, 5));
      
      // Set overall stats
      setStats({
        totalUsers: users.length,
        activeUsers,
        totalTrips: trips.length,
        activeTrips: scheduledTrips + ongoingTrips,
        totalVehicles: vehicles.length,
        availableVehicles,
        totalStations: stations.length,
        activeStations,
        totalBookings: bookings.length,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
        todayRevenue,
        pendingPayments: payments.filter(p => p.paymentStatus === 'pending').length
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
            {t('welcome')}, {userData?.fullName || user?.fullName || t('super_admin')}
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
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
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

        {/* ✅ New Revenue Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={3} sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
                  <PaymentsIcon />
                </Avatar>
                <Typography variant="h6" color="white">
                  {t('total_revenue')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="white">
                ETB {stats.totalRevenue.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={t('today_revenue', { amount: `ETB ${stats.todayRevenue.toLocaleString()}` })}
                  size="small"
                  sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6" color="textSecondary">
                  {t('total_bookings')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalBookings}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <Chip
                  label={t('confirmed', { count: stats.confirmedBookings || 0 })}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={t('pending', { count: stats.pendingBookings || 0 })}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <ErrorIcon />
                </Avatar>
                <Typography variant="h6" color="textSecondary">
                  {t('pending_payments')}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.pendingPayments || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {t('requires_attention')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* User Roles Distribution */}
        {userRoles.length > 0 && (
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
        )}

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
                href="/admin/AllUsers"
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
                href="/admin/schedules"
                startIcon={<TripIcon />}
              >
                {t('manage_trips')}
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                href="/admin/bookings"
                startIcon={<PeopleIcon />}
              >
                {t('manage_bookings')}
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                href="/admin/payments"
                startIcon={<PaymentsIcon />}
              >
                {t('manage_payments')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;