import AsyncStorage from '@react-native-async-storage/async-storage';

const StorageKeys = {
  ACCESS_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  IS_LOGGED_IN: 'is_logged_in',
} as const;

export const storage = {
  async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, token);
    } catch {
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      return token;
    } catch {
      return null;
    }
  },

  async storeRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, token);
    } catch {
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },
  async storeUser(user: any): Promise<void> {
    try {
      const userData = JSON.stringify(user);
      await AsyncStorage.setItem(StorageKeys.USER_DATA, userData);
      await AsyncStorage.setItem(StorageKeys.IS_LOGGED_IN, 'true');
    } catch {
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const userString = await AsyncStorage.getItem(StorageKeys.USER_DATA);
      if (!userString) {
        return null;
      }
      
      const user = JSON.parse(userString);
      return user;
    } catch {
      return null;
    }
  },
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const user = await this.getUser();
      const isLoggedIn = !!(token && user);
      return isLoggedIn;
    } catch {
      return false;
    }
  },
  async removeTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER_DATA,
        StorageKeys.IS_LOGGED_IN,
      ]);
    } catch {
    }
  },
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch {
    }
  },
};