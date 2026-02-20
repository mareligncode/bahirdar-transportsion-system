import AsyncStorage from '@react-native-async-storage/async-storage';

const StorageKeys = {
  ACCESS_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  IS_LOGGED_IN: 'is_logged_in',
} as const;

export const storage = {
  // Token Management
  async storeToken(token: string): Promise<void> {
    try {
      console.log('💾 [storeToken] Storing token');
      await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, token);
      console.log('✅ [storeToken] Token stored');
    } catch (error) {
      console.error('❌ [storeToken] Error:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      console.log('🔍 [getToken] Retrieved:', token ? 'yes' : 'null');
      return token;
    } catch (error) {
      console.error('❌ [getToken] Error:', error);
      return null;
    }
  },

  async storeRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, token);
      console.log('✅ [storeRefreshToken] Stored');
    } catch (error) {
      console.error('❌ [storeRefreshToken] Error:', error);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);
    } catch (error) {
      console.error('❌ [getRefreshToken] Error:', error);
      return null;
    }
  },

  // User Data Management
  async storeUser(user: any): Promise<void> {
    try {
      console.log('💾 [storeUser] Storing user:', user?.email);
      const userData = JSON.stringify(user);
      await AsyncStorage.setItem(StorageKeys.USER_DATA, userData);
      await AsyncStorage.setItem(StorageKeys.IS_LOGGED_IN, 'true');
      console.log('✅ [storeUser] User stored');
    } catch (error) {
      console.error('❌ [storeUser] Error:', error);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const userString = await AsyncStorage.getItem(StorageKeys.USER_DATA);
      if (!userString) {
        console.log('🔍 [getUser] No user data found');
        return null;
      }
      
      const user = JSON.parse(userString);
      console.log('🔍 [getUser] Retrieved:', user?.email);
      return user;
    } catch (error) {
      console.error('❌ [getUser] Error:', error);
      return null;
    }
  },

  // Auth State
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const user = await this.getUser();
      const isLoggedIn = !!(token && user);
      console.log('🔍 [isLoggedIn] Result:', isLoggedIn);
      return isLoggedIn;
    } catch (error) {
      console.error('❌ [isLoggedIn] Error:', error);
      return false;
    }
  },

  // Remove tokens
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
    }
  },

  // Clear everything
  async clearAll(): Promise<void> {
    try {
      console.log('🧹 [clearAll] Clearing all storage...');
      await AsyncStorage.clear();
      console.log('✅ [clearAll] All storage cleared');
    } catch (error) {
      console.error('❌ [clearAll] Error:', error);
    }
  },
};