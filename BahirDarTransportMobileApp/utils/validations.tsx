// utils/validations.tsx - FIXED VERSION
import { 
  LoginFormData, 
  RegisterFormData, 
  ForgotPasswordFormData,
  UpdateProfileFormData,
  ResetPasswordFormData,
  ValidationErrors 
} from '@/types/auth';

export const validateLoginForm = (data: LoginFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password || data.password.trim() === '') {
    errors.password = 'Password is required';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};

export const validateRegisterForm = (data: RegisterFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Full name validation - FIXED FIELD NAME
  if (!data.fullName || data.fullName.trim() === '') {
    errors.name = 'Full name is required';
  } else if (data.fullName.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters';
  } else if (data.fullName.trim().split(' ').length < 2) {
    errors.name = 'Please enter your first and last name';
  }

  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation - FIXED FIELD NAME
  if (!data.phoneNumber || data.phoneNumber.trim() === '') {
    errors.phone = 'Phone number is required';
  } else {
    // Remove country code and check digits
    const phoneDigits = data.phoneNumber.replace(/\D/g, '');
    const countryCode = data.phoneNumber.includes('+251') ? '251' : '';
    const numberWithoutCode = phoneDigits.replace(countryCode, '');
    
    if (numberWithoutCode.length < 9) {
      errors.phone = 'Phone number must be at least 9 digits';
    } else if (!/^[79]/.test(numberWithoutCode)) {
      errors.phone = 'Ethiopian numbers must start with 7 or 9';
    }
  }

  // Password validation
  if (!data.password || data.password.trim() === '') {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])/.test(data.password)) {
    errors.password = 'Password must contain at least one lowercase letter';
  } else if (!/(?=.*[A-Z])/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/(?=.*\d)/.test(data.password)) {
    errors.password = 'Password must contain at least one number';
  } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(data.password)) {
    errors.password = 'Password must contain at least one special character';
  }

  // Confirm password
  if (!data.confirmPassword || data.confirmPassword.trim() === '') {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Terms and conditions
  if (!data.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms and conditions';
  }

  // Emergency contact (optional)
  if (data.emergencyContact && data.emergencyContact.trim() !== '') {
    const emergencyDigits = data.emergencyContact.replace(/\D/g, '');
    if (emergencyDigits.length < 9) {
      errors.emergencyContact = 'Please enter a valid emergency contact number';
    }
  }

  return errors;
};

export const validateForgotPasswordForm = (data: ForgotPasswordFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return errors;
};

export const validateResetPasswordForm = (data: ResetPasswordFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.password || data.password.trim() === '') {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])/.test(data.password)) {
    errors.password = 'Password must contain at least one lowercase letter';
  } else if (!/(?=.*[A-Z])/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/(?=.*\d)/.test(data.password)) {
    errors.password = 'Password must contain at least one number';
  } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(data.password)) {
    errors.password = 'Password must contain at least one special character';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const getPasswordStrength = (password: string) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const percentage = Math.min(100, (score / 5) * 100);

  return {
    score,
    label: strengthLabels[score],
    percentage,
  };
};

export const extractPhoneNumber = (phoneWithCode: string, countryCode: string): string => {
  return phoneWithCode.replace(countryCode, '');
};

export const validatePhoneWithCountryCode = (phone: string, countryCode: string): boolean => {
  const numberWithoutCode = extractPhoneNumber(phone, countryCode);
  const digitsOnly = numberWithoutCode.replace(/\D/g, '');
  
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
};

export const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Add to utils/validations.tsx
export const validatePassengerDetails = (data: {
  fullName: string;
  phoneNumber: string;
  email: string;
  emergencyContact?: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Full Name validation
  if (!data.fullName.trim()) {
    errors.fullName = 'Full name is required';
  } else if (data.fullName.trim().length < 3) {
    errors.fullName = 'Name must be at least 3 characters';
  }

  // Phone Number validation
  const phoneDigits = data.phoneNumber.replace(/\D/g, '');
  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (phoneDigits.length < 9) {
    errors.phoneNumber = 'Enter a valid 9-digit phone number';
  } else if (!/^[+25179]/.test(phoneDigits)) {
    errors.phoneNumber = 'Ethiopian numbers must start with 7 or 9';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Enter a valid email address';
  }

  // Emergency Contact (optional)
  if (data.emergencyContact && data.emergencyContact.trim()) {
    const emergencyDigits = data.emergencyContact.replace(/\D/g, '');
    if (emergencyDigits.length < 9) {
      errors.emergencyContact = 'Emergency contact must be a valid phone number';
    }
  }

  return errors;
};