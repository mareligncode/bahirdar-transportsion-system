import api from './api';

class PaymentService {
  // Initialize payment for a booking
  async initializePayment(bookingId, paymentMethod = 'mobile_money') {
    try {
      const response = await api.post('/api/payment/initialize', {
        bookingId,
        paymentMethod
      });
      
      const data = response.data?.data || response.data;
      
      if (data?.checkoutUrl) {
        // Redirect to Chapa payment page
        window.location.href = data.checkoutUrl;
        return { success: true };
      }
      
      return { success: false, error: 'No checkout URL received' };
    } catch (error) {
      console.error('Payment initialization error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initialize payment'
      };
    }
  }

  // Verify payment status
  async verifyPayment(txRef) {
    try {
      const response = await api.get(`/api/payment/verify/${txRef}`);
      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify payment'
      };
    }
  }

  // Get payment status for a booking
  async getPaymentStatus(bookingId) {
    try {
      const response = await api.get('/api/payment/status', {
        params: { bookingId }
      });
      return response.data;
    } catch (error) {
      console.error('Get payment status error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get payment status'
      };
    }
  }
}

export default new PaymentService();