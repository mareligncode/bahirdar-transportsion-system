import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Alert } from 'react-native';

const { StorageAccessFramework } = FileSystem;

export const fallbackToSharing = async (uri: string, fileName: string): Promise<{ success: boolean; message: string }> => {
  try {
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
    if (Platform.OS === 'android') {
      try {
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Download Ticket',
            'To save the ticket, please select the "Downloads" folder in the next screen.',
            [{ text: 'OK', onPress: () => resolve() }]
          );
        });

        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          return await fallbackToSharing(uri, fileName);
        }
        const cleanFileName = fileName.replace(/\.pdf$/i, '');
        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          cleanFileName,
          'application/pdf'
        );

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
        return await fallbackToSharing(uri, fileName);
      }
    }

    if (Platform.OS === 'ios') {
      const documentDir = FileSystem.documentDirectory;
      if (documentDir) {
        const newUri = documentDir + fileName;
        await FileSystem.copyAsync({ from: uri, to: newUri });

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
    return await fallbackToSharing(uri, fileName);

  } catch (error: any) {
    return await fallbackToSharing(uri, fileName);
  }
};

export const saveToGallery = async (
  uri: string,
  fileName: string,
  mediaPermission?: boolean
): Promise<{ success: boolean; message: string }> => {
  try {

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, message: 'Permission to access gallery was denied. Please enable it in settings.' };
    }

    const asset = await MediaLibrary.createAssetAsync(uri);

    try {
      const album = await MediaLibrary.getAlbumAsync('BahirDarTransport');
      if (album === null) {
        await MediaLibrary.createAlbumAsync('BahirDarTransport', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (albumErr) {
    }

    return { success: true, message: 'Ticket image saved to gallery!' };
  } catch (err: any) {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      return { success: true, message: 'Saved to gallery (default folder)' };
    } catch (finalErr: any) {
      return { success: false, message: `Failed to save image: ${finalErr.message}` };
    }
  }
};
