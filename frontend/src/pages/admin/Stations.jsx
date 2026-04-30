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
  LinearProgress,
  FormHelperText
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
  const [userRole, setUserRole] = useState('super_admin'); // Force super_admin since this page is only for super_admin

  // Status colors
  const statusColors = {
    active: { bg: '#e8f5e9', text: '#2e7d32', icon: <CheckIcon fontSize="small" /> },
    inactive: { bg: '#ffebee', text: '#c62828', icon: <CancelIcon fontSize="small" /> }
  };

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

      let stationsData = [];
      let paginationData = {};

      if (response.data?.stations) {
        stationsData = response.data.stations;
        paginationData = response.data.pagination || {};
      } else if (response.data?.data?.stations) {
        stationsData = response.data.data.stations;
        paginationData = response.data.data.pagination || {};
      } else if (Array.isArray(response.data)) {
        stationsData = response.data;
      }

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

      let activeStations = [];
      if (response.data?.stations) {
        activeStations = response.data.stations;
      } else if (response.data?.data?.stations) {
        activeStations = response.data.data.stations;
      } else if (Array.isArray(response.data)) {
        activeStations = response.data;
      }

      const uniqueCities = [...new Set(activeStations.map(station => station.city).filter(Boolean))];
      setCities(uniqueCities);
    } catch (err) {
      console.error('Error fetching active stations:', err);
    }
  }, []);

  // Fetch station admins for manager dropdown
  const fetchStationAdmins = useCallback(async () => {
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

      // Filter for station admins that are active
      const stationAdmins = allUsers.filter(user => {
        return user.role === 'station_admin' && user.isActive === true;
      });

      setManagers(stationAdmins);
      setAvailableManagers(stationAdmins);

    } catch (userErr) {
      console.error('Error fetching station admins:', userErr);
      setManagers([]);
      setAvailableManagers([]);
    } finally {
      setManagersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
    fetchActiveStations();
    fetchStationAdmins();
  }, []);

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

  // Validate form data - ONLY required fields
  const validateForm = (data) => {
    const errors = [];

    if (!data.stationCode?.trim()) errors.push(t('station_code_required_error'));
    if (!data.stationName?.trim()) errors.push(t('station_name_required_error'));
    if (!data.location?.trim()) errors.push(t('location_required_error'));
    if (!data.city?.trim()) errors.push(t('city_required_error'));
    if (!data.contactPhone?.trim()) errors.push(t('contact_phone_required_error'));
    if (!data.contactEmail?.trim()) errors.push(t('contact_email_required_error'));

    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      errors.push(t('invalid_email_format'));
    }

    // Manager is NOT validated - it's optional
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
      // Build station data with ONLY required fields
      const stationData = {
        stationCode: formData.stationCode.toUpperCase().trim(),
        stationName: formData.stationName.trim(),
        location: formData.location.trim(),
        city: formData.city.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactEmail: formData.contactEmail.trim(),
        isActive: formData.isActive
      };

      // IMPORTANT: Only add manager field if a manager is selected AND not empty
      if (formData.manager && formData.manager.trim() !== '') {
        stationData.manager = formData.manager.trim();
      }

      console.log('Creating station with data:', stationData);

      const response = await api.post('/api/station/register', stationData);

      setSuccess(t('station_created_success'));
      setOpenCreateDialog(false);
      resetForm();
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      console.error('Error creating station:', err);
      console.error('Error response:', err.response?.data);

      // Show the actual error message from backend
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        t('failed_to_create_station');
      setError(errorMessage);
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
      // Build station data with ONLY required fields
      const stationData = {
        stationCode: editFormData.stationCode.toUpperCase().trim(),
        stationName: editFormData.stationName.trim(),
        location: editFormData.location.trim(),
        city: editFormData.city.trim(),
        contactPhone: editFormData.contactPhone.trim(),
        contactEmail: editFormData.contactEmail.trim(),
        isActive: editFormData.isActive
      };

      // IMPORTANT: Only add manager field if a manager is selected AND not empty
      if (editFormData.manager && editFormData.manager.trim() !== '') {
        stationData.manager = editFormData.manager.trim();
      }

      console.log('Updating station with data:', stationData);

      const response = await api.put(`/api/station/${editFormData._id}`, stationData);

      setSuccess(t('station_updated_success'));
      setOpenEditDialog(false);
      resetEditForm();
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      console.error('Error updating station:', err);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || t('failed_to_update_station'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete station
  const handleDeleteStation = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/api/station/${selectedStation._id}`);
      setSuccess(t('station_deleted_success'));
      setOpenDeleteDialog(false);
      setSelectedStation(null);
      fetchStations();
      fetchActiveStations();
      fetchStationAdmins();
    } catch (err) {
      console.error('Error deleting station:', err);
      setError(err.response?.data?.message || t('failed_to_delete_station'));
    } finally {
      setFormLoading(false);
    }
  };

  // Handle toggle station status
  const handleToggleStatus = async (station) => {
    try {
      if (station.isActive) {
        await api.patch(`/api/station/${station._id}/deactivate`);
        setSuccess(t('station_deactivated_success'));
      } else {
        await api.patch(`/api/station/${station._id}/activate`);
        setSuccess(t('station_activated_success'));
      }
      fetchStations();
    } catch (err) {
      console.error('Error toggling status:', err);
      setError(err.response?.data?.message || t('failed_to_update_status_error'));
    }
  };

  // Handle assign/remove manager
  const handleAssignManager = async () => {
    if (managerAssignmentData.action === 'assign' && !managerAssignmentData.manager) {
      setError(t('select_manager_error'));
      return;
    }

    setManagerAssignmentLoading(true);
    try {
      // Send empty string to remove manager, or manager ID to assign
      const updateData = {
        manager: managerAssignmentData.action === 'assign' ? managerAssignmentData.manager : ''
      };

      console.log('Updating manager:', updateData);
      await api.put(`/api/station/${managerAssignmentData.stationId}`, updateData);

      const actionText = managerAssignmentData.action === 'assign' ? t('manager_assigned_success') : t('manager_removed_success');
      setSuccess(actionText);
      setOpenAssignManagerDialog(false);
      resetManagerAssignmentForm();
      fetchStations();
      fetchStationAdmins();
    } catch (err) {
      console.error('Error managing manager:', err);
      setError(err.response?.data?.message || t('failed_to_update_manager'));
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
      isActive: station.isActive !== undefined ? station.isActive : true,
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
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('251')) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
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
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: 3
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          <BusinessIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          {t('station_management_title')}
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          {t('station_management_subtitle')}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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
                    {t('total_stations')}
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
        <Grid item xs={12} sm={6} md={3}>
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
                    {t('active_stations')}
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
        <Grid item xs={12} sm={6} md={3}>
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
                    {t('inactive_stations')}
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
        <Grid item xs={12} sm={6} md={3}>
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
                    {t('with_manager')}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.total > 0 ? Math.round((stats.withManager / stats.total) * 100) : 0}{t('managed_percentage')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter Section */}
      <Paper sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
          {t('filter_stations')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_stations_placeholder')}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('city')}</InputLabel>
              <Select
                value={cityFilter || ''}
                onChange={(e) => setCityFilter(e.target.value)}
                label={t('city')}
              >
                <MenuItem value="">{t('all_cities')}</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {t(city)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('status')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('status')}
              >
                <MenuItem value="all">{t('all_status_filters')}</MenuItem>
                <MenuItem value="active">{t('active')}</MenuItem>
                <MenuItem value="inactive">{t('inactive')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'flex-end',
              pt: 1
            }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
                sx={{ borderRadius: 2 }}
                fullWidth={{ xs: true, sm: false }}
              >
                {t('reset')}
              </Button>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                fullWidth={{ xs: true, sm: false }}
              >
                {t('search')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{ borderRadius: 2 }}
                fullWidth={{ xs: true, sm: false }}
              >
                {t('add_station')}
              </Button>
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
            {t('loading_stations')}
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
              {t('retry')}
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {t('error_loading_stations')}
          </Typography>
          {error}
        </Alert>
      ) : (
        <>
          {/* Stations Table */}
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
                {t('stations_list')} ({totalStations})
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('station_details')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('location')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('contact_info')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('manager')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>{t('status')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LocationIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {t('no_stations_found')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('add_station_hint')}
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
                                {t('code_prefix')} {station.stationCode}
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
                                {station.manager.email || t('no_email')}
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', opacity: 0.5 }} />
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                {t('no_manager')}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={statusColors[station.isActive ? 'active' : 'inactive'].icon}
                            label={station.isActive ? t('active') : t('inactive')}
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
                            <Tooltip title={t('view_details')}>
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

                            <Tooltip title={t('edit_station')}>
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

                            <Tooltip title={station.isActive ? t('deactivate') : t('activate')}>
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

                            <Tooltip title={t('delete')}>
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
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
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
            {t('create_new_station')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('station_code_required')}
                value={formData.stationCode}
                onChange={(e) => setFormData({ ...formData, stationCode: e.target.value.toUpperCase() })}
                placeholder={t('station_code_placeholder')}
                helperText={t('unique_station_identifier')}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('station_name_required')}
                value={formData.stationName}
                onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                placeholder={t('station_name_placeholder')}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('location_required')}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('location_placeholder')}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('city_required')}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t('city_placeholder')}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('contact_phone_required')}
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder={t('phone_placeholder')}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label={t('contact_email_required')}
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder={t('email_placeholder')}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('station_manager_optional')}</InputLabel>
                <Select
                  value={formData.manager || ''}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  label={t('station_manager_optional')}
                  disabled={formLoading || managersLoading}
                >
                  <MenuItem value="">
                    <Typography color="text.secondary" fontStyle="italic">
                      {t('none_no_manager')}
                    </Typography>
                  </MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager._id} value={manager._id}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {manager.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {manager.email} • {manager.phoneNumber || t('na')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{t('manager_optional_hint')}</FormHelperText>
                {!managersLoading && managers.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mt: 0.5 }}>
                    {t('no_active_admins_available')}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
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
                    <Typography variant="body2">{t('active_station_toggle')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('inactive_station_hint')}
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
            {t('cancel')}
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
            {formLoading ? t('creating') : t('create_station_button')}
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
                  label={selectedStation.isActive ? 'Active' : 'Inactive'}
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
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('station_code')}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedStation.stationCode}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CityIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('city')}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {t(selectedStation.city)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('location')}
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {selectedStation.location}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('contact_phone')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {formatPhoneNumber(selectedStation.contactPhone)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('contact_email')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedStation.contactEmail}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {t('station_manager')}
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
                              {t('change_manager')}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                          <Typography variant="body1" color="text.secondary" fontStyle="italic">
                            {t('no_manager_assigned')}
                          </Typography>
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
                            {t('assign_manager')}
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    <TimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {t('additional_information')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t('created_at')}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {selectedStation.createdAt ? format(new Date(selectedStation.createdAt), 'PP') : 'N/A'}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
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
                {t('close')}
              </Button>
              <Button
                onClick={() => {
                  setOpenViewDialog(false);
                  openEdit(selectedStation);
                }}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                {t('edit')}
              </Button>
              <Button
                onClick={() => handleToggleStatus(selectedStation)}
                variant="contained"
                color={selectedStation.isActive ? "warning" : "success"}
                sx={{ borderRadius: 2 }}
              >
                {selectedStation.isActive ? t('deactivate') : t('activate')}
              </Button>
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
            {t('edit_station')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('station_code_required')}
                value={editFormData.stationCode || ''}
                onChange={(e) => setEditFormData({ ...editFormData, stationCode: e.target.value.toUpperCase() })}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('station_name_required')}
                value={editFormData.stationName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, stationName: e.target.value })}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('location_required')}
                value={editFormData.location || ''}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('city_required')}
                value={editFormData.city || ''}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('contact_phone_required')}
                value={editFormData.contactPhone || ''}
                onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label={t('contact_email_required')}
                value={editFormData.contactEmail || ''}
                onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                required
                variant="outlined"
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('station_manager_optional')}</InputLabel>
                <Select
                  value={editFormData.manager || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, manager: e.target.value })}
                  label={t('station_manager_optional')}
                  disabled={formLoading || managersLoading}
                >
                  <MenuItem value="">
                    <Typography color="text.secondary" fontStyle="italic">
                      {t('none_no_manager')}
                    </Typography>
                  </MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager._id} value={manager._id}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {manager.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {manager.email} • {manager.phoneNumber || t('na')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{t('manager_optional_hint')}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.isActive || false}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    color="primary"
                    disabled={formLoading}
                  />
                }
                label={t('active_station_toggle')}
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
            {t('cancel')}
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
            {formLoading ? t('saving') : t('save_changes')}
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
            {managerAssignmentData.action === 'assign' ? t('assign_manager') : t('remove_manager')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {managerAssignmentLoading && <LinearProgress sx={{ mb: 2 }} />}

          <Typography variant="h6" gutterBottom>
            {t('station_prefix')} {managerAssignmentData.stationName}
          </Typography>

          {managerAssignmentData.action === 'assign' ? (
            <FormControl fullWidth size="medium" sx={{ mt: 2 }}>
              <InputLabel>{t('select_manager_required')}</InputLabel>
              <Select
                value={managerAssignmentData.manager || ''}
                onChange={(e) => setManagerAssignmentData({ ...managerAssignmentData, manager: e.target.value })}
                label={t('select_manager_required')}
                disabled={managerAssignmentLoading || managersLoading}
              >
                {managersLoading ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {t('loading_admins')}
                      </Typography>
                    </Box>
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="">
                      <Typography color="text.secondary" fontStyle="italic">
                        {t('select_a_manager')}
                      </Typography>
                    </MenuItem>
                    {availableManagers.map((manager) => (
                      <MenuItem key={manager._id} value={manager._id}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {manager.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manager.email} • {manager.phoneNumber || t('na')}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
              {!managersLoading && availableManagers.length === 0 && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2">
                    {t('no_admins_available_alert')}
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
                {t('confirm_remove_manager')}
              </Typography>
              <Typography variant="body2">
                {t('remove_manager_confirm_text')}
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
            {t('cancel')}
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
            {managerAssignmentLoading ? t('processing') :
              (managerAssignmentData.action === 'assign' ? t('assign_manager') : t('remove_manager'))}
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
            {t('confirm_delete')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          <Typography variant="h6" gutterBottom>
            {t('delete_confirm_question', { name: selectedStation?.stationName })}
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
                {t('station_active_warning')}
              </Typography>
              <Typography variant="body2">
                {t('deactivate_before_delete_hint')}
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
              {t('action_cannot_be_undone')}
            </Typography>
            <Typography variant="body2">
              {t('associated_data_permanent_removal')}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={formLoading}
            sx={{ borderRadius: 2 }}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleDeleteStation}
            variant="contained"
            color="error"
            disabled={formLoading || selectedStation?.isActive}
            startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            {formLoading ? t('deleting') : t('delete_station_button')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Stations;