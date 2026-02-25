import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  CircularProgress,
  Zoom,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  Select,
  Badge,
  alpha,
  useTheme,
  Fade
} from '@mui/material';
import {
  ViewList,
  GridView,
  FilterList,
  Sort,
  Search,
  Clear,
  ArrowBack,
  TrendingUp,
  AccessTime,
  AttachMoney,
  Star
} from '@mui/icons-material';
import TripCard from './TripCard';
import { useTranslation } from '../../hooks/useTranslation';

const TripResults = ({
  trips = [],
  loading = false,
  searchData = {},
  stations = [],
  onTripSelect,
  onBack,
  viewMode: initialViewMode = 'grid'
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // State
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('departureTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState([]);

  // Get unique vehicle types from trips
  const vehicleTypes = useMemo(() => {
    const types = new Set();
    trips.forEach(trip => {
      if (trip.vehicle?.carType) {
        types.add(trip.vehicle.carType);
      }
    });
    return Array.from(types);
  }, [trips]);

  // Formatting functions with error handling
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return '';
    try {
      const dep = new Date(departure);
      const arr = new Date(arrival);
      const diffMs = arr - dep;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return '';
    }
  };

  const getSeatAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (available === 0) return 'error';
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  const getSeatAvailabilityText = (available, total) => {
    if (available === 0) return t('sold_out');
    const percentage = (available / total) * 100;
    if (percentage <= 20) return t('few_seats_left', { count: available });
    if (percentage <= 50) return t('limited_seats', { count: available });
    return t('seats_available', { count: available });
  };

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    if (!trips.length) return [];

    let filtered = [...trips];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(trip => {
        return (
          trip.origin?.stationName?.toLowerCase().includes(searchLower) ||
          trip.destination?.stationName?.toLowerCase().includes(searchLower) ||
          trip.vehicle?.plateNumber?.toLowerCase().includes(searchLower) ||
          trip.driver?.fullName?.toLowerCase().includes(searchLower) ||
          trip.vehicle?.carType?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply price range filter
    if (priceRange.min) {
      filtered = filtered.filter(trip => trip.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(trip => trip.price <= parseFloat(priceRange.max));
    }

    // Apply vehicle type filter
    if (selectedVehicleTypes.length > 0) {
      filtered = filtered.filter(trip => 
        selectedVehicleTypes.includes(trip.vehicle?.carType)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'departureTime':
          comparison = new Date(a.departureTime) - new Date(b.departureTime);
          break;
        case 'duration':
          const durA = calculateDuration(a.departureTime, a.arrivalTime);
          const durB = calculateDuration(b.departureTime, b.arrivalTime);
          comparison = durA.localeCompare(durB);
          break;
        case 'availability':
          comparison = (b.availableSeats || 0) - (a.availableSeats || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [trips, searchTerm, priceRange, selectedVehicleTypes, sortBy, sortOrder]);

  const paginatedTrips = filteredAndSortedTrips.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    handleSortClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setSelectedVehicleTypes([]);
    setPage(0);
  };

  const handleVehicleTypeToggle = (type) => {
    setSelectedVehicleTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (priceRange.min || priceRange.max) count++;
    if (selectedVehicleTypes.length) count++;
    return count;
  }, [searchTerm, priceRange, selectedVehicleTypes]);

  // Grid View
  const renderGridView = () => (
    <Grid container spacing={3}>
      {paginatedTrips.map((trip, index) => (
        <Grid item xs={12} sm={6} lg={4} key={trip._id}>
          <Fade in={true} timeout={500}>
            <div>
              <TripCard 
                trip={trip}
                onSelect={onTripSelect}
                viewMode="grid"
                highlight={trip.availableSeats > 0 && trip.availableSeats <= 5}
              />
            </div>
          </Fade>
        </Grid>
      ))}
    </Grid>
  );

  // List View
  const renderListView = () => (
    <Paper sx={{ 
      width: '100%', 
      overflow: 'hidden', 
      borderRadius: '16px', 
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
    }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('route')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('date_and_time')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('duration')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('vehicle')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('driver')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('price')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('seats')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('status')}</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>{t('action')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTrips.map((trip) => (
              trip && (
                <TableRow 
                  key={trip._id} 
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                    cursor: trip.availableSeats > 0 ? 'pointer' : 'default',
                    opacity: trip.availableSeats === 0 ? 0.7 : 1
                  }}
                  onClick={() => trip.availableSeats > 0 && onTripSelect(trip)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {trip.origin?.stationName || 'Unknown'} → {trip.destination?.stationName || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.origin?.city || ''} {trip.origin?.city && trip.destination?.city ? t('to') : ''} {trip.destination?.city || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(trip.departureTime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 12 }} />
                      {formatTime(trip.departureTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {calculateDuration(trip.departureTime, trip.arrivalTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {trip.vehicle?.carType || t('na')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.vehicle?.plateNumber || t('na')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {trip.driver?.fullName?.split(' ')[0] || t('na')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                      ETB {trip.price?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('per_seat')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Chip 
                        label={`${trip.availableSeats || 0}/${trip.totalSeats || 0}`}
                        size="small"
                        color={getSeatAvailabilityColor(trip.availableSeats || 0, trip.totalSeats || 1)}
                        variant="outlined"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {getSeatAvailabilityText(trip.availableSeats || 0, trip.totalSeats || 1)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {trip.availableSeats > 0 ? (
                      <Chip 
                        label={t('available')} 
                        size="small" 
                        color="success" 
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Chip 
                        label={t('sold_out')} 
                        size="small" 
                        color="error" 
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={trip.availableSeats > 0 ? "contained" : "outlined"}
                      color="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTripSelect(trip);
                      }}
                      disabled={trip.availableSeats === 0}
                      sx={{ 
                        borderRadius: '6px',
                        minWidth: '80px',
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {trip.availableSeats === 0 ? t('sold_out') : t('select')}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredAndSortedTrips.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ 
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#f8fafc'
        }}
      />
    </Paper>
  );

  // Loading State
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 3
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          {t('loading_trips')}
        </Typography>
      </Box>
    );
  }

  // Empty State
  if (trips.length === 0) {
    return (
      <Paper sx={{ 
        p: 6,
        textAlign: 'center',
        borderRadius: '16px',
        background: 'white',
        border: '1px solid #e2e8f0'
      }}>
        <Box sx={{ mb: 3 }}>
          <img 
            src="/images/no-results.svg" 
            alt="No trips"
            style={{ width: 120, height: 120, opacity: 0.5 }}
            onError={(e) => e.target.style.display = 'none'}
          />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
          {t('no_trips_found')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
          {t('try_adjusting_search_criteria')}
        </Typography>
        <Button 
          variant="contained" 
          onClick={onBack}
          startIcon={<ArrowBack />}
          sx={{ 
            borderRadius: '8px',
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          {t('back_to_search')}
        </Button>
      </Paper>
    );
  }

  // Filtered Empty State
  if (filteredAndSortedTrips.length === 0) {
    return (
      <Paper sx={{ 
        p: 6,
        textAlign: 'center',
        borderRadius: '16px',
        background: 'white',
        border: '1px solid #e2e8f0'
      }}>
        <Box sx={{ mb: 3 }}>
          <Search sx={{ fontSize: 80, color: '#cbd5e1' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
          {t('no_matching_trips')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t('try_adjusting_filters')}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={clearFilters}
          startIcon={<Clear />}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          {t('clear_filters')}
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header with Search Info and Controls */}
      <Paper sx={{ 
        p: 3,
        mb: 4,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2
        }}>
          {/* Search Info */}
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              mb: 1, 
              color: '#1e293b'
            }}>
              {t('search_results')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              {t('trips_from_to', { 
                from: stations.find(s => s._id === searchData.origin)?.stationName || 'Unknown',
                to: stations.find(s => s._id === searchData.destination)?.stationName || 'Unknown'
              })} 
              {searchData.date && ` • ${formatDate(searchData.date)}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('found_trips', { count: filteredAndSortedTrips.length, total: trips.length })}
            </Typography>
          </Box>
          
          {/* Controls */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <TextField
              placeholder={t('filter_results_placeholder')}
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 250 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 20, color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: '8px' }
              }}
            />

            {/* View Toggle */}
            <IconButton 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              sx={{ 
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                '&:hover': { bgcolor: '#f1f5f9' }
              }}
            >
              {viewMode === 'grid' ? <ViewList /> : <GridView />}
            </IconButton>

            {/* Filter Button */}
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={handleFilterClick}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  borderColor: activeFilterCount > 0 ? 'primary.main' : '#e2e8f0'
                }}
              >
                {t('filter')}
              </Button>
            </Badge>

            {/* Sort Button */}
            <Button
              variant="outlined"
              startIcon={<Sort />}
              onClick={handleSortClick}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              {t('sort')}
            </Button>
          </Box>
        </Box>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            mt: 2,
            pt: 2,
            borderTop: '1px solid #e2e8f0'
          }}>
            {searchTerm && (
              <Chip
                label={`${t('search')}: ${searchTerm}`}
                onDelete={() => setSearchTerm('')}
                size="small"
                sx={{ borderRadius: '6px' }}
              />
            )}
            {(priceRange.min || priceRange.max) && (
              <Chip
                label={`${t('price')}: ${priceRange.min || '0'} - ${priceRange.max || '∞'}`}
                onDelete={() => setPriceRange({ min: '', max: '' })}
                size="small"
                sx={{ borderRadius: '6px' }}
              />
            )}
            {selectedVehicleTypes.map(type => (
              <Chip
                key={type}
                label={`${t('vehicle')}: ${type}`}
                onDelete={() => handleVehicleTypeToggle(type)}
                size="small"
                sx={{ borderRadius: '6px' }}
              />
            ))}
            <Button
              size="small"
              onClick={clearFilters}
              startIcon={<Clear />}
              sx={{ ml: 'auto', textTransform: 'none' }}
            >
              {t('clear_all')}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Results */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}
      
      {/* Pagination for Grid View */}
      {viewMode === 'grid' && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 4,
          p: 2,
          bgcolor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <TablePagination
            rowsPerPageOptions={[6, 12, 24, 48]}
            component="div"
            count={filteredAndSortedTrips.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            width: 300,
            p: 2,
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, px: 1 }}>
          {t('filter_by')}
        </Typography>

        {/* Price Range */}
        <Box sx={{ mb: 2, px: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 500, display: 'block', mb: 1 }}>
            {t('price_range')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder={t('min')}
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              placeholder={t('max')}
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
              }}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        {/* Vehicle Types */}
        {vehicleTypes.length > 0 && (
          <Box sx={{ mb: 2, px: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 500, display: 'block', mb: 1 }}>
              {t('vehicle_type')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {vehicleTypes.map(type => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  onClick={() => handleVehicleTypeToggle(type)}
                  color={selectedVehicleTypes.includes(type) ? 'primary' : 'default'}
                  variant={selectedVehicleTypes.includes(type) ? 'filled' : 'outlined'}
                  sx={{ borderRadius: '6px' }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button size="small" onClick={clearFilters}>
            {t('clear_all')}
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            onClick={handleFilterClose}
            sx={{ borderRadius: '6px' }}
          >
            {t('apply')}
          </Button>
        </Box>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{
          sx: {
            width: 250,
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, px: 2, pt: 1 }}>
          {t('sort_by')}
        </Typography>
        
        <MenuItem 
          onClick={() => handleSortChange('departureTime')}
          selected={sortBy === 'departureTime'}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 18 }} />
            {t('departure_time')}
          </Box>
          {sortBy === 'departureTime' && (
            <Chip 
              label={sortOrder === 'asc' ? '↑' : '↓'} 
              size="small"
              sx={{ height: 20, minWidth: 20 }}
            />
          )}
        </MenuItem>

        <MenuItem 
          onClick={() => handleSortChange('price')}
          selected={sortBy === 'price'}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney sx={{ fontSize: 18 }} />
            {t('price')}
          </Box>
          {sortBy === 'price' && (
            <Chip 
              label={sortOrder === 'asc' ? '↑' : '↓'} 
              size="small"
              sx={{ height: 20, minWidth: 20 }}
            />
          )}
        </MenuItem>

        <MenuItem 
          onClick={() => handleSortChange('duration')}
          selected={sortBy === 'duration'}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ fontSize: 18 }} />
            {t('duration')}
          </Box>
          {sortBy === 'duration' && (
            <Chip 
              label={sortOrder === 'asc' ? '↑' : '↓'} 
              size="small"
              sx={{ height: 20, minWidth: 20 }}
            />
          )}
        </MenuItem>

        <MenuItem 
          onClick={() => handleSortChange('availability')}
          selected={sortBy === 'availability'}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star sx={{ fontSize: 18 }} />
            {t('availability')}
          </Box>
          {sortBy === 'availability' && (
            <Chip 
              label={sortOrder === 'asc' ? '↑' : '↓'} 
              size="small"
              sx={{ height: 20, minWidth: 20 }}
            />
          )}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TripResults;