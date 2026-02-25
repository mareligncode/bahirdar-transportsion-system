import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Payment, PaymentStatus } from '../types';

interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  
  // Actions
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void; // Use the imported type
  setCurrentPayment: (payment: Payment | null) => void;
  clearPaymentState: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      payments: [],
      currentPayment: null,

      setPayments: (payments) => set({ payments }),
      
      addPayment: (payment) => 
        set((state) => ({ 
          payments: [payment, ...state.payments] 
        })),
      
      updatePayment: (id, updates) =>
        set((state) => ({
          payments: state.payments.map(payment =>
            payment._id === id ? { ...payment, ...updates } : payment
          ),
          currentPayment: state.currentPayment?._id === id 
            ? { ...state.currentPayment, ...updates }
            : state.currentPayment
        })),
      
      updatePaymentStatus: (id, status) =>
        set((state) => ({
          payments: state.payments.map(payment =>
            payment._id === id ? { ...payment, paymentStatus: status } : payment
          ),
          currentPayment: state.currentPayment?._id === id 
            ? { ...state.currentPayment, paymentStatus: status }
            : state.currentPayment
        })),
      
      setCurrentPayment: (payment) => set({ currentPayment: payment }),
      
      clearPaymentState: () => set({ currentPayment: null })
    }),
    {
      name: 'payment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        payments: state.payments 
      }),
    }
  )
);