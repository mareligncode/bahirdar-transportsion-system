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
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';

const Stations = () => {
  const { t } = useTranslation();
  
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
  const [openAssignManagerDialog, setOpenAssignManagerDialog] = useState(false);
  
  // Form states with proper initialization
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
  
  const [editFormData, setEditFormData] = useState({
    stationCode: '',
    stationName: '',
    location: '',
    city: '',
    contactPhone: '',
    contactEmail: '',
    manager: '',
    isActive: true,
    _id: ''
  });

  // Manager assignment form state
  const [managerAssignmentData, setManagerAssignmentData] = useState({
    stationId: '',
    stationName: '',
    manager: '',
    action: 'assign'
  });
  
  const [selectedStation, setSelectedStation] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [managerAssignmentLoading, setManagerAssignmentLoading] = useState(false);
  
  // Data for dropdowns
  const [cities, setCities] = useState([]);
  const [managers, setManagers] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
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
        console.error(t('errors.tokenParse'), err);
      }
    }
  }, [t]);

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
      console.error(t('errors.fetchStations'), err);
      setError(err.response?.data?.message || t('errors.failedToLoadStations'));
      setStations([]);
      setFilteredStations([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, cityFilter, statusFilter, t]);

  // Fetch active stations for cities dropdown
  const fetchActiveStations = useCallback(async () => {
    try {
      const response = await api.get('/api/station/active');
      
      const activeStations = response.data?.stations || [];
      const uniqueCities = [...new Set(activeStations.map(station => station.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (err) {
      console.error(t('errors.fetchActiveStations'), err);
    }
  }, [t]);

  // Fetch station admins for manager dropdown (only for super_admin)
  const fetchStationAdmins = useCallback(async () => {
    if (userRole !== 'super_admin') {
      setManagers([]);
      setAvailableManagers([]);
      return;
    }

    setManagersLoading(true);
    try {
      const usersRes = await api.get('/api/auth/all-users');
      
      let allUsers = [];
      
      if (usersRes.data?.success && usersRes.data?.data?.users) {
        allUsers = usersRes.data.data.users;
      } else if (usersRes.data?.data?.users) {
        allUsers = usersRes.data.data.users;
      } else if (usersRes.data?.users) {
        allUsers = usersRes.data.users;
      } else if (Array.isArray(usersRes.data)) {
        allUsers = usersRes.data;
      }
      
      const stationAdmins = allUsers.filter(user => {
        return user.role === 'station_admin' && user.isActive === true;
      });
      
      setManagers(stationAdmins);
      setAvailableManagers(stationAdmins);
      
    } catch (userErr) {
      console.error(t('errors.fetchStationAdmins'), userErr);
      setManagers([]);
      setAvailableManagers([]);
    } finally {
      setManagersLoading(false);
    }
  }, [userRole, t]);

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
    
    if (!data.stationCode?.trim()) errors.push(t('validation.stationCodeRequired'));
    if (!data.stationName?.trim()) errors.push(t('validation.stationNameRequired'));
    if (!data.location?.trim()) errors.push(t('validation.locationRequired'));
    if (!data.city?.trim()) errors.push(t('validation.cityRequired'));
    if (!data.contactPhone?.trim()) errors.push(t('validation.contactPhoneRequired'));
    if (!data.contactEmail?.trim()) errors.push(t('validation.contactEmailRequired'));
    
    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      errors.push(t('validation.invalidEmailFormat'));
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
        stationCode: formData.stationCode.toUpperCase().trim(),
        stationName: formData.stationName.trim(),
        location: formData.location.trim(),
        city: formData.city.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactEmail: formData.contactEmail.trim(),
        isActive: formData.isActive
      };

      // Only add manager field if a manager is selected
      if (formData.manager && formData.manager.trim()) {
        stationData.manager = formData.manager.trim();
      }

      const response = await api.post('/api/station/register', stationData);
      setSuccess(t('messages.stationCreated'));
      setOpenCreateDialog(false);
      resetForm();
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      console.error(t('errors.createStation'), err);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || t('errors.failedToCreateStation'));
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
        stationCode: editFormData.stationCode.toUpperCase().trim(),
        stationName: editFormData.stationName.trim(),
        location: editFormData.location.trim(),
        city: editFormData.city.trim(),
        contactPhone: editFormData.contactPhone.trim(),
        contactEmail: editFormData.contactEmail.trim(),
        isActive: editFormData.isActive
      };

      // Only add manager field if a manager is selected
      if (editFormData.manager && editFormData.manager.trim()) {
        stationData.manager = editFormData.manager.trim();
      }

      const response = await api.put(`/api/station/${editFormData._id}`, stationData);
      setSuccess(t('messages.stationUpdated'));
      setOpenEditDialog(false);
      resetEditForm();
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      console.error(t('errors.editStation'), err);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || t('errors.failedToUpdateStation'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete station
  const handleDeleteStation = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/station/${selectedStation._id}`);
      setSuccess(t('messages.stationDeleted'));
      setOpenDeleteDialog(false);
      setSelectedStation(null);
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      console.error(t('errors.deleteStation'), err);
      setError(err.response?.data?.message || t('errors.failedToDeleteStation'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle toggle station status
  const handleToggleStatus = async (station) => {
    try {
      if (station.isActive) {
        const response = await api.patch(`/api/station/${station._id}/deactivate`);
        setSuccess(t('messages.stationDeactivated'));
      } else {
        const response = await api.patch(`/api/station/${station._id}/activate`);
        setSuccess(t('messages.stationActivated'));
      }
      fetchStations();
    } catch (err) {
      console.error(t('errors.toggleStatus'), err);
      setError(err.response?.data?.message || t('errors.failedToUpdateStationStatus'));
    }
  };

  // Handle assign/remove manager
  const handleAssignManager = async () => {
    if (managerAssignmentData.action === 'assign' && !managerAssignmentData.manager) {
      setError(t('validation.selectManager'));
      return;
    }
    
    setManagerAssignmentLoading(true);
    try {
      // Create update data object
      const updateData = {};
      
      if (managerAssignmentData.action === 'assign') {
        // When assigning, send the manager ID
        updateData.manager = managerAssignmentData.manager;
      } else {
        // When removing, DO NOT include manager field at all
        // This will let the backend handle it properly
        updateData.manager = '';
      }

      console.log('Sending manager update:', {
        stationId: managerAssignmentData.stationId,
        action: managerAssignmentData.action,
        updateData: updateData
      });

      const response = await api.put(`/api/station/${managerAssignmentData.stationId}`, updateData);
      
      const actionText = managerAssignmentData.action === 'assign' ? t('common.assigned') : t('common.removed');
      setSuccess(`${t('common.manager')} ${actionText} ${t('common.successfully')}!`);
      setOpenAssignManagerDialog(false);
      resetManagerAssignmentForm();
      fetchStations();
      fetchStationAdmins();
    } catch (err) {
      console.error(t('errors.managerAssignment'), err);
      console.error('Error response:', err.response?.data);
      
      // More detailed error logging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      
      setError(err.response?.data?.message || 
               err.response?.data?.errors?.[0]?.msg || 
               t('errors.failedToUpdateManager'));
    } finally {
      setManagerAssignmentLoading(false);
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

  // Reset edit form
  const resetEditForm = () => {
    setEditFormData({
      stationCode: '',
      stationName: '',
      location: '',
      city: '',
      contactPhone: '',
      contactEmail: '',
      manager: '',
      isActive: true,
      _id: ''
    });
  };

  // Reset manager assignment form
  const resetManagerAssignmentForm = () => {
    setManagerAssignmentData({
      stationId: '',
      stationName: '',
      manager: '',
      action: 'assign'
    });
  };

  // Open edit dialog
  const openEdit = (station) => {
    setEditFormData({
      stationCode: station.stationCode || '',
      stationName: station.stationName || '',
      location: station.location || '',
      city: station.city || '',
      contactPhone: station.contactPhone || '',
      contactEmail: station.contactEmail || '',
      manager: station.manager?._id || station.manager || '',
      isActive: station.isActive || true,
      _id: station._id || ''
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

  // Open assign manager dialog
  const openAssignManager = (station) => {
    setManagerAssignmentData({
      stationId: station._id || '',
      stationName: station.stationName || '',
      manager: station.manager?._id || station.manager || '',
      action: station.manager ? 'remove' : 'assign'
    });
    setOpenAssignManagerDialog(true);
  };

  // Format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return t('common.na');
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
          {t('stations.title')}
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          {t('stations.description')}
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
                    {t('stations.totalStations')}
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
                    {t('stations.activeStations')}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  {stats.activePercentage}% {t('stations.active')}
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
                    {t('stations.inactiveStations')}
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
                    {t('stations.withManager')}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.total > 0 ? Math.round((stats.withManager / stats.total) * 100) : 0}% {t('stations.managed')}
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
          {t('stations.filterStations')}
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label={t('stations.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('stations.searchPlaceholder')}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('stations.city')}</InputLabel>
              <Select
                value={cityFilter || ''}
                onChange={(e) => setCityFilter(e.target.value)}
                label={t('stations.city')}
              >
                <MenuItem value="">{t('stations.allCities')}</MenuItem>
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
              <InputLabel>{t('stations.status')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('stations.status')}
              >
                <MenuItem value="all">{t('stations.allStatus')}</MenuItem>
                <MenuItem value="active">{t('stations.active')}</MenuItem>
                <MenuItem value="inactive">{t('stations.inactive')}</MenuItem>
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
                {t('common.reset')}
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
                {t('common.search')}
              </Button>
              {canManageStations() && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('stations.addStation')}
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
            {t('common.loading')}
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
              {t('common.retry')}
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {t('errors.errorLoadingStations')}
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
                {t('stations.stationsList')} ({totalStations})
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('stations.stationDetails')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('stations.location')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('stations.contactInfo')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('stations.manager')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('stations.status')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>{t('stations.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LocationIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {t('stations.noStationsFound')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {canManageStations() 
                              ? t('stations.noStationsAdd')
                              : t('stations.noStationsMatch')}
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
                                {t('stations.code')}: {station.stationCode}
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
                                  {station.manager.fullName || t('common.na')}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 2.5 }}>
                                {station.manager.email || t('common.noEmail')}
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', opacity: 0.5 }} />
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                {t('stations.noManager')}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={statusColors[station.isActive ? 'active' : 'inactive'].icon}
                            label={station.isActive ? t('stations.active') : t('stations.inactive')}
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
                            <Tooltip title={t('common.viewDetails')}>
                              <span>
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
                              </span>
                            </Tooltip>
                            
                            {canManageStations() && (
                              <>
                                <Tooltip title={t('stations.editStation')}>
                                  <span>
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
                                  </span>
                                </Tooltip>
                                <Tooltip title={station.manager ? t('stations.removeManager') : t('stations.assignManager')}>
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => openAssignManager(station)}
                                      sx={{ 
                                        bgcolor: station.manager ? '#fff3e0' : '#e3f2fd',
                                        '&:hover': { bgcolor: station.manager ? '#ffe0b2' : '#bbdefb' }
                                      }}
                                    >
                                      {station.manager ? (
                                        <PersonIcon fontSize="small" color="warning" />
                                      ) : (
                                        <AssignmentIcon fontSize="small" color="info" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title={station.isActive ? t('stations.deactivate') : t('stations.activate')}>
                                  <span>
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
                                  </span>
                                </Tooltip>
                                <Tooltip title={t('common.delete')}>
                                  <span>
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
            {t('stations.createNewStation')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={`${t('stations.stationCode')} *`}
                value={formData.stationCode}
                onChange={(e) => setFormData({ ...formData, stationCode: e.target.value })}
                placeholder={t('stations.stationCodePlaceholder')}
                helperText={t('stations.stationCodeHelper')}
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
                label={`${t('stations.stationName')} *`}
                value={formData.stationName}
                onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                placeholder={t('stations.stationNamePlaceholder')}
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
                label={`${t('stations.location')} *`}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('stations.locationPlaceholder')}
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
                label={`${t('stations.city')} *`}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t('stations.cityPlaceholder')}
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
                label={`${t('stations.contactPhone')} *`}
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder={t('stations.contactPhonePlaceholder')}
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
                label={`${t('stations.contactEmail')} *`}
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder={t('stations.contactEmailPlaceholder')}
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
                  <InputLabel>{t('stations.stationManagerOptional')}</InputLabel>
                  <Select
                    value={formData.manager || ''}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    label={t('stations.stationManagerOptional')}
                    disabled={formLoading || managersLoading}
                  >
                    <MenuItem value="">
                      <Typography color="text.secondary" fontStyle="italic">
                        {t('stations.noManagerAssigned')}
                      </Typography>
                    </MenuItem>
                    {managers.map((manager) => (
                      <MenuItem key={manager._id} value={manager._id}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {manager.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manager.email} • {manager.phoneNumber || t('common.noPhone')}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {!managersLoading && managers.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mt: 0.5 }}>
                      {t('stations.noActiveStationAdmins')}
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
                    <Typography variant="body2">{t('stations.activeStation')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('stations.inactiveStationHelper')}
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
            {t('common.cancel')}
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
            {formLoading ? t('common.creating') : t('stations.createStation')}
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
                  label={selectedStation.isActive ? t('stations.active') : t('stations.inactive')}
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
                        {t('stations.stationCode')}
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
                        {t('stations.city')}
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
                        {t('stations.location')}
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
                        {t('stations.contactPhone')}
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
                        {t('stations.contactEmail')}
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
                          {t('stations.stationManager')}
                        </Typography>
                      </Box>
                      {selectedStation.manager ? (
                        <Box sx={{ pl: 3 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {selectedStation.manager.fullName || t('common.na')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <EmailIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {selectedStation.manager.email || t('common.noEmail')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <PhoneIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {formatPhoneNumber(selectedStation.manager.phoneNumber)}
                          </Typography>
                          {canAssignManagers() && (
                            <Box sx={{ mt: 2 }}>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                startIcon={<PersonIcon />}
                                onClick={() => {
                                  setOpenViewDialog(false);
                                  openAssignManager(selectedStation);
                                }}
                              >
                                {t('stations.changeManager')}
                              </Button>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                          <Typography variant="body1" color="text.secondary" fontStyle="italic">
                            {t('stations.noManagerAssigned')}
                          </Typography>
                          {canAssignManagers() && (
                            <Button 
                              variant="outlined" 
                              size="small" 
                              startIcon={<AssignmentIcon />}
                              onClick={() => {
                                setOpenViewDialog(false);
                                openAssignManager(selectedStation);
                              }}
                              sx={{ mt: 2 }}
                            >
                              {t('stations.assignManager')}
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
                    {t('stations.additionalInfo')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('stations.created')}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedStation.createdAt ? format(new Date(selectedStation.createdAt), 'PP') : t('common.na')}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text-secondary" display="block">
                          {t('stations.lastUpdated')}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedStation.updatedAt ? format(new Date(selectedStation.updatedAt), 'PP') : t('common.na')}
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
                {t('common.close')}
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
                    {t('common.edit')}
                  </Button>
                  <Button 
                    onClick={() => handleToggleStatus(selectedStation)}
                    variant="contained"
                    color={selectedStation.isActive ? "warning" : "success"}
                    sx={{ borderRadius: 2 }}
                  >
                    {selectedStation.isActive ? t('stations.deactivate') : t('stations.activate')}
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
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 2 }} />
            {t('stations.editStation')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={`${t('stations.stationCode')} *`}
                value={editFormData.stationCode || ''}
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
                label={`${t('stations.stationName')} *`}
                value={editFormData.stationName || ''}
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
                label={`${t('stations.location')} *`}
                value={editFormData.location || ''}
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
                label={`${t('stations.city')} *`}
                value={editFormData.city || ''}
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
                label={`${t('stations.contactPhone')} *`}
                value={editFormData.contactPhone || ''}
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
                label={`${t('stations.contactEmail')} *`}
                value={editFormData.contactEmail || ''}
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
                  <InputLabel>{t('stations.stationManagerOptional')}</InputLabel>
                  <Select
                    value={editFormData.manager || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, manager: e.target.value })}
                    label={t('stations.stationManagerOptional')}
                    disabled={formLoading || managersLoading}
                  >
                    <MenuItem value="">
                      <Typography color="text.secondary" fontStyle="italic">
                        {t('stations.noManagerAssigned')}
                      </Typography>
                    </MenuItem>
                    {managers.map((manager) => (
                      <MenuItem key={manager._id} value={manager._id}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {manager.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manager.email} • {manager.phoneNumber || t('common.noPhone')}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={{ xs: 12, md: canAssignManagers() ? 6 : 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.isActive || false}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    color="primary"
                    disabled={formLoading}
                  />
                }
                label={t('stations.activeStation')}
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
            {t('common.cancel')}
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
            {formLoading ? t('common.saving') : t('common.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign/Remove Manager Dialog */}
      <Dialog 
        open={openAssignManagerDialog} 
        onClose={() => !managerAssignmentLoading && setOpenAssignManagerDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: managerAssignmentData.action === 'assign' ? '#2196f3' : '#ff9800', 
          color: 'white',
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {managerAssignmentData.action === 'assign' ? (
              <AssignmentIcon sx={{ mr: 2 }} />
            ) : (
              <PersonIcon sx={{ mr: 2 }} />
            )}
            {managerAssignmentData.action === 'assign' ? t('stations.assignManager') : t('stations.removeManager')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {managerAssignmentLoading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Typography variant="h6" gutterBottom>
            {t('stations.station')}: {managerAssignmentData.stationName}
          </Typography>
          
          {managerAssignmentData.action === 'assign' ? (
            <FormControl fullWidth size="medium" sx={{ mt: 2 }}>
              <InputLabel>{t('stations.selectManager')} *</InputLabel>
              <Select
                value={managerAssignmentData.manager || ''}
                onChange={(e) => setManagerAssignmentData({ ...managerAssignmentData, manager: e.target.value })}
                label={`${t('stations.selectManager')} *`}
                disabled={managerAssignmentLoading || managersLoading}
              >
                {managersLoading ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {t('stations.loadingStationAdmins')}
                      </Typography>
                    </Box>
                  </MenuItem>
                ) : (
                  <Box>
                    <MenuItem value="">
                      <Typography color="text.secondary" fontStyle="italic">
                        {t('stations.selectAManager')}
                      </Typography>
                    </MenuItem>
                    {availableManagers.map((manager) => (
                      <MenuItem key={manager._id} value={manager._id}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {manager.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manager.email} • {manager.phoneNumber || t('common.noPhone')}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Box>
                )}
              </Select>
              {!managersLoading && availableManagers.length === 0 && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2">
                    {t('stations.noStationAdminsAvailable')}
                  </Typography>
                </Alert>
              )}
            </FormControl>
          ) : (
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 2, 
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' }
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {t('stations.confirmRemoveManager')}
              </Typography>
              <Typography variant="body2">
                {t('stations.removeManagerWarning')}
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenAssignManagerDialog(false)} 
            disabled={managerAssignmentLoading}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleAssignManager} 
            variant="contained" 
            color={managerAssignmentData.action === 'assign' ? "primary" : "warning"}
            disabled={managerAssignmentLoading || (managerAssignmentData.action === 'assign' && !managerAssignmentData.manager)}
            startIcon={managerAssignmentLoading ? <CircularProgress size={20} /> : 
              (managerAssignmentData.action === 'assign' ? <AssignmentIcon /> : <PersonIcon />)}
            sx={{ 
              borderRadius: 2,
              background: managerAssignmentData.action === 'assign' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)'
            }}
          >
            {managerAssignmentLoading ? t('common.processing') : 
              (managerAssignmentData.action === 'assign' ? t('stations.assignManager') : t('stations.removeManager'))}
          </Button>
        </DialogActions>
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
            {t('stations.confirmDelete')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Typography variant="h6" gutterBottom>
            {t('stations.deleteConfirmation', { stationName: selectedStation?.stationName })}
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
                {t('stations.stationActiveWarning')}
              </Typography>
              <Typography variant="body2">
                {t('stations.deactivateBeforeDelete')}
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
              {t('stations.actionCannotBeUndone')}
            </Typography>
            <Typography variant="body2">
              {t('stations.deleteDataWarning')}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteStation} 
            variant="contained" 
            color="error"
            disabled={formLoading || selectedStation?.isActive}
            startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            {formLoading ? t('common.deleting') : t('stations.deleteStation')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Stations;