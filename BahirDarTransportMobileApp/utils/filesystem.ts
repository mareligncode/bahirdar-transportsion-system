// utils/filesystem.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Alert } from 'react-native';

const { StorageAccessFramework } = FileSystem;

/**
 * Fallback helper to use Sharing API when traditional saving fails
 */
export const fallbackToSharing = async (uri: string, fileName: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`📂 [fallbackToSharing] Sharing URI: ${uri}`);
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, message: 'Sharing is not available on this device' };
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Save ${fileName}`,
    });
    return {
      success: true,
      message: 'PDF shared - use "Save to Files" or other options'
    };
  } catch (shareError: any) {
    console.error('❌ [fallbackToSharing] Share error:', shareError);
    return {
      success: false,
      message: `Failed to save or share PDF: ${shareError.message}`
    };
  }
};

export const savePDFToDevice = async (
  uri: string,
  fileName: string,
  mediaPermission?: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    // Android: Use StorageAccessFramework for direct "Download" to user chosen folder
    if (Platform.OS === 'android') {
      try {
        console.log('📂 [savePDFToDevice] Android direct download started');

        // Guide the user because SAF can be confusing
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Download Ticket',
            'To save the ticket, please select the "Downloads" folder in the next screen.',
            [{ text: 'OK', onPress: () => resolve() }]
          );
        });

        // Let user pick a directory to save the file
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          console.warn('⚠️ [savePDFToDevice] Directory permission denied, falling back to sharing');
          return await fallbackToSharing(uri, fileName);
        }

        console.log(`📂 [savePDFToDevice] Directory granted: ${permissions.directoryUri}`);

        // Strip extension because createFileAsync adds it or expects it to be handled by mimeType
        const cleanFileName = fileName.replace(/\.pdf$/i, '');
        console.log(`📂 [savePDFToDevice] Creating file: ${cleanFileName} (mime: application/pdf)`);

        // Create the file in the selected directory
        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          cleanFileName,
          'application/pdf'
        );

        console.log(`📂 [savePDFToDevice] File created at: ${fileUri}`);

        // Read the source file and write to the new location
        const content = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return {
          success: true,
          message: 'Ticket successfully downloaded!'
        };
      } catch (androidError: any) {
        console.error('❌ [savePDFToDevice] Android StorageAccessFramework error:', androidError);
        // If it fails, we fall back to sharing so the user isn't stuck
        return await fallbackToSharing(uri, fileName);
      }
    }

    // iOS: Use FileSystem and trigger Sharing (iOS doesn't have a direct "Download" folder like Android)
    if (Platform.OS === 'ios') {
      const documentDir = FileSystem.documentDirectory;
      if (documentDir) {
        const newUri = documentDir + fileName;
        await FileSystem.copyAsync({ from: uri, to: newUri });

        // On iOS, Sharing IS the way to "Download" (user picks "Save to Files")
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Ticket',
        });

        return {
          success: true,
          message: 'Choose "Save to Files" to download the ticket'
        };
      } else {
        return await fallbackToSharing(uri, fileName);
      }
    }

    // For other platforms, use sharing
    return await fallbackToSharing(uri, fileName);

  } catch (error: any) {
    console.error('❌ [savePDFToDevice] Global error:', error);
    return await fallbackToSharing(uri, fileName);
  }
};

export const saveToGallery = async (
  uri: string,
  fileName: string,
  mediaPermission?: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`📸 [saveToGallery] Saving URI to gallery: ${uri}`);

    // Request permission if not already granted
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, message: 'Permission to access gallery was denied. Please enable it in settings.' };
    }

    // Simple and reliable method for both Android and iOS
    const asset = await MediaLibrary.createAssetAsync(uri);

    // Attempt to put it in a specific album, but don't fail if this part doesn't work
    try {
      const album = await MediaLibrary.getAlbumAsync('BahirDarTransport');
      if (album === null) {
        await MediaLibrary.createAlbumAsync('BahirDarTransport', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (albumErr) {
      console.warn('⚠️ [saveToGallery] Could not sort into album, but asset was created:', albumErr);
    }

    return { success: true, message: 'Ticket image saved to gallery!' };
  } catch (err: any) {
    console.error('❌ [saveToGallery] Error:', err);

    // Fallback: simple save if the album logic failed
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      return { success: true, message: 'Saved to gallery (default folder)' };
    } catch (finalErr: any) {
      return { success: false, message: `Failed to save image: ${finalErr.message}` };
    }
  }
};
