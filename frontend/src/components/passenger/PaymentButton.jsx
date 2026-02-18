import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  Paper
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

const PaymentButton = ({ 
  bookingId, 
  amount, 
  onSuccess,
  onError,
  variant = 'contained',
  fullWidth = true,
  size = 'large'
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setDialogOpen(true);
    setErrorMessage('');
    setDebugInfo(null);
    
    try {
      console.log('💰 Initializing payment for booking:', bookingId);
      console.log('Amount:', amount);
      
      const requestData = {
        bookingId: bookingId,
        paymentMethod: 'mobile_money'
      };
      
      console.log('Sending request:', requestData);
      
      const response = await api.post('/api/payment/initialize', requestData);

      console.log('✅ Payment response:', response.data);

      const paymentResult = response.data?.data || response.data;

      if (paymentResult?.checkoutUrl) {
        console.log('🔗 Redirecting to:', paymentResult.checkoutUrl);
        // Store booking ID in sessionStorage before redirect
        sessionStorage.setItem('pendingBookingId', bookingId);
        console.log('💾 Saved booking ID to sessionStorage:', bookingId);
        window.location.href = paymentResult.checkoutUrl;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('❌ Payment initialization error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Get the detailed error message
      let errorMsg = 'Payment initialization failed';
      let debug = {
        status: error.response?.status,
        data: error.response?.data
      };
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setDebugInfo(debug);
      setPaymentStatus('failed');
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setPaymentStatus(null);
    setErrorMessage('');
    setDebugInfo(null);
  };

  return (
    <>
      <Button
        variant={variant}
        color="primary"
        onClick={handlePayment}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        fullWidth={fullWidth}
        size={size}
        sx={{
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563eb, #1e3a8a)'
          },
          '&:disabled': {
            background: '#cbd5e1'
          }
        }}
      >
        {loading ? t('processing') : t('pay_now')} • ETB {amount?.toLocaleString()}
      </Button>

      {/* Payment Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          {paymentStatus === 'failed' ? t('Payment Failed') : 
           paymentStatus === 'success' ? t('Payment Successful') : 
           t('Processing Payment')}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
          {!paymentStatus && !errorMessage ? (
            <>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography>
                {t('Initializing payment...')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('Please wait')}
              </Typography>
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography>
                {t('Payment successful!')}
              </Typography>
            </>
          ) : paymentStatus === 'failed' ? (
            <>
              <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Alert severity="error" sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {errorMessage}
                </Typography>
              </Alert>
              
              {/* Show detailed error in development */}
              {process.env.NODE_ENV === 'development' && debugInfo && (
                <Paper sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', textAlign: 'left' }}>
                  <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem', overflow: 'auto' }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </Typography>
                </Paper>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('Please try again or contact support.')}
              </Typography>
            </>
          ) : null}
        </DialogContent>
        {(paymentStatus === 'failed' || paymentStatus === 'success') && (
          <DialogActions sx={{ pb: 3, px: 3 }}>
            <Button 
              onClick={handleClose} 
              variant="contained" 
              fullWidth
              color={paymentStatus === 'success' ? 'success' : 'primary'}
            >
              {paymentStatus === 'success' ? t('Continue') : t('Close')}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default PaymentButton;