import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  TextField,
  Stack,
  Tooltip,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
  ConfirmationNumber as TicketIcon,
  AccessTime,
  Person as PersonIcon,
  Payment as PaymentIcon,
  QrCode as QrCodeIcon,
  WhatsApp as WhatsAppIcon,
  Refresh as RefreshIcon,
  DirectionsBus,
  EventSeat,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../services/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BookingConfirmation() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Get booking ID from URL or sessionStorage
  const [bookingId, setBookingId] = useState(() => {
    const params = new URLSearchParams(location.search);
    const urlId = params.get('bookingId');
    if (urlId) return urlId;

    const storedId = sessionStorage.getItem('pendingBookingId');
    if (storedId) {
      console.log('📦 Found in sessionStorage:', storedId);
      return storedId;
    }
    return null;
  });

  const paymentSuccess = new URLSearchParams(location.search).get('success') === 'true';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  // Helper function to get total amount correctly
  const getTotalAmount = () => {
    if (!booking) return 0;
    
    // Priority 1: Use totalPrice from booking (already includes all seats)
    if (booking.totalPrice && booking.totalPrice > 0) {
      return booking.totalPrice;
    }
    
    // Priority 2: Calculate from trip price and seat count
    const seatCount = getSeatCount(booking);
    const pricePerSeat = booking.tripID?.price || booking.pricePerSeat || 0;
    if (seatCount > 0 && pricePerSeat > 0) {
      return seatCount * pricePerSeat;
    }
    
    // Priority 3: Fallback to amount or batchTotalPrice
    return booking.amount || booking.batchTotalPrice || 0;
  };

  // Helper function to get price per seat
  const getPricePerSeat = () => {
    if (!booking) return 0;
    
    const totalAmount = getTotalAmount();
    const seatCount = getSeatCount(booking);
    
    if (seatCount > 0 && totalAmount > 0) {
      return totalAmount / seatCount;
    }
    
    return booking.tripID?.price || booking.pricePerSeat || 0;
  };

  // Helper function to format seat numbers for display
  const getSeatDisplay = () => {
    if (!booking) return 'N/A';
    const seats = getSeatNumbers(booking);
    if (seats.length === 0) return 'N/A';
    if (seats.length === 1) return seats[0].toString();
    return seats.join(', ');
  };

  // Confetti effect
  useEffect(() => {
    if (paymentSuccess) {
      setShowConfetti(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });
      toast.success('Payment successful! Your booking is confirmed.', {
        duration: 5000,
        icon: '🎉',
      });

      // Force refresh after payment success
      setTimeout(() => {
        handleRefresh();
      }, 1500);
    }
  }, [paymentSuccess]);

  // Fetch booking
  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID found');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        console.log('Fetching booking:', bookingId);
        const response = await api.get(`/api/booking/${bookingId}`);
        const bookingData = response.data?.data || response.data;
        console.log('Booking data:', bookingData);
        console.log('Seat numbers:', bookingData.seatNumbers);
        console.log('Total price:', bookingData.totalPrice);
        setBooking(bookingData);

        // Clear sessionStorage after successful fetch
        if (sessionStorage.getItem('pendingBookingId')) {
          sessionStorage.removeItem('pendingBookingId');
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err.response?.data?.message || 'Failed to load booking');
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Print handler
  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened', { duration: 2000 });
  };

  // PDF Generation Function
  const generatePDF = () => {
    if (!booking) return;

    const doc = new jsPDF();
    const trip = booking.tripID || {};
    const origin = trip.origin?.stationName || 'N/A';
    const destination = trip.destination?.stationName || 'N/A';
    const departureTime = trip.departureTime ? new Date(trip.departureTime) : null;
    const arrivalTime = trip.arrivalTime ? new Date(trip.arrivalTime) : null;
    const seatNumbers = getSeatNumbers(booking);
    const seatCount = seatNumbers.length;
    const totalAmount = getTotalAmount();
    const pricePerSeat = getPricePerSeat();

    // Add logo or title
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text('Bahir Dar Transport System', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('E-Ticket', 105, 30, { align: 'center' });

    // Booking details
    doc.setFontSize(12);
    doc.text(`Booking #: ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}`, 20, 45);
    doc.text(`Ticket #: ${booking.ticketNumber || (seatCount > 1 ? booking.groupTicketNumber || 'N/A' : 'N/A')}`, 20, 52);
    doc.text(`Status: ${booking.status?.toUpperCase() || 'N/A'}`, 20, 59);
    if (seatCount > 1) {
      doc.text(`Group Booking: ${seatCount} seats`, 20, 66);
    }

    // Passenger details
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Passenger Information', 20, 75 + (seatCount > 1 ? 10 : 0));
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Name: ${booking.passengerDetails?.fullName || user?.fullName || 'N/A'}`, 20, 85 + (seatCount > 1 ? 10 : 0));
    doc.text(`Email: ${booking.passengerDetails?.email || user?.email || 'N/A'}`, 20, 92 + (seatCount > 1 ? 10 : 0));
    doc.text(`Phone: ${booking.passengerDetails?.phoneNumber || user?.phoneNumber || 'N/A'}`, 20, 99 + (seatCount > 1 ? 10 : 0));

    // Journey details
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Journey Information', 20, 115 + (seatCount > 1 ? 10 : 0));
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`From: ${origin}`, 20, 125 + (seatCount > 1 ? 10 : 0));
    doc.text(`To: ${destination}`, 20, 132 + (seatCount > 1 ? 10 : 0));

    if (departureTime) {
      doc.text(`Departure: ${departureTime.toLocaleDateString()} at ${departureTime.toLocaleTimeString()}`, 20, 139 + (seatCount > 1 ? 10 : 0));
    }
    if (arrivalTime) {
      doc.text(`Arrival: ${arrivalTime.toLocaleDateString()} at ${arrivalTime.toLocaleTimeString()}`, 20, 146 + (seatCount > 1 ? 10 : 0));
    }

    // Seat information
    if (seatCount === 1) {
      doc.text(`Seat: ${seatNumbers[0]}`, 20, 153 + (seatCount > 1 ? 10 : 0));
    } else {
      doc.text(`Seats: ${seatNumbers.join(', ')}`, 20, 153 + (seatCount > 1 ? 10 : 0));
    }

    // Payment details
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Payment Information', 20, 170 + (seatCount > 1 ? 10 : 0));
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Price per Seat: ETB ${pricePerSeat.toLocaleString()}`, 20, 180 + (seatCount > 1 ? 10 : 0));
    if (seatCount > 1) {
      doc.text(`Number of Seats: ${seatCount}`, 20, 187 + (seatCount > 1 ? 10 : 0));
    }
    doc.text(`Total Amount: ETB ${totalAmount.toLocaleString()}`, 20, 194 + (seatCount > 1 ? 10 : 0));
    doc.text(`Payment Status: ${booking.paymentStatus?.toUpperCase() || 'N/A'}`, 20, 201 + (seatCount > 1 ? 10 : 0));

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing Bahir Dar Transport System!', 105, 270, { align: 'center' });
    doc.text('This is a computer generated ticket.', 105, 277, { align: 'center' });

    // Save PDF
    doc.save(`ticket-${booking.bookingNumber || 'booking'}.pdf`);
  };

  // Download PDF handler
  const handleDownload = async () => {
    toast.loading('Generating PDF...', { id: 'pdf' });
    try {
      generatePDF();
      toast.success('PDF downloaded successfully!', { id: 'pdf' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

  // Email handlers
  const handleEmail = () => setEmailDialogOpen(true);

  const sendEmailTicket = async () => {
    if (!booking) return;
    setEmailSending(true);
    try {
      const pdf = generatePDFForEmail();

      const pdfBlob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `ticket-${booking.bookingNumber || 'booking'}.pdf`);
      formData.append('bookingId', bookingId);
      formData.append('email', user?.email);

      await api.post('/api/booking/send-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Ticket sent to your email!', { duration: 4000 });
      setEmailDialogOpen(false);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email. Please try again.', { duration: 4000 });
    } finally {
      setEmailSending(false);
    }
  };

  // Helper for email PDF
  const generatePDFForEmail = () => {
    if (!booking) return new jsPDF();

    const doc = new jsPDF();
    const trip = booking.tripID || {};
    const origin = trip.origin?.stationName || 'N/A';
    const destination = trip.destination?.stationName || 'N/A';
    const departureTime = trip.departureTime ? new Date(trip.departureTime) : null;
    const arrivalTime = trip.arrivalTime ? new Date(trip.arrivalTime) : null;
    const seatNumbers = getSeatNumbers(booking);
    const seatCount = seatNumbers.length;
    const totalAmount = getTotalAmount();
    const pricePerSeat = getPricePerSeat();

    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text('Bahir Dar Transport System', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('E-Ticket', 105, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Booking #: ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}`, 20, 45);
    doc.text(`Ticket #: ${booking.ticketNumber || (seatCount > 1 ? booking.groupTicketNumber || 'N/A' : 'N/A')}`, 20, 52);
    doc.text(`Status: ${booking.status?.toUpperCase() || 'N/A'}`, 20, 59);
    if (seatCount > 1) {
      doc.text(`Group Booking: ${seatCount} seats`, 20, 66);
    }

    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Passenger Information', 20, 75 + (seatCount > 1 ? 10 : 0));
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Name: ${booking.passengerDetails?.fullName || user?.fullName || 'N/A'}`, 20, 85 + (seatCount > 1 ? 10 : 0));
    doc.text(`Email: ${booking.passengerDetails?.email || user?.email || 'N/A'}`, 20, 92 + (seatCount > 1 ? 10 : 0));
    doc.text(`Phone: ${booking.passengerDetails?.phoneNumber || user?.phoneNumber || 'N/A'}`, 20, 99 + (seatCount > 1 ? 10 : 0));

    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Journey Information', 20, 115 + (seatCount > 1 ? 10 : 0));
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`From: ${origin}`, 20, 125 + (seatCount > 1 ? 10 : 0));
    doc.text(`To: ${destination}`, 20, 132 + (seatCount > 1 ? 10 : 0));

    if (departureTime) {
      doc.text(`Departure: ${departureTime.toLocaleDateString()} at ${departureTime.toLocaleTimeString()}`, 20, 139 + (seatCount > 1 ? 10 : 0));
    }
    if (arrivalTime) {
      doc.text(`Arrival: ${arrivalTime.toLocaleDateString()} at ${arrivalTime.toLocaleTimeString()}`, 20, 146 + (seatCount > 1 ? 10 : 0));
    }

    if (seatCount === 1) {
      doc.text(`Seat: ${seatNumbers[0]}`, 20, 153 + (seatCount > 1 ? 10 : 0));
    } else {
      doc.text(`Seats: ${seatNumbers.join(', ')}`, 20, 153 + (seatCount > 1 ? 10 : 0));
    }

    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Payment Information', 20, 170 + (seatCount > 1 ? 10 : 0));
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Price per Seat: ETB ${pricePerSeat.toLocaleString()}`, 20, 180 + (seatCount > 1 ? 10 : 0));
    if (seatCount > 1) {
      doc.text(`Number of Seats: ${seatCount}`, 20, 187 + (seatCount > 1 ? 10 : 0));
    }
    doc.text(`Total Amount: ETB ${totalAmount.toLocaleString()}`, 20, 194 + (seatCount > 1 ? 10 : 0));
    doc.text(`Payment Status: ${booking.paymentStatus?.toUpperCase() || 'N/A'}`, 20, 201 + (seatCount > 1 ? 10 : 0));

    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing Bahir Dar Transport System!', 105, 270, { align: 'center' });

    return doc;
  };

  // WhatsApp share handler
  const handleWhatsApp = () => {
    if (!booking) return;

    const trip = booking.tripID || {};
    const origin = trip.origin?.stationName || 'Origin';
    const destination = trip.destination?.stationName || 'Destination';
    const departureDate = trip.departureTime ? new Date(trip.departureTime).toLocaleDateString() : 'N/A';
    const departureTime = trip.departureTime ? new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    const seatNumbers = getSeatNumbers(booking);
    const seatDisplay = seatNumbers.length === 1 ? seatNumbers[0] : seatNumbers.join(', ');
    const totalAmount = getTotalAmount();

    const message = `🚌 *Bahir Dar Transport System - Ticket*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*From:* ${origin}\n` +
      `*To:* ${destination}\n` +
      `*Date:* ${departureDate}\n` +
      `*Time:* ${departureTime}\n` +
      `*Seat(s):* ${seatDisplay}\n` +
      `*Booking #:* ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}\n` +
      `*Ticket #:* ${booking.ticketNumber || (seatNumbers.length > 1 ? booking.groupTicketNumber || 'N/A' : 'N/A')}\n` +
      `*Total Amount:* ETB ${totalAmount.toLocaleString()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Thank you for choosing Bahir Dar Transport System!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Copy booking code handler
  const handleCopyCode = () => {
    const code = booking?.bookingNumber || booking?._id?.slice(-6).toUpperCase() || '';
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    toast.success('Booking code copied!', { duration: 2000 });
  };

  // Cancel booking handler
  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const response = await api.delete(`/api/booking/${booking._id}`);

      if (response.data?.success) {
        toast.success('Booking cancelled successfully', { duration: 4000 });
        setCancelDialogOpen(false);
        setBooking(prev => ({ ...prev, status: 'cancelled' }));
        const refreshResponse = await api.get(`/api/booking/${bookingId}`);
        setBooking(refreshResponse.data?.data || refreshResponse.data);
      } else {
        toast.error(response.data?.message || 'Failed to cancel booking', { duration: 4000 });
      }
    } catch (error) {
      console.error('Cancel error:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to cancel booking';
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setCancelling(false);
    }
  };

  // Refund handler
  const handleRefund = async () => {
    if (!booking || !refundAmount) return;
    setRefunding(true);
    try {
      const response = await api.post(`/api/payment/${booking.paymentID}/refund`, {
        refundAmount: parseFloat(refundAmount),
        reason: refundReason || 'Customer requested refund'
      });

      if (response.data?.success) {
        toast.success('Refund processed successfully', { duration: 4000 });
        setRefundDialogOpen(false);
        const refreshResponse = await api.get(`/api/booking/${bookingId}`);
        setBooking(refreshResponse.data?.data || refreshResponse.data);
        setRefundAmount('');
        setRefundReason('');
      } else {
        toast.error(response.data?.message || 'Failed to process refund', { duration: 4000 });
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to process refund', { duration: 4000 });
    } finally {
      setRefunding(false);
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/booking/${bookingId}`);
      const bookingData = response.data?.data || response.data;
      console.log('Refreshed booking data:', bookingData);
      setBooking(bookingData);
      toast.success('Booking refreshed!', { duration: 2000 });
    } catch (error) {
      toast.error('Failed to refresh', { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      case 'refunded': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <CheckCircleIcon />;
      case 'pending': return <CircularProgress size={16} />;
      case 'cancelled': return <CancelIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'refunded': return <PaymentIcon />;
      default: return <ReceiptIcon />;
    }
  };

  const canCancel = () => {
    if (!booking) return false;
    const cancellableStatuses = ['pending', 'confirmed'];
    return cancellableStatuses.includes(booking.status?.toLowerCase());
  };

  const canRefund = () => {
    if (!booking) return false;
    const isAdmin = user?.role === 'super_admin' || user?.role === 'station_admin';
    return isAdmin && booking.paymentStatus === 'success' && booking.status !== 'cancelled' && booking.status !== 'refunded';
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'station_admin';

  // Get data for display
  const seatNumbers = booking ? getSeatNumbers(booking) : [];
  const seatCount = seatNumbers.length;
  const totalAmount = getTotalAmount();
  const pricePerSeat = getPricePerSeat();
  const isGroupBooking = seatCount > 1;

  // Loading
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: '#64748b' }}>
          Loading your booking...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please wait while we fetch your details
        </Typography>
      </Container>
    );
  }

  // Error
  if (error || !booking) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: '16px',
            p: 4,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            ⚠️ {error || 'Booking not found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The booking you're looking for doesn't exist or you don't have permission to view it.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => navigate('/passenger/my-bookings')}
              startIcon={<ReceiptIcon />}
            >
              View My Bookings
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/passenger/book-trip')}
              startIcon={<DirectionsBus />}
            >
              Book New Trip
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  const trip = booking.tripID || {};
  const vehicle = trip.vehicle || {};
  const origin = trip.origin || {};
  const destination = trip.destination || {};
  const driver = trip.driver || {};
  const isConfirmed = booking.status?.toLowerCase() === 'confirmed';
  const isPending = booking.status?.toLowerCase() === 'pending';
  const isCancelled = booking.status?.toLowerCase() === 'cancelled';

  return (
    <>
      {showConfetti && (
        <canvas
          id="confetti-canvas"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/passenger/my-bookings')}
            sx={{
              textTransform: 'none',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
            }}
          >
            Back to My Bookings
          </Button>

          <Tooltip title="Refresh booking">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {paymentSuccess && (
          <Fade in={true}>
            <Alert
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success"
              sx={{
                mb: 4,
                borderRadius: '12px',
                py: 2,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    🎉 Payment Successful!
                  </Typography>
                  <Typography variant="body2">
                    Your booking has been confirmed. Check your email for the ticket.
                  </Typography>
                </Box>
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Confirmed"
                  color="success"
                  sx={{ fontWeight: 600, px: 1 }}
                />
              </Box>
            </Alert>
          </Fade>
        )}

        <Zoom in={true}>
          <Paper
            sx={{
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: isCancelled ? '#ef4444' : isPending ? '#f59e0b' : '#e2e8f0',
              boxShadow: isConfirmed ? '0 20px 40px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.05)',
              position: 'relative',
              transition: 'all 0.3s ease',
              '&::before': isConfirmed ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #3b82f6, #10b981)'
              } : isPending ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              } : {}
            }}
          >
            <Box sx={{
              p: 3,
              background: isConfirmed ? 'linear-gradient(135deg, #f0f9ff, #e6f7e6)' :
                isPending ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' :
                  '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{
                  bgcolor: isConfirmed ? '#3b82f6' : isPending ? '#f59e0b' : '#64748b',
                  width: 48,
                  height: 48
                }}>
                  <TicketIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {isConfirmed ? 'Booking Confirmed' : isPending ? 'Payment Pending' : 'Booking Details'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Booking #{booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
                    </Typography>
                    <Tooltip title="Copy booking code">
                      <IconButton size="small" onClick={handleCopyCode}>
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {isGroupBooking && (
                  <Chip
                    icon={<EventSeat />}
                    label={`${seatCount} Seats`}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                <Chip
                  icon={getStatusIcon(booking.status)}
                  label={booking.status?.toUpperCase()}
                  color={getStatusColor(booking.status)}
                  sx={{ fontWeight: 600, px: 1 }}
                />
                {booking.ticketNumber && (
                  <Chip
                    label={`Ticket: ${booking.ticketNumber}`}
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          From
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {origin.stationName || 'N/A'}
                        </Typography>
                        {origin.city && (
                          <Typography variant="caption" color="text.secondary">
                            {origin.city}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ px: 3 }}>
                        <DirectionsBus sx={{ color: '#3b82f6', fontSize: 32 }} />
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          To
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {destination.stationName || 'N/A'}
                        </Typography>
                        {destination.city && (
                          <Typography variant="caption" color="text.secondary">
                            {destination.city}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Paper sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <AccessTime sx={{ color: '#3b82f6' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Departure
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {formatDate(trip.departureTime)}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                                {formatTime(trip.departureTime)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <AccessTime sx={{ color: '#10b981' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Arrival
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {formatDate(trip.arrivalTime)}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                                {formatTime(trip.arrivalTime)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Passenger Details
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PersonIcon fontSize="small" sx={{ color: '#64748b' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {booking.passengerDetails?.fullName || user?.fullName}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {booking.passengerDetails?.email || user?.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {booking.passengerDetails?.phoneNumber || user?.phoneNumber}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Seat Information
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{
                            bgcolor: '#3b82f6',
                            width: 48,
                            height: 48
                          }}>
                            <EventSeat />
                          </Avatar>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b82f6' }}>
                              {seatCount === 1 ? seatNumbers[0] : `${seatCount} Seats`}
                            </Typography>
                            {isGroupBooking && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Seats: {seatNumbers.join(', ')}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.carType || 'Standard'} • {vehicle.plateNumber || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  {driver.fullName && (
                    <Box sx={{ mt: 3 }}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Driver Information
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={driver.profilePicture} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {driver.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              License: {driver.licenseNumber || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {booking.paymentID && (
                    <Box sx={{ mt: 3 }}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Payment Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Payment Status
                            </Typography>
                            <Chip
                              size="small"
                              label={booking.paymentStatus?.toUpperCase()}
                              color={booking.paymentStatus === 'success' ? 'success' : 'warning'}
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Payment Method
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {booking.paymentMethod || 'Mobile Money'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{
                    p: 3,
                    bgcolor: '#f8fafc',
                    borderRadius: '16px',
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Box sx={{ mb: 3 }}>
                      <Paper sx={{
                        p: 2,
                        display: 'inline-block',
                        bgcolor: 'white',
                        borderRadius: '12px',
                        border: '2px dashed #cbd5e1',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}>
                        <QrCodeIcon sx={{ fontSize: 120, color: '#1e293b' }} />
                      </Paper>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Scan for ticket details
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Amount
                      </Typography>
                      <Typography variant="h3" sx={{
                        fontWeight: 800,
                        color: '#1e40af',
                        lineHeight: 1.2
                      }}>
                        ETB {totalAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {seatCount} seat(s) × ETB {pricePerSeat.toLocaleString()}
                      </Typography>
                    </Box>

                    <Stack spacing={2} sx={{ mt: 'auto' }}>
                      <Tooltip title="Print your ticket">
                        <Button
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={handlePrint}
                          fullWidth
                          sx={{
                            borderRadius: '8px',
                            py: 1.2,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                          }}
                        >
                          Print Ticket
                        </Button>
                      </Tooltip>

                      <Tooltip title="Download as PDF">
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={handleDownload}
                          fullWidth
                          sx={{
                            borderRadius: '8px',
                            py: 1.2,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                          }}
                        >
                          Download PDF
                        </Button>
                      </Tooltip>

                      <Tooltip title="Email ticket">
                        <Button
                          variant="outlined"
                          startIcon={<EmailIcon />}
                          onClick={handleEmail}
                          fullWidth
                          sx={{
                            borderRadius: '8px',
                            py: 1.2,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                          }}
                        >
                          Email Ticket
                        </Button>
                      </Tooltip>

                      <Tooltip title="Share via WhatsApp">
                        <Button
                          variant="outlined"
                          startIcon={<WhatsAppIcon />}
                          onClick={handleWhatsApp}
                          fullWidth
                          sx={{
                            borderRadius: '8px',
                            py: 1.2,
                            color: '#25D366',
                            borderColor: '#25D366',
                            '&:hover': {
                              borderColor: '#128C7E',
                              bgcolor: alpha('#25D366', 0.04)
                            }
                          }}
                        >
                          Share
                        </Button>
                      </Tooltip>

                      <Divider sx={{ my: 1 }} />

                      {canCancel() && (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => setCancelDialogOpen(true)}
                          fullWidth
                          sx={{
                            borderRadius: '8px',
                            py: 1.2,
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                            '&:hover': { boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)' }
                          }}
                        >
                          Cancel Booking
                        </Button>
                      )}

                      {canRefund() && (
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<PaymentIcon />}
                          onClick={() => setRefundDialogOpen(true)}
                          fullWidth
                          sx={{
                            borderRadius: '8px',
                            py: 1.2,
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                            '&:hover': { boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)' }
                          }}
                        >
                          Process Refund
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>

            <Box sx={{
              p: 2,
              bgcolor: '#f8fafc',
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="caption" color="text.secondary">
                Booking Date: {formatDate(booking.bookingDate || booking.createdAt)}
              </Typography>
              {isGroupBooking && (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                  Group Booking • {seatCount} seats
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Terms & Conditions apply
              </Typography>
            </Box>
          </Paper>
        </Zoom>

        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#fee2e2', color: '#ef4444' }}>
                <CancelIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Cancel Booking
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#64748b', mb: 2 }}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogContentText>

            <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
              <Typography variant="body2">
                Refund amount: <strong>ETB {totalAmount.toLocaleString()}</strong>
              </Typography>
              <Typography variant="caption">
                Refund will be processed to your original payment method.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for cancellation (optional)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setCancelDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: '8px' }}
            >
              Keep Booking
            </Button>
            <Button
              onClick={handleCancel}
              variant="contained"
              color="error"
              disabled={cancelling}
              sx={{ borderRadius: '8px', px: 3 }}
            >
              {cancelling ? <CircularProgress size={24} /> : 'Yes, Cancel Booking'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={refundDialogOpen}
          onClose={() => setRefundDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706' }}>
                <PaymentIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Process Refund
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#64748b', mb: 2 }}>
              Process a refund for this booking. The amount will be returned to the passenger's original payment method.
            </DialogContentText>

            <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
              <Typography variant="body2">
                Maximum refund: <strong>ETB {totalAmount.toLocaleString()}</strong>
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Refund Amount"
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={`Max: ${totalAmount.toLocaleString()}`}
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: '#64748b' }}>ETB</Typography>
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for refund"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setRefundDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: '8px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              variant="contained"
              color="warning"
              disabled={!refundAmount || refunding}
              sx={{ borderRadius: '8px', px: 3 }}
            >
              {refunding ? <CircularProgress size={24} /> : 'Process Refund'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7' }}>
                <EmailIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Email Ticket
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#64748b', mb: 2 }}>
              Send your ticket to your email address for easy access.
            </DialogContentText>

            <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This is your registered email address
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setEmailDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: '8px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={sendEmailTicket}
              variant="contained"
              disabled={emailSending}
              sx={{ borderRadius: '8px', px: 3 }}
            >
              {emailSending ? <CircularProgress size={24} /> : 'Send Email'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={copySuccess}
          autoHideDuration={2000}
          onClose={() => setCopySuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: '8px' }}>
            Booking code copied to clipboard!
          </Alert>
        </Snackbar>

        <Box sx={{
          mt: 4,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Button
            variant="contained"
            onClick={() => navigate('/passenger/book-trip')}
            startIcon={<DirectionsBus />}
            sx={{
              borderRadius: '8px',
              px: 3,
              py: 1.2,
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb, #1e3a8a)'
              }
            }}
          >
            Book Another Trip
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/passenger/my-bookings')}
            startIcon={<ReceiptIcon />}
            sx={{
              borderRadius: '8px',
              px: 3,
              py: 1.2
            }}
          >
            View All Bookings
          </Button>
        </Box>
      </Container>
    </>
  );
}