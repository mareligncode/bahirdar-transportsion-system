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

const TripResults = ({
  trips,
  loading,
  searchData,
  stations,
  onTripSelect,
  onBack,
  viewMode: initialViewMode = 'grid'
}) => {
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

  // Filter trips based on search term
  const filteredTrips = trips.filter(trip => {
    if (!trip) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      trip.origin?.stationName?.toLowerCase().includes(searchLower) ||
      trip.destination?.stationName?.toLowerCase().includes(searchLower) ||
      trip.vehicle?.plateNumber?.toLowerCase().includes(searchLower) ||
      trip.driver?.fullName?.toLowerCase().includes(searchLower) ||
      trip.vehicle?.carType?.toLowerCase().includes(searchLower)
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
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Vehicle</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Seats</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc' }}>Action</TableCell>
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
                    cursor: trip.availableSeats > 0 ? 'pointer' : 'default'
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {trip.origin?.stationName} → {trip.destination?.stationName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.origin?.city} to {trip.destination?.city}
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
                      {trip.vehicle?.carType || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.vehicle?.plateNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {trip.driver?.fullName?.split(' ')[0] || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                      ${trip.price || '0'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per seat
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
                    {trip.availableSeats > 0 ? (
                      <Chip 
                        label="Available" 
                        size="small" 
                        color="success" 
                        variant="filled"
                        sx={{ fontWeight: 500 }}
                      />
                    ) : (
                      <Chip 
                        label="Sold Out" 
                        size="small" 
                        color="error" 
                        variant="filled"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={trip.availableSeats > 0 ? "contained" : "outlined"}
                      color="primary"
                      size="small"
                      onClick={() => onTripSelect(trip)}
                      disabled={trip.availableSeats === 0}
                      sx={{ 
                        borderRadius: '6px',
                        minWidth: '80px'
                      }}
                    >
                      {trip.availableSeats === 0 ? 'Sold Out' : 'Book'}
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
        <Typography>Loading trips...</Typography>
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
          No trips found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search criteria
        </Typography>
        <Button 
          variant="outlined" 
          onClick={onBack}
          sx={{ marginTop: 2 }}
        >
          Back to Search
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
            Search Results
          </Typography>
          <Typography variant="body1" sx={{ 
            color: '#64748b',
            fontSize: '1rem'
          }}>
            Trips from {stations.find(s => s._id === searchData.origin)?.stationName} to {stations.find(s => s._id === searchData.destination)?.stationName} • {searchData.date?.toLocaleDateString()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <TextField
            placeholder="Filter results..."
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
          <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <ViewList /> : <GridView />}
          </IconButton>
          <Button startIcon={<FilterList />}>Filter</Button>
          <Button startIcon={<Sort />}>Sort</Button>
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