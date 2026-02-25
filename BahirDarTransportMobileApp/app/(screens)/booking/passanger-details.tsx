// app/(screens)/booking/passenger-details.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { COLORS } from '../../../constants/colors';
import { formatCurrency, formatDate, formatTime } from '../../../utils/helpers';

export default function PassengerDetailsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    emergencyContact: '',
    specialRequests: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [seatPrice, setSeatPrice] = useState(0);
  const [serviceFee] = useState(20);

  useEffect(() => {
    // Parse params from seat selection screen
    if (params.tripDetails) {
      setTripDetails(JSON.parse(params.tripDetails as string));
    }
    if (params.selectedSeats) {
      setSelectedSeats(JSON.parse(params.selectedSeats as string));
    }
    if (params.totalAmount) {
      setTotalAmount(parseFloat(params.totalAmount as string));
    }
    if (params.seatPrice) {
      setSeatPrice(parseFloat(params.seatPrice as string));
    }

    // Pre-fill user data if available
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        emergencyContact: '',
        specialRequests: '',
      });
    }
  }, [params, user]);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        return value.trim() ? '' : 'Full name is required';
      case 'phoneNumber':
        if (!value.trim()) return 'Phone number is required';
        if (value.length < 10) return 'Enter a valid 10-digit phone number';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!value.includes('@') || !value.includes('.')) return 'Enter a valid email';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    errors.fullName = validateField('fullName', formData.fullName);
    errors.phoneNumber = validateField('phoneNumber', formData.phoneNumber);
    errors.email = validateField('email', formData.email);
    
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return false;
    }
    
    return true;
  };

  const handleProceedToPayment = () => {
    if (!validateForm()) return;

    router.push({
      pathname: '/(screens)/payment/checkout',
      params: {
        tripId: params.tripId,
        selectedSeats: JSON.stringify(selectedSeats),
        passengerDetails: JSON.stringify(formData),
        totalAmount: totalAmount.toString(),
        seatPrice: seatPrice.toString(),
        serviceFee: serviceFee.toString(),
        tripDetails: params.tripDetails,
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-gray-800">
                Passenger Details
              </Text>
              <Text className="text-sm text-gray-500">
                Step 1 of 2: Enter your information
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Trip Summary */}
          {tripDetails && (
            <View className="bg-white mx-4 mt-4 p-4 rounded-xl border border-gray-200">
              <View className="flex-row items-center mb-2">
                <View className="bg-blue-100 p-2 rounded-full mr-3">
                  <Ionicons name="bus" size={20} color={COLORS.primary} />
                </View>
                <Text className="font-semibold text-gray-800">Trip Summary</Text>
              </View>
              
              <View className="ml-11">
                <Text className="font-medium text-gray-800">
                  {tripDetails.fromStation} → {tripDetails.toStation}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {tripDetails.departureTime ? formatDate(tripDetails.departureTime) : 'N/A'} at{' '}
                  {tripDetails.departureTime ? formatTime(tripDetails.departureTime) : 'N/A'}
                </Text>
                <View className="flex-row mt-2">
                  <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                    <Text className="text-blue-700 text-xs font-medium">
                      {selectedSeats.length} seat(s)
                    </Text>
                  </View>
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-700 text-xs font-medium">
                      Seats: {selectedSeats.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Passenger Form */}
          <View className="bg-white mx-4 mt-4 p-4 rounded-xl border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Contact Information
            </Text>

            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              error={formErrors.fullName}
              leftIcon={<Ionicons name="person-outline" size={20} color="#64748b" />}
            />

            <Input
              label="Phone Number *"
              placeholder="0912345678"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              error={formErrors.phoneNumber}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color="#64748b" />}
            />

            <Input
              label="Email *"
              placeholder="your@email.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              error={formErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#64748b" />}
            />

            <Input
              label="Emergency Contact (Optional)"
              placeholder="Emergency phone number"
              value={formData.emergencyContact}
              onChangeText={(value) => handleInputChange('emergencyContact', value)}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="alert-circle-outline" size={20} color="#64748b" />}
            />

            <Input
              label="Special Requests (Optional)"
              placeholder="Any special requirements?"
              value={formData.specialRequests}
              onChangeText={(value) => handleInputChange('specialRequests', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[80px]"
            />
          </View>

          {/* Price Summary */}
          <View className="bg-white mx-4 mt-4 p-4 rounded-xl border border-gray-200 mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Price Summary
            </Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Ticket Price ({selectedSeats.length} × {formatCurrency(seatPrice)})</Text>
              <Text className="text-gray-800">{formatCurrency(seatPrice * selectedSeats.length)}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Service Fee</Text>
              <Text className="text-gray-800">{formatCurrency(serviceFee)}</Text>
            </View>

            <View className="flex-row justify-between pt-2 mt-2 border-t border-gray-200">
              <Text className="font-bold text-gray-800">Total</Text>
              <Text className="font-bold text-blue-600 text-lg">{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View className="bg-white px-4 py-4 border-t border-gray-200">
          <Button
            title="Proceed to Payment"
            onPress={handleProceedToPayment}
            icon={<Ionicons name="card-outline" size={20} color="white" />}
            size="large"
            className="bg-blue-600"
          />
          <Text className="text-xs text-center text-gray-500 mt-2">
            By proceeding, you agree to our terms and conditions
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}