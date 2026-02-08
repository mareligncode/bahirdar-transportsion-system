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
  Switch,
  FormControlLabel,
  Checkbox,
  InputAdornment,
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
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PhotoCamera as CameraIcon,
  MoreVert as MoreVertIcon,
  LocalGasStation as FuelIcon,
  CalendarToday as CalendarIcon,
  Speed as SpeedIcon,
  ColorLens as ColorIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Business as StationIcon,
  Upload as UploadIcon,
  Assignment as AssignmentIcon,
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import api from '../../services/api';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [openAssignDriverDialog, setOpenAssignDriverDialog] = useState(false);
  const [openRemoveDriverDialog, setOpenRemoveDriverDialog] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [anchorEl, setAnchorEl] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [stations, setStations] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userStationId, setUserStationId] = useState('');
  const [stationName, setStationName] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    carType: 'coaster',
    totalCapacity: '',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    color: 'white',
    fuelType: 'diesel',
    insuranceExpiry: '',
    features: [],
    stationID: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    description: '',
    cost: '',
    mileage: '',
    servicedBy: '',
    notes: ''
  });

  const [imageForm, setImageForm] = useState({
    images: [],
    primaryImageIndex: null
  });

  const [assignDriverForm, setAssignDriverForm] = useState({
    driverId: ''
  });

  // Vehicle stats
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    on_trip: 0,
    maintenance: 0,
    active: 0,
    inactive: 0,
    insuranceExpiring: 0
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

  // Fetch station name
  const fetchStationName = useCallback(async () => {
    if (userStationId) {
      try {
        const response = await api.get(`/api/station/${userStationId}`);
        if (response.data?.station) {
          setStationName(response.data.station.stationName);
        }
      } catch (err) {
        console.error('Error fetching station name:', err);
      }
    }
  }, [userStationId]);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters based on user role
      let url = '/api/vehicles';
      const params = new URLSearchParams();
      
      // For station admin, backend will filter automatically based on their stationID
      // But we can also add it as query param
      if (userRole === 'station_admin' && userStationId) {
        params.append('stationID', userStationId);
      }
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await api.get(url);
      
      // Handle different response structures
      let vehiclesData = [];
      if (response.data?.data?.vehicles) {
        vehiclesData = response.data.data.vehicles;
      } else if (Array.isArray(response.data?.data)) {
        vehiclesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        vehiclesData = response.data;
      } else if (response.data?.vehicles) {
        vehiclesData = response.data.vehicles;
      }
      
      // Additional frontend filtering (safety check)
      if (userRole === 'station_admin' && userStationId) {
        vehiclesData = vehiclesData.filter(vehicle => {
          const vehicleStationId = vehicle.stationID?._id || vehicle.stationID;
          return vehicleStationId === userStationId;
        });
      }
      
      setVehicles(vehiclesData);
      setFilteredVehicles(vehiclesData);
      
      // Calculate statistics
      calculateStats(vehiclesData);

      // Fetch related data
      await fetchRelatedData();

    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [userRole, userStationId]);

  // Fetch related data
  const fetchRelatedData = async () => {
    try {
      // Fetch station name
      await fetchStationName();

      // Fetch drivers (only from station for station admin)
      let driversData = [];
      if (userRole === 'station_admin' && userStationId) {
        const driversResponse = await api.get('/api/auth/station-users');
        driversData = driversResponse.data.data?.users?.filter(user => 
          user.role === 'driver' && 
          user.isActive === true
        ) || [];
      } else if (userRole === 'super_admin') {
        const driversResponse = await api.get('/api/auth/all-users');
        driversData = driversResponse.data.data?.users?.filter(user => 
          user.role === 'driver' && 
          user.isActive === true
        ) || [];
      }
      setDrivers(driversData);

      // Fetch stations for super admin
      if (userRole === 'super_admin') {
        const stationsResponse = await api.get('/api/station/active');
        setStations(stationsResponse.data?.stations || []);
      } else if (userRole === 'station_admin' && userStationId) {
        // Station admin only needs their station
        const stationResponse = await api.get(`/api/station/${userStationId}`);
        if (stationResponse.data?.station) {
          setStations([stationResponse.data.station]);
        }
      }

    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const calculateStats = (vehiclesData) => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const stats = {
      total: vehiclesData.length,
      available: vehiclesData.filter(v => v.currentStatus === 'available').length,
      on_trip: vehiclesData.filter(v => v.currentStatus === 'on_trip').length,
      maintenance: vehiclesData.filter(v => v.currentStatus === 'maintenance').length,
      active: vehiclesData.filter(v => v.isActive).length,
      inactive: vehiclesData.filter(v => !v.isActive).length,
      insuranceExpiring: vehiclesData.filter(v => {
        if (!v.insuranceExpiry) return false;
        const expiryDate = new Date(v.insuranceExpiry);
        return expiryDate > today && expiryDate <= nextMonth;
      }).length
    };
    setStats(stats);
  };

  useEffect(() => {
    if (userRole) {
      fetchVehicles();
    }
  }, [fetchVehicles, userRole]);

  // Filter vehicles based on search and filters
  useEffect(() => {
    let filtered = vehicles;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.driverID?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.currentStatus === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.carType === typeFilter);
    }

    setFilteredVehicles(filtered);
    setPage(0);
  }, [vehicles, searchTerm, statusFilter, typeFilter]);

  // Dialog handlers
  const handleOpenCreateDialog = () => {
    // Auto-fill station ID for station admin
    const stationID = userStationId || '';
    
    setVehicleForm({
      plateNumber: '',
      carType: 'coaster',
      totalCapacity: '',
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      color: 'white',
      fuelType: 'diesel',
      insuranceExpiry: '',
      features: [],
      stationID: stationID
    });
    setOpenCreateDialog(true);
  };

  const handleOpenEditDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleForm({
      plateNumber: vehicle.plateNumber || '',
      carType: vehicle.carType || 'coaster',
      totalCapacity: vehicle.totalCapacity || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear().toString(),
      color: vehicle.color || 'white',
      fuelType: vehicle.fuelType || 'diesel',
      insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0] : '',
      features: vehicle.features || [],
      stationID: vehicle.stationID?._id || vehicle.stationID || userStationId || ''
    });
    setOpenEditDialog(true);
  };

  const handleOpenDetailModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenDetailModal(true);
  };

  const handleOpenStatusDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenStatusDialog(true);
  };

  const handleOpenDeleteDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenDeleteDialog(true);
  };

  const handleOpenImageDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setImageForm({
      images: [],
      primaryImageIndex: null
    });
    setOpenImageDialog(true);
  };

  const handleOpenMaintenanceDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setMaintenanceForm({
      description: '',
      cost: '',
      mileage: vehicle.mileage || '',
      servicedBy: '',
      notes: ''
    });
    setOpenMaintenanceDialog(true);
  };

  const handleOpenAssignDriverDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setAssignDriverForm({
      driverId: vehicle.driverID?._id || ''
    });
    setOpenAssignDriverDialog(true);
  };

  const handleOpenRemoveDriverDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenRemoveDriverDialog(true);
  };

  const handleMenuClick = (event, vehicle) => {
    setAnchorEl(event.currentTarget);
    setSelectedVehicle(vehicle);
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
    setOpenImageDialog(false);
    setOpenMaintenanceDialog(false);
    setOpenAssignDriverDialog(false);
    setOpenRemoveDriverDialog(false);
    setSelectedVehicle(null);
    setAnchorEl(null);
    setError('');
    setFormLoading(false);
  };

  // API Actions
  const handleCreateVehicle = async () => {
    try {
      // Validate required fields
      const requiredFields = ['plateNumber', 'carType', 'totalCapacity', 'make', 'model', 'insuranceExpiry'];
      const missingFields = requiredFields.filter(field => !vehicleForm[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate station for station admin
      if (userRole === 'station_admin' && !userStationId) {
        setError('Station ID is required');
        return;
      }

      setFormLoading(true);

      const payload = {
        ...vehicleForm,
        totalCapacity: parseInt(vehicleForm.totalCapacity),
        year: vehicleForm.year ? parseInt(vehicleForm.year) : new Date().getFullYear(),
        stationID: userStationId || vehicleForm.stationID
      };

      const response = await api.post('/api/vehicles/register', payload);

      if (response.data?.success) {
        setSuccess('Vehicle registered successfully');
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to register vehicle');
      }
    } catch (err) {
      console.error('Error creating vehicle:', err);
      setError(err.response?.data?.message || 
               err.response?.data?.error || 
               err.message || 
               'Failed to register vehicle');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateVehicle = async () => {
    try {
      setFormLoading(true);

      const payload = {
        ...vehicleForm,
        totalCapacity: parseInt(vehicleForm.totalCapacity),
        year: vehicleForm.year ? parseInt(vehicleForm.year) : new Date().getFullYear()
      };

      const response = await api.put(`/api/vehicles/${selectedVehicle._id}`, payload);

      if (response.data?.success || response.data?.vehicle) {
        setSuccess('Vehicle updated successfully');
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to update vehicle');
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update vehicle');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    try {
      setFormLoading(true);
      const response = await api.delete(`/api/vehicles/${selectedVehicle._id}`);

      if (response.data?.success) {
        setSuccess('Vehicle deactivated successfully');
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to deactivate vehicle');
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setError(err.response?.data?.message || err.message || 'Failed to deactivate vehicle');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      setFormLoading(true);
      
      const response = await api.post(`/api/vehicles/${selectedVehicle._id}/status`, {
        status: status,
        notes: `Status changed to ${status}`
      });

      if (response.data?.success) {
        setSuccess(`Vehicle status updated to ${status}`);
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to update vehicle status');
      }
    } catch (err) {
      console.error('Error updating vehicle status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update vehicle status');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    try {
      if (!assignDriverForm.driverId) {
        setError('Please select a driver');
        return;
      }

      setFormLoading(true);

      // Check if the selected driver is already assigned to another active vehicle
      const driverAlreadyAssigned = vehicles.find(vehicle => 
        vehicle.driverID?._id === assignDriverForm.driverId && 
        vehicle._id !== selectedVehicle._id &&
        vehicle.isActive === true
      );

      if (driverAlreadyAssigned) {
        setError(`This driver is already assigned to vehicle ${driverAlreadyAssigned.plateNumber}`);
        return;
      }

      const response = await api.post(`/api/vehicles/${selectedVehicle._id}/assign-driver/${assignDriverForm.driverId}`);

      if (response.data?.success) {
        setSuccess('Driver assigned successfully');
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to assign driver');
      }
    } catch (err) {
      console.error('Error assigning driver:', err);
      setError(err.response?.data?.message || err.message || 'Failed to assign driver');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveDriver = async () => {
    try {
      setFormLoading(true);
      
      const response = await api.post(`/api/vehicles/${selectedVehicle._id}/remove-driver`);

      if (response.data?.success) {
        setSuccess('Driver removed successfully');
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to remove driver');
      }
    } catch (err) {
      console.error('Error removing driver:', err);
      setError(err.response?.data?.message || err.message || 'Failed to remove driver');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddMaintenance = async () => {
    try {
      if (!maintenanceForm.description) {
        setError('Description is required');
        return;
      }

      setFormLoading(true);

      const payload = {
        description: maintenanceForm.description,
        cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : 0,
        mileage: maintenanceForm.mileage ? parseInt(maintenanceForm.mileage) : 0,
        servicedBy: maintenanceForm.servicedBy || '',
        notes: maintenanceForm.notes || ''
      };

      const response = await api.post(`/api/vehicles/${selectedVehicle._id}/maintenance`, payload);

      if (response.data?.success) {
        setSuccess('Maintenance record added successfully');
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to add maintenance record');
      }
    } catch (err) {
      console.error('Error adding maintenance:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add maintenance record');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUploadImages = async () => {
    try {
      if (imageForm.images.length === 0) {
        setError('Please select at least one image');
        return;
      }

      if (imageForm.images.length > 5) {
        setError('Maximum 5 images allowed');
        return;
      }

      setUploadingImages(true);

      const formData = new FormData();
      
      // Add images to form data
      imageForm.images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await api.post(`/api/vehicles/${selectedVehicle._id}/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        setSuccess('Images uploaded successfully');
        fetchVehicles();
        handleCloseAllDialogs();
      } else {
        throw new Error('Failed to upload images');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSetPrimaryImage = async (imageUrl) => {
    try {
      const response = await api.post(`/api/vehicles/${selectedVehicle._id}/set-primary-image`, {
        imageUrl
      });

      if (response.data?.success) {
        setSuccess('Primary image set successfully');
        fetchVehicles();
      } else {
        throw new Error('Failed to set primary image');
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
      setError(err.response?.data?.message || err.message || 'Failed to set primary image');
    }
  };

  const handleImageFileChange = (event) => {
    const files = Array.from(event.target.files);
    // Limit to 5 files
    const limitedFiles = files.slice(0, 5);
    setImageForm({ ...imageForm, images: limitedFiles });
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
    setTypeFilter('all');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'active': return 'success';
      case 'on_trip': return 'warning';
      case 'maintenance': return 'error';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'coaster': return 'primary';
      case 'bus': return 'secondary';
      case 'minibus': return 'info';
      case 'aba dulla': return 'warning';
      case 'van': return 'success';
      default: return 'default';
    }
  };

  const getFuelColor = (fuelType) => {
    switch (fuelType) {
      case 'diesel': return 'warning';
      case 'petrol': return 'error';
      case 'electric': return 'success';
      case 'hybrid': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const isInsuranceExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return expiry > today && expiry <= nextMonth;
    } catch (err) {
      return false;
    }
  };

  const isInsuranceExpired = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      return new Date(expiryDate) < new Date();
    } catch (err) {
      return false;
    }
  };

  // Check if user can manage vehicles
  const canManageVehicles = () => {
    return ['station_admin', 'super_admin'].includes(userRole);
  };

  // Pagination
  const paginatedVehicles = filteredVehicles.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const carTypes = ['coaster', 'bus', 'minibus', 'aba dulla', 'van', 'other'];
  const fuelTypes = ['diesel', 'petrol', 'electric', 'hybrid'];
  const featuresList = ['ac', 'wifi', 'entertainment', 'charging_port', 'toilet', 'refreshments'];

  // Check if user is station admin but has no station assigned
  const isStationAdminWithoutStation = userRole === 'station_admin' && !userStationId;

  if (isStationAdminWithoutStation && !loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            maxWidth: 500,
            borderRadius: 3,
            boxShadow: 3
          }}>
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Station Not Assigned
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You are registered as a station administrator, but you are not assigned to any station yet.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please contact the super administrator to be assigned to a station.
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (loading && vehicles.length === 0) {
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
              <CarIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Vehicle Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {userRole === 'station_admin' 
                ? `Managing vehicles for ${stationName || 'your station'}` 
                : 'Managing all vehicles across all stations'
              }
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
              <ToggleButton value="grid">
                Grid View
              </ToggleButton>
            </ToggleButtonGroup>
            {canManageVehicles() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                disabled={!userStationId && userRole === 'station_admin'}
                title={!userStationId && userRole === 'station_admin' 
                  ? "You need to be assigned to a station to register vehicles" 
                  : ""
                }
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.3)' }
                }}
              >
                Register Vehicle
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            icon: <CarIcon />,
            title: 'Total Vehicles',
            value: stats.total,
            color: '#3f51b5',
            bgColor: '#e8eaf6'
          },
          {
            icon: <CheckCircleIcon />,
            title: 'Available',
            value: stats.available,
            color: '#4caf50',
            bgColor: '#e8f5e9'
          },
          {
            icon: <WarningIcon />,
            title: 'On Trip',
            value: stats.on_trip,
            color: '#ff9800',
            bgColor: '#fff3e0'
          },
          {
            icon: <BuildIcon />,
            title: 'Maintenance',
            value: stats.maintenance,
            color: '#f44336',
            bgColor: '#ffebee'
          },
          {
            icon: <CalendarIcon />,
            title: 'Insurance Expiring',
            value: stats.insuranceExpiring,
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
          Filter Vehicles
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search by plate number, make, model, or driver..."
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
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="on_trip">On Trip</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={typeFilter}
                label="Vehicle Type"
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Types</MenuItem>
                {carTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
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
                onClick={fetchVehicles}
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

      {/* Vehicles Table */}
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
            <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
            Vehicles List ({filteredVehicles.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Vehicle Details</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Type & Capacity</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Driver & Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Insurance</TableCell>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Features</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No vehicles found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm 
                          ? 'Try changing your search term' 
                          : vehicles.length === 0 
                            ? canManageVehicles() 
                              ? 'No vehicles registered yet' 
                              : 'No vehicles available'
                            : 'No vehicles match the selected filter'
                        }
                      </Typography>
                      {vehicles.length === 0 && canManageVehicles() && (
                        <Button 
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreateDialog}
                          sx={{ mt: 2, borderRadius: 2 }}
                        >
                          Register Your First Vehicle
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVehicles.map((vehicle) => (
                  <TableRow 
                    key={vehicle._id} 
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: '#f8f9fa' },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ 
                          mr: 2, 
                          bgcolor: vehicle.isActive ? 'primary.main' : '#9e9e9e',
                          color: 'white'
                        }}>
                          <CarIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {vehicle.plateNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {vehicle.images?.length > 0 ? `${vehicle.images.length} photos` : 'No photos'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={vehicle.carType?.toUpperCase()}
                          color={getTypeColor(vehicle.carType)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip
                          label={`${vehicle.totalCapacity} seats`}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <FuelIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        {vehicle.fuelType}
                        {vehicle.color && (
                          <>
                            <ColorIcon fontSize="small" sx={{ verticalAlign: 'middle', ml: 1, mr: 0.5 }} />
                            {vehicle.color}
                          </>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vehicle.driverID ? (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {vehicle.driverID.fullName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No driver assigned
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip
                          label={vehicle.currentStatus?.toUpperCase()}
                          color={getStatusColor(vehicle.currentStatus)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip
                          label={vehicle.isActive ? 'ACTIVE' : 'INACTIVE'}
                          color={vehicle.isActive ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {vehicle.insuranceExpiry ? (
                        <Box>
                          <Typography variant="body2">
                            {formatDate(vehicle.insuranceExpiry)}
                          </Typography>
                          {isInsuranceExpired(vehicle.insuranceExpiry) ? (
                            <Chip
                              label="EXPIRED"
                              color="error"
                              size="small"
                              sx={{ mt: 0.5, fontWeight: 'bold' }}
                            />
                          ) : isInsuranceExpiring(vehicle.insuranceExpiry) ? (
                            <Chip
                              label="EXPIRING SOON"
                              color="warning"
                              size="small"
                              sx={{ mt: 0.5, fontWeight: 'bold' }}
                            />
                          ) : (
                            <Chip
                              label="VALID"
                              color="success"
                              size="small"
                              sx={{ mt: 0.5, fontWeight: 'bold' }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not set
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.features && vehicle.features.length > 0 ? (
                        <Box sx={{ maxWidth: 200 }}>
                          {vehicle.features.slice(0, 2).map((feature, index) => (
                            <Chip
                              key={index}
                              label={feature}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {vehicle.features.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{vehicle.features.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No features
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDetailModal(vehicle)}
                              sx={{ 
                                bgcolor: '#e3f2fd',
                                '&:hover': { bgcolor: '#bbdefb' }
                              }}
                            >
                              <VisibilityIcon fontSize="small" color="primary" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        {canManageVehicles() && (
                          <Tooltip title="More Actions">
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleMenuClick(e, vehicle)}
                                sx={{ 
                                  bgcolor: '#fff3e0',
                                  '&:hover': { bgcolor: '#ffe0b2' }
                                }}
                              >
                                <MoreVertIcon fontSize="small" color="warning" />
                              </IconButton>
                            </span>
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
        
        {/* Pagination */}
        {paginatedVehicles.length > 0 && (
          <TablePagination
            component="div"
            count={filteredVehicles.length}
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
          handleOpenEditDialog(selectedVehicle);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit Vehicle</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleOpenImageDialog(selectedVehicle);
        }}>
          <ListItemIcon>
            <CameraIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Upload Images</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleOpenMaintenanceDialog(selectedVehicle);
        }}>
          <ListItemIcon>
            <BuildIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Add Maintenance</ListItemText>
        </MenuItem>
        
        <Divider />
        
        {selectedVehicle?.driverID ? (
          <MenuItem onClick={() => {
            handleMenuClose();
            handleOpenRemoveDriverDialog(selectedVehicle);
          }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Remove Driver</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => {
            handleMenuClose();
            handleOpenAssignDriverDialog(selectedVehicle);
          }}>
            <ListItemIcon>
              <AssignmentIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Assign Driver</ListItemText>
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleOpenStatusDialog(selectedVehicle);
        }}>
          <ListItemIcon>
            <BuildIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Change Status</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleOpenDeleteDialog(selectedVehicle);
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Deactivate Vehicle</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Vehicle Dialog */}
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
            <Typography fontWeight="bold">Register New Vehicle</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {formLoading && <LinearProgress sx={{ mb: 2 }} />}
          
          {userRole === 'station_admin' && userStationId && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                Vehicle will be registered to your station: <strong>{stationName || 'Your Station'}</strong>
              </Typography>
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Plate Number *"
                value={vehicleForm.plateNumber}
                onChange={(e) => setVehicleForm({...vehicleForm, plateNumber: e.target.value.toUpperCase()})}
                margin="normal"
                required
                disabled={formLoading}
                helperText="Format: AAA 000 AA"
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required size="small">
                <InputLabel>Vehicle Type *</InputLabel>
                <Select
                  value={vehicleForm.carType}
                  label="Vehicle Type *"
                  onChange={(e) => setVehicleForm({...vehicleForm, carType: e.target.value})}
                  disabled={formLoading}
                >
                  {carTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Total Capacity *"
                type="number"
                value={vehicleForm.totalCapacity}
                onChange={(e) => setVehicleForm({...vehicleForm, totalCapacity: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                inputProps={{ min: 1, max: 100 }}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  value={vehicleForm.fuelType}
                  label="Fuel Type"
                  onChange={(e) => setVehicleForm({...vehicleForm, fuelType: e.target.value})}
                  disabled={formLoading}
                >
                  {fuelTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Make *"
                value={vehicleForm.make}
                onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Model *"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})}
                margin="normal"
                disabled={formLoading}
                inputProps={{ min: 1980, max: new Date().getFullYear() + 1 }}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Color"
                value={vehicleForm.color}
                onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                margin="normal"
                disabled={formLoading}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Insurance Expiry *"
                type="date"
                value={vehicleForm.insuranceExpiry}
                onChange={(e) => setVehicleForm({...vehicleForm, insuranceExpiry: e.target.value})}
                margin="normal"
                required
                disabled={formLoading}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Features</InputLabel>
                <Select
                  multiple
                  value={vehicleForm.features}
                  label="Features"
                  onChange={(e) => setVehicleForm({...vehicleForm, features: e.target.value})}
                  disabled={formLoading}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {featuresList.map((feature) => (
                    <MenuItem key={feature} value={feature}>
                      <Checkbox 
                        checked={vehicleForm.features.indexOf(feature) > -1} 
                        icon={<CheckBoxOutlineBlankIcon />}
                        checkedIcon={<CheckBoxIcon />}
                      />
                      <ListItemText primary={feature.charAt(0).toUpperCase() + feature.slice(1).replace('_', ' ')} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {userRole === 'super_admin' && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth margin="normal" required size="small">
                  <InputLabel>Station *</InputLabel>
                  <Select
                    value={vehicleForm.stationID}
                    label="Station *"
                    onChange={(e) => setVehicleForm({...vehicleForm, stationID: e.target.value})}
                    disabled={formLoading}
                  >
                    <MenuItem value="">
                      <Typography color="text.secondary" fontStyle="italic">
                        Select station
                      </Typography>
                    </MenuItem>
                    {stations.map(station => (
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
            onClick={handleCreateVehicle}
            variant="contained"
            color="primary"
            disabled={formLoading || (!userStationId && userRole === 'station_admin')}
            startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {formLoading ? 'Registering...' : 'Register Vehicle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vehicle Dialog (similar structure as Create) */}
      {/* Vehicle Detail Modal (keep existing) */}
      {/* Delete Confirmation Dialog (keep existing) */}
      {/* Maintenance Dialog (keep existing) */}
      {/* Image Upload Dialog (keep existing) */}
      {/* Assign Driver Dialog (keep existing) */}
      {/* Remove Driver Dialog (keep existing) */}
      {/* Status Dialog (keep existing) */}

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

export default Vehicles;