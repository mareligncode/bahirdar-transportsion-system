import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle ,ChevronDown } from 'lucide-react';

export default function Register() {

// Add this country codes array at the top of your component (after imports)
const countryCodes = [
  { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  // Add more as needed
];


  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    emergencyContact: '',
  });
  
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]); // Ethiopia by default

const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Validate phone number (basic Ethiopian format)
    const phoneRegex = /^\+251[1-9][0-9]{8}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Please enter a valid Ethiopian phone number (+251XXXXXXXXX)');
      setIsLoading(false);
      return;
    }


    try {
      // Prepare registration data for backend
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
  
        ...(formData.emergencyContact && { emergencyContact: formData.emergencyContact }),
      };

      // Call real register function from useAuth hook
      const result = await register(registrationData);
      
      if (result.success) {
        setSuccess('Account created successfully! Redirecting to dashboard...');
        
        // Show success message for 2 seconds then redirect
       setTimeout(() => {
  const userRole = result.user?.role;
  
  switch(userRole) {
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
      navigate('/passenger/dashboard'); // Use specific route
  }
}, 2000);
        setTimeout(() => {navigate('/dashboard');}, 2000);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific backend errors
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message.includes('email')) {
        setError('Email already exists. Please use a different email or login.');
      } else if (err.message.includes('phone')) {
        setError('Phone number already exists. Please use a different phone number.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (error) setError('');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join Bahir Dar Meneharia Transportation System</p>
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
              <p className="font-medium">Registration failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your full name"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

           
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="name@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            
       
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
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
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setIsCountryOpen(false);
                              // Update phone number with new country code
                              const currentNumber = formData.phoneNumber.replace(/^\+\d+/, '');
                              setFormData({
                                ...formData,
                                phoneNumber: country.code + currentNumber
                              });
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="font-medium">{country.code}</span>
                            <span className="text-gray-600 text-sm">{country.name}</span>
                          </button>
                        ))}
                      </div>
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
                      onChange={(e) => {
                        // Auto-add country code if not present
                        let value = e.target.value;
                        if (!value.startsWith('+') && !value.startsWith(selectedCountry.code)) {
                          value = selectedCountry.code + value.replace(/[^\d]/g, '');
                        }
                        setFormData({
                          ...formData,
                          phoneNumber: value
                        });
                      }}
                      className="input-field pl-10"
                      placeholder="912345678"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: {selectedCountry.code}XXXXXXXXX
                </p>
              </div>  

      <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact (Optional)
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
            </div>
          </div>
        </div>


        {/* Role-specific fields */}

        {/* Password */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Security *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Minimum 6 characters"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
              </div>
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
            I agree to the{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-700 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-700 hover:underline">
              Privacy Policy
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
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}