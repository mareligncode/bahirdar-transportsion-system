// BahirDarTransportMobileApp\lib\storage.ts - UPDATED
import AsyncStorage from '@react-native-async-storage/async-storage';

const StorageKeys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  IS_LOGGED_IN: 'is_logged_in',
} as const;

export const storage = {
  // Token Management - FIXED
  async storeToken(token: string): Promise<void> {
    try {
      console.log('💾 [storeToken] Storing token:', token.substring(0, 20) + '...');
      await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, token);
      console.log('✅ [storeToken] Token stored successfully');
    } catch (error) {
      console.error('❌ [storeToken] Error:', error);
      throw error;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      console.log('🔍 [getToken] Retrieved:', token ? token.substring(0, 20) + '...' : 'null');
      return token;
    } catch (error) {
      console.error('❌ [getToken] Error:', error);
      return null;
    }
  },

  async storeRefreshToken(token: string): Promise<void> {
    try {
      console.log('💾 [storeRefreshToken] Storing refresh token');
      await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, token);
      console.log('✅ [storeRefreshToken] Refresh token stored');
    } catch (error) {
      console.error('❌ [storeRefreshToken] Error:', error);
      throw error;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);
      console.log('🔍 [getRefreshToken] Retrieved:', token ? 'yes' : 'null');
      return token;
    } catch (error) {
      console.error('❌ [getRefreshToken] Error:', error);
      return null;
    }
  },

  // User Data Management - FIXED
  async storeUser(user: any): Promise<void> {
    try {
      console.log('💾 [storeUser] Storing user:', {
        id: user.id,
        email: user.email,
        name: user.fullName || user.name
      });
      
      const userData = JSON.stringify(user);
      await AsyncStorage.setItem(StorageKeys.USER_DATA, userData);
      await AsyncStorage.setItem(StorageKeys.IS_LOGGED_IN, 'true');
      
      console.log('✅ [storeUser] User stored successfully');
    } catch (error) {
      console.error('❌ [storeUser] Error:', error);
      throw error;
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const userString = await AsyncStorage.getItem(StorageKeys.USER_DATA);
      console.log('🔍 [getUser] Retrieved:', userString ? 'yes' : 'null');
      
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      return user;
    } catch (error) {
      console.error('❌ [getUser] Error:', error);
      return null;
    }
  },

  // Auth State
  async isLoggedIn(): Promise<boolean> {
    try {
      const isLoggedIn = await AsyncStorage.getItem(StorageKeys.IS_LOGGED_IN);
      const result = isLoggedIn === 'true';
      console.log('🔍 [isLoggedIn] Result:', result);
      return result;
    } catch (error) {
      console.error('❌ [isLoggedIn] Error:', error);
      return false;
    }
  },

  // Clear all auth data
  async removeTokens(): Promise<void> {
    try {
      console.log('🧹 [removeTokens] Clearing tokens...');
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER_DATA,
        StorageKeys.IS_LOGGED_IN,
      ]);
      console.log('✅ [removeTokens] Tokens cleared');
    } catch (error) {
      console.error('❌ [removeTokens] Error:', error);
      throw error;
    }
  },

  // Clear everything (for logout)
  async clearAll(): Promise<void> {
    try {
      console.log('🧹 [clearAll] Clearing all storage...');
      await AsyncStorage.clear();
      console.log('✅ [clearAll] All storage cleared');
    } catch (error) {
      console.error('❌ [clearAll] Error:', error);
      throw error;
    }
  },
};