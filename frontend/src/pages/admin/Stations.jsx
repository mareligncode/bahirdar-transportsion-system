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
  Switch,
  FormControlLabel,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  LocationCity as CityIcon,
  Code as CodeIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

const Stations = () => {
  // State variables
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStations, setTotalStations] = useState(0);
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    stationCode: '',
    stationName: '',
    location: '',
    city: '',
    contactPhone: '',
    contactEmail: '',
    manager: '',
    isActive: true
  });
  
  const [editFormData, setEditFormData] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Data for dropdowns
  const [cities, setCities] = useState([]);
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [userRole, setUserRole] = useState('');

  // Status colors with better styling
  const statusColors = {
    active: { bg: '#e8f5e9', text: '#2e7d32', icon: <CheckIcon fontSize="small" /> },
    inactive: { bg: '#ffebee', text: '#c62828', icon: <CancelIcon fontSize="small" /> }
  };

  // Fetch user role
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  // Fetch stations
  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/station';
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (cityFilter) params.append('city', cityFilter);
      if (statusFilter && statusFilter !== 'all') params.append('isActive', statusFilter === 'active');
      
      params.append('page', page + 1);
      params.append('limit', rowsPerPage);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await api.get(url);
      
      const stationsData = response.data?.stations || [];
      const paginationData = response.data?.pagination || {};
      
      setStations(stationsData);
      setFilteredStations(stationsData);
      setTotalStations(paginationData.totalStations || stationsData.length);
      setError('');
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError(err.response?.data?.message || 'Failed to load stations');
      setStations([]);
      setFilteredStations([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, cityFilter, statusFilter]);

  // Fetch active stations for cities dropdown
  const fetchActiveStations = useCallback(async () => {
    try {
      const response = await api.get('/api/station/active');
      
      const activeStations = response.data?.stations || [];
      const uniqueCities = [...new Set(activeStations.map(station => station.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (err) {
      console.error('Error fetching active stations:', err);
    }
  }, []);

  // Fetch station admins for manager dropdown (only for super_admin)
  const fetchStationAdmins = useCallback(async () => {
    if (userRole !== 'super_admin') {
      setManagers([]);
      return;
    }

    setManagersLoading(true);
    try {
      // Fetch all users - FIXED: Your backend returns { success: true, data: { users: [] } }
      const usersRes = await api.get('/api/auth/all-users');
      
      // CORRECTED: Access the correct data structure
      const allUsers = usersRes.data?.data?.users || usersRes.data?.users || [];
      
      // Filter for active station admins
      const stationAdmins = allUsers.filter(user => 
        user.role === 'station_admin' && user.isActive
      );
      
      setManagers(stationAdmins);
    } catch (userErr) {
      console.error('Error fetching station admins:', userErr);
      setManagers([]);
    } finally {
      setManagersLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchStations();
    fetchActiveStations();
  }, [fetchStations, fetchActiveStations]);

  useEffect(() => {
    fetchStationAdmins();
  }, [fetchStationAdmins]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchStations();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setStatusFilter('all');
    setPage(0);
  };

  // Validate form data
  const validateForm = (data) => {
    const errors = [];
    
    if (!data.stationCode?.trim()) errors.push('Station code is required');
    if (!data.stationName?.trim()) errors.push('Station name is required');
    if (!data.location?.trim()) errors.push('Location is required');
    if (!data.city?.trim()) errors.push('City is required');
    if (!data.contactPhone?.trim()) errors.push('Contact phone is required');
    if (!data.contactEmail?.trim()) errors.push('Contact email is required');
    
    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      errors.push('Invalid email format');
    }
    
    return errors;
  };

  // Handle create station
  const handleCreateStation = async () => {
    const errors = validateForm(formData);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setFormLoading(true);
    try {
      const stationData = {
        ...formData,
        stationCode: formData.stationCode.toUpperCase().trim()
      };

      const response = await api.post('/api/station/register', stationData);
      setSuccess('Station created successfully!');
      setOpenCreateDialog(false);
      resetForm();
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create station');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit station
  const handleEditStation = async () => {
    const errors = validateForm(editFormData);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setFormLoading(true);
    try {
      const stationData = {
        ...editFormData,
        stationCode: editFormData.stationCode.toUpperCase().trim()
      };

      const response = await api.put(`/api/station/${editFormData._id}`, stationData);
      setSuccess('Station updated successfully!');
      setOpenEditDialog(false);
      setEditFormData(null);
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to update station');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete station
  const handleDeleteStation = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/station/${selectedStation._id}`);
      setSuccess('Station deleted successfully!');
      setOpenDeleteDialog(false);
      setSelectedStation(null);
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete station');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle toggle station status
  const handleToggleStatus = async (station) => {
    try {
      if (station.isActive) {
        const response = await api.patch(`/api/station/${station._id}/deactivate`);
        setSuccess('Station deactivated successfully!');
      } else {
        const response = await api.patch(`/api/station/${station._id}/activate`);
        setSuccess('Station activated successfully!');
      }
      fetchStations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update station status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      stationCode: '',
      stationName: '',
      location: '',
      city: '',
      contactPhone: '',
      contactEmail: '',
      manager: '',
      isActive: true
    });
  };

  // Open edit dialog
  const openEdit = (station) => {
    setEditFormData({
      ...station,
      manager: station.manager?._id || ''
    });
    setOpenEditDialog(true);
  };

  // Open view dialog
  const openView = (station) => {
    setSelectedStation(station);
    setOpenViewDialog(true);
  };

  // Open delete confirmation
  const openDelete = (station) => {
    setSelectedStation(station);
    setOpenDeleteDialog(true);
  };

  // Format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('251')) {
      return `+${cleaned.slice(0,3)} ${cleaned.slice(3,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8)}`;
    }
    return phone;
  };

  // Check if user can manage stations (only super_admin)
  const canManageStations = () => {
    return userRole === 'super_admin';
  };

  // Check if user can assign station managers (only super_admin)
  const canAssignManagers = () => {
    return userRole === 'super_admin';
  };

  // Get station statistics
  const getStationStats = () => {
    const total = stations.length;
    const active = stations.filter(s => s.isActive).length;
    const inactive = total - active;
    const withManager = stations.filter(s => s.manager).length;
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
    
    return { total, active, inactive, withManager, activePercentage };
  };

  const stats = getStationStats();

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
      {/* Header with gradient */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: 3
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          <BusinessIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Stations Management
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Manage bus stations across the transportation network
        </Typography>
      </Box>

      {/* Statistics Cards with better design */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #3f51b5'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3f51b5', mr: 2 }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Stations
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ height: 4, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #4caf50'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                  <CheckIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Stations
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  {stats.activePercentage}% Active
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.activePercentage} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 4, 
                    borderRadius: 2,
                    backgroundColor: '#e8f5e9',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #f44336'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                  <CancelIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.inactive}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive Stations
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0} 
                sx={{ 
                  height: 4, 
                  borderRadius: 2,
                  backgroundColor: '#ffebee',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#f44336'
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #2196f3'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#2196f3', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.withManager}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Manager
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.total > 0 ? Math.round((stats.withManager / stats.total) * 100) : 0}% Managed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter Section with modern design */}
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
          Filter Stations
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search Stations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, or city"
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>City</InputLabel>
              <Select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                label="City"
              >
                <MenuItem value="">All Cities</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end',
              pt: 1 
            }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
                sx={{ borderRadius: 2 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{ 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Search
              </Button>
              {canManageStations() && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Add Station
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading & Error States */}
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          my: 8 
        }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading stations...
          </Typography>
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 30 }
          }}
          action={
            <Button color="inherit" size="small" onClick={fetchStations}>
              Retry
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Error Loading Stations
          </Typography>
          {error}
        </Alert>
      ) : (
        <>
          {/* Stations Table with improved design */}
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
                <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                Stations List ({totalStations})
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Station Details</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Contact Info</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Manager</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LocationIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No stations found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {canManageStations() 
                              ? 'Try adding a new station or adjust your search filters.' 
                              : 'No stations match your search criteria.'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStations.map((station) => (
                      <TableRow 
                        key={station._id} 
                        hover 
                        sx={{ 
                          '&:hover': { bgcolor: '#f8f9fa' },
                          '&:last-child td': { borderBottom: 0 }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="subtitle2" fontWeight="bold">
                                {station.stationName}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CodeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Code: {station.stationCode}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                              <Typography variant="body2">
                                {station.location}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <CityIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {station.city}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {formatPhoneNumber(station.contactPhone)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                                {station.contactEmail}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {station.manager ? (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                                <Typography variant="body2" fontWeight="medium">
                                  {station.manager.fullName || 'N/A'}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 2.5 }}>
                                {station.manager.email || 'No email'}
                              </Typography>
                            </Box>
                          ) : canAssignManagers() ? (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              startIcon={<PersonIcon />}
                              onClick={() => {
                                setSelectedStation(station);
                                setEditFormData({
                                  ...station,
                                  manager: station.manager?._id || ''
                                });
                                setOpenEditDialog(true);
                              }}
                              sx={{ borderRadius: 1 }}
                            >
                              Assign Manager
                            </Button>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', opacity: 0.5 }} />
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No manager
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={statusColors[station.isActive ? 'active' : 'inactive'].icon}
                            label={station.isActive ? 'ACTIVE' : 'INACTIVE'}
                            sx={{
                              backgroundColor: statusColors[station.isActive ? 'active' : 'inactive'].bg,
                              color: statusColors[station.isActive ? 'active' : 'inactive'].text,
                              fontWeight: 'bold',
                              borderRadius: 1,
                              '& .MuiChip-icon': { color: statusColors[station.isActive ? 'active' : 'inactive'].text }
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => openView(station)}
                                sx={{ 
                                  bgcolor: '#e3f2fd',
                                  '&:hover': { bgcolor: '#bbdefb' }
                                }}
                              >
                                <ViewIcon fontSize="small" color="primary" />
                              </IconButton>
                            </Tooltip>
                            
                            {canManageStations() && (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => openEdit(station)}
                                    sx={{ 
                                      bgcolor: '#e8f5e9',
                                      '&:hover': { bgcolor: '#c8e6c9' }
                                    }}
                                  >
                                    <EditIcon fontSize="small" color="success" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={`${station.isActive ? 'Deactivate' : 'Activate'}`}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleToggleStatus(station)}
                                    sx={{ 
                                      bgcolor: station.isActive ? '#fff3e0' : '#e8f5e9',
                                      '&:hover': { bgcolor: station.isActive ? '#ffe0b2' : '#c8e6c9' }
                                    }}
                                  >
                                    {station.isActive ? (
                                      <CancelIcon fontSize="small" color="warning" />
                                    ) : (
                                      <CheckIcon fontSize="small" color="success" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton 
                                    size="small" 
                                    color="error" 
                                    onClick={() => openDelete(station)}
                                    disabled={station.isActive}
                                    sx={{ 
                                      bgcolor: '#ffebee',
                                      '&:hover': { bgcolor: '#ffcdd2' },
                                      '&.Mui-disabled': { opacity: 0.3 }
                                    }}
                                  >
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
            
            {/* Pagination with better styling */}
            {filteredStations.length > 0 && (
              <TablePagination
                component="div"
                count={totalStations}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
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
        </>
      )}

      {/* Snackbars for notifications */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccess('')} 
          severity="success" 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 26 }
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {success}
          </Typography>
        </Alert>
      </Snackbar>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError('')} 
          severity="error" 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-icon': { fontSize: 26 }
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {error}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Create Station Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => !formLoading && setOpenCreateDialog(false)} 
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AddIcon sx={{ mr: 2 }} />
            Create New Station
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Station Code *"
                value={formData.stationCode}
                onChange={(e) => setFormData({ ...formData, stationCode: e.target.value })}
                placeholder="e.g., BDR-01"
                helperText="Unique code for the station"
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Station Name *"
                value={formData.stationName}
                onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                placeholder="e.g., Bahir Dar Main Station"
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Location *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Near City Center, Main Road"
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Bahir Dar"
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Contact Phone *"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="e.g., +251900000000"
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="email"
                label="Contact Email *"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="e.g., station@bahirdar-transport.com"
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            {canAssignManagers() && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Station Manager</InputLabel>
                  <Select
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    label="Station Manager"
                    disabled={formLoading || managersLoading}
                  >
                    {managersLoading ? (
                      <MenuItem value="" disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            Loading station admins...
                          </Typography>
                        </Box>
                      </MenuItem>
                    ) : (
                      <Box>
                        <MenuItem value="">
                          <Typography color="text.secondary" fontStyle="italic">
                            No manager assigned
                          </Typography>
                        </MenuItem>
                        {managers.map((manager) => (
                          <MenuItem key={manager._id} value={manager._id}>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {manager.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {manager.email} • {manager.phoneNumber || 'No phone'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Box>
                    )}
                  </Select>
                  {!managersLoading && managers.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mt: 0.5 }}>
                      No active station admins found
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: canAssignManagers() ? 6 : 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    color="primary"
                    disabled={formLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Active Station</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inactive stations won't appear in trip creation
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenCreateDialog(false)} 
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateStation} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {formLoading ? 'Creating...' : 'Create Station'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Station Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {selectedStation && (
          <>
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ mr: 2 }} />
                  {selectedStation.stationName}
                </Box>
                <Chip
                  label={selectedStation.isActive ? 'ACTIVE' : 'INACTIVE'}
                  sx={{
                    backgroundColor: selectedStation.isActive ? '#4caf50' : '#f44336',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Station Code
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedStation.stationCode}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CityIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        City
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedStation.city}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Location
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {selectedStation.location}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Contact Phone
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {formatPhoneNumber(selectedStation.contactPhone)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Contact Email
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedStation.contactEmail}
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Station Manager
                        </Typography>
                      </Box>
                      {selectedStation.manager ? (
                        <Box sx={{ pl: 3 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {selectedStation.manager.fullName || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <EmailIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {selectedStation.manager.email || 'No email'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <PhoneIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {formatPhoneNumber(selectedStation.manager.phoneNumber)}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                          <Typography variant="body1" color="text.secondary" fontStyle="italic">
                            No manager assigned
                          </Typography>
                          {canAssignManagers() && (
                            <Button 
                              variant="outlined" 
                              size="small" 
                              startIcon={<PersonIcon />}
                              onClick={() => {
                                setOpenViewDialog(false);
                                openEdit(selectedStation);
                              }}
                              sx={{ mt: 2 }}
                            >
                              Assign Manager
                            </Button>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    <TimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Created
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedStation.createdAt ? format(new Date(selectedStation.createdAt), 'PP') : 'N/A'}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text-secondary" display="block">
                          Last Updated
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedStation.updatedAt ? format(new Date(selectedStation.updatedAt), 'PP') : 'N/A'}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setOpenViewDialog(false)} 
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
              {canManageStations() && (
                <>
                  <Button 
                    onClick={() => {
                      setOpenViewDialog(false);
                      openEdit(selectedStation);
                    }}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleToggleStatus(selectedStation)}
                    variant="contained"
                    color={selectedStation.isActive ? "warning" : "success"}
                    sx={{ borderRadius: 2 }}
                  >
                    {selectedStation.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Station Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => !formLoading && setOpenEditDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {editFormData && (
          <>
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EditIcon sx={{ mr: 2 }} />
                Edit Station
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {formLoading && <LinearProgress sx={{ mb: 2 }} />}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Station Code *"
                    value={editFormData.stationCode}
                    onChange={(e) => setEditFormData({ ...editFormData, stationCode: e.target.value })}
                    required
                    variant="outlined"
                    size="small"
                    disabled={formLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Station Name *"
                    value={editFormData.stationName}
                    onChange={(e) => setEditFormData({ ...editFormData, stationName: e.target.value })}
                    required
                    variant="outlined"
                    size="small"
                    disabled={formLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Location *"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    required
                    variant="outlined"
                    size="small"
                    disabled={formLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="City *"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    required
                    variant="outlined"
                    size="small"
                    disabled={formLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Phone *"
                    value={editFormData.contactPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                    required
                    variant="outlined"
                    size="small"
                    disabled={formLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Contact Email *"
                    value={editFormData.contactEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                    required
                    variant="outlined"
                    size="small"
                    disabled={formLoading}
                  />
                </Grid>
                {canAssignManagers() && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Station Manager</InputLabel>
                      <Select
                        value={editFormData.manager || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, manager: e.target.value })}
                        label="Station Manager"
                        disabled={formLoading || managersLoading}
                      >
                        {managersLoading ? (
                          <MenuItem value="" disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                Loading station admins...
                              </Typography>
                            </Box>
                          </MenuItem>
                        ) : (
                          <Box>
                            <MenuItem value="">
                              <Typography color="text.secondary" fontStyle="italic">
                                No manager assigned
                              </Typography>
                            </MenuItem>
                            {managers.map((manager) => (
                              <MenuItem key={manager._id} value={manager._id}>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {manager.fullName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {manager.email} • {manager.phoneNumber || 'No phone'}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Box>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: canAssignManagers() ? 6 : 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editFormData.isActive}
                        onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                        color="primary"
                        disabled={formLoading}
                      />
                    }
                    label="Active Station"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setOpenEditDialog(false)} 
                disabled={formLoading}
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditStation} 
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
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => !formLoading && setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 500 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f44336', 
          color: 'white',
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteIcon sx={{ mr: 2 }} />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Typography variant="h6" gutterBottom>
            Delete "{selectedStation?.stationName}"?
          </Typography>
          {selectedStation?.isActive && (
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' }
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                This station is currently active!
              </Typography>
              <Typography variant="body2">
                Please deactivate it first before deletion.
              </Typography>
            </Alert>
          )}
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              This action cannot be undone!
            </Typography>
            <Typography variant="body2">
              All associated data may be affected.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteStation} 
            variant="contained" 
            color="error"
            disabled={formLoading || selectedStation?.isActive}
            startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            {formLoading ? 'Deleting...' : 'Delete Station'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Stations;