import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { AppText } from './AppText';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  show?: boolean;
}

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  show = true,
}: ToastProps) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-50);

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200';
      default:
        return 'bg-blue-100 border-blue-200';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={20} color="#F59E0B" />;
      default:
        return <Info size={20} color="#3B82F6" />;
    }
  };

  React.useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!show) return null;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="absolute top-16 left-4 right-4 z-50"
    >
      <View
        className={`
          ${getTypeClasses()}
          border rounded-lg p-4 flex-row items-center justify-between
          shadow-lg
        `}
      >
        <View className="flex-row items-center flex-1">
          <View className="mr-3">
            {getTypeIcon()}
          </View>
          <AppText variant="bodySmall" color="textPrimary" className="flex-1">{message}</AppText>
        </View>

        <TouchableOpacity onPress={hideToast} className="ml-2">
          <X size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    show: boolean;
  }>({
    message: '',
    type: 'info',
    show: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, show: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast, hideToast } = useToast();

  return (
    <>
      {children}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          show={toast.show}
        />
      )}
    </>
  );
};