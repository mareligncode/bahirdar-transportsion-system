import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  TextInput,
} from 'react-native';
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

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View className="relative">
        <TextInput
          className={`bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 pr-12 text-gray-900`}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3"
        >
          {showPassword ? (
            <EyeOff size={20} color="#6b7280" />
          ) : (
            <Eye size={20} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser, changePassword, isLoading } = useAuth();
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
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!passwordFormData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else {
      const hasUpperCase = /[A-Z]/.test(passwordFormData.newPassword);
      const hasLowerCase = /[a-z]/.test(passwordFormData.newPassword);
      const hasNumbers = /\d/.test(passwordFormData.newPassword);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordFormData.newPassword);
      const hasMinLength = passwordFormData.newPassword.length >= 8;

      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar || !hasMinLength) {
        errors.newPassword = 'Password does not meet requirements';
        isValid = false;
      }
    }

    if (!passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
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
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      await updateUser(formData);
      setIsEditing(false);
      setViewMode('view');
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
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
        Alert.alert('Success', result.message);
        setShowPasswordDialog(false);
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordErrors({});
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar style="dark" />
      <View className="bg-blue-500 px-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-white">My Profile</Text>
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
            <View className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full items-center justify-center border-4 border-white shadow-lg">
              {avatarPreview ? (
                <Image
                  source={{ uri: avatarPreview }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-white font-bold text-2xl">
                  {getInitials(user?.fullName || '')}
                </Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full border-2 border-white">
              <Camera size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text className="text-lg font-bold text-gray-900 mt-2">
            {user?.fullName || 'User'}
          </Text>
          
          <View className="flex-row items-center mt-2 space-x-4">
            {user?.isActive ? (
              <View className="flex-row items-center">
                <CheckCircle size={16} color="#10b981" className="mr-1" />
                <Text className="text-sm text-green-600 font-medium">Active</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <XCircle size={16} color="#ef4444" className="mr-1" />
                <Text className="text-sm text-red-600 font-medium">Inactive</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center mt-2 space-x-6">
            <View className="flex-row items-center">
              <Calendar size={16} color="#6b7280" className="mr-1" />
              <Text className="text-sm text-gray-600">Member since {formatDate(user?.createdAt)}</Text>
            </View>
          </View>
        </View>
        <View className="bg-white mx-4 mt-6 p-5 rounded-xl border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Personal Information
          </Text>

          {viewMode === 'view' ? (
            <View className="space-y-4">
              <View className="flex-row items-center bg-gray-50 p-3 rounded-lg">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <User size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Full Name</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user?.fullName || 'Not set'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 p-3 rounded-lg">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Mail size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Email Address</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user?.email || 'Not set'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 p-3 rounded-lg">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                  <Phone size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Phone Number</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user?.phoneNumber || 'Not set'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="space-y-4">
              <Input
                label="Full Name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter your full name"
                leftIcon={<User size={20} color="#6b7280" />}
              />

              <Input
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color="#6b7280" />}
              />

              <Input
                label="Emergency Contact"
                value={formData.emergencyContact}
                onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
                placeholder="Name and phone number"
                leftIcon={<Phone size={20} color="#6b7280" />}
              />

              <Text className="text-xs text-gray-500 mt-2">
                Email cannot be changed. Contact support if needed.
              </Text>
            </View>
          )}
        </View>
        {viewMode === 'view' && (
          <View className="bg-white mx-4 mt-6 p-5 rounded-xl border border-gray-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                  <Lock size={20} color="#f97316" />
                </View>
                <View>
                  <Text className="text-lg font-semibold text-gray-800">
                    Password
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Change your password regularly
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowPasswordDialog(true)}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium text-sm">Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View className="bg-white mx-4 mt-6 p-5 rounded-xl border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Account Status
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-center justify-between bg-gray-50 p-3 rounded-lg">
              <View className="flex-row items-center">
                <CheckCircle size={20} color="#6b7280" className="mr-3" />
                <Text className="text-sm text-gray-500">Account Status</Text>
              </View>
              <View className="flex-row items-center">
                {user?.isActive ? (
                  <CheckCircle size={20} color="#10b981" className="mr-2" />
                ) : (
                  <XCircle size={20} color="#ef4444" className="mr-2" />
                )}
                <Text className={`font-medium ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center justify-between bg-gray-50 p-3 rounded-lg">
              <View className="flex-row items-center">
                <Calendar size={20} color="#6b7280" className="mr-3" />
                <Text className="text-sm text-gray-500">Last Updated</Text>
              </View>
              <Text className="text-sm text-gray-600">
                {formatDate(user?.updatedAt)}
              </Text>
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
            <Text className="text-white font-bold text-lg">
              Logout
            </Text>
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
          <View className="bg-white rounded-xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Change Profile Picture</Text>
            
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
                className="border border-gray-300 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Camera size={20} color="#6b7280" className="mr-2" />
                <Text className="text-gray-700 font-medium">Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={pickImage}
                className="border border-gray-300 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Camera size={20} color="#6b7280" className="mr-2" />
                <Text className="text-gray-700 font-medium">Choose from Gallery</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              <Text className="text-xs text-gray-500 text-center">
                Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowAvatarDialog(false)}
              className="mt-4 border border-gray-300 py-3 rounded-lg"
            >
              <Text className="text-gray-700 text-center font-medium">Cancel</Text>
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
          <View className="bg-white rounded-xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Change Password</Text>
            
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <PasswordInput
                  label="Current Password"
                  value={passwordFormData.currentPassword}
                  onChangeText={(text) => {
                    setPasswordFormData({ ...passwordFormData, currentPassword: text });
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                    }
                  }}
                  placeholder="Enter your current password"
                  error={passwordErrors.currentPassword}
                />

                <PasswordInput
                  label="New Password"
                  value={passwordFormData.newPassword}
                  onChangeText={(text) => {
                    setPasswordFormData({ ...passwordFormData, newPassword: text });
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                    }
                  }}
                  placeholder="Enter your new password"
                  error={passwordErrors.newPassword}
                />

                {passwordFormData.newPassword && (
                  <PasswordRequirements password={passwordFormData.newPassword} />
                )}

                <PasswordInput
                  label="Confirm New Password"
                  value={passwordFormData.confirmPassword}
                  onChangeText={(text) => {
                    setPasswordFormData({ ...passwordFormData, confirmPassword: text });
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                    }
                  }}
                  placeholder="Confirm your new password"
                  error={passwordErrors.confirmPassword}
                />

                {passwordFormData.confirmPassword && passwordFormData.newPassword === passwordFormData.confirmPassword && (
                  <View className="flex-row items-center mt-2">
                    <CheckCircle size={16} color="#10b981" />
                    <Text className="text-sm text-green-600 ml-2">Passwords match</Text>
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
                className="flex-1 border border-gray-300 py-3 rounded-lg"
              >
                <Text className="text-gray-700 text-center font-medium">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isChangingPassword || !passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword}
                className={`flex-1 py-3 rounded-lg ${isChangingPassword || !passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword ? 'bg-gray-400' : 'bg-blue-500'}`}
              >
                <Text className="text-white text-center font-medium">
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}