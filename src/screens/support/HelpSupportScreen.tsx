import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, StatusBar, Linking, ScrollView } from 'react-native';
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Need assistance?</Text>
        <Text style={styles.description}>
          Our driver support team is available 24/7. Select an option below to get instant help with your trips or account.
        </Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridCard} onPress={openSupportEmail} activeOpacity={0.8}>
            <View style={[styles.gridIconBox, { backgroundColor: '#eff6ff' }]}>
              <Text style={styles.gridIconEmoji}>📧</Text>
            </View>
            <Text style={styles.gridCardTitle}>Email Support</Text>
            <Text style={styles.gridCardSub}>Send us a message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={openSupportEmail} activeOpacity={0.8}>
            <View style={[styles.gridIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Text style={styles.gridIconEmoji}>📞</Text>
            </View>
            <Text style={styles.gridCardTitle}>Call Dispatch</Text>
            <Text style={styles.gridCardSub}>Hotline assistance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>💬</Text>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Direct Driver Helpdesk</Text>
              <Text style={styles.cardText}>Email support directly for document verification & payout queries.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={openSupportEmail} activeOpacity={0.85}>
            <Text style={styles.actionBtnText}>Contact Support Team</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    padding: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  gridIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridIconEmoji: {
    fontSize: 20,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  gridCardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});

export default HelpSupportScreen;
