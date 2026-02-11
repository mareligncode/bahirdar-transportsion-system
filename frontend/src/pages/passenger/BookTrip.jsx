import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Chip,
  Fade,
  Fab
} from '@mui/material'; // Removed SnackbarCloseReason
import {
  ArrowBack,
  SafetyCheck,
  TrendingUp,
  Schedule,
  ElectricCar
} from '@mui/icons-material';
import api from '../../services/api';
import TripSearch from '../../components/passenger/TripSearch';
import TripResults from '../../components/passenger/TripResults';
import SeatSelection from '../../components/passenger/SeatSelection';

const BookTrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const initialOrigin = queryParams.get('origin') || '';
  const initialDestination = queryParams.get('destination') || '';
  const initialDate = queryParams.get('date') ? new Date(queryParams.get('date')) : null;

  const [searchData, setSearchData] = useState({
    origin: initialOrigin,
    destination: initialDestination,
    date: initialDate,
  });
  const [availableTrips, setAvailableTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [searching, setSearching] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [stations, setStations] = useState([]);
  const [step, setStep] = useState('search');
  const [viewMode, setViewMode] = useState('grid');
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch stations on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchStations();
        
        if (initialOrigin && initialDestination && initialDate) {
          handleSearch({
            origin: initialOrigin,
            destination: initialDestination,
            date: initialDate
          });
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    
    initializeData();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await api.get('/api/station/active');
      setStations(response.data.stations || []);
    } catch (error) {
      console.error('Error fetching stations:', error);
      showNotification('Failed to load stations', 'error');
    }
  };

  const handleSearch = async (searchParams) => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.date) {
      showNotification('Please fill all search fields', 'error');
      return;
    }

    setSearchData(searchParams);
    setSearching(true);
    setAvailableTrips([]);

    try {
      const params = {
        origin: searchParams.origin,
        destination: searchParams.destination,
        date: searchParams.date.toISOString().split('T')[0]
      };

      const response = await api.get('/api/trip/search', { params });
      
      let trips = [];
      if (response.data.success && Array.isArray(response.data.data)) {
        trips = response.data.data;
      } else if (Array.isArray(response.data.data)) {
        trips = response.data.data;
      } else if (Array.isArray(response.data.trips)) {
        trips = response.data.trips;
      } else if (Array.isArray(response.data)) {
        trips = response.data;
      }
      
      setAvailableTrips(trips);
      setStep('results');
      
      if (trips.length === 0) {
        showNotification('No trips found for your search criteria', 'info');
      } else {
        showNotification(`Found ${trips.length} trip${trips.length > 1 ? 's' : ''}`, 'success');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to search trips';
      showNotification(errorMessage, 'error');
      setAvailableTrips([]);
    } finally {
      setSearching(false);
    }
  };

  const handleTripSelect = (trip) => {
    if (trip.availableSeats === 0) {
      showNotification('This trip is sold out. Please select another trip.', 'error');
      return;
    }
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setStep('seats');
  };

  const handleSeatsSelected = (seats) => {
    setSelectedSeats(seats);
  };

  const handleProceedToPayment = async () => {
    if (!selectedTrip || selectedSeats.length === 0) {
      showNotification('Please select at least one seat', 'error');
      return;
    }

    setBookingLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        showNotification('Please login to continue', 'error');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      const user = JSON.parse(userStr);
      
      const bookingData = {
        tripID: selectedTrip._id,
        passengerID: user._id,
        seatNumbers: selectedSeats,
        bookingDate: new Date().toISOString(),
        totalPrice: selectedTrip.price * selectedSeats.length,
        notes: '',
        status: 'pending'
      };

      const response = await api.post('/api/booking', bookingData);

      if (response.data.success) {
        showNotification('🎉 Booking successful! Redirecting to bookings...', 'success');
        
        setTimeout(() => {
          setSelectedTrip(null);
          setSelectedSeats([]);
          setStep('search');
          navigate('/passenger/bookings');
        }, 2000);
      } else {
        showNotification(response.data.message || 'Booking failed', 'error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to book trip';
      showNotification(errorMessage, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  };

  const goBack = () => {
    switch(step) {
      case 'results':
        setStep('search');
        break;
      case 'seats':
        setStep('results');
        setSelectedTrip(null);
        setSelectedSeats([]);
        break;
      default:
        navigate('/passenger');
    }
  };

  const renderHeroSection = () => (
    <Box sx={{
      textAlign: 'center',
      padding: '60px 20px 40px',
      background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
      borderRadius: '0 0 30px 30px',
      color: 'white',
      marginBottom: '40px',
      boxShadow: '0 4px 20px rgba(30, 64, 175, 0.15)'
    }}>
      <Typography variant="h2" sx={{ 
        fontWeight: 700, 
        fontSize: { xs: '2rem', md: '3rem' },
        marginBottom: '16px',
        letterSpacing: '-0.5px'
      }} gutterBottom>
        Find Your Perfect Ride
      </Typography>
      <Typography variant="h5" sx={{ 
        fontWeight: 400,
        marginBottom: '30px',
        opacity: 0.9,
        fontSize: { xs: '1rem', md: '1.2rem' },
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }} gutterBottom>
        Comfortable, safe, and affordable travel across Ethiopia
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '16px', 
        flexWrap: 'wrap',
        marginTop: '30px'
      }}>
        <Chip icon={<SafetyCheck />} label="Safe Travel" sx={{ 
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          fontWeight: 500,
          '& .MuiChip-icon': { color: 'white' }
        }} />
        <Chip icon={<TrendingUp />} label="Best Prices" sx={{ 
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          fontWeight: 500,
          '& .MuiChip-icon': { color: 'white' }
        }} />
        <Chip icon={<Schedule />} label="On Time" sx={{ 
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          fontWeight: 500,
          '& .MuiChip-icon': { color: 'white' }
        }} />
        <Chip icon={<ElectricCar />} label="Modern Fleet" sx={{ 
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          fontWeight: 500,
          '& .MuiChip-icon': { color: 'white' }
        }} />
      </Box>
    </Box>
  );

  const renderStepContent = () => {
    switch(step) {
      case 'search':
        return (
          <Fade in={true} timeout={800}>
            <Box>
              {renderHeroSection()}
              
              <Paper elevation={0} sx={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                margin: '-40px auto 40px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                zIndex: 10,
                maxWidth: '1000px',
                border: '1px solid #e2e8f0'
              }}>
                <TripSearch 
                  stations={stations}
                  initialData={searchData}
                  onSearch={handleSearch}
                />
              </Paper>
            </Box>
          </Fade>
        );

      case 'results':
        return (
          <Fade in={true} timeout={800}>
            <Box>
              <TripResults
                trips={availableTrips}
                loading={searching}
                searchData={searchData}
                stations={stations}
                onTripSelect={handleTripSelect}
                onBack={goBack}
                viewMode={viewMode}
              />
            </Box>
          </Fade>
        );

      case 'seats':
        if (!selectedTrip) {
          return (
            <Box sx={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
              <Typography variant="h4">Trip Not Found</Typography>
              <Typography>Please go back and select another trip.</Typography>
            </Box>
          );
        }

        return (
          <Fade in={true} timeout={800}>
            <Container maxWidth="xl">
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: '8px', 
                  color: '#1e293b'
                }} gutterBottom>
                  Complete Your Booking
                </Typography>
                <Paper elevation={1} sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bae6fd'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedTrip.origin?.stationName} → {selectedTrip.destination?.stationName}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {new Date(selectedTrip.departureTime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} • {new Date(selectedTrip.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e40af' }}>
                        ${selectedTrip.price} <Typography component="span" variant="body2" color="text.secondary">per seat</Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTrip.availableSeats} seats available
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
              
              <SeatSelection
                trip={selectedTrip}
                selectedSeats={selectedSeats}
                onSeatsSelected={handleSeatsSelected}
                onProceedToPayment={handleProceedToPayment}
              />
            </Container>
          </Fade>
        );

      default:
        return null;
    }
  };

return (
  <Container maxWidth="xl" sx={{ 
    padding: '0 !important', 
    maxWidth: '1400px !important', 
    minHeight: '100vh', 
    background: '#f8fafc',
    position: 'relative' // Add this back
  }}>
    {/* Back Button - Absolute positioned at bottom right */}
    {step !== 'search' && (
      <Fab
        onClick={goBack}
        sx={{
          position: 'absolute', // Changed from fixed to absolute
          bottom: '30px',
          right: '30px',
          zIndex: 9999,
          background: '#3b82f6',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            background: '#2563eb',
            transform: 'scale(1.1)',
            transition: 'all 0.2s ease'
          },
          width: '56px',
          height: '56px'
        }}
        aria-label="back"
      >
        <ArrowBack />
      </Fab>
    )}

    {/* Main Content */}
    <Box sx={{ 
      padding: { xs: '16px', md: '24px' },
      minHeight: '100vh',
      pb: '100px' // Add padding bottom to make room for the button
    }}>
      {renderStepContent()}
    </Box>

      {/* Loading Overlay for Booking */}
      {bookingLoading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <Box sx={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Processing your booking...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we confirm your seats
            </Typography>
          </Box>
        </Box>
      )}

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

export default BookTrip;