import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

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
  const [createdBooking, setCreatedBooking] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]); // NEW: State for booked seats
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

  // NEW: Fetch booked seats when trip is selected
  useEffect(() => {
    if (selectedTrip?._id) {
      fetchBookedSeats(selectedTrip._id);
    }
  }, [selectedTrip]);

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
        setActiveStep(2);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast.error(error.response?.data?.message || t('Failed to load trip details'));
      navigate('/passenger/book-trip');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch booked seats for the selected trip
  const fetchBookedSeats = async (tripId) => {
    try {
      console.log('🔍 Fetching booked seats for trip:', tripId);
      const response = await api.get(`/api/booking/trip/${tripId}/booked-seats`);
      
      // The API returns an array of booked seat numbers
      const bookedSeatsArray = response.data?.data || [];
      console.log('📊 Booked seats from backend:', bookedSeatsArray);
      setBookedSeats(bookedSeatsArray);
    } catch (error) {
      console.error('Error fetching booked seats:', error);
      // Don't show error to user, just set empty array
      setBookedSeats([]);
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
      // Handle date that might already be a string (YYYY-MM-DD) or a Date object
      let formattedDate;
      if (typeof searchParams.date === 'string') {
        formattedDate = searchParams.date;
      } else if (searchParams.date instanceof Date) {
        formattedDate = searchParams.date.toISOString().split('T')[0];
      } else {
        formattedDate = String(searchParams.date);
      }

      const params = {
        origin: searchParams.origin,
        destination: searchParams.destination,
        date: formattedDate
      };

      console.log('🔍 Searching trips with params:', params);

      const response = await api.get('/api/trip/search', { params });

      let trips = [];
      if (response.data?.data) {
        trips = response.data.data;
      } else if (Array.isArray(response.data)) {
        trips = response.data;
      }

      console.log('🎫 Found trips:', trips.length);

      setAvailableTrips(trips);

      if (trips.length === 0) {
        toast.success(t('No trips found for your search criteria'), {
          icon: 'ℹ️',
          duration: 4000
        });
      } else {
        toast.success(t('Found {{count}} trips', { count: trips.length }));
      }
      
      setActiveStep(1);
    } catch (error) {
      console.error('❌ Search error:', error);
      console.error('Error response:', error.response?.data);
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
    setCreatedBooking(null);
    setBookedSeats([]); // Reset booked seats when selecting new trip
    setActiveStep(2);
    navigate(`/passenger/book-trip/${trip._id}`, { replace: true });
  }, [t, navigate]);

  const handleSeatSelection = useCallback((seats) => {
    console.log('Selected seats (numbers):', seats);
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
      console.log('Creating booking for seats:', selectedSeats);
      
      const passengerDetails = {
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        emergencyContact: user.emergencyContact || ''
      };

      let bookingResponse;
      
      if (selectedSeats.length === 1) {
        const bookingData = {
          tripID: selectedTrip._id,
          seatNumber: parseInt(selectedSeats[0], 10),
          passengerDetails
        };
        
        console.log('Sending single seat booking data:', bookingData);
        const response = await api.post('/api/booking', bookingData);
        bookingResponse = response.data?.data;
        
      } else {
        const seatsPayload = selectedSeats.map(seatNumber => ({
          seatNumber: parseInt(seatNumber, 10)
        }));
        
        const batchData = {
          tripID: selectedTrip._id,
          seats: seatsPayload,
          passengerDetails
        };
        
        console.log('Sending batch booking data:', batchData);
        const response = await api.post('/api/booking/batch', batchData);
        
        const bookingArray = response.data?.data || [];
        bookingResponse = bookingArray[0];
      }
      
      console.log('Booking created:', bookingResponse);
      setCreatedBooking(bookingResponse);
      
      const seatCount = selectedSeats.length;
      toast.success(t('{{count}} seat(s) booked successfully!', { count: seatCount }));
      
      setActiveStep(3);
      
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error details:', error.response?.data);
      
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
    
    const bookingId = createdBooking?._id;
    
    setTimeout(() => {
      navigate(`/passenger/booking-confirmation?bookingId=${bookingId}&success=true`);
    }, 1500);
  }, [navigate, createdBooking]);

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
      setCreatedBooking(null);
      setBookedSeats([]);
      navigate('/passenger/book-trip', { replace: true });
    } else if (activeStep === 3) {
      setActiveStep(2);
      setPaymentDialogOpen(false);
      setPaymentStatus(null);
    }
  }, [activeStep, navigate]);

  const handleNewSearch = useCallback(() => {
    setActiveStep(0);
    setSelectedTrip(null);
    setSelectedSeats([]);
    setCreatedBooking(null);
    setBookedSeats([]);
    setAvailableTrips([]);
    setSearchData({ origin: '', destination: '', date: null });
    setPaymentStatus(null);
    navigate('/passenger/book-trip', { replace: true });
  }, [navigate]);

  const handleClosePaymentDialog = useCallback(() => {
    setPaymentDialogOpen(false);
    if (paymentStatus === 'success') {
      const bookingId = createdBooking?._id;
      navigate(`/passenger/booking-confirmation?bookingId=${bookingId}&success=true`);
    } else {
      setPaymentStatus(null);
    }
  }, [navigate, createdBooking, paymentStatus]);

  const getSeatNumbers = useCallback((booking) => {
    if (booking?.seatNumbers && Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0) {
      return booking.seatNumbers;
    }
    if (booking?.seatNumber) {
      return [booking.seatNumber];
    }
    return [];
  }, []);

  const getTotalAmount = useCallback(() => {
    if (!selectedTrip) return 0;
    return selectedTrip.price * selectedSeats.length;
  }, [selectedTrip, selectedSeats]);

  // Memoized step content to prevent infinite re-renders
  const stepContent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <TripSearch
            key="trip-search"
            stations={stations}
            initialData={searchData}
            onSearch={handleSearch}
            loading={searching}
          />
        );
      
      case 1:
        return (
          <TripResults
            key="trip-results"
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
            key="seat-selection"
            trip={selectedTrip}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelection}
            onProceedToPayment={handleProceedToPayment}
            onBack={handleBack}
            loading={bookingLoading}
            maxSeats={8}
            bookedSeats={bookedSeats} // Pass the booked seats to SeatSelection
          />
        ) : null;
      
      case 3: {
        const totalAmount = getTotalAmount();
        const bookingId = createdBooking?._id;
        const seatNumbers = createdBooking ? getSeatNumbers(createdBooking) : selectedSeats;
        const seatCount = seatNumbers.length;

        return (
          <Paper key="payment-step" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {t('Complete Payment')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {t('You have {{count}} seat(s) to pay for.', { count: seatCount })}
            </Typography>
            
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
                {seatCount} {t('seat(s)')} × ETB {selectedTrip?.price.toLocaleString()}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1, 
                mt: 2,
                flexWrap: 'wrap'
              }}>
                {seatNumbers.map((seat, index) => (
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
              
              {seatCount > 1 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  {t('Group booking - all seats in one transaction')}
                </Typography>
              )}
            </Box>

            {bookingId ? (
              <PaymentButton
                bookingId={bookingId}
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
      }
      
      default:
        return null;
    }
  }, [
    activeStep, stations, searchData, handleSearch, searching,
    availableTrips, handleTripSelect, handleBack, selectedTrip,
    selectedSeats, handleSeatSelection, handleProceedToPayment,
    bookingLoading, getTotalAmount, createdBooking, getSeatNumbers,
    t, theme, handlePaymentSuccess, handlePaymentError, selectedTrip?.price,
    bookedSeats // Add bookedSeats to dependencies
  ]);

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
          {t('Book Your Trip')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('Find and book your next journey with Bahir Dar Transport System')}
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{t(label)}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Fade in={true} timeout={500}>
        <Box>
          {stepContent}
        </Box>
      </Fade>

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