import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text } from 'react-native';
import { COLORS } from '../../constants/colors';

interface LoaderProps {
  visible: boolean;
  message?: string;
}

export const Loader = ({ visible, message = 'Please wait...' }: LoaderProps) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)', // Glassmorphic dark overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 140,
  },
  message: {
    marginTop: 14,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});
export default Loader;
