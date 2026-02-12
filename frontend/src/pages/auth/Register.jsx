import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle, ChevronDown, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

export default function Register() {
  const { t } = useTranslation();
  
  const countryCodes = [
    { code: '+251', flag: '🇪🇹', name: t('ethiopia') },
    { code: '+1', flag: '🇺🇸', name: t('usa') },
    { code: '+44', flag: '🇬🇧', name: t('uk') },
    { code: '+91', flag: '🇮🇳', name: t('india') },
    { code: '+86', flag: '🇨🇳', name: t('china') },
    { code: '+254', flag: '🇰🇪', name: t('kenya') },
    { code: '+255', flag: '🇹🇿', name: t('tanzania') },
    { code: '+256', flag: '🇺🇬', name: t('uganda') },
    { code: '+27', flag: '🇿🇦', name: t('southAfrica') },
    { code: '+234', flag: '🇳🇬', name: t('nigeria') },
    { code: '+20', flag: '🇪🇬', name: t('egypt') },
  ];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    emergencyContact: '',
  });
  
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Basic required field validation only
    if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.password) {
      setError(t('allRequiredFields'));
      setIsLoading(false);
      return;
    }

    // Only check if passwords match (backend handles password complexity)
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    try {
      // Remove all non-digit characters except plus sign for phone number
      let phoneNumber = formData.phoneNumber.replace(/[^\d+]/g, '');
      
      // Ensure phone number starts with country code
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = selectedCountry.code + phoneNumber.replace(/\D/g, '');
      }

      // Prepare registration data matching your backend schema
      const registrationData = {
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        password: formData.password, // Backend will validate complexity
        ...(formData.emergencyContact.trim() && { 
          emergencyContact: formData.emergencyContact.trim() 
        }),
      };

      console.log('Sending registration data:', registrationData);

      // Call the backend API directly
      const response = await api.post('/api/auth/register', registrationData);
      
      console.log('Registration response:', response.data);

      if (response.data.success) {
        setSuccess(t('accountCreated'));
        
        // Automatically log in the user after successful registration
        try {
          // Use the same credentials to log in
          const loginResponse = await api.post('/api/auth/login', {
            email: registrationData.email,
            password: registrationData.password
          });

          console.log('Auto-login response:', loginResponse.data);

          if (loginResponse.data.success && loginResponse.data.data?.tokens) {
            // Store tokens in localStorage
            localStorage.setItem('accessToken', loginResponse.data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', loginResponse.data.data.tokens.refreshToken);
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(loginResponse.data.data.user));
            
            // Call login function from auth context if needed
            if (login) {
              login(loginResponse.data.data);
            }

            // Show success message then redirect based on role
            setTimeout(() => {
              const userRole = loginResponse.data.data.user?.role || 'passenger';
              
              switch(userRole.toLowerCase()) {
                case 'driver':
                  navigate('/driver/dashboard');
                  break;
                case 'station_admin':
                  navigate('/station/dashboard');
                  break;
                case 'super_admin':
                  navigate('/admin/dashboard');
                  break;
                case 'passenger':
                default:
                  navigate('/passenger/dashboard');
              }
            }, 2000);
          } else {
            // If auto-login fails, redirect to login page
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          // Registration was successful, but login failed
          setSuccess(t('accountCreatedPleaseLogin'));
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else {
        // Handle backend validation errors
        const errorMessage = response.data.message || t('registrationFailed');
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Registration error details:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.data) {
        // Backend returned an error response
        const backendError = err.response.data;
        
        if (backendError.message?.includes('email')) {
          setError(t('emailExists'));
        } else if (backendError.message?.includes('phone')) {
          setError(t('phoneExists'));
        } else if (backendError.message?.includes('password')) {
          setError(backendError.message);
        } else if (backendError.errors) {
          // Handle validation errors from express-validator
          const validationError = Object.values(backendError.errors)[0]?.msg || 
                                Object.values(backendError.errors)[0]?.message;
          setError(validationError || t('checkInputValues'));
        } else {
          setError(backendError.message || t('registrationFailed'));
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(t('registrationConnectionError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Remove all non-digit characters except plus sign
    value = value.replace(/[^\d+]/g, '');
    
    // Ensure only one plus sign at the beginning
    if (value.startsWith('++')) {
      value = '+' + value.slice(2);
    }
    
    // If it doesn't start with a country code, add the selected one
    if (!value.startsWith('+') && selectedCountry) {
      // Check if the number already has the country code
      if (!value.startsWith(selectedCountry.code.replace('+', ''))) {
        value = selectedCountry.code + value;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      phoneNumber: value
    }));
    
    if (error) setError('');
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsCountryOpen(false);
    
    // Update phone number with new country code
    const currentNumber = formData.phoneNumber.replace(/^\+\d+/, '');
    setFormData(prev => ({
      ...prev,
      phoneNumber: country.code + currentNumber
    }));
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              B
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('createAccount')}</h1>
          <p className="text-gray-600">{t('joinSystem')}</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{t('registrationError')}</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('personalInformation')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fullName')} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder={t('fullNamePlaceholder')}
                  required
                  disabled={isLoading}
                  minLength="2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emailAddress')} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder={t('emailPlaceholder')}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phoneNumber')} *
              </label>
              <div className="flex gap-2">
                {/* Country Code Dropdown */}
                <div className="relative flex-1 max-w-[140px]">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCountryOpen(!isCountryOpen)}
                      className="w-full input-field flex items-center justify-between hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="font-medium">{selectedCountry.code}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isCountryOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setIsCountryOpen(false)}
                        />
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {countryCodes.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="font-medium">{country.code}</span>
                              <span className="text-gray-600 text-sm">{country.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Phone Number Input */}
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    className="input-field pl-10"
                    placeholder={`${selectedCountry.code}912345678`}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('phoneExample')}: {selectedCountry.code}912345678
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emergencyContact')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="+251911234567"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('emergencyContactInfo')}
              </p>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('security')} *</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder={t('passwordPlaceholder')}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-xs space-y-1 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="font-medium text-blue-700">{t('passwordRequirements')}:</p>
                <ul className="text-blue-600 space-y-1">
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                    {t('passwordLength')}
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                    {t('passwordUppercase')}
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                    {t('passwordLowercase')}
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                    {t('passwordNumber')}
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                    {t('passwordSpecial')}
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('confirmPassword')} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-field pl-10 pr-10 ${
                    formData.confirmPassword && 
                    formData.password !== formData.confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  placeholder={t('confirmPasswordPlaceholder')}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{t('passwordsDoNotMatch')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            required
            className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 mt-1"
            disabled={isLoading}
          />
          <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
            {t('agreeTo')}{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-700 hover:underline">
              {t('termsOfService')}
            </Link>{' '}
            {t('and')}{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-700 hover:underline">
              {t('privacyPolicy')}
            </Link>
            . *
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {t('creatingAccount')}
            </>
          ) : (
            t('createAccount')
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          {t('alreadyHaveAccount')}{' '}
          <Link 
            to="/login" 
            className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
          >
            {t('signInHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}