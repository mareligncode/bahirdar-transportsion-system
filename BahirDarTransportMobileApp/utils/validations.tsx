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

  // Full name validation
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

  // Phone validation
  if (!data.phoneNumber || data.phoneNumber.trim() === '') {
    errors.phone = 'Phone number is required';
  } else if (data.phoneNumber.replace(/\D/g, '').length < 9) {
    errors.phone = 'Please enter a valid phone number';
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
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Terms and conditions
  if (!data.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms and conditions';
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

// Helper function to extract phone number without country code
export const extractPhoneNumber = (phoneWithCode: string, countryCode: string): string => {
  return phoneWithCode.replace(countryCode, '');
};

// Helper function to validate phone number with country code
export const validatePhoneWithCountryCode = (phone: string, countryCode: string): boolean => {
  const numberWithoutCode = extractPhoneNumber(phone, countryCode);
  const digitsOnly = numberWithoutCode.replace(/\D/g, '');
  
  // Basic validation - adjust based on country requirements
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
};