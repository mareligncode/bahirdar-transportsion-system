// BahirDarTransportMobileApp/components/layout/ScreenLayout.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView, Platform } from 'react-native';

interface ScreenLayoutProps {
  children: ReactNode;
  style?: any;
  safeArea?: boolean;
}

export default function ScreenLayout({ children, style, safeArea = true }: ScreenLayoutProps) {
  const content = (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});