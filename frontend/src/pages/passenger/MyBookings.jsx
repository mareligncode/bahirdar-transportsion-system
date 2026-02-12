import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  LinearProgress,
  Fade,
  Zoom,
  Tooltip,
  Badge,
  TextField
} from '@mui/material';
import {
  DirectionsBus,
  Person,
  Schedule,
  LocationOn,
  AttachMoney,
  EventSeat,
  Cancel,
  Receipt,
  History,
  ArrowBack,
  Refresh,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  Info,
  ConfirmationNumber,
  AccessTime
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

const MyBookings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchDate, setSearchDate] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchBookings();
  }, []); // ⚠️ NO 't' here!

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user._id) {
        showNotification(t('Please login to view your bookings'), 'error');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      const response = await api.get('/api/booking/my-bookings', {
        params: {
          passengerId: user._id
        }
      });

      console.log('Bookings response:', response.data);

      let fetchedBookings = [];
      if (response.data.success && Array.isArray(response.data.data)) {
        fetchedBookings = response.data.data;
      } else if (Array.isArray(response.data.data)) {
        fetchedBookings = response.data.data;
      } else if (Array.isArray(response.data.bookings)) {
        fetchedBookings = response.data.bookings;
      } else if (Array.isArray(response.data)) {
        fetchedBookings = response.data;
      }

      // Sort bookings by date (most recent first)
      const sortedBookings = fetchedBookings.sort((a, b) => 
        new Date(b.bookingDate || b.createdAt) - new Date(a.bookingDate || a.createdAt)
      );

      setBookings(sortedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const errorMessage = error.response?.data?.message || t('Failed to load your bookings');
      showNotification(errorMessage, 'error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setCancelling(true);
    try {
      const response = await api.put(`/api/booking/${selectedBooking._id}/cancel`);

      if (response.data.success) {
        showNotification(t('Booking cancelled successfully'), 'success');
        // Update the booking in the list
        setBookings(prev => prev.map(booking => 
          booking._id === selectedBooking._id 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
        setCancelDialogOpen(false);
        setSelectedBooking(null);
      } else {
        showNotification(response.data.message || t('Failed to cancel booking'), 'error');
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      const errorMessage = error.response?.data?.message || t('Failed to cancel booking');
      showNotification(errorMessage, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const openCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification(prev => ({ ...prev, open: false }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('N/A');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return t('N/A');
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return t('N/A');
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle />;
      case 'pending':
        return <Pending />;
      case 'cancelled':
        return <Cancel />;
      case 'completed':
        return <CheckCircle />;
      default:
        return <Info />;
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return t('Unknown');
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return t('N/A');
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const hours = Math.floor((arr - dep) / (1000 * 60 * 60));
    const minutes = Math.floor(((arr - dep) % (1000 * 60 * 60)) / (1000 * 60));
    return t('{{hours}}h {{minutes}}m', { hours, minutes });
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => 
        booking.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Filter by date
    if (searchDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.bookingDate || booking.createdAt);
        return bookingDate.toDateString() === searchDate.toDateString();
      });
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  const renderBookingCard = (booking) => {
    const isCancellable = booking.status?.toLowerCase() === 'confirmed' || 
                          booking.status?.toLowerCase() === 'pending';
    const trip = booking.tripID || booking.trip || {};
    const vehicle = trip.vehicle || {};
    const origin = trip.origin || {};
    const destination = trip.destination || {};

    return (
      <Zoom in={true} style={{ transitionDelay: '50ms' }}>
        <Card sx={{ 
          mb: 3, 
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'visible',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            transform: 'translateY(-4px)',
            borderColor: '#3b82f6'
          }
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px',
            zIndex: 1
          }}>
            <Chip
              icon={getStatusIcon(booking.status)}
              label={getStatusLabel(booking.status)}
              color={getStatusColor(booking.status)}
              sx={{ 
                fontWeight: 600,
                px: 1,
                '& .MuiChip-icon': { 
                  fontSize: '18px',
                  ml: 0.5
                }
              }}
            />
          </Box>

          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Left Section - Route Info */}
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: '#3b82f6',
                    width: 40,
                    height: 40,
                    mr: 2
                  }}>
                    <DirectionsBus />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {origin.stationName || t('Unknown')} → {destination.stationName || t('Unknown')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('Booking #')}{booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {t('Departure')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(trip.departureTime)} {t('at')} {formatTime(trip.departureTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {t('Duration')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {calculateDuration(trip.departureTime, trip.arrivalTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventSeat fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {t('Seats')}:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {booking.seatNumbers?.map((seat, index) => (
                          <Chip
                            key={index}
                            label={seat}
                            size="small"
                            sx={{ 
                              bgcolor: '#e2e8f0',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <DirectionsBus fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {t('Vehicle')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {vehicle.carType || t('N/A')} • {vehicle.plateNumber || t('N/A')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {t('Driver')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {trip.driver?.fullName || t('N/A')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Receipt fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {t('Booked on')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(booking.bookingDate || booking.createdAt)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Section - Price & Actions */}
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: { md: '1px solid #e2e8f0' },
                  pl: { md: 3 },
                  pt: { xs: 2, md: 0 },
                  mt: { xs: 2, md: 0 }
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('Total Amount')}
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      color: '#1e40af',
                      mb: 1
                    }}>
                      ${booking.totalPrice || booking.price || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AttachMoney fontSize="small" sx={{ color: '#64748b', fontSize: '16px' }} />
                      <Typography variant="caption" color="text.secondary">
                        {booking.seatNumbers?.length || 0} {t('seat(s)')} × ${booking.pricePerSeat || trip.price || 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 3,
                    flexDirection: { xs: 'row', sm: 'row' }
                  }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Receipt />}
                      onClick={() => {/* Handle view ticket */}}
                      fullWidth
                      sx={{ borderRadius: '8px' }}
                    >
                      {t('Ticket')}
                    </Button>
                    
                    {isCancellable && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Cancel />}
                        onClick={() => openCancelDialog(booking)}
                        disabled={cancelling}
                        fullWidth
                        sx={{ borderRadius: '8px' }}
                      >
                        {t('Cancel')}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  const renderEmptyState = () => (
    <Paper sx={{ 
      p: 6, 
      textAlign: 'center',
      borderRadius: '16px',
      background: 'white',
      border: '1px solid #e2e8f0'
    }}>
      <Avatar sx={{ 
        width: 80, 
        height: 80, 
        bgcolor: '#e2e8f0',
        color: '#64748b',
        margin: '0 auto 20px'
      }}>
        <History sx={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
        {t('No Bookings Found')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {filterStatus !== 'all' || searchDate 
          ? t('No bookings match your current filters. Try adjusting your search criteria.')
          : t("You haven't made any bookings yet. Start your journey by booking a trip!")}
      </Typography>
      {filterStatus !== 'all' || searchDate ? (
        <Button 
          variant="outlined" 
          onClick={() => {
            setFilterStatus('all');
            setSearchDate(null);
          }}
          sx={{ borderRadius: '8px' }}
        >
          {t('Clear Filters')}
        </Button>
      ) : (
        <Button 
          variant="contained" 
          startIcon={<DirectionsBus />}
          onClick={() => navigate('/passenger/book-trip')}
          sx={{ 
            borderRadius: '8px',
            background: '#3b82f6',
            '&:hover': { background: '#2563eb' }
          }}
        >
          {t('Book a Trip')}
        </Button>
      )}
    </Paper>
  );

  const renderLoadingState = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '100px',
      gap: '20px'
    }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ color: '#1e293b' }}>
        {t('Loading your bookings...')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('Please wait while we fetch your booking history')}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ 
      py: 4,
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/passenger')}
            sx={{ 
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              '&:hover': { bgcolor: '#f8fafc' }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <ConfirmationNumber sx={{ fontSize: 32, color: '#3b82f6' }} />
              {t('My Bookings')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('View and manage your trip bookings')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title={t('Refresh')}>
            <IconButton 
              onClick={fetchBookings}
              disabled={loading}
              sx={{ 
                bgcolor: 'white',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f8fafc' }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<DirectionsBus />}
            onClick={() => navigate('/passenger/book-trip')}
            sx={{ 
              borderRadius: '8px',
              background: '#3b82f6',
              '&:hover': { background: '#2563eb' },
              px: 3
            }}
          >
            {t('Book New Trip')}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        background: 'white'
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('Filter by Status')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((status) => (
                <Chip
                  key={status}
                  label={status === 'all' ? t('All') : t(status.charAt(0).toUpperCase() + status.slice(1))}
                  onClick={() => setFilterStatus(status)}
                  color={filterStatus === status ? 'primary' : 'default'}
                  variant={filterStatus === status ? 'filled' : 'outlined'}
                  sx={{ 
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('Filter by Date')}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t('Booking Date')}
                value={searchDate}
                onChange={setSearchDate}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    size="small" 
                    fullWidth 
                    placeholder={t('Select date')}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('Summary')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Badge badgeContent={bookings.length} color="primary">
                  <ConfirmationNumber color="action" />
                </Badge>
                <Typography variant="body2">{t('Total')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Badge badgeContent={bookings.filter(b => b.status === 'confirmed').length} color="success">
                  <CheckCircle color="action" />
                </Badge>
                <Typography variant="body2">{t('Confirmed')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Badge badgeContent={bookings.filter(b => b.status === 'pending').length} color="warning">
                  <Pending color="action" />
                </Badge>
                <Typography variant="body2">{t('Pending')}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Bookings List */}
      <Fade in={true} timeout={500}>
        <Box>
          {loading ? (
            renderLoadingState()
          ) : filteredBookings.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('Showing {{count}} of {{total}} booking(s)', { 
                    count: filteredBookings.length, 
                    total: bookings.length 
                  })}
                </Typography>
                {(filterStatus !== 'all' || searchDate) && (
                  <Button 
                    size="small" 
                    onClick={() => {
                      setFilterStatus('all');
                      setSearchDate(null);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('Clear Filters')}
                  </Button>
                )}
              </Box>
              {filteredBookings.map((booking, index) => (
                <Box key={booking._id}>
                  {renderBookingCard(booking)}
                </Box>
              ))}
            </>
          )}
        </Box>
      </Fade>

      {/* Cancel Booking Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={closeCancelDialog}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#fee2e2', color: '#ef4444' }}>
              <Cancel />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('Cancel Booking')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#64748b' }}>
            {t('Are you sure you want to cancel this booking?')}
            {selectedBooking && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedBooking.tripID?.origin?.stationName} → {selectedBooking.tripID?.destination?.stationName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatDateTime(selectedBooking.tripID?.departureTime)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: '#1e40af' }}>
                  {t('Refund Amount')}: ${selectedBooking.totalPrice || selectedBooking.price || 0}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={closeCancelDialog}
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            {t('Keep Booking')}
          </Button>
          <Button 
            onClick={handleCancelBooking}
            variant="contained"
            color="error"
            disabled={cancelling}
            sx={{ 
              borderRadius: '8px',
              px: 3
            }}
          >
            {cancelling ? <CircularProgress size={24} /> : t('Yes, Cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ 
            borderRadius: '8px', 
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyBookings;