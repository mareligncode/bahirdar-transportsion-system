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
import QRCode from 'react-native-qrcode-svg';
import { Download, Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { COLORS } from '@/constants/colors';
import { useToast } from '@/components/common/Toast';

interface QrCodeDisplayProps {
    value: string;
    size?: number;
    title?: string;
    subtitle?: string;
    showActions?: boolean;
    onSave?: () => void;
    onShare?: () => void;
}

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

            if (!viewShotRef.current) return;

            // Request permissions first
            if (Platform.OS === 'android') {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Required',
                        'This app needs permission to save images to your gallery.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Settings', onPress: () => Linking.openSettings() }
                        ]
                    );
                    return;
                }
            }

            // Capture the QR code as an image
            const uri = await viewShotRef.current.capture?.();

            if (uri) {
                // Use type assertion to fix TypeScript error
                const documentDir = (FileSystem as any).documentDirectory;
                if (!documentDir) {
                    showToast('Cannot access device storage', 'error');
                    return;
                }

                const fileName = `qrcode-${Date.now()}.png`;
                const fileUri = documentDir + fileName;

                // Copy the temporary file to a permanent location
                await FileSystem.copyAsync({
                    from: uri,
                    to: fileUri
                });

                // Save to media library (gallery)
                const asset = await MediaLibrary.createAssetAsync(fileUri);

                // Create or add to album
                const albumName = 'BahirDar Transport';
                const album = await MediaLibrary.getAlbumAsync(albumName);

                if (album === null) {
                    await MediaLibrary.createAlbumAsync(albumName, asset, false);
                } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                }

                showToast('QR code saved to gallery', 'success');

                // Clean up temporary file
                await FileSystem.deleteAsync(uri, { idempotent: true });
            }

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

            if (uri) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                        mimeType: 'image/png',
                        dialogTitle: 'Share QR Code',
                        UTI: 'public.png',
                    });
                } else {
                    showToast('Sharing is not available on this device', 'error');
                }
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
            <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 0.9 }}
                style={{ alignItems: 'center' }}
            >
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
            </ViewShot>

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
                                <Text className="text-white ml-2 font-medium">Save to Gallery</Text>
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