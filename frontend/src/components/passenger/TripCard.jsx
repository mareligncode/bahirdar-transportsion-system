import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Button,
  LinearProgress
} from '@mui/material';
import {
  DirectionsBus,
  Person,
  Schedule,
  ArrowForward
} from '@mui/icons-material';

const TripCard = ({ trip, onSelect, viewMode = 'grid' }) => {
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
      day: 'numeric'
    });
  };

  const calculateDuration = (departure, arrival) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const hours = Math.floor((arr - dep) / (1000 * 60 * 60));
    const minutes = Math.floor(((arr - dep) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getVehicleIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'luxury_bus':
        return <DirectionsBus color="primary" />;
      case 'coaster':
        return <DirectionsBus color="secondary" />;
      default:
        return <DirectionsBus />;
    }
  };

  const getSeatAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  if (viewMode === 'list') {
    return (
      <Card sx={{ 
        borderRadius: '12px', 
        overflow: 'hidden', 
        transition: 'all 0.3s ease',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
        background: 'white',
        borderLeft: '4px solid #3b82f6',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
          borderColor: '#3b82f6'
        }
      }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.25rem' }}>
                  {formatTime(trip.departureTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(trip.departureTime)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={1}>
              <Box sx={{ textAlign: 'center', color: '#3b82f6' }}>
                <ArrowForward />
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.25rem' }}>
                  {formatTime(trip.arrivalTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(trip.arrivalTime)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  {trip.origin?.stationName} → {trip.destination?.stationName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {calculateDuration(trip.departureTime, trip.arrivalTime)} • {trip.vehicle?.carType}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e40af' }}>
                  ${trip.price}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  per seat
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => onSelect(trip)}
                  disabled={trip.availableSeats === 0}
                  fullWidth
                  sx={{ borderRadius: '8px' }}
                >
                  {trip.availableSeats === 0 ? 'Sold Out' : 'Select'}
                </Button>
              </CardActions>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
            <Chip 
              icon={<Schedule />}
              label={`${trip.availableSeats} seats left`}
              size="small"
              color={getSeatAvailabilityColor(trip.availableSeats, trip.totalSeats)}
              variant="outlined"
            />
            <Chip 
              icon={getVehicleIcon(trip.vehicle?.carType)}
              label={trip.vehicle?.plateNumber}
              size="small"
              variant="outlined"
            />
            <Chip 
              icon={<Person />}
              label={trip.driver?.fullName?.split(' ')[0]}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Grid View (default)
  return (
    <Card sx={{ 
      borderRadius: '12px', 
      overflow: 'hidden', 
      transition: 'all 0.3s ease',
      marginBottom: '20px',
      border: '1px solid #e2e8f0',
      background: 'white',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
        borderColor: '#3b82f6'
      }
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 24px',
        background: '#f1f5f9',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box sx={{ 
          background: '#3b82f6',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '20px',
          fontWeight: 500,
          fontSize: '0.875rem'
        }}>
          <Typography variant="subtitle2">
            {trip.origin?.city} → {trip.destination?.city}
          </Typography>
        </Box>
        {trip.availableSeats < 5 && trip.availableSeats > 0 && (
          <Chip 
            label="Almost Full"
            size="small"
            color="warning"
            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
          />
        )}
        {trip.availableSeats === 0 && (
          <Chip 
            label="Sold Out"
            size="small"
            color="error"
            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
          />
        )}
      </Box>

      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
              {trip.origin?.stationName} to {trip.destination?.stationName}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              margin: '24px 0',
              padding: '0 16px'
            }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.5rem' }}>
                  {formatTime(trip.departureTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Departure
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', flex: 2, position: 'relative' }}>
                <Typography variant="body2" sx={{ color: '#64748b', marginBottom: '12px', fontWeight: 500 }}>
                  {calculateDuration(trip.departureTime, trip.arrivalTime)}
                </Typography>
                <Box sx={{ 
                  height: '2px',
                  background: 'linear-gradient(90deg, #e2e8f0, #94a3b8, #e2e8f0)',
                  position: 'relative',
                  '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    background: '#3b82f6',
                    borderRadius: '50%',
                    top: '-5px',
                    border: '2px solid white',
                    boxShadow: '0 0 0 2px #3b82f6'
                  },
                  '&::before': { left: 0 },
                  '&::after': { right: 0 }
                }} />
              </Box>
              
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.5rem' }}>
                  {formatTime(trip.arrivalTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Arrival
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              marginTop: '20px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                width: '40px',
                height: '40px'
              }}>
                {getVehicleIcon(trip.vehicle?.carType)}
              </Avatar>
              <Box>
                <Typography variant="body2">
                  {trip.vehicle?.carType} • {trip.vehicle?.plateNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Driver: {trip.driver?.fullName}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1e40af', fontSize: '2.25rem' }}>
                ${trip.price}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                per seat
              </Typography>
              
              <Box sx={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginTop: '16px' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(trip.availableSeats / trip.totalSeats) * 100}
                  color={getSeatAvailabilityColor(trip.availableSeats, trip.totalSeats)}
                  sx={{ marginBottom: '8px' }}
                />
                <Typography variant="caption">
                  {trip.availableSeats} of {trip.totalSeats} seats available
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      <CardActions>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSelect(trip)}
          disabled={trip.availableSeats === 0}
          fullWidth
          size="large"
          sx={{ 
            borderRadius: '8px',
            padding: '14px',
            fontWeight: 500,
            background: '#3b82f6',
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': { background: '#2563eb' },
            '&:disabled': {
              background: '#cbd5e1',
              color: '#64748b'
            }
          }}
        >
          {trip.availableSeats === 0 ? 'Sold Out' : `Select Trip • $${trip.price}`}
        </Button>
      </CardActions>
    </Card>
  );
};

export default TripCard;