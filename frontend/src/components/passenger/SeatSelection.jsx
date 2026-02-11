import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import {
  DirectionsBus,
  Chair as SeatIcon
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

const SeatSelection = ({ 
  trip, 
  selectedSeats, 
  onSeatsSelected, 
  onProceedToPayment 
}) => {
  const { t } = useTranslation(); // ✅ ADD THIS
  const [seats, setSeats] = useState([]);
  const [localSelectedSeats, setLocalSelectedSeats] = useState(selectedSeats || []);

  // Generate seat layout (4 columns)
  const generateSeats = () => {
    const seats = [];
    const rows = Math.ceil(trip.totalSeats / 4);
    
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= 4; col++) {
        const seatNumber = `${String.fromCharCode(64 + row)}${col}`;
        if (seats.length < trip.totalSeats) {
          seats.push({
            id: seatNumber,
            row: row,
            col: col,
            isBooked: false,
            isAvailable: true
          });
        }
      }
    }
    return seats;
  };

  useEffect(() => {
    setSeats(generateSeats());
  }, [trip.totalSeats]);

  const handleSeatClick = (seat) => {
    if (seat.isBooked) return;

    const newSelectedSeats = localSelectedSeats.includes(seat.id) 
      ? localSelectedSeats.filter(id => id !== seat.id)
      : [...localSelectedSeats, seat.id];

    setLocalSelectedSeats(newSelectedSeats);
    onSeatsSelected(newSelectedSeats);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPrice = trip.price * localSelectedSeats.length;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ 
        fontWeight: 600, 
        mb: 2,
        fontSize: '1.35rem'
      }}>
        {t('select_your_seats')} {/* ✅ TRANSLATED */}
      </Typography>
      
      <Grid container spacing={10}>
        {/* Left Side: Seat Selection */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ 
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            height: '100%'
          }}>
            <CardContent sx={{ p: 2.5 }}>
              {/* Header with seat count */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  🪑 {t('available_seats_count', { count: trip.availableSeats })} 
                </Typography>
                <Chip 
                  label={t('total_seats_count', { count: trip.totalSeats })} 
                  size="small"
                  sx={{ 
                    bgcolor: '#f1f5f9', 
                    color: '#475569',
                    fontSize: '0.75rem',
                    height: '24px'
                  }}
                />
              </Box>

              {/* Seat Grid */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 1.5,
                maxWidth: 280,
                mx: 'auto',
                mb: 2.5,
                p: 1
              }}>
                {seats.map((seat) => (
                  <Button
                    key={seat.id}
                    variant={localSelectedSeats.includes(seat.id) ? "contained" : "outlined"}
                    color={seat.isBooked ? "error" : localSelectedSeats.includes(seat.id) ? "primary" : "inherit"}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.isBooked}
                    sx={{ 
                      height: 48,
                      minWidth: 48,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '8px',
                      p: 0.5,
                      borderWidth: localSelectedSeats.includes(seat.id) ? '2px' : '1px',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <SeatIcon sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ 
                      mt: 0.25, 
                      fontSize: '0.65rem',
                      fontWeight: localSelectedSeats.includes(seat.id) ? 600 : 400
                    }}>
                      {seat.id}
                    </Typography>
                  </Button>
                ))}
              </Box>

              {/* Seat Legend */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2.5,
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 14, height: 14, bgcolor: 'success.main', borderRadius: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>{t('legend_available')}</Typography> {/* ✅ TRANSLATED */}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 14, height: 14, bgcolor: 'primary.main', borderRadius: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>{t('legend_selected')}</Typography> {/* ✅ TRANSLATED */}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 14, height: 14, bgcolor: 'error.main', borderRadius: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>{t('legend_booked')}</Typography> {/* ✅ TRANSLATED */}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Booking Summary */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ 
            borderRadius: '12px',
            border: '1px solid #3b82f6',
            height: '100%',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
            ml: { md: 6 }
          }}>
            <CardContent sx={{ p: 2.5 }}>
              {/* Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 1.5
              }}>
                <Box sx={{ 
                  bgcolor: '#3b82f6', 
                  borderRadius: '6px',
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                    📋
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 700, 
                  color: '#1e40af',
                  fontSize: '1rem'
                }}>
                  {t('booking_summary')} {/* ✅ TRANSLATED */}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2, borderColor: '#e2e8f0' }} />
              
              {/* Trip Details */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.65rem'
                }}>
                  {t('trip_details')} {/* ✅ TRANSLATED */}
                </Typography>
                <Paper variant="outlined" sx={{ 
                  p: 1.5, 
                  mt: 0.5,
                  bgcolor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                    {trip.origin?.stationName} → {trip.destination?.stationName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                    {formatDate(trip.departureTime)} • {formatTime(trip.departureTime)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
                    <DirectionsBus sx={{ fontSize: 12, color: '#64748b' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {trip.vehicle?.carType} • {trip.vehicle?.plateNumber}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              {/* Selected Seats */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.65rem'
                }}>
                  {t('selected_seats')} {/* ✅ TRANSLATED */}
                </Typography>
                <Box sx={{ 
                  p: 1.5, 
                  mt: 0.5,
                  bgcolor: localSelectedSeats.length > 0 ? '#f0f9ff' : '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  minHeight: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 0.5
                }}>
                  {localSelectedSeats.length > 0 ? (
                    localSelectedSeats.map((seat) => (
                      <Chip
                        key={seat}
                        label={seat}
                        size="small"
                        sx={{ 
                          bgcolor: '#3b82f6',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: '24px',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" sx={{ 
                      color: '#64748b',
                      fontSize: '0.75rem'
                    }}>
                      {t('no_seats_selected_yet')} {/* ✅ TRANSLATED */}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Price Breakdown */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.65rem'
                }}>
                  {t('price_breakdown')} {/* ✅ TRANSLATED */}
                </Typography>
                <Box sx={{ 
                  p: 1.5, 
                  mt: 0.5,
                  bgcolor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">{t('price_per_seat')}:</Typography> {/* ✅ TRANSLATED */}
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>${trip.price}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">{t('number_of_seats')}:</Typography> {/* ✅ TRANSLATED */}
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{localSelectedSeats.length}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.75, borderColor: '#e2e8f0' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">{t('subtotal')}:</Typography> {/* ✅ TRANSLATED */}
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>${trip.price * localSelectedSeats.length}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} />

              {/* Total Price */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                p: 1.5,
                bgcolor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #3b82f6'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {t('total_amount')} {/* ✅ TRANSLATED */}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ 
                  fontWeight: 700,
                  fontSize: '1.25rem'
                }}>
                  ${totalPrice}
                </Typography>
              </Box>

              {/* Proceed to Payment Button */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="medium"
                onClick={onProceedToPayment}
                disabled={localSelectedSeats.length === 0}
                sx={{ 
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  },
                  '&:disabled': {
                    background: '#cbd5e1'
                  }
                }}
              >
                {localSelectedSeats.length === 0 
                  ? t('select_seats_to_continue') 
                  : `${t('proceed_to_payment')} - $${totalPrice}`
                }
              </Button>

              {localSelectedSeats.length === 0 && (
                <Alert severity="info" sx={{ 
                  mt: 2, 
                  borderRadius: '6px',
                  py: 0,
                  '& .MuiAlert-message': { fontSize: '0.75rem', p: 1 }
                }}>
                  {t('please_select_at_least_one_seat')} {/* ✅ TRANSLATED */}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeatSelection;