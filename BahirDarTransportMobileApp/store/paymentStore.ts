// store/paymentStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Payment } from '../types';

interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  removePayment: (id: string) => void;
  setCurrentPayment: (payment: Payment | null) => void;
  clearPaymentState: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      payments: [],
      currentPayment: null,

      setPayments: (payments) => set({ payments }),

      addPayment: (payment) => set((state) => ({
        payments: [payment, ...state.payments]
      })),

      updatePayment: (id, updatedPayment) => set((state) => ({
        payments: state.payments.map((payment) =>
          payment._id === id ? { ...payment, ...updatedPayment } : payment
        ),
        currentPayment: state.currentPayment?._id === id
          ? { ...state.currentPayment, ...updatedPayment }
          : state.currentPayment
      })),

      removePayment: (id) => set((state) => ({
        payments: state.payments.filter((payment) => payment._id !== id),
        currentPayment: state.currentPayment?._id === id ? null : state.currentPayment
      })),

      setCurrentPayment: (payment) => set({ currentPayment: payment }),

      clearPaymentState: () => set({
        payments: [],
        currentPayment: null
      })
    }),
    {
      name: 'payment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        payments: state.payments,
        currentPayment: state.currentPayment
      })
    }
  )
);