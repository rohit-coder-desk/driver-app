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
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 22,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.65)',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 150,
  },
  message: {
    marginTop: 14,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
});
export default Loader;
