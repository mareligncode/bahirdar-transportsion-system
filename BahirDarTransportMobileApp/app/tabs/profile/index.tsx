import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import {
  User,
  Mail,
  Phone,
  LogOut,
  Edit2,
  Check,
  X,
  Camera,
  Calendar,
  CheckCircle,
  XCircle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { PasswordRequirements } from '@/components/common/passwordRequirements';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';

interface FormData {
  fullName: string;
  phoneNumber: string;
  emergencyContact: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const PasswordInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  error 
}: { 
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { colors, isDark } = useTheme();

  return (
    <View className="mb-4">
      <AppText variant="bodySmall" weight="500" color={isDark ? '#d1d5db' : '#374151'} className="mb-1">{label}</AppText>
      <View className="relative">
        <TextInput
          className={`${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border ${error ? 'border-red-500' : ''} rounded-lg px-4 py-3 pr-12`}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3"
        >
          {showPassword ? (
            <EyeOff size={20} color={colors.textSecondary} />
          ) : (
            <Eye size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
      {error && (
        <AppText variant="caption" color="#ef4444" className="mt-1">{error}</AppText>
      )}
    </View>
  );
};

export default function ProfileScreen() {
  const { translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser, changePassword, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  
  const [formData, setFormData] = useState<FormData>({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    emergencyContact: user?.emergencyContact || '',
  });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        emergencyContact: user.emergencyContact || '',
      });
      console.log('🔄 Profile: User data loaded:', user);
    } else if (!user) {
      console.log('🔄 Profile: No user data available');
    }
  }, [user, isEditing]);

  const validatePasswordForm = (): boolean => {
    const errors: PasswordErrors = {};
    let isValid = true;

    if (!passwordFormData.currentPassword) {
      errors.currentPassword = translate('current_password_required');
      isValid = false;
    }

    if (!passwordFormData.newPassword) {
      errors.newPassword = translate('new_password_required');
      isValid = false;
    } else {
      const hasUpperCase = /[A-Z]/.test(passwordFormData.newPassword);
      const hasLowerCase = /[a-z]/.test(passwordFormData.newPassword);
      const hasNumbers = /\d/.test(passwordFormData.newPassword);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordFormData.newPassword);
      const hasMinLength = passwordFormData.newPassword.length >= 8;

      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar || !hasMinLength) {
        errors.newPassword = translate('pass_requirements_not_met');
        isValid = false;
      }
    }

    if (!passwordFormData.confirmPassword) {
      errors.confirmPassword = translate('confirm_password_required');
      isValid = false;
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = translate('passwords_dont_match');
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarPreview(result.assets[0].uri);
        setShowAvatarDialog(false);
        Alert.alert(translate('success'), translate('profile_updated'));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(translate('error'), translate('pick_image_failed'));
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarPreview(result.assets[0].uri);
        setShowAvatarDialog(false);
        Alert.alert(translate('success'), translate('profile_updated'));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(translate('error'), translate('take_photo_failed'));
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert(translate('error'), translate('name_empty_error'));
      return;
    }

    try {
      await updateUser(formData);
      setIsEditing(false);
      setViewMode('view');
      Alert.alert(translate('success'), translate('profile_updated'));
    } catch (error) {
      Alert.alert(translate('error'), translate('update_failed'));
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsChangingPassword(true);
      
      const result = await changePassword(
        passwordFormData.currentPassword,
        passwordFormData.newPassword
      );

      if (result.success) {
        Alert.alert(translate('success'), result.message);
        setShowPasswordDialog(false);
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordErrors({});
      } else {
        Alert.alert(translate('error'), result.message);
      }
    } catch (error: any) {
      Alert.alert(translate('error'), error.message || translate('update_failed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      translate('logout'),
      translate('logout_confirm'),
      [
        { text: translate('cancel'), style: 'cancel' },
        {
          text: translate('logout'),
          onPress: async () => {
            await logout();
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return translate('not_available');
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
      : name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      <View className={`${isDark ? 'bg-blue-700' : 'bg-blue-500'} px-4 py-4`}>
        <View className="flex-row justify-between items-center">
          <AppText variant="h2" weight="bold" color="white">{translate('profile_title')}</AppText>
          {viewMode === 'view' ? (
            <TouchableOpacity
              onPress={() => {
                setViewMode('edit');
                setIsEditing(true);
              }}
              className="p-2 bg-blue-500 rounded-full"
            >
              <Edit2 size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setViewMode('view');
                  setIsEditing(false);
                  setFormData({
                    fullName: user?.fullName || '',
                    phoneNumber: user?.phoneNumber || '',
                    emergencyContact: user?.emergencyContact || '',
                  });
                }}
                className="mr-2 p-2 bg-red-500 rounded-full"
              >
                <X size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={isLoading}
                className="p-2 bg-green-500 rounded-full"
              >
                <Check size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        <View className="items-center mt-6">
          <TouchableOpacity
            onPress={() => setShowAvatarDialog(true)}
            className="relative"
          >
            <View className={`w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full items-center justify-center border-4 ${isDark ? 'border-gray-800' : 'border-white'} shadow-lg`}>
              {avatarPreview ? (
                <Image
                  source={{ uri: avatarPreview }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <AppText variant="h1" weight="bold" color="white">
                  {getInitials(user?.fullName || translate('unknown'))}
                </AppText>
              )}
            </View>
            <View className={`absolute bottom-0 right-0 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} p-1.5 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'}`}>
              <Camera size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <AppText variant="bodyLarge" weight="bold" color={isDark ? 'white' : 'black'} className="mt-2">
            {user?.fullName || translate('unknown')}
          </AppText>
          
          <View className="flex-row items-center mt-2 space-x-4">
            {user?.isActive ? (
              <View className="flex-row items-center">
                <CheckCircle size={16} color="#10b981" className="mr-1" />
                <AppText variant="bodySmall" weight="500" color="#16a34a">{translate('active')}</AppText>
              </View>
            ) : (
              <View className="flex-row items-center">
                <XCircle size={16} color="#ef4444" className="mr-1" />
                <AppText variant="bodySmall" weight="500" color="#dc2626">{translate('inactive')}</AppText>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center mt-2 space-x-6">
            <View className="flex-row items-center">
              <Calendar size={16} color={colors.textSecondary} className="mr-1" />
              <AppText variant="bodySmall" color={isDark ? colors.gray400 : colors.gray600}>{translate('member_since_date', { date: formatDate(user?.createdAt) })}</AppText>
            </View>
          </View>
        </View>
        <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mx-4 mt-6 p-5 rounded-xl border`}>
          <AppText variant="h3" weight="semibold" color={isDark ? 'white' : colors.gray800} className="mb-4">
            {translate('personal_info')}
          </AppText>

          {viewMode === 'view' ? (
            <View className="space-y-4">
              <View className={`flex-row items-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} p-3 rounded-lg`}>
                <View className={`w-10 h-10 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-full items-center justify-center mr-3`}>
                  <User size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('full_name')}</AppText>
                  <AppText variant="bodyMedium" weight="500" color={isDark ? 'white' : colors.gray900}>
                    {user?.fullName || translate('not_set')}
                  </AppText>
                </View>
              </View>

              <View className={`flex-row items-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} p-3 rounded-lg`}>
                <View className={`w-10 h-10 ${isDark ? 'bg-green-900/50' : 'bg-green-100'} rounded-full items-center justify-center mr-3`}>
                  <Mail size={20} color={colors.success} />
                </View>
                <View className="flex-1">
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('email_address')}</AppText>
                  <AppText variant="bodyMedium" weight="500" color={isDark ? 'white' : colors.gray900}>
                    {user?.email || translate('not_set')}
                  </AppText>
                </View>
              </View>

              <View className={`flex-row items-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} p-3 rounded-lg`}>
                <View className={`w-10 h-10 ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'} rounded-full items-center justify-center mr-3`}>
                  <Phone size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>{translate('phone_number')}</AppText>
                  <AppText variant="bodyMedium" weight="500" color={isDark ? 'white' : colors.gray900}>
                    {user?.phoneNumber || translate('not_set')}
                  </AppText>
                </View>
              </View>
            </View>
          ) : (
            <View className="space-y-4">
              <Input
                label={translate('full_name')}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder={translate('full_name_placeholder')}
                leftIcon={<User size={20} color="#6b7280" />}
              />

              <Input
                label={translate('phone_number')}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                placeholder={translate('phone_placeholder')}
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color="#6b7280" />}
              />

              <Input
                label={translate('emergency_contact_label')}
                value={formData.emergencyContact}
                onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
                placeholder={translate('emergency_placeholder')}
                leftIcon={<Phone size={20} color={colors.textSecondary} />}
              />

              <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500} className="mt-2">
                {translate('email_change_note')}
              </AppText>
            </View>
          )}
        </View>
        {viewMode === 'view' && (
          <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mx-4 mt-6 p-5 rounded-xl border`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`w-10 h-10 ${isDark ? 'bg-orange-900/50' : 'bg-orange-100'} rounded-full items-center justify-center mr-3`}>
                  <Lock size={20} color="#f97316" />
                </View>
                <View>
                  <AppText variant="bodyLarge" weight="semibold" color={isDark ? 'white' : colors.gray800}>
                    {translate('change_password')}
                  </AppText>
                  <AppText variant="bodySmall" color={isDark ? colors.gray400 : colors.gray500}>
                    {translate('change_pass_regularly')}
                  </AppText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowPasswordDialog(true)}
                className={`${isDark ? 'bg-blue-600' : 'bg-blue-500'} px-4 py-2 rounded-lg`}
              >
                <AppText variant="label" weight="500" color="white">{translate('change')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mx-4 mt-6 p-5 rounded-xl border`}>
          <AppText variant="h3" weight="semibold" color={isDark ? 'white' : colors.gray800} className="mb-4">
            {translate('account_status')}
          </AppText>
          <View className="space-y-3">
            <View className={`flex-row items-center justify-between ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} p-3 rounded-lg`}>
              <View className="flex-row items-center">
                <CheckCircle size={20} color={colors.textSecondary} className="mr-3" />
                <AppText variant="bodySmall" color={isDark ? colors.gray400 : colors.gray500}>{translate('account_status')}</AppText>
              </View>
              <View className="flex-row items-center">
                {user?.isActive ? (
                  <CheckCircle size={20} color="#10b981" className="mr-2" />
                ) : (
                  <XCircle size={20} color="#ef4444" className="mr-2" />
                )}
                <AppText variant="bodyMedium" weight="500" color={user?.isActive ? '#16a34a' : '#dc2626'}>
                  {user?.isActive ? translate('active') : translate('inactive')}
                </AppText>
              </View>
            </View>
            
            <View className={`flex-row items-center justify-between ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} p-3 rounded-lg`}>
              <View className="flex-row items-center">
                <Calendar size={20} color={colors.textSecondary} className="mr-3" />
                <AppText variant="bodySmall" color={isDark ? colors.gray400 : colors.gray500}>{translate('last_updated')}</AppText>
              </View>
              <AppText variant="bodySmall" color={isDark ? colors.gray300 : colors.gray600}>
                {formatDate(user?.updatedAt)}
              </AppText>
            </View>
          </View>
        </View>
        <View className="mx-4 mt-8 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoading}
            className="bg-red-500 py-4 rounded-xl flex-row items-center justify-center shadow-md"
          >
            <LogOut size={22} color="white" className="mr-2" />
            <AppText variant="bodyLarge" weight="bold" color="white">
              {translate('logout')}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={showAvatarDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarDialog(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md p-6`}>
            <AppText variant="h2" weight="bold" color={isDark ? 'white' : 'black'} className="mb-4">{translate('avatar_change_title')}</AppText>
            
            <View className="items-center mb-6">
              <Image
                source={{ uri: avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=3b82f6&color=fff` }}
                className="w-32 h-32 rounded-full"
                resizeMode="cover"
              />
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={takePhoto}
                className={`border ${isDark ? 'border-gray-700' : 'border-gray-300'} py-3 rounded-lg flex-row items-center justify-center`}
              >
                <Camera size={20} color={colors.textSecondary} className="mr-2" />
                <AppText variant="bodyMedium" weight="500" color={isDark ? colors.gray300 : colors.gray700}>{translate('take_photo')}</AppText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={pickImage}
                className={`border ${isDark ? 'border-gray-700' : 'border-gray-300'} py-3 rounded-lg flex-row items-center justify-center`}
              >
                <Camera size={20} color={colors.textSecondary} className="mr-2" />
                <AppText variant="bodyMedium" weight="500" color={isDark ? colors.gray300 : colors.gray700}>{translate('choose_gallery')}</AppText>
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500} className="text-center">
                {translate('file_size_note')}
              </AppText>
            </View>

            <TouchableOpacity
              onPress={() => setShowAvatarDialog(false)}
              className={`mt-4 border ${isDark ? 'border-gray-700' : 'border-gray-300'} py-3 rounded-lg`}
            >
              <AppText variant="bodyMedium" weight="500" color={isDark ? colors.gray300 : colors.gray700} className="text-center">{translate('cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showPasswordDialog}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPasswordDialog(false);
          setPasswordFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setPasswordErrors({});
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl w-full max-w-md p-6`}>
            <AppText variant="h2" weight="bold" color={isDark ? 'white' : 'black'} className="mb-4">{translate('change_password')}</AppText>
            
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <PasswordInput
                  label={translate('current_password')}
                  value={passwordFormData.currentPassword}
                  onChangeText={(text) => {
                    setPasswordFormData({ ...passwordFormData, currentPassword: text });
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                    }
                  }}
                  placeholder={translate('current_password')}
                  error={passwordErrors.currentPassword}
                />

                <PasswordInput
                  label={translate('new_password_label')}
                  value={passwordFormData.newPassword}
                  onChangeText={(text) => {
                    setPasswordFormData({ ...passwordFormData, newPassword: text });
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                    }
                  }}
                  placeholder={translate('new_password_label')}
                  error={passwordErrors.newPassword}
                />

                {passwordFormData.newPassword && (
                  <PasswordRequirements password={passwordFormData.newPassword} />
                )}

                <PasswordInput
                  label={translate('confirm_new_pass')}
                  value={passwordFormData.confirmPassword}
                  onChangeText={(text) => {
                    setPasswordFormData({ ...passwordFormData, confirmPassword: text });
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                    }
                  }}
                  placeholder={translate('confirm_new_pass')}
                  error={passwordErrors.confirmPassword}
                />

                {passwordFormData.confirmPassword && passwordFormData.newPassword === passwordFormData.confirmPassword && (
                  <View className="flex-row items-center mt-2">
                    <CheckCircle size={16} color="#10b981" />
                    <AppText variant="bodySmall" color="#16a34a" className="ml-2">{translate('passwords_match')}</AppText>
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordDialog(false);
                  setPasswordFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setPasswordErrors({});
                }}
                className={`flex-1 border ${isDark ? 'border-gray-700' : 'border-gray-300'} py-3 rounded-lg`}
              >
                <AppText variant="bodyMedium" weight="500" color={isDark ? colors.gray300 : colors.gray700} className="text-center">{translate('cancel')}</AppText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isChangingPassword || !passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword}
                className={`flex-1 py-3 rounded-lg ${isChangingPassword || !passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword ? (isDark ? 'bg-gray-700' : 'bg-gray-400') : (isDark ? 'bg-blue-600' : 'bg-blue-500')}`}
              >
                <AppText variant="bodyMedium" weight="500" color="white" className="text-center">
                  {isChangingPassword ? translate('updating') : translate('update_password_btn')}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}