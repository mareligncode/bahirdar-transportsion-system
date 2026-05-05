import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
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
    Stack,
    Tooltip,
    Zoom,
    useTheme,
    alpha,
    Snackbar,
    IconButton
} from '@mui/material';
import {
    Print as PrintIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
    Share as ShareIcon,
    ArrowBack as ArrowBackIcon,
    ConfirmationNumber as TicketIcon,
    AccessTime,
    Person as PersonIcon,
    QrCode as QrCodeIcon,
    WhatsApp as WhatsAppIcon,
    Refresh as RefreshIcon,
    DirectionsBus,
    EventSeat,
    ContentCopy as ContentCopyIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Payment as PaymentIcon,
    Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

export default function TicketView() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const { bookingId } = useParams();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Helper functions
    const getSeatNumbers = (booking) => {
        if (booking.seatNumbers && Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0) {
            return booking.seatNumbers;
        }
        if (booking.seatNumber) {
            return [booking.seatNumber];
        }
        return [];
    };

    const getSeatCount = (booking) => {
        return getSeatNumbers(booking).length;
    };

    const getTotalAmount = () => {
        if (!booking) return 0;
        if (booking.totalPrice && booking.totalPrice > 0) {
            return booking.totalPrice;
        }
        const seatCount = getSeatCount(booking);
        const pricePerSeat = booking.tripID?.price || booking.pricePerSeat || 0;
        if (seatCount > 0 && pricePerSeat > 0) {
            return seatCount * pricePerSeat;
        }
        return booking.amount || booking.batchTotalPrice || 0;
    };

    const getPricePerSeat = () => {
        if (!booking) return 0;
        const totalAmount = getTotalAmount();
        const seatCount = getSeatCount(booking);
        if (seatCount > 0 && totalAmount > 0) {
            return totalAmount / seatCount;
        }
        return booking.tripID?.price || booking.pricePerSeat || 0;
    };

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
                const response = await api.get(`/api/booking/${bookingId}`);
                const bookingData = response.data?.data || response.data;
                setBooking(bookingData);
            } catch (err) {
                console.error('Error:', err);
                setError(err.response?.data?.message || 'Failed to load booking');
                toast.error(t('failed to load booking details'));
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);

    const handlePrint = () => {
        window.print();
        toast.success(t('print dialog opened'), { duration: 2000 });
    };

    const generatePDFForEmailOrDownload = () => {
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

        const qrCanvas = document.querySelector('canvas');
        if (qrCanvas) {
            const qrImage = qrCanvas.toDataURL('image/png');
            doc.addImage(qrImage, 'PNG', 150, 42, 45, 45);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Scan for Live Verification', 172.5, 90, { align: 'center' });
        }

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
        doc.text('This is a computer generated ticket.', 105, 277, { align: 'center' });

        return doc;
    };

    const handleDownload = async () => {
        toast.loading(t('generating pdf'), { id: 'pdf' });
        try {
            const doc = generatePDFForEmailOrDownload();
            doc.save(`ticket-${booking?.bookingNumber || 'booking'}.pdf`);
            toast.success(t('pdf downloaded successfully'), { id: 'pdf' });
        } catch (error) {
            console.error('Download error:', error);
            toast.error(t('failed to generate pdf'), { id: 'pdf' });
        }
    };

    const handleEmail = () => setEmailDialogOpen(true);

    const sendEmailTicket = async () => {
        if (!booking) return;
        setEmailSending(true);
        try {
            const pdf = generatePDFForEmailOrDownload();
            const pdfBlob = pdf.output('blob');
            const formData = new FormData();
            formData.append('pdf', pdfBlob, `ticket-${booking.bookingNumber || 'booking'}.pdf`);
            formData.append('bookingId', bookingId);
            formData.append('email', user?.email);

            await api.post('/api/booking/send-email', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(t('ticket sent to your email'), { duration: 4000 });
            setEmailDialogOpen(false);
        } catch (error) {
            console.error('Email error:', error);
            toast.error(t('failed to send email'), { duration: 4000 });
        } finally {
            setEmailSending(false);
        }
    };

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

    const handleCopyCode = () => {
        const code = booking?.bookingNumber || booking?._id?.slice(-6).toUpperCase() || '';
        navigator.clipboard.writeText(code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        toast.success(t('booking code copied'), { duration: 2000 });
    };

    const handleRefresh = async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const response = await api.get(`/api/booking/${bookingId}`);
            const bookingData = response.data?.data || response.data;
            setBooking(bookingData);
            toast.success(t('booking refreshed'), { duration: 2000 });
        } catch (error) {
            toast.error(t('failed to refresh'), { duration: 2000 });
        } finally {
            setLoading(false);
        }
    };

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

    const seatNumbers = booking ? getSeatNumbers(booking) : [];
    const seatCount = seatNumbers.length;
    const totalAmount = getTotalAmount();
    const pricePerSeat = getPricePerSeat();
    const isGroupBooking = seatCount > 1;

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 3, color: '#64748b' }}>
                    {t('loading your booking')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('please wait fetching details')}
                </Typography>
            </Container>
        );
    }

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
                        ⚠️ {error || t('booking not found')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('booking not found desc')}
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            onClick={() => navigate('/passenger/my-booking')}
                            startIcon={<ReceiptIcon />}
                        >
                            {t('view all bookings')}
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

    // We will build qrString using the translated terms from the current language
    const passengerName = booking.passengerDetails?.fullName || booking.passengerID?.fullName || booking.passenger?.fullName || user?.fullName || 'N/A';
    const passengerPhone = booking.passengerDetails?.phoneNumber || booking.passengerID?.phoneNumber || booking.passenger?.phoneNumber || user?.phoneNumber || '';

    const qrString = `${t('public transport service')}
${t('from receipt')} ${origin.stationName || 'N/A'} - ${destination.stationName || 'N/A'}
TIN : 0049849051
${t('seat no')} .. ${seatCount === 1 ? seatNumbers[0] : seatNumbers.join(', ')} ..
${t('plate no')} : ${vehicle.plateNumber || 'N/A'}
${t('ticket number')} : ${booking.ticketNumber || (seatCount > 1 ? booking.groupTicketNumber || 'N/A' : 'N/A')}
${t('travel date')} : ${formatDate(trip.departureTime)} ${formatTime(trip.departureTime)}
${t('passenger receipt')} : ${passengerName}
${t('tariff')} : ${pricePerSeat.toFixed(2)} ${t('currency')}
${t('total fee')} : ${totalAmount.toFixed(2)} ${t('currency')}
${t('ticket date')} : ${formatDate(booking.bookingDate || booking.createdAt)}
${t('confirmation number')} : ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
        `.trim();

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/passenger/my-booking')}>
                    {t('back to my bookings')}
                </Button>
                <Stack direction="row" spacing={1}>
                    <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="contained">{t('print ticket') || 'Print'}</Button>
                    <Button onClick={handleDownload} startIcon={<DownloadIcon />} variant="outlined">{t('download pdf') || 'PDF'}</Button>
                </Stack>
            </Box>

            <Paper sx={{
                width: '100%',
                maxWidth: '320px',
                margin: '0 auto',
                p: 3,
                bgcolor: '#fff',
                color: '#000',
                borderRadius: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontFamily: '"Courier New", Courier, monospace',
                lineHeight: 1.6
            }}>
                <Box sx={{ textAlign: 'center', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <DirectionsBus sx={{ fontSize: 24, color: '#000' }} />
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'inherit' }}>
                        {t('mengedenya')}
                    </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('public transport service')}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('from receipt')} {origin.stationName || ''} - {destination.stationName || ''} {destination.city ? `(${destination.city})` : ''}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>TIN : 0049849051</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('seat no')} .. {seatNumbers.join(', ')} ..</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 'bold', mb: 0.5 }}>{t('plate no')} : {vehicle.plateNumber || ''}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 'bold', mb: 0.5 }}>{t('ticket number')} : {booking.ticketNumber || (seatCount > 1 ? booking.groupTicketNumber : '')}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('travel date')} : {formatDate(trip.departureTime)} {formatTime(trip.departureTime)}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('passenger receipt')} : {passengerName}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('passenger phone')} : {passengerPhone}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('id card no')} : </Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('tariff')} : {pricePerSeat.toFixed(2)} {t('currency')}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('service fee')} : 0.00 {t('currency')}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 'bold', mb: 0.5 }}>{t('total fee')} : {totalAmount.toFixed(2)} {t('currency')}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('ticket date')} : {formatDate(booking.bookingDate || booking.createdAt)} {formatTime(booking.bookingDate || booking.createdAt)}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('association name')} : {vehicle.associationName || 'N/A'}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>{t('agent')} : {booking.agentName || 'system'}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 'bold', mb: 1 }}>{t('confirmation number')} : {booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}</Typography>

                <Divider sx={{ my: 1, borderStyle: 'solid', borderWidth: '1px', borderColor: '#000' }} />

                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 0.5 }}>✓ {t('authorized for one time travel only')}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontFamily: 'inherit', mb: 1 }}>✓ {t('for complaints call 9325')}</Typography>

                <Box sx={{ textAlign: 'center', mt: 3, mb: 1, display: 'flex', justifyContent: 'center' }}>
                    {booking && (
                        <QRCodeCanvas
                            value={qrString}
                            size={120}
                            level={"M"}
                            includeMargin={false}
                        />
                    )}
                </Box>

                <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontFamily: 'inherit' }}>{t('#1 choice', '#1 choice')}</Typography>
                </Box>
            </Paper>
        </Container>
    );
}
