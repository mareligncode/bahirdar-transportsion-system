import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  FlatList,
  TextInput,
  Dimensions,
  KeyboardEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  validateRegisterForm,
  getPasswordStrength
} from '@/utils/validations';
import {
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ArrowLeft,
  Eye,
  EyeOff,
  Search
} from 'lucide-react-native';
import { RegisterFormData } from '@/types/auth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const countryCodes = [
  { code: '+251', flag: '🇪🇹', name: 'Ethiopia', minLength: 9, maxLength: 9, pattern: '9|7' },
];

export default function Register() {
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const nameInputRef = useRef<TextInput>(null!);
  const emailInputRef = useRef<TextInput>(null!);
  const phoneInputRef = useRef<TextInput>(null!);
  const emergencyContactInputRef = useRef<TextInput>(null!);
  const passwordInputRef = useRef<TextInput>(null!);
  const confirmPasswordInputRef = useRef<TextInput>(null!);

  const scrollViewRef = useRef<ScrollView>(null);

  const { register: registerUser, isLoading: authLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    clearErrors,
    watch,
    setValue,
    trigger,
  } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      emergencyContact: '',
      termsAccepted: false,
    },
    mode: 'onBlur',
  });

  const phone = watch('phoneNumber');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsKeyboardVisible(true);
      setKeyboardOffset(e.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const passwordStrength = useMemo(() => {
    if (!password) return null;
    return getPasswordStrength(password);
  }, [password]);

  const passwordMeetsAllCriteria = useMemo(() => {
    if (!password) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;

    console.log('Password criteria check:', {
      password,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      hasMinLength,
      meetsAll: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && hasMinLength
    });

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && hasMinLength;
  }, [password]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countryCodes;

    const query = searchQuery.toLowerCase().trim();

    return countryCodes.filter(country => {
      if (country.name.toLowerCase().includes(query)) return true;
      const cleanCode = country.code.replace('+', '').toLowerCase();
      const cleanQuery = query.replace('+', '').toLowerCase();
      if (cleanCode.includes(cleanQuery)) return true;
      if (country.code.includes(query)) return true;
      return false;
    });
  }, [searchQuery]);

  const handleRegister = async (data: RegisterFormData) => {
    Keyboard.dismiss();
    setError('');
    setSuccess('');

    if (!passwordMeetsAllCriteria) {
      setError('Password must meet all security requirements');
      return;
    }

    const validationErrors = validateRegisterForm(data);

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setFormError(field as keyof RegisterFormData, { message });
      });
      return;
    }

    try {
      const result = await registerUser(data);

      if (result.success) {
        setSuccess('Account created successfully! Redirecting...');

        setTimeout(() => {
          router.replace('/tabs/home');
        }, 2000);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    }
  };

  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country);

    if (phone) {
      const currentNumber = phone.replace(selectedCountry.code, '');
      const cleanNumber = currentNumber.replace(/\D/g, '');
      const newPhone = country.code + cleanNumber;
      setValue('phoneNumber', newPhone, { shouldValidate: true });
    }

    setIsCountryOpen(false);
    setSearchQuery('');
  };

  const handlePhoneChange = (text: string, onChange: (value: string) => void) => {
    const cleanText = text.replace(/\D/g, '');
    const limitedText = cleanText.slice(0, selectedCountry.maxLength);
    const fullNumber = selectedCountry.code + limitedText;

    onChange(fullNumber);
    if (errors.phoneNumber) {
      clearErrors('phoneNumber');
    }
  };

  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };
  const handleNextField = (currentRef: React.RefObject<TextInput>, nextRef: React.RefObject<TextInput>) => {
    if (nextRef.current) {
      nextRef.current.focus();
      scrollToInput(nextRef);
    }
  };

  const loading = authLoading || isSubmitting;

  if (loading) {
    return <Loader message="Creating account..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Platform.OS === 'ios' ? keyboardOffset + 40 : 60
          }}
          automaticallyAdjustContentInsets={false}
          scrollEventThrottle={16}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="px-6 pt-4">
              <View className="mb-8">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mb-6 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color="#3B82F6" />
                </TouchableOpacity>

                <View className="items-center mb-6">
                  <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <View className="w-12 h-12 bg-blue-600 rounded-lg items-center justify-center">
                      <User size={24} color="white" />
                    </View>
                  </View>
                  <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    Create Account
                  </Text>
                  <Text className="text-gray-600 text-center">
                    Sign up to start your journey
                  </Text>
                </View>
              </View>
              {success && (
                <Card className="bg-green-50 border-green-200 mb-6">
                  <View className="flex-row items-start">
                    <CheckCircle size={20} color="#10B981" className="mt-0.5 mr-3" />
                    <View className="flex-1">
                      <Text className="font-medium text-green-700">{success}</Text>
                    </View>
                  </View>
                </Card>
              )}
              {error && (
                <Card className="bg-red-50 border-red-200 mb-6">
                  <View className="flex-row items-start">
                    <AlertCircle size={20} color="#EF4444" className="mt-0.5 mr-3" />
                    <View className="flex-1">
                      <Text className="font-medium text-red-600">Registration failed</Text>
                      <Text className="text-sm text-red-600 mt-1">{error}</Text>
                    </View>
                  </View>
                </Card>
              )}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-4">
                  Personal Information
                </Text>

                <View className="space-y-4">
                  <Controller
                    name="fullName"
                    control={control}
                    render={({ field: { onChange, value, onBlur } }) => (
                      <View>
                        <Input
                          ref={nameInputRef}
                          label="Full Name *"
                          placeholder="Enter your full name (first and last)"
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            trigger('fullName');
                          }}
                          onBlur={onBlur}
                          onFocus={() => {
                            setTimeout(() => scrollToInput(nameInputRef), 100);
                          }}
                          error={errors.fullName?.message}
                          leftIcon={<User size={20} color="#6B7280" />}
                          autoCapitalize="words"
                          autoComplete="name"
                          textContentType="name"
                          editable={!loading}
                          returnKeyType="next"
                          onSubmitEditing={() => handleNextField(nameInputRef, emailInputRef)}
                          blurOnSubmit={false}
                        />
                      </View>
                    )}
                  />
                  <Controller
                    name="email"
                    control={control}
                    render={({ field: { onChange, value, onBlur } }) => (
                      <View>
                        <Input
                          ref={emailInputRef}
                          label="Email Address *"
                          placeholder="name@example.com"
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            trigger('email');
                          }}
                          onBlur={onBlur}
                          onFocus={() => {
                            setTimeout(() => scrollToInput(emailInputRef), 100);
                          }}
                          error={errors.email?.message}
                          leftIcon={<Mail size={20} color="#6B7280" />}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          textContentType="emailAddress"
                          editable={!loading}
                          returnKeyType="next"
                          onSubmitEditing={() => handleNextField(emailInputRef, phoneInputRef)}
                          blurOnSubmit={false}
                        />
                      </View>
                    )}
                  />
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </Text>
                    <View className="flex-row space-x-2">
                      <View className="flex-1 max-w-[140px]">
                        <TouchableOpacity
                          onPress={() => setIsCountryOpen(true)}
                          disabled={loading}
                          className="flex-row items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-3 py-3"
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-center space-x-2">
                            <Text className="text-lg">{selectedCountry.flag}</Text>
                            <Text className="font-medium text-sm">
                              {selectedCountry.code.length > 5 ?
                                selectedCountry.code.substring(0, 5) + '...' :
                                selectedCountry.code}
                            </Text>
                          </View>
                          <ChevronDown size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <View className="flex-1">
                        <Controller
                          name="phoneNumber"
                          control={control}
                          render={({ field: { onChange, value, onBlur } }) => (
                            <View>
                              <Input
                                ref={phoneInputRef}
                                placeholder={`${selectedCountry.minLength} digits`}
                                value={value?.replace(selectedCountry.code, '') || ''}
                                onChangeText={(text) => handlePhoneChange(text, onChange)}
                                onBlur={onBlur}
                                onFocus={() => {
                                  setTimeout(() => scrollToInput(phoneInputRef), 100);
                                }}
                                error={errors.phoneNumber?.message}
                                leftIcon={<Phone size={20} color="#6B7280" />}
                                keyboardType="phone-pad"
                                autoComplete="tel"
                                textContentType="telephoneNumber"
                                editable={!loading}
                                returnKeyType="next"
                                onSubmitEditing={() => handleNextField(phoneInputRef, emergencyContactInputRef)}
                                blurOnSubmit={false}
                              />
                            </View>
                          )}
                        />
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      Format: {selectedCountry.code} followed by {selectedCountry.minLength} digits
                      {selectedCountry.pattern ? ` starting with ${selectedCountry.pattern}` : ''}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact (Optional)
                    </Text>
                    <Controller
                      name="emergencyContact"
                      control={control}
                      render={({ field: { onChange, value, onBlur } }) => (
                        <View>
                          <Input
                            ref={emergencyContactInputRef}
                            placeholder="+251911234567"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onFocus={() => {
                              setTimeout(() => scrollToInput(emergencyContactInputRef), 100);
                            }}
                            error={errors.emergencyContact?.message}
                            leftIcon={<Phone size={20} color="#6B7280" />}
                            keyboardType="phone-pad"
                            autoComplete="tel"
                            textContentType="telephoneNumber"
                            editable={!loading}
                            returnKeyType="next"
                            onSubmitEditing={() => handleNextField(emergencyContactInputRef, passwordInputRef)}
                            blurOnSubmit={false}
                          />
                        </View>
                      )}
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Contact person in case of emergency
                    </Text>
                  </View>
                </View>
              </View>
              <View className="mb-6">
                <View className="space-y-4">
                  <Controller
                    name="password"
                    control={control}
                    render={({ field: { onChange, value, onBlur } }) => (
                      <View>
                        <Input
                          ref={passwordInputRef}
                          label="Password *"
                          placeholder="Create a strong password"
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            trigger('password');
                          }}
                          onBlur={onBlur}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({
                                y: 400,
                                animated: true,
                              });
                            }, 100);
                          }}
                          error={errors.password?.message}
                          leftIcon={<Lock size={20} color="#6B7280" />}
                          secureTextEntry={!showPassword}
                          autoComplete="password-new"
                          textContentType="newPassword"
                          autoCapitalize="none"
                          editable={!loading}
                          returnKeyType="next"
                          onSubmitEditing={() => handleNextField(passwordInputRef, confirmPasswordInputRef)}
                          blurOnSubmit={false}
                          rightIcon={
                            <TouchableOpacity
                              onPress={() => setShowPassword(!showPassword)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              {showPassword ? (
                                <EyeOff size={20} color="#6B7280" />
                              ) : (
                                <Eye size={20} color="#6B7280" />
                              )}
                            </TouchableOpacity>
                          }
                        />
                      </View>
                    )}
                  />

                  {password && (
                    <View className="bg-gray-50 p-4 rounded-lg">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm font-medium text-gray-700">
                          Password Strength
                        </Text>
                        <Text className={`text-sm font-bold ${passwordStrength?.score === 0 ? 'text-red-600' :
                            passwordStrength?.score === 1 ? 'text-red-500' :
                              passwordStrength?.score === 2 ? 'text-yellow-600' :
                                passwordStrength?.score === 3 ? 'text-yellow-500' :
                                  passwordStrength?.score === 4 ? 'text-green-500' :
                                    passwordStrength?.score === 5 ? 'text-green-600' :
                                      'text-gray-500'
                          }`}>
                          {passwordStrength?.label || 'None'}
                        </Text>
                      </View>
                      <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <View
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength?.score === 0 ? 'bg-red-500' :
                              passwordStrength?.score === 1 ? 'bg-red-400' :
                                passwordStrength?.score === 2 ? 'bg-yellow-500' :
                                  passwordStrength?.score === 3 ? 'bg-yellow-400' :
                                    passwordStrength?.score === 4 ? 'bg-green-400' :
                                      'bg-green-600'
                            }`}
                          style={{ width: `${passwordStrength?.percentage || 0}%` }}
                        />
                      </View>
                      <View className="space-y-2">
                        <Text className="text-xs font-medium text-gray-700 mb-1">
                          Must include:
                        </Text>

                        {[
                          {
                            check: password.length >= 8,
                            text: 'At least 8 characters',
                            description: `${password.length}/8`,
                            required: true
                          },
                          {
                            check: /[a-z]/.test(password),
                            text: 'One lowercase letter',
                            description: /[a-z]/.test(password) ? '✓' : '✗',
                            required: true
                          },
                          {
                            check: /[A-Z]/.test(password),
                            text: 'One uppercase letter',
                            description: /[A-Z]/.test(password) ? '✓' : '✗',
                            required: true
                          },
                          {
                            check: /\d/.test(password),
                            text: 'One number',
                            description: /\d/.test(password) ? '✓' : '✗',
                            required: true
                          },
                          {
                            check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
                            text: 'One special character',
                            description: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '✗',
                            required: true
                          },
                        ].map((req, index) => (
                          <View key={index} className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <View className={`w-3 h-3 rounded-full mr-2 ${req.check ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <Text className={`text-xs ${req.check ? 'text-green-600' : 'text-gray-500'}`}>
                                {req.text}
                              </Text>
                            </View>
                            <Text className={`text-xs font-medium ${req.check ? 'text-green-600' : 'text-gray-400'}`}>
                              {req.description}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {passwordStrength?.label === 'Full' && (
                        <View className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <View className="flex-row items-center">
                            <CheckCircle size={18} color="#059669" className="mr-2" />
                            <View className="flex-1">
                              <Text className="text-sm font-bold text-green-800">
                                Password Strength: Full
                              </Text>
                              <Text className="text-xs text-green-700 mt-1">
                                Your password meets all security requirements. Excellent!
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field: { onChange, value, onBlur } }) => (
                      <View>
                        <Input
                          ref={confirmPasswordInputRef}
                          label="Confirm Password *"
                          placeholder="Re-enter your password"
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            trigger('confirmPassword');
                          }}
                          onBlur={onBlur}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollTo({
                                y: 500,
                                animated: true,
                              });
                            }, 100);
                          }}
                          error={errors.confirmPassword?.message}
                          leftIcon={<Lock size={20} color="#6B7280" />}
                          secureTextEntry={!showConfirmPassword}
                          autoComplete="password-new"
                          textContentType="newPassword"
                          autoCapitalize="none"
                          editable={!loading}
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit(handleRegister)}
                          rightIcon={
                            <TouchableOpacity
                              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={20} color="#6B7280" />
                              ) : (
                                <Eye size={20} color="#6B7280" />
                              )}
                            </TouchableOpacity>
                          }
                        />
                      </View>
                    )}
                  />
                </View>
              </View>
              <Controller
                name="termsAccepted"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <View className="mb-8">
                    <View className="flex-row items-start">
                      <TouchableOpacity
                        onPress={() => onChange(!value)}
                        disabled={loading}
                        activeOpacity={0.7}
                        className="mt-0.5 mr-3"
                      >
                        <View className={`w-5 h-5 rounded border items-center justify-center ${value ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                          {value && <CheckCircle size={12} color="white" />}
                        </View>
                      </TouchableOpacity>
                      <View className="flex-1">
                        <View className="flex-row flex-wrap items-center">
                          <Text className="text-sm text-gray-700 mr-1">
                            I agree to the
                          </Text>
                          <TouchableOpacity
                            onPress={() => router.push('/terms')}
                            disabled={loading}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text className="text-blue-600 font-medium text-sm underline">
                              Terms of Service
                            </Text>
                          </TouchableOpacity>

                          <Text className="text-sm text-gray-700 mx-1">and</Text>

                          <TouchableOpacity
                            onPress={() => router.push('/privacy')}
                            disabled={loading}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text className="text-blue-600 font-medium text-sm underline">
                              Privacy Policy
                            </Text>
                          </TouchableOpacity>

                          <Text className="text-sm text-gray-700 ml-1">.*</Text>
                        </View>
                      </View>
                    </View>

                    {errors.termsAccepted && (
                      <Text className="text-red-500 text-xs mt-1 ml-8">
                        {errors.termsAccepted.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Button
                title="Create Account"
                onPress={handleSubmit(handleRegister)}
                loading={loading}
                disabled={loading || !passwordMeetsAllCriteria || confirmPassword !== password}
                variant="primary"
                size="large"
                className="mb-6"
                fullWidth
              />
              <View className="pt-6 border-t border-gray-200">
                <View className="flex-row justify-center">
                  <Text className="text-gray-600">Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/Login')}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text className="text-blue-600 font-bold">Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={isCountryOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsCountryOpen(false);
          setSearchQuery('');
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setIsCountryOpen(false);
          setSearchQuery('');
        }}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback onPress={() => { }}>
              <View className="bg-white rounded-t-3xl max-h-3/4">
                <View className="p-4 border-b border-gray-200">
                  <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
                  <Text className="text-lg font-semibold text-center">Select Country</Text>

                  <View className="mt-4">
                    <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-3 border border-gray-300">
                      <Search size={20} color="#6B7280" className="mr-3" />
                      <TextInput
                        placeholder="Search by country name or code..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 text-gray-800 text-base"
                        autoFocus={true}
                        clearButtonMode="while-editing"
                      />
                    </View>
                  </View>
                </View>

                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.code + item.name}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleCountrySelect(item)}
                      className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                      activeOpacity={0.5}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">{item.flag}</Text>
                        <View className="flex-1">
                          <Text className="font-medium text-gray-800">{item.name}</Text>
                          <Text className="text-gray-600 text-sm">
                            {item.code} • {item.minLength} digits{item.pattern ? ` • Starts with ${item.pattern}` : ''}
                          </Text>
                        </View>
                        {selectedCountry.code === item.code && selectedCountry.name === item.name && (
                          <CheckCircle size={20} color="#3B82F6" />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View className="p-8 items-center">
                      <Search size={40} color="#9CA3AF" className="mb-3" />
                      <Text className="text-gray-500 text-lg font-medium">No countries found</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        Try searching with country name or code
                      </Text>
                    </View>
                  }
                  showsVerticalScrollIndicator={false}
                />

                <TouchableOpacity
                  onPress={() => {
                    setIsCountryOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-4 border-t border-gray-200 active:bg-gray-50"
                  activeOpacity={0.7}
                >
                  <Text className="text-center text-blue-600 font-medium text-lg">Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}