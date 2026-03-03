// components/ui/QrCodeDisplay.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Alert,
    Linking
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { Download, Share2 } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { COLORS } from '@/constants/colors';
import { useToast } from '@/components/common/Toast';
import { saveToGallery } from '@/utils/filesystem';

interface QrCodeDisplayProps {
    value: string;
    size?: number;
    title?: string;
    subtitle?: string;
    showActions?: boolean;
    onSave?: () => void;
    onShare?: () => void;
}

const QRCodeWrapper: React.FC<Omit<QrCodeDisplayProps, 'showActions' | 'onSave' | 'onShare'>> = ({
    value,
    size,
    title,
    subtitle,
}) => (
    <View className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
        {title && (
            <Text className="text-lg font-bold text-gray-800 text-center mb-2">
                {title}
            </Text>
        )}

        <View className="p-3 bg-white rounded-xl">
            <QRCode
                value={value}
                size={size}
                color="#000000"
                backgroundColor="#FFFFFF"
            />
        </View>

        {subtitle && (
            <Text className="text-xs text-gray-500 text-center mt-2">
                {subtitle}
            </Text>
        )}
    </View>
);

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
    value,
    size = 200,
    title,
    subtitle,
    showActions = true,
    onSave,
    onShare,
}) => {
    const viewShotRef = useRef<ViewShot>(null);
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [sharing, setSharing] = useState(false);

    const saveQRToGallery = async () => {
        try {
            setSaving(true);
            if (!viewShotRef.current || !viewShotRef.current.capture) return;

            // Capture the QR code as an image
            const uri = await viewShotRef.current.capture();
            if (!uri) {
                showToast('Unable to capture QR code', 'error');
                return;
            }

            // Save to Gallery/Download
            if (Platform.OS === 'web') {
                const a = document.createElement('a');
                a.href = uri;
                a.download = `qrcode-${Date.now()}.png`;
                a.click();
            } else {
                const fileName = `qrcode-${Date.now()}.png`;
                const result = await saveToGallery(uri, fileName);
                if (!result.success) {
                    showToast(result.message, 'error');
                    return;
                }
            }

            showToast('QR code saved', 'success');
            if (onSave) onSave();
        } catch (error) {
            console.error('Error saving QR code:', error);
            showToast('Failed to save QR code', 'error');
        } finally {
            setSaving(false);
        }
    };

    const shareQR = async () => {
        try {
            setSharing(true);
            if (!viewShotRef.current) return;

            const uri = await viewShotRef.current.capture?.();
            if (!uri) {
                showToast('Unable to capture QR code', 'error');
                return;
            }

            if (Platform.OS === 'web') {
                window.open(uri, '_blank');
            } else {
                await Sharing.shareAsync(uri);
            }

            if (onShare) onShare();
        } catch (error) {
            console.error('Error sharing QR code:', error);
            showToast('Failed to share QR code', 'error');
        } finally {
            setSharing(false);
        }
    };

    return (
        <View className="items-center">
            {(Platform.OS !== 'web') ? (
                <ViewShot
                    ref={viewShotRef}
                    options={{ format: 'png', quality: 0.9 }}
                    style={{ alignItems: 'center' }}
                >
                    <QRCodeWrapper value={value} size={size} title={title} subtitle={subtitle} />
                </ViewShot>
            ) : (
                <View style={{ alignItems: 'center' }}>
                    <QRCodeWrapper value={value} size={size} title={title} subtitle={subtitle} />
                </View>
            )}

            {showActions && (
                <View className="flex-row justify-center mt-4 gap-4">
                    <TouchableOpacity
                        onPress={saveQRToGallery}
                        disabled={saving}
                        className="flex-row items-center bg-blue-500 px-4 py-2 rounded-full"
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Download size={16} color="white" />
                                <Text className="text-white ml-2 font-medium">
                                    {Platform.OS === 'web' ? 'Download' : 'Save to Gallery'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={shareQR}
                        disabled={sharing}
                        className="flex-row items-center bg-green-500 px-4 py-2 rounded-full"
                    >
                        {sharing ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Share2 size={16} color="white" />
                                <Text className="text-white ml-2 font-medium">Share</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};