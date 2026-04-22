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
  TextField,
  alpha,
  useTheme
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
  AccessTime,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import PaymentButton from '../../components/passenger/PaymentButton';

const MyBookings = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchDate, setSearchDate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check authentication when auth state changes
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If not authenticated after loading, redirect to login
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    // If authenticated and first check, fetch bookings
    if (!initialCheckDone) {
      setInitialCheckDone(true);
      fetchBookings();
    }
  }, [isAuthenticated, user, authLoading, navigate, initialCheckDone]);

  const fetchBookings = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await api.get('/api/booking/my-bookings');
      
      console.log('Bookings API response:', response.data);

      let fetchedBookings = [];
      if (response.data?.success && Array.isArray(response.data.data)) {
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
      
      if (showRefreshIndicator) {
        showNotification(t('Bookings refreshed'), 'success');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      
      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401) {
        showNotification(t('Session expired. Please login again.'), 'error');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      const errorMessage = error.response?.data?.message || t('Failed to load your bookings');
      showNotification(errorMessage, 'error');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setCancelling(true);
    try {
      const response = await api.delete(`/api/booking/${selectedBooking._id}`);

      if (response.data?.success) {
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
        showNotification(response.data?.message || t('Failed to cancel booking'), 'error');
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      
      if (error.response?.status === 400) {
        showNotification(error.response.data?.message || t('Cannot cancel booking at this time'), 'error');
      } else if (error.response?.status === 401) {
        showNotification(t('Session expired. Please login again.'), 'error');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        const errorMessage = error.response?.data?.message || t('Failed to cancel booking');
        showNotification(errorMessage, 'error');
      }
    } finally {
      setCancelling(false);
    }
  };

  const handlePaymentSuccess = (bookingId) => {
    showNotification(t('Payment completed successfully!'), 'success');
    // Refresh bookings to update status
    fetchBookings(true);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    showNotification(error || t('Payment failed'), 'error');
  };

  const handleViewTicket = (booking) => {
    navigate(`/passenger/booking/${booking._id}/ticket`);
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return t('Invalid date');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return t('N/A');
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t('Invalid time');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return t('N/A');
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t('Invalid date');
    }
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
    try {
      const dep = new Date(departure);
      const arr = new Date(arrival);
      const hours = Math.floor((arr - dep) / (1000 * 60 * 60));
      const minutes = Math.floor(((arr - dep) % (1000 * 60 * 60)) / (1000 * 60));
      return t('{{hours}}h {{minutes}}m', { hours, minutes });
    } catch {
      return t('N/A');
    }
  };

  const canCancelBooking = (booking) => {
    const isPendingOrConfirmed = ['pending', 'confirmed'].includes(booking.status?.toLowerCase());
    const departureTime = booking.tripID?.departureTime ? new Date(booking.tripID.departureTime) : null;
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    return isPendingOrConfirmed && departureTime && departureTime > twoHoursFromNow;
  };

  // Helper function to get seat numbers from booking
  const getSeatNumbers = (booking) => {
    // Priority 1: seatNumbers array (for group bookings)
    if (booking.seatNumbers && Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0) {
      return booking.seatNumbers;
    }
    // Priority 2: single seatNumber
    if (booking.seatNumber) {
      return [booking.seatNumber];
    }
    // Fallback: empty array
    return [];
  };

  // Helper function to get seat count
  const getSeatCount = (booking) => {
    return getSeatNumbers(booking).length;
  };

  // Helper function to get total price
  const getTotalPrice = (booking) => {
    return booking.totalPrice || booking.amount || 0;
  };

  // Helper function to get price per seat
  const getPricePerSeat = (booking) => {
    const totalPrice = getTotalPrice(booking);
    const seatCount = getSeatCount(booking);
    if (seatCount > 0 && totalPrice > 0) {
      return totalPrice / seatCount;
    }
    return booking.pricePerSeat || booking.tripID?.price || 0;
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
    const isPending = booking.status?.toLowerCase() === 'pending';
    const isConfirmed = booking.status?.toLowerCase() === 'confirmed';
    const isCancelled = booking.status?.toLowerCase() === 'cancelled';
    const canCancel = canCancelBooking(booking);
    
    const trip = booking.tripID || booking.trip || {};
    const vehicle = trip.vehicle || {};
    const origin = trip.origin || {};
    const destination = trip.destination || {};
    
    // Get seat numbers using helper function
    const seatNumbers = getSeatNumbers(booking);
    const seatCount = seatNumbers.length;
    const totalAmount = getTotalPrice(booking);
    const pricePerSeat = getPricePerSeat(booking);
    const isGroupBooking = seatCount > 1;

    // Check if payment is needed (pending status and no payment or payment pending)
    const needsPayment = isPending && (!booking.paymentStatus || booking.paymentStatus === 'pending');

    return (
      <Zoom in={true} style={{ transitionDelay: '50ms' }}>
        <Card sx={{ 
          mb: 3, 
          borderRadius: '16px',
          border: '1px solid',
          borderColor: isPending ? '#f59e0b' : isCancelled ? '#ef4444' : '#e2e8f0',
          overflow: 'visible',
          position: 'relative',
          transition: 'all 0.3s ease',
          bgcolor: isCancelled ? alpha('#ef4444', 0.02) : 'white',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            transform: 'translateY(-4px)',
            borderColor: isPending ? '#f59e0b' : isCancelled ? '#ef4444' : '#3b82f6'
          }
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px',
            zIndex: 1,
            display: 'flex',
            gap: 1
          }}>
            {needsPayment && (
              <Chip
                icon={<PaymentIcon />}
                label={t('Payment Required')}
                color="warning"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
            {isGroupBooking && (
              <Chip
                icon={<EventSeat />}
                label={`${seatCount} ${t('Seats')}`}
                color="primary"
                size="small"
                sx={{ fontWeight: 600, bgcolor: '#3b82f6' }}
              />
            )}
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
                    bgcolor: isPending ? '#f59e0b' : '#3b82f6',
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
                    {booking.ticketNumber && (
                      <Typography variant="caption" color="text.secondary">
                        {t('Ticket')}: {booking.ticketNumber}
                      </Typography>
                    )}
                    {isGroupBooking && booking.groupTicketNumber && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('Group Ticket')}: {booking.groupTicketNumber}
                      </Typography>
                    )}
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
                        {seatNumbers.map((seat, index) => (
                          <Chip
                            key={index}
                            label={`Seat ${seat}`}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
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
                      ETB {totalAmount.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AttachMoney fontSize="small" sx={{ color: '#64748b', fontSize: '16px' }} />
                      <Typography variant="caption" color="text.secondary">
                        {seatCount} {t('seat(s)')} × ETB {pricePerSeat.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    {booking.paymentStatus && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('Payment')}: 
                          <Chip
                            size="small"
                            label={booking.paymentStatus === 'success' ? t('Paid') : 
                                   booking.paymentStatus === 'pending' ? t('Pending') : 
                                   booking.paymentStatus}
                            color={booking.paymentStatus === 'success' ? 'success' : 
                                   booking.paymentStatus === 'pending' ? 'warning' : 'default'}
                            sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }}
                          />
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 3,
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    {/* Payment Button for Pending Bookings */}
                    {needsPayment && (
                      <PaymentButton
                        bookingId={booking._id}
                        amount={totalAmount}
                        onSuccess={() => handlePaymentSuccess(booking._id)}
                        onError={handlePaymentError}
                        size="small"
                        variant="contained"
                        fullWidth
                      />
                    )}
                    
                    {/* Ticket Button - Show for confirmed/completed bookings */}
                    {(isConfirmed || booking.status?.toLowerCase() === 'completed') && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Receipt />}
                        onClick={() => handleViewTicket(booking)}
                        fullWidth
                        sx={{ borderRadius: '8px' }}
                      >
                        {t('View Ticket')}
                      </Button>
                    )}
                    
                    {/* Cancel Button */}
                    {canCancel && (
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
                    
                    {/* If no actions available, show disabled state */}
                    {!needsPayment && !canCancel && !isConfirmed && booking.status?.toLowerCase() !== 'completed' && (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled
                        fullWidth
                        sx={{ borderRadius: '8px' }}
                      >
                        {t('No Actions Available')}
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
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            '&:hover': { background: 'linear-gradient(135deg, #2563eb, #1e3a8a)' }
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

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>{t('Checking authentication...')}</Typography>
      </Container>
    );
  }

  // If not authenticated after loading, show redirect message
  if (!isAuthenticated || !user) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>{t('Redirecting to login...')}</Typography>
      </Container>
    );
  }

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
            onClick={() => navigate('/passenger/dashboard')}
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
              onClick={() => fetchBookings(true)}
              disabled={refreshing}
              sx={{ 
                bgcolor: 'white',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f8fafc' }
              }}
            >
              {refreshing ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<DirectionsBus />}
            onClick={() => navigate('/passenger/book-trip')}
            sx={{ 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              '&:hover': { background: 'linear-gradient(135deg, #2563eb, #1e3a8a)' },
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
              {filteredBookings.map((booking) => (
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
                  {t('Refund Amount')}: ETB {getTotalPrice(selectedBooking).toLocaleString()}
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