// src/components/LoadingOverlay.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../constants';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={[COLORS.BG_LIGHT, COLORS.BG_MEDIUM]}
          style={styles.container}
        >
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.message}>{message}</Text>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <LinearGradient
      colors={[COLORS.BG_LIGHT, COLORS.BG_MEDIUM, COLORS.BG_DARK]}
      style={styles.container}
    >
      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      <Text style={styles.message}>{message}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },
});

export default LoadingOverlay;
