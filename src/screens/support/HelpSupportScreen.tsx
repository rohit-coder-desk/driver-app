import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, StatusBar, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';

export const HelpSupportScreen = () => {
  const navigation = useNavigation<any>();

  const openSupportEmail = () => {
    Linking.openURL('mailto:support@driverapp.example.com?subject=Driver%20Support%20Request');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Need help?</Text>
        <Text style={styles.description}>If you have issues with a delivery, document, or account, please contact our support team.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Email support</Text>
          <Text style={styles.cardText}>Send us a message and we will respond as soon as possible.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={openSupportEmail} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>Email Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : Math.max(StatusBar.currentHeight || 0, 24) + 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default HelpSupportScreen;
