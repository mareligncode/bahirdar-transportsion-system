import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Banknote, 
  Info, 
  Copy, 
  X,
  ShieldCheck
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../../components/common/Toast';
import { AppText } from '../../components/common/AppText';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { paymentsApi } from '../../lib/api/payments';

interface ReceiptUploadProps {
  bookingId: string;
  amount: number;
  onVerificationSuccess: (data: any) => void;
}

export default function ReceiptUpload({ bookingId, amount, onVerificationSuccess }: ReceiptUploadProps) {
  const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [bankDetails, setBankDetails] = useState<any>(null);

  const { isDark, colors } = useTheme();
  const { translate } = useTranslation();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchInstructions = async () => {
      if (!bookingId) return;
      try {
        setLoadingDetails(true);
        const response = await paymentsApi.getPaymentInstructions(bookingId);
        if (response.success) {
          setBankDetails(response.data);
        }
      } catch (err) {
        console.error('Failed to load bank details:', err);
        showToast(translate('failed_to_load_bank_details') || 'Could not load bank details', 'error');
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchInstructions();
  }, [bookingId]);

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    showToast(`${label} ${translate('copied') || 'copied!'}`, 'success');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        translate('permission_required') || 'Permission Required', 
        translate('camera_roll_permission') || 'Sorry, we need camera roll permissions to upload your receipt.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
        showToast(translate('file_too_large') || 'File size exceeds 5MB limit', 'error');
        return;
      }
      setFile(selectedAsset);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !file.uri) {
      showToast(translate('please_select_image') || 'Please select an image first', 'warning');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await paymentsApi.verifyReceipt(
        bookingId, 
        file.uri, 
        file.mimeType || 'image/jpeg'
      );

      if (response.success) {
        setResult(response.data);
        showToast(translate('verification_successful') || 'Receipt verified successfully!', 'success');
        if (onVerificationSuccess) {
          onVerificationSuccess(response.data);
        }
      } else {
        setError(response.message || 'Failed to verify receipt');
      }
    } catch (err: any) {
      console.error('OCR Verification Error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to process receipt. Please try clear image.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <View className={`rounded-2xl border mb-6 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <View className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-blue-50/50'} flex-row justify-between items-center`}>
        <View className="flex-row items-center flex-1">
          <View className="p-2 bg-blue-600 rounded-xl mr-3">
            <Banknote size={20} color="white" />
          </View>
          <View>
            <AppText className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {translate('bank_transfer') || 'Bank Transfer'}
            </AppText>
            <AppText className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {translate('secure_payment_verification') || 'Secure Payment Verification'}
            </AppText>
          </View>
        </View>
      </View>

      <View className="p-4">
        {loadingDetails ? (
          <View className={`rounded-xl p-6 h-32 items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : bankDetails ? (
          <View className="bg-slate-800 rounded-xl p-5 mb-5 shadow-lg">
            <AppText className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">
              {translate('bank_name') || 'Bank Name'}
            </AppText>
            <AppText className="text-base font-bold text-white mb-3">
              {bankDetails.bankName}
            </AppText>

            <View className="flex-row border-t border-white/10 pt-3">
              <TouchableOpacity 
                className="flex-1 mr-2" 
                onPress={() => copyToClipboard(bankDetails.accountNumber, translate('account_number') || 'Account Number')}
              >
                <AppText className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">
                  {translate('account_number') || 'Account Number'}
                </AppText>
                <View className="flex-row items-center">
                  <AppText className="text-lg font-mono font-bold text-white mr-2">
                    {bankDetails.accountNumber}
                  </AppText>
                  <Copy size={14} color="#9ca3af" />
                </View>
              </TouchableOpacity>
              
              <View className="flex-1">
                <AppText className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">
                  {translate('account_name') || 'Account Holder'}
                </AppText>
                <AppText className="text-sm font-bold text-blue-50">
                  {bankDetails.accountName}
                </AppText>
              </View>
            </View>
            
            <View className="mt-3 pt-3 border-t border-white/5">
                <AppText className="text-[10px] text-white/50 italic">
                  {translate('double_check_account') || 'Please double-check account name before sending'}
                </AppText>
            </View>
          </View>
        ) : (
          <View className="bg-red-50 border border-red-100 rounded-xl p-4 items-center mb-5">
            <AlertCircle size={24} color="#f87171" className="mb-2" />
            <AppText className="text-sm font-bold text-red-900">
              {translate('failed_to_load_bank_details') || 'Failed to load bank details'}
            </AppText>
          </View>
        )}

        {!file ? (
          <TouchableOpacity
            onPress={pickImage}
            className={`border-2 border-dashed rounded-xl p-6 items-center justify-center ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}
          >
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
              <Upload size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            </View>
            <AppText className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {translate('upload_receipt_screenshot') || 'Upload Transfer Screenshot'}
            </AppText>
            <AppText className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {translate('supported_formats') || 'PNG, JPG or JPEG (Max 5MB)'}
            </AppText>

            <View className={`mt-4 flex-row items-center py-2 px-4 rounded-lg ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
              <Info size={14} color={isDark ? '#818cf8' : '#4338ca'} className="mr-2" />
              <AppText className={`text-[10px] font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {translate('txn_id_visible') || 'TXN ID & ACCOUNT MUST BE VISIBLE'}
              </AppText>
            </View>
          </TouchableOpacity>
        ) : (
          <View className="space-y-4">
            <View className={`rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} items-center justify-center bg-black/5`}>
              <Image 
                source={{ uri: file.uri }} 
                style={{ width: '100%', height: 200 }} 
                resizeMode="contain" 
              />
              <TouchableOpacity
                onPress={reset}
                className="absolute top-2 right-2 p-2 bg-red-600 rounded-full"
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-100 rounded-xl p-4 flex-row">
                <View className="p-2 bg-red-600 rounded-lg mr-3 self-start">
                  <AlertCircle size={20} color="white" />
                </View>
                <View className="flex-1">
                  <AppText className="font-bold text-red-900 mb-1">
                    {translate('validation_failure') || 'Validation Failure'}
                  </AppText>
                  <AppText className="text-xs text-red-700 mb-3">
                    {error}
                  </AppText>
                  <TouchableOpacity
                    onPress={reset}
                    className="py-2 px-4 bg-red-600 rounded-lg self-start"
                  >
                    <AppText className="text-white text-xs font-bold uppercase">
                      {translate('try_clear_photo') || 'Try Clear Photo'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleUpload}
                disabled={processing}
                className={`w-full py-4 rounded-xl flex-row items-center justify-center ${processing ? 'bg-gray-400' : 'bg-gray-900'}`}
              >
                {processing ? (
                  <>
                    <ActivityIndicator size="small" color="white" className="mr-2" />
                    <AppText className="text-white font-bold text-sm">
                      {translate('securely_analyzing') || 'SECURELY ANALYZING DATA...'}
                    </AppText>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} color="#60a5fa" className="mr-2" />
                    <AppText className="text-white font-bold text-sm">
                      {translate('verify_and_release') || 'VERIFY & RELEASE PAYMENT'}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
