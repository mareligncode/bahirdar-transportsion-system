// components/common/PasswordRequirements.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Contains number',
      met: /\d/.test(password),
    },
    {
      label: 'Contains special character',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
    {
      label: 'Not too common',
      met: !/^(password|123456|qwerty|admin|letmein)/i.test(password),
    },
  ];

  return (
    <View className="mt-2 bg-gray-50 rounded-lg p-3">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        Password Requirements:
      </Text>
      {requirements.map((req, index) => (
        <View key={index} className="flex-row items-center mb-1">
          {req.met ? (
            <Check size={16} color="#10B981" className="mr-2" />
          ) : (
            <X size={16} color="#EF4444" className="mr-2" />
          )}
          <Text
            className={`text-sm ${req.met ? 'text-green-600' : 'text-gray-500'}`}
          >
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
}