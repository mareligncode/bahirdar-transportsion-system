import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { Check, X } from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { translate } = useTranslation();
  const requirements = [
    {
      label: translate('pass_req_min_8' as any),
      met: password.length >= 8,
    },
    {
      label: translate('pass_req_upper' as any),
      met: /[A-Z]/.test(password),
    },
    {
      label: translate('pass_req_lower' as any),
      met: /[a-z]/.test(password),
    },
    {
      label: translate('pass_req_number' as any),
      met: /\d/.test(password),
    },
    {
      label: translate('pass_req_special' as any),
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
    {
      label: translate('pass_req_uncommon' as any),
      met: !/^(password|123456|qwerty|admin|letmein)/i.test(password),
    },
  ];

  return (
    <View className="mt-2 bg-gray-50 rounded-lg p-3">
      <AppText variant="bodySmall" weight="medium" color="textPrimary" className="mb-2">
        {translate('pass_req_header' as any)}
      </AppText>
      {requirements.map((req, index) => (
        <View key={index} className="flex-row items-center mb-1">
          {req.met ? (
            <Check size={16} color="#10B981" className="mr-2" />
          ) : (
            <X size={16} color="#EF4444" className="mr-2" />
          )}
          <AppText
            variant="bodySmall"
            color={req.met ? '#16a34a' : 'textSecondary'}
          >
            {req.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}