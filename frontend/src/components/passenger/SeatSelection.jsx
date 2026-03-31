import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Paper,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  DirectionsBus,
  Chair as SeatIcon,
  ArrowBack,
  Info,
  CheckCircle,
  Schedule,
  LocationOn,
  AccessTime,
  Person
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';

const SeatSelection = ({ 
  trip, 
  selectedSeats = [], 
  onSeatSelect, 
  onProceedToPayment,
  onBack,
  loading = false,
  maxSeats = 8,
  bookedSeats = [] // Add prop to receive actual booked seats from parent
}) => {
  const { t } = useTranslation();
  const [localSelectedSeats, setLocalSelectedSeats] = useState(selectedSeats || []);
  const [error, setError] = useState('');

  // Generate seats with numbers and actual booked status
  const generateSeats = useCallback(() => {
    if (!trip) return [];
    
    const totalSeats = trip.totalSeats || 40;
    const rows = Math.ceil(totalSeats / 4);
    
    // Create a Set of booked seat numbers from the prop (actual booked seats from backend)
    const bookedSeatsSet = new Set(bookedSeats || []);
    
    const seats = [];
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= 4; col++) {
        const seatNumber = (row - 1) * 4 + col;
        if (seatNumber <= totalSeats) {
          seats.push({
            id: seatNumber,
            number: seatNumber,
            row: row,
            col: col,
            label: seatNumber.toString(),
            isBooked: bookedSeatsSet.has(seatNumber),
            isAvailable: !bookedSeatsSet.has(seatNumber)
          });
        }
      }
    }
    return seats;
  }, [trip, bookedSeats]);

  const seats = useMemo(() => generateSeats(), [generateSeats]);

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedSeats(selectedSeats);
  }, [selectedSeats]);

  const handleSeatClick = (seat) => {
    if (seat.isBooked) return;

    setError('');
    
    let newSelectedSeats;
    if (localSelectedSeats.includes(seat.number)) {
      // Remove seat
      newSelectedSeats = localSelectedSeats.filter(num => num !== seat.number);
    } else {
      // Add seat if under max limit
      if (localSelectedSeats.length >= maxSeats) {
        setError(t('max_seats_error', { count: maxSeats }));
        return;
      }
      newSelectedSeats = [...localSelectedSeats, seat.number];
    }

    setLocalSelectedSeats(newSelectedSeats);
    onSeatSelect(newSelectedSeats);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

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

  const totalPrice = (trip?.price || 0) * localSelectedSeats.length;

  const handleProceed = () => {
    if (localSelectedSeats.length === 0) {
      setError(t('select_seats_error'));
      return;
    }
    onProceedToPayment();
  };

  // Calculate available seats count from actual booked seats
  const availableSeatsCount = seats.filter(seat => !seat.isBooked).length;

  return (
    <Box sx={{ mt: 2 }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ 
            color: '#64748b',
            '&:hover': { color: '#1e293b' }
          }}
        >
          {t('back_to_results')}
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ 
        fontWeight: 600, 
        mb: 3,
        fontSize: '1.35rem',
        color: '#1e293b'
      }}>
        {t('select_your_seats')}
      </Typography>
      
      <Grid container spacing={4}>
        {/* Left Side: Seat Selection */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ 
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              {/* Header with seat count */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    {t('available_seats')}: {availableSeatsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('select_up_to', { count: maxSeats })} seats
                  </Typography>
                </Box>
                <Chip 
                  label={t('total_seats', { count: trip?.totalSeats || 0 })} 
                  size="small"
                  sx={{ 
                    bgcolor: '#f1f5f9', 
                    color: '#475569',
                    fontSize: '0.75rem',
                    height: '24px'
                  }}
                />
              </Box>

              {/* Driver Seat Indicator */}
              <Box sx={{ 
                mb: 3, 
                p: 1.5, 
                bgcolor: '#f8fafc', 
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px dashed #94a3b8'
              }}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  🚌 {t('driver_seat_front')}
                </Typography>
              </Box>

              {/* Seat Grid */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 1.5,
                maxWidth: 320,
                mx: 'auto',
                mb: 3,
                p: 1
              }}>
                {seats.map((seat) => {
                  const isSelected = localSelectedSeats.includes(seat.number);
                  
                  return (
                    <Tooltip 
                      key={seat.number}
                      title={seat.isBooked ? t('seat_booked') : `Seat ${seat.number}`}
                      arrow
                    >
                      <Button
                        variant={isSelected ? "contained" : "outlined"}
                        color={seat.isBooked ? "error" : isSelected ? "primary" : "inherit"}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.isBooked}
                        sx={{ 
                          height: 56,
                          minWidth: 56,
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '10px',
                          p: 0.5,
                          borderWidth: isSelected ? '2px' : '1px',
                          borderColor: seat.isBooked ? '#ef4444' : isSelected ? '#3b82f6' : '#e2e8f0',
                          bgcolor: seat.isBooked ? '#fee2e2' : isSelected ? '#3b82f6' : 'white',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            bgcolor: seat.isBooked ? '#fee2e2' : isSelected ? '#2563eb' : '#f8fafc'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <SeatIcon sx={{ 
                          fontSize: 20,
                          color: seat.isBooked ? '#ef4444' : isSelected ? 'white' : '#64748b'
                        }} />
                        <Typography variant="caption" sx={{ 
                          mt: 0.25, 
                          fontSize: '0.7rem',
                          fontWeight: isSelected ? 600 : 400,
                          color: seat.isBooked ? '#ef4444' : isSelected ? 'white' : '#1e293b'
                        }}>
                          {seat.number}
                        </Typography>
                      </Button>
                    </Tooltip>
                  );
                })}
              </Box>

              {/* Seat Legend */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 3,
                p: 2,
                bgcolor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'white', border: '2px solid #e2e8f0', borderRadius: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    {t('available')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#3b82f6', borderRadius: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    {t('selected')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#fee2e2', border: '1px solid #ef4444', borderRadius: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    {t('booked')}
                  </Typography>
                </Box>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
                  {error}
                </Alert>
              )}
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
            position: 'sticky',
            top: 20
          }}>
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 2
              }}>
                <Box sx={{ 
                  bgcolor: '#3b82f6', 
                  borderRadius: '8px',
                  p: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Info sx={{ fontSize: 16, color: 'white' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 700, 
                  color: '#1e40af',
                  fontSize: '1rem'
                }}>
                  {t('booking_summary')}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2, borderColor: '#e2e8f0' }} />
              
              {/* Trip Details */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.65rem'
                }}>
                  {t('trip_details')}
                </Typography>
                <Paper variant="outlined" sx={{ 
                  p: 2, 
                  mt: 0.5,
                  bgcolor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                    {trip?.origin?.stationName || 'Unknown'} → {trip?.destination?.stationName || 'Unknown'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Schedule sx={{ fontSize: 14, color: '#64748b' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(trip?.departureTime)} • {formatTime(trip?.departureTime)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <DirectionsBus sx={{ fontSize: 14, color: '#64748b' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {trip?.vehicle?.carType || 'Bus'} • {trip?.vehicle?.plateNumber || 'N/A'}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              {/* Selected Seats */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.65rem'
                }}>
                  {t('selected_seats')}
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  mt: 0.5,
                  bgcolor: localSelectedSeats.length > 0 ? '#f0f9ff' : '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1
                }}>
                  {localSelectedSeats.length > 0 ? (
                    localSelectedSeats.map((seatNumber) => {
                      return (
                        <Chip
                          key={seatNumber}
                          label={`Seat ${seatNumber}`}
                          size="small"
                          onDelete={() => handleSeatClick({ number: seatNumber, isBooked: false })}
                          sx={{ 
                            bgcolor: '#3b82f6',
                            color: 'white',
                            fontSize: '0.75rem',
                            height: '28px',
                            '& .MuiChip-label': { px: 1.5 },
                            '& .MuiChip-deleteIcon': { color: 'white', fontSize: '16px' }
                          }}
                        />
                      );
                    })
                  ) : (
                    <Typography variant="caption" sx={{ 
                      color: '#64748b',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      width: '100%'
                    }}>
                      {t('no_seats_selected_yet')}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Price Breakdown */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.65rem'
                }}>
                  {t('price_breakdown')}
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  mt: 0.5,
                  bgcolor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">{t('price_per_seat')}:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>ETB {trip?.price || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">{t('number_of_seats')}:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{localSelectedSeats.length}</Typography>
                  </Box>
                  <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">{t('subtotal')}:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>ETB {totalPrice}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />

              {/* Total Price */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2.5,
                p: 2,
                bgcolor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #3b82f6'
              }}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {t('total_amount')}
                </Typography>
                <Typography variant="h5" color="primary" sx={{ 
                  fontWeight: 700,
                  fontSize: '1.3rem'
                }}>
                  ETB {totalPrice}
                </Typography>
              </Box>

              {/* Proceed to Payment Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleProceed}
                disabled={localSelectedSeats.length === 0 || loading}
                sx={{ 
                  borderRadius: '10px',
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #2563eb, #1e3a8a)',
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                  },
                  '&:disabled': {
                    background: '#cbd5e1'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : localSelectedSeats.length === 0 ? (
                  t('select_seats_to_continue')
                ) : (
                  `${t('proceed_to_payment')} - ETB ${totalPrice}`
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeatSelection;