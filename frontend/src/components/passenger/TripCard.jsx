import React, { useMemo } from 'react';
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
  LinearProgress,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  DirectionsBus,
  Person,
  Schedule,
  ArrowForward,
  AccessTime,
  EventSeat,
  LocalOffer,
  Star,
  Warning
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';

const TripCard = ({ trip, onSelect, viewMode = 'grid', highlight = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString(t('locale') || 'en-US', {
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
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) return t('today');
      if (date.toDateString() === tomorrow.toDateString()) return t('tomorrow');

      return date.toLocaleDateString(t('locale') || 'en-US', {
        month: 'short',
        day: 'numeric'
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
      return t('duration_format', { hours, minutes });
    } catch {
      return '';
    }
  };

  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'luxury_bus':
      case 'bus':
        return <DirectionsBus sx={{ color: '#3b82f6' }} />;
      case 'coaster':
        return <DirectionsBus sx={{ color: '#10b981' }} />;
      case 'minibus':
        return <DirectionsBus sx={{ color: '#f59e0b' }} />;
      case 'van':
        return <DirectionsBus sx={{ color: '#8b5cf6' }} />;
      default:
        return <DirectionsBus sx={{ color: '#64748b' }} />;
    }
  };

  const getSeatAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  const getSeatAvailabilityText = (available, total) => {
    const percentage = (available / total) * 100;
    if (available === 0) return t('sold_out');
    if (percentage <= 20) return t('few_seats_left', { count: available });
    if (percentage <= 50) return t('limited_seats', { count: available });
    return t('seats_available', { count: available });
  };

  const isAlmostFull = useMemo(() => {
    const percentage = (trip.availableSeats / trip.totalSeats) * 100;
    return percentage <= 20 && trip.availableSeats > 0;
  }, [trip.availableSeats, trip.totalSeats]);

  const getDepartureStatus = () => {
    if (!trip.departureTime) return null;

    const now = new Date();
    const departure = new Date(trip.departureTime);
    const diffMs = departure - now;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    // If trip status is explicitly boarding
    if (trip.tripStatus === 'boarding' || trip.status === 'boarding') {
      return {
        label: t('boarding_now'),
        color: 'success',
        isCritical: true
      };
    }

    // Countdown if within 2 hours
    if (diffMins > 0 && diffMins <= 30) {
      return {
        label: t('boarding_now'),
        color: 'success',
        isCritical: true
      };
    }

    if (diffMins > 30 && diffMins <= 120) {
      return {
        label: t('departing_in', { minutes: diffMins }),
        color: 'warning',
        isCritical: true
      };
    }

    // If it's the departure date but in the past (and not completed/cancelled)
    if (diffMs < 0 && !['completed', 'cancelled'].includes(trip.status?.toLowerCase())) {
      return {
        label: t('just_departed'),
        color: 'error',
        isCritical: true
      };
    }

    return null;
  };

  const depStatus = getDepartureStatus();
  const isSoldOut = trip.availableSeats === 0;

  // List View
  if (viewMode === 'list') {
    return (
      <Card sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        marginBottom: '16px',
        border: '1px solid',
        borderColor: isSoldOut ? '#fee2e2' : highlight ? '#3b82f6' : '#e2e8f0',
        background: isSoldOut ? '#fef2f2' : 'white',
        borderLeft: isSoldOut ? '4px solid #ef4444' : '4px solid #3b82f6',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[10],
          borderColor: isSoldOut ? '#ef4444' : '#3b82f6'
        },
        opacity: isSoldOut ? 0.8 : 1,
        cursor: isSoldOut ? 'not-allowed' : 'pointer'
      }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Departure Time */}
            <Grid item xs={12} sm={2}>
              <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                  {t('leaves_at')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  {formatTime(trip.departureTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 14 }} />
                  {formatDate(trip.departureTime)}
                </Typography>
              </Box>
            </Grid>

            {/* Arrow */}
            <Grid item xs={12} sm={1} sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ textAlign: 'center', color: '#94a3b8' }}>
                <ArrowForward />
              </Box>
            </Grid>

            {/* Arrival Time */}
            <Grid item xs={12} sm={2}>
              <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                  {t('arrives_at')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b' }}>
                  {formatTime(trip.arrivalTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 14 }} />
                  {formatDate(trip.arrivalTime)}
                </Typography>
              </Box>
            </Grid>

            {/* Route Info */}
            <Grid item xs={12} sm={3}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                  {trip.origin?.stationName || t('unknown')} → {trip.destination?.stationName || t('unknown')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <AccessTime sx={{ fontSize: 14, color: '#64748b' }} />
                  <Typography variant="caption" color="text.secondary">
                    {calculateDuration(trip.departureTime, trip.arrivalTime)} • {trip.vehicle?.carType || t('bus')}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Price */}
            <Grid item xs={12} sm={2}>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af', fontSize: '1.25rem' }}>
                  ETB {trip.price?.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('per_seat')}
                </Typography>
              </Box>
            </Grid>

            {/* Action Button */}
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                color={isSoldOut ? 'error' : 'primary'}
                onClick={() => !isSoldOut && onSelect(trip)}
                disabled={isSoldOut}
                fullWidth
                sx={{
                  borderRadius: '8px',
                  py: 1,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  background: isSoldOut ? '#ef4444' : 'linear-gradient(135deg, #3b82f6, #1e40af)',
                  '&:hover': {
                    background: isSoldOut ? '#dc2626' : 'linear-gradient(135deg, #2563eb, #1e3a8a)'
                  }
                }}
              >
                {isSoldOut ? t('sold_out') : t('select')}
              </Button>
            </Grid>
          </Grid>

          {/* Chips Row */}
          <Box sx={{
            display: 'flex',
            gap: 1,
            mt: 2,
            flexWrap: 'wrap'
          }}>
            {depStatus && (
              <Chip
                label={depStatus.label}
                size="small"
                color={depStatus.color}
                sx={{
                  fontWeight: 700,
                  boxShadow: depStatus.isCritical ? `0 0 10px ${alpha(theme.palette[depStatus.color].main, 0.3)}` : 'none',
                  animation: depStatus.label === t('boarding_now') ? 'pulse 2s infinite' : 'none'
                }}
              />
            )}
            <Chip
              icon={<EventSeat />}
              label={getSeatAvailabilityText(trip.availableSeats, trip.totalSeats)}
              size="small"
              color={getSeatAvailabilityColor(trip.availableSeats, trip.totalSeats)}
              variant={isAlmostFull ? 'filled' : 'outlined'}
              sx={{ fontWeight: 500 }}
            />
            <Chip
              icon={getVehicleIcon(trip.vehicle?.carType)}
              label={trip.vehicle?.plateNumber || 'N/A'}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<Person />}
              label={trip.driver?.fullName?.split(' ')[0] || t('driver')}
              size="small"
              variant="outlined"
            />
            {isAlmostFull && !isSoldOut && (
              <Chip
                icon={<Warning />}
                label={t('almost_full')}
                size="small"
                color="warning"
                sx={{ fontWeight: 500 }}
              />
            )}
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
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid',
      borderColor: isSoldOut ? '#fee2e2' : highlight ? '#3b82f6' : '#e2e8f0',
      background: isSoldOut ? '#fef2f2' : 'white',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[12],
        borderColor: isSoldOut ? '#ef4444' : '#3b82f6'
      },
      opacity: isSoldOut ? 0.8 : 1,
      cursor: isSoldOut ? 'not-allowed' : 'pointer'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        background: isSoldOut ? '#fee2e2' : alpha(theme.palette.primary.main, 0.04),
        borderBottom: '1px solid',
        borderColor: isSoldOut ? '#fecaca' : '#e2e8f0'
      }}>
        <Box sx={{
          background: isSoldOut ? '#ef4444' : theme.palette.primary.main,
          color: 'white',
          px: 2,
          py: 0.5,
          borderRadius: '20px',
          fontWeight: 600,
          fontSize: '0.8rem'
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {trip.origin?.city || t('city')} → {trip.destination?.city || t('city')}
          </Typography>
        </Box>

        {depStatus && (
          <Chip
            label={depStatus.label}
            size="small"
            color={depStatus.color}
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        )}

        {isAlmostFull && !isSoldOut && !depStatus && (
          <Tooltip title={t('book_soon')}>
            <Chip
              label={t('almost_full')}
              size="small"
              color="warning"
              icon={<Warning sx={{ fontSize: 14 }} />}
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}

        {isSoldOut && (
          <Chip
            label={t('sold_out')}
            size="small"
            color="error"
            icon={<EventSeat sx={{ fontSize: 14 }} />}
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
        )}
      </Box>

      <CardContent sx={{ flex: 1, p: 2.5 }}>
        <Grid container spacing={2}>
          {/* Left Column - Route Info */}
          <Grid item xs={8}>
            <Typography variant="h6" gutterBottom sx={{
              fontWeight: 700,
              color: '#1e293b',
              fontSize: '1rem',
              lineHeight: 1.3
            }}>
              {trip.origin?.stationName || t('unknown')} {t('to')} {trip.destination?.stationName || t('unknown')}
            </Typography>

            {/* Timeline */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              my: 2,
              px: 1
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.6rem', display: 'block' }}>
                  {t('leaves_at')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  {formatTime(trip.departureTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 12 }} />
                  {formatDate(trip.departureTime)}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, mx: 2, position: 'relative' }}>
                <Typography variant="caption" sx={{
                  color: '#64748b',
                  display: 'block',
                  textAlign: 'center',
                  mb: 0.5,
                  fontSize: '0.7rem'
                }}>
                  {calculateDuration(trip.departureTime, trip.arrivalTime)}
                </Typography>
                <Box sx={{
                  height: '2px',
                  background: 'linear-gradient(90deg, #e2e8f0, #94a3b8, #e2e8f0)',
                  position: 'relative',
                  '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    background: theme.palette.primary.main,
                    borderRadius: '50%',
                    top: '-4px',
                    border: '2px solid white',
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`
                  },
                  '&::before': { left: 0 },
                  '&::after': { right: 0 }
                }} />
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.6rem', display: 'block' }}>
                  {t('arrives_at')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b' }}>
                  {formatTime(trip.arrivalTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 12 }} />
                  {formatDate(trip.arrivalTime)}
                </Typography>
              </Box>
            </Box>

            {/* Vehicle & Driver Info */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <Avatar sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                width: 36,
                height: 36
              }}>
                {getVehicleIcon(trip.vehicle?.carType)}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {trip.vehicle?.carType || t('bus')} • {trip.vehicle?.plateNumber || t('na')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Person sx={{ fontSize: 12 }} />
                  {t('driver')}: {trip.driver?.fullName || t('na')}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right Column - Price & Availability */}
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" gutterBottom sx={{
                fontWeight: 800,
                color: '#1e40af',
                fontSize: '1.5rem',
                lineHeight: 1.2
              }}>
                ETB {trip.price?.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                {t('per_seat')}
              </Typography>

              {/* Availability Bar */}
              <Box sx={{
                mt: 2,
                p: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {t('availability')}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {trip.availableSeats}/{trip.totalSeats}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(trip.availableSeats / trip.totalSeats) * 100}
                  color={getSeatAvailabilityColor(trip.availableSeats, trip.totalSeats)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.grey[500], 0.2)
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{
                  display: 'block',
                  mt: 1,
                  fontSize: '0.65rem',
                  fontWeight: 500
                }}>
                  {getSeatAvailabilityText(trip.availableSeats, trip.totalSeats)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          onClick={() => !isSoldOut && onSelect(trip)}
          disabled={isSoldOut}
          fullWidth
          size="large"
          sx={{
            borderRadius: '8px',
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.95rem',
            background: isSoldOut ? '#ef4444' : 'linear-gradient(135deg, #3b82f6, #1e40af)',
            '&:hover': {
              background: isSoldOut ? '#dc2626' : 'linear-gradient(135deg, #2563eb, #1e3a8a)'
            },
            '&:disabled': {
              background: '#cbd5e1',
              color: '#64748b'
            }
          }}
        >
          {isSoldOut
            ? t('sold_out')
            : `${t('select_trip')} • ETB ${trip.price?.toLocaleString()}`}
        </Button>
      </CardActions>
    </Card>
  );
};

export default TripCard;