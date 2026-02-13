import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import {
  ViewList,
  GridView,
  FilterList,
  Sort,
  Search
} from '@mui/icons-material';
import TripCard from './TripCard';
import { useTranslation } from '../../hooks/useTranslation';

const TripResults = ({
  trips,
  loading,
  searchData,
  stations,
  onTripSelect,
  onBack,
  viewMode: initialViewMode = 'grid'
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (departure, arrival) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const hours = Math.floor((arr - dep) / (1000 * 60 * 60));
    const minutes = Math.floor(((arr - dep) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getSeatAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (available === 0) return 'error';
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  // FIXED: Get trip status color based on backend status
  const getTripStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'info';
      case 'boarding': return 'warning';
      case 'ongoing': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'delayed': return 'warning';
      default: return 'default';
    }
  };

  // FIXED: Check if trip is bookable
  const isTripBookable = (trip) => {
    const bookableStatuses = ['scheduled', 'boarding'];
    return bookableStatuses.includes(trip.tripStatus) && 
           trip.isActive === true && 
           trip.availableSeats > 0;
  };

  // FIXED: Format price as ETB
  const formatPrice = (price) => {
    if (!price) return 'ETB 0';
    return `ETB ${price.toLocaleString()}`;
  };

  // Filter trips based on search term
  const filteredTrips = trips.filter(trip => {
    if (!trip) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      trip.origin?.stationName?.toLowerCase().includes(searchLower) ||
      trip.destination?.stationName?.toLowerCase().includes(searchLower) ||
      trip.vehicle?.plateNumber?.toLowerCase().includes(searchLower) ||
      trip.driver?.fullName?.toLowerCase().includes(searchLower) ||
      trip.vehicle?.carType?.toLowerCase().includes(searchLower) ||
      trip.tripNumber?.toLowerCase().includes(searchLower) ||
      trip.tripStatus?.toLowerCase().includes(searchLower)
    );
  });

  const paginatedTrips = filteredTrips.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderGridView = () => (
    <Grid container spacing={3}>
      {paginatedTrips.map((trip, index) => (
        <Grid item xs={12} key={trip._id}>
          <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
            <div>
              <TripCard 
                trip={trip}
                onSelect={onTripSelect}
                viewMode={viewMode}
              />
            </div>
          </Zoom>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('trip_number')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('route')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('date_and_time')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('duration')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('vehicle')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('driver')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('price')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('seats')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('status')}</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>{t('action')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTrips.map((trip) => (
              trip && (
                <TableRow 
                  key={trip._id} 
                  hover
                  sx={{ 
                    '&:hover': { backgroundColor: '#f8fafc' },
                    cursor: isTripBookable(trip) ? 'pointer' : 'default',
                    opacity: trip.isActive === false ? 0.7 : 1
                  }}
                >
                  {/* Trip Number - ADDED */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {trip.tripNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {trip.origin?.stationName} → {trip.destination?.stationName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.origin?.city || trip.origin?.stationName} {t('to')} {trip.destination?.city || trip.destination?.stationName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(trip.departureTime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(trip.departureTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {calculateDuration(trip.departureTime, trip.arrivalTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {trip.vehicle?.carType || t('na')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.vehicle?.plateNumber || t('na')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {trip.driver?.fullName?.split(' ')[0] || t('not_assigned')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                      {formatPrice(trip.price)} {/* FIXED: ETB format */}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('per_seat')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${trip.availableSeats || 0}/${trip.totalSeats || 0}`}
                      size="small"
                      color={getSeatAvailabilityColor(trip.availableSeats || 0, trip.totalSeats || 1)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {/* FIXED: Show proper trip status */}
                    <Chip 
                      label={t(`trip_status_${trip.tripStatus}`) || trip.tripStatus}
                      size="small"
                      color={getTripStatusColor(trip.tripStatus)}
                      variant={trip.tripStatus === 'cancelled' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 500 }}
                    />
                    {!trip.isActive && (
                      <Chip 
                        label={t('inactive')}
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ ml: 0.5, fontWeight: 500 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={isTripBookable(trip) ? "contained" : "outlined"}
                      color="primary"
                      size="small"
                      onClick={() => onTripSelect(trip)}
                      disabled={!isTripBookable(trip)}
                      sx={{ 
                        borderRadius: '6px',
                        minWidth: '80px'
                      }}
                    >
                      {!isTripBookable(trip) 
                        ? trip.availableSeats === 0 ? t('sold_out') :
                          trip.tripStatus === 'cancelled' ? t('cancelled') :
                          trip.isActive === false ? t('inactive') :
                          t('not_available')
                        : t('book')}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTrips.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: '1px solid #e2e8f0' }}
      />
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        gap: '20px'
      }}>
        <CircularProgress />
        <Typography>{t('loading_trips')}</Typography>
      </Box>
    );
  }

  if (trips.length === 0) {
    return (
      <Paper sx={{ 
        padding: '48px',
        textAlign: 'center',
        borderRadius: '12px',
        background: 'white',
        border: '1px solid #e2e8f0'
      }}>
        <Typography variant="h6" color="text.secondary">
          {t('no_trips_found')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('try_adjusting_search_criteria')}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={onBack}
          sx={{ marginTop: 2 }}
        >
          {t('back_to_search')}
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '32px',
        padding: '24px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            marginBottom: '8px', 
            color: '#1e293b'
          }} gutterBottom>
            {t('search_results')}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#64748b',
            fontSize: '1rem'
          }}>
            {t('trips_from_to', { 
              from: stations?.find(s => s._id === searchData.origin)?.stationName || searchData.origin,
              to: stations?.find(s => s._id === searchData.destination)?.stationName || searchData.destination
            })} • {searchData.date?.toLocaleDateString()}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
            {t('total_trips_found', { count: filteredTrips.length })}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <TextField
            placeholder={t('filter_results_placeholder')}
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <IconButton 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            sx={{ 
              bgcolor: viewMode === 'list' ? '#f1f5f9' : 'transparent',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            {viewMode === 'grid' ? <ViewList /> : <GridView />}
          </IconButton>
          <Button startIcon={<FilterList />}>{t('filter')}</Button>
          <Button startIcon={<Sort />}>{t('sort')}</Button>
        </Box>
      </Box>

      {viewMode === 'grid' ? renderGridView() : renderListView()}
      
      {viewMode === 'grid' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTrips.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
    </Box>
  );
};

export default TripResults;