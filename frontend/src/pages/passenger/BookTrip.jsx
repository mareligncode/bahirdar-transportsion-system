import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  DirectionsBus,
  Payment as PaymentIcon,
  ArrowBack,
  Refresh,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import SeatSelection from '../../components/passenger/SeatSelection';
import TripSearch from '../../components/passenger/TripSearch';
import TripResults from '../../components/passenger/TripResults';
import PaymentButton from '../../components/passenger/PaymentButton';
import toast from 'react-hot-toast';

const steps = ['Search Trips', 'Select Trip', 'Choose Seats', 'Payment'];

export default function BookTrip() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId } = useParams();
  const theme = useTheme();
  const queryParams = new URLSearchParams(location.search);

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [stations, setStations] = useState([]);
  const [searchData, setSearchData] = useState({
    origin: queryParams.get('origin') || '',
    destination: queryParams.get('destination') || '',
    date: queryParams.get('date') ? new Date(queryParams.get('date')) : null,
  });
  const [availableTrips, setAvailableTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [createdBookings, setCreatedBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  // Fetch stations on mount
  useEffect(() => {
    fetchStations();
  }, []);

  // Fetch trip details if tripId is provided
  useEffect(() => {
    if (tripId) {
      fetchTripDetails(tripId);
    }
  }, [tripId]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated && activeStep > 0) {
      toast.error(t('Please login to continue'));
      navigate('/login');
    }
  }, [isAuthenticated, activeStep, navigate, t]);

  const fetchStations = async () => {
    try {
      const response = await api.get('/api/station/active');
      const stationsData = response.data?.stations || response.data?.data?.stations || [];
      setStations(stationsData);
    } catch (error) {
      console.error('Error fetching stations:', error);
      toast.error(t('Failed to load stations'));
    }
  };

  const fetchTripDetails = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/trip/${id}`);
      
      const trip = response.data?.data || response.data;
      if (trip) {
        setSelectedTrip(trip);
        setActiveStep(2); // Go to seat selection
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast.error(error.response?.data?.message || t('Failed to load trip details'));
      navigate('/passenger/book-trip');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (searchParams) => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.date) {
      toast.error(t('Please fill all search fields'));
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const params = {
        origin: searchParams.origin,
        destination: searchParams.destination,
        date: searchParams.date.toISOString().split('T')[0]
      };

      const response = await api.get('/api/trip/search', { params });

      let trips = [];
      if (response.data?.data) {
        trips = response.data.data;
      } else if (Array.isArray(response.data)) {
        trips = response.data;
      }

      setAvailableTrips(trips);

      if (trips.length === 0) {
        toast.info(t('No trips found for your search criteria'));
      } else {
        toast.success(t('Found {{count}} trips', { count: trips.length }));
      }
      
      setActiveStep(1); // Move to results step
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error.response?.data?.message || t('Failed to search trips');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSearching(false);
    }
  }, [t]);

  const handleTripSelect = useCallback((trip) => {
    if (trip.availableSeats === 0) {
      toast.error(t('This trip is sold out'));
      return;
    }
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setActiveStep(2); // Move to seat selection
    navigate(`/passenger/book-trip/${trip._id}`, { replace: true });
  }, [t, navigate]);

  const handleSeatSelection = useCallback((seats) => {
    console.log('Selected seats (numbers):', seats); // Debug log
    setSelectedSeats(seats);
  }, []);

  const handleProceedToPayment = useCallback(async () => {
    if (!selectedTrip || selectedSeats.length === 0) {
      toast.error(t('Please select at least one seat'));
      return;
    }

    if (!isAuthenticated) {
      toast.error(t('Please login to continue'));
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    setPaymentDialogOpen(true);

    try {
      console.log('Creating bookings for seats:', selectedSeats); // Debug log
      
      // Create bookings for each selected seat
      const bookingPromises = selectedSeats.map(async (seatNumber) => {
        // Ensure seatNumber is a number
        const seatNum = parseInt(seatNumber, 10);
        
        const bookingData = {
          tripID: selectedTrip._id,
          seatNumber: seatNum, // Now guaranteed to be a number
          passengerDetails: {
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            emergencyContact: user.emergencyContact || ''
          }
        };

        console.log('Sending booking data:', bookingData); // Debug log

        const response = await api.post('/api/booking', bookingData);
        return response.data?.data || response.data;
      });

      const bookings = await Promise.all(bookingPromises);
      
      console.log('Bookings created:', bookings); // Debug log
      setCreatedBookings(bookings);
      toast.success(t('{{count}} seat(s) booked successfully!', { count: selectedSeats.length }));

      // If only one booking, proceed directly to payment
      if (bookings.length === 1) {
        setActiveStep(3);
      } else {
        // For multiple bookings, show payment step
        setActiveStep(3);
      }
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error details:', error.response?.data); // Debug log
      
      let errorMessage = t('Failed to create booking');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
      setPaymentDialogOpen(false);
      setPaymentStatus('failed');
    } finally {
      setBookingLoading(false);
    }
  }, [selectedTrip, selectedSeats, isAuthenticated, user, t, navigate]);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentStatus('success');
    toast.success(t('Payment completed successfully!'));
    
    // Get the first booking ID to show in confirmation
    const bookingId = createdBookings[0]?._id;
    
    // Redirect to booking confirmation page
    setTimeout(() => {
      navigate(`/passenger/booking-confirmation?bookingId=${bookingId}&success=true`);
    }, 1500);
  }, [navigate, createdBookings]);

  const handlePaymentError = useCallback((error) => {
    console.error('Payment error in BookTrip:', error);
    setPaymentStatus('failed');
    toast.error(error || t('Payment failed'));
  }, [t]);

  const handleBack = useCallback(() => {
    if (activeStep === 1) {
      setActiveStep(0);
      navigate('/passenger/book-trip', { replace: true });
    } else if (activeStep === 2) {
      setActiveStep(1);
      setSelectedTrip(null);
      setSelectedSeats([]);
      setCreatedBookings([]);
      navigate('/passenger/book-trip', { replace: true });
    } else if (activeStep === 3) {
      setActiveStep(2);
      setPaymentDialogOpen(false);
      setPaymentStatus(null);
    }
  }, [activeStep, navigate]);

  const handleNewSearch = () => {
    setActiveStep(0);
    setSelectedTrip(null);
    setSelectedSeats([]);
    setCreatedBookings([]);
    setAvailableTrips([]);
    setSearchData({ origin: '', destination: '', date: null });
    setPaymentStatus(null);
    navigate('/passenger/book-trip', { replace: true });
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    if (paymentStatus === 'success') {
      const bookingId = createdBookings[0]?._id;
      navigate(`/passenger/booking-confirmation?bookingId=${bookingId}&success=true`);
    } else {
      setPaymentStatus(null);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <TripSearch
            stations={stations}
            initialData={searchData}
            onSearch={handleSearch}
            loading={searching}
          />
        );
      
      case 1:
        return (
          <TripResults
            trips={availableTrips}
            searchData={searchData}
            stations={stations}
            onTripSelect={handleTripSelect}
            onBack={handleBack}
            loading={searching}
          />
        );
      
      case 2:
        return selectedTrip ? (
          <SeatSelection
            trip={selectedTrip}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelection}
            onProceedToPayment={handleProceedToPayment}
            onBack={handleBack}
            loading={bookingLoading}
            maxSeats={8}
          />
        ) : null;
      
      case 3:
        const totalAmount = selectedTrip?.price * selectedSeats.length;
        const firstBookingId = createdBookings[0]?._id;

        return (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {t('Complete Payment')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {t('You have {{count}} booking(s) to pay for.', { count: selectedSeats.length })}
            </Typography>
            
            {/* Booking Summary */}
            <Box sx={{ 
              my: 4, 
              p: 3, 
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <Typography variant="h3" sx={{ 
                fontWeight: 700, 
                color: theme.palette.primary.main,
                mb: 1
              }}>
                ETB {totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedSeats.length} {t('seat(s)')} × ETB {selectedTrip?.price.toLocaleString()}
              </Typography>
              
              {/* Selected Seats - Now showing numbers */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1, 
                mt: 2,
                flexWrap: 'wrap'
              }}>
                {selectedSeats.map((seat, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '16px',
                      fontWeight: 600
                    }}
                  >
                    Seat {seat}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Payment Button */}
            {firstBookingId ? (
              <PaymentButton
                bookingId={firstBookingId}
                amount={totalAmount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                fullWidth
                size="large"
              />
            ) : (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('No booking found. Please go back and try again.')}
              </Alert>
            )}

            {/* Back Button */}
            <Button
              variant="text"
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ mt: 2 }}
            >
              {t('Back to Seat Selection')}
            </Button>
          </Paper>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>{t('Loading...')}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          {t('Book Your Trip')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('Find and book your next journey with Bahir Dar Transport System')}
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{t(label)}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Main Content */}
      <Fade in={true} timeout={500}>
        <Box>
          {getStepContent(activeStep)}
        </Box>
      </Fade>

      {/* New Search Button (visible after step 0) */}
      {activeStep > 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleNewSearch}
            startIcon={<SearchIcon />}
            sx={{ borderRadius: '8px' }}
          >
            {t('Start New Search')}
          </Button>
        </Box>
      )}

      {/* Payment Processing Dialog */}
      <Dialog 
        open={paymentDialogOpen && activeStep !== 3} 
        onClose={handleClosePaymentDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          {paymentStatus === 'success' ? t('Payment Successful') : 
           paymentStatus === 'failed' ? t('Payment Failed') : 
           t('Processing Payment')}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          {!paymentStatus ? (
            <>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography>
                {bookingLoading ? t('Creating your booking...') : t('Redirecting to payment...')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('Please do not close this window')}
              </Typography>
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('Payment Successful!')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Your booking has been confirmed.')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                {t('Redirecting to confirmation page...')}
              </Typography>
            </>
          ) : (
            <>
              <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, color: '#ef4444' }}>
                {t('Payment Failed')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Please try again or contact support.')}
              </Typography>
            </>
          )}
        </DialogContent>
        {paymentStatus && (
          <DialogActions sx={{ pb: 3, px: 3 }}>
            <Button 
              onClick={handleClosePaymentDialog} 
              variant="contained" 
              fullWidth
              color={paymentStatus === 'success' ? 'success' : 'primary'}
            >
              {paymentStatus === 'success' ? t('View Confirmation') : t('Close')}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
}