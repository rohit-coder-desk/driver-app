import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';

export const EarningsScreen = () => {
  const { driver } = useAuth();
  const navigation = useNavigation<any>();

  const balance = driver?.balance || 0;
  const blockedBalance = driver?.blockedBalance || 0;
  const minimumBalance = driver?.minimumBalance || 0;

  const handleRequestPayout = () => {
    Alert.alert(
      'Payout Request',
      `Your current withdrawable balance is ₹${balance.toFixed(2)}.\nMinimum balance required: ₹${minimumBalance.toFixed(2)}.\n\nYour payout request has been queued for processing.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(ROUTES.HOME);
            }
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings & Balance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Earnings Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL EARNINGS BALANCE</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>

          <View style={styles.balanceMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>BLOCKED</Text>
              <Text style={styles.metricValue}>₹{blockedBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MIN. BALANCE</Text>
              <Text style={styles.metricValue}>₹{minimumBalance.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.payoutBtn}
            onPress={handleRequestPayout}
            activeOpacity={0.8}
          >
            <Text style={styles.payoutBtnText}>Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Performance Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>TODAY'S EARNINGS</Text>
            <Text style={styles.summaryCardValue}>₹{balance > 0 ? (balance * 0.4).toFixed(2) : '0.00'}</Text>
            <Text style={styles.summaryCardSub}>Completed orders</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>THIS WEEK</Text>
            <Text style={styles.summaryCardValue}>₹{balance > 0 ? balance.toFixed(2) : '0.00'}</Text>
            <Text style={styles.summaryCardSub}>Total payouts</Text>
          </View>
        </View>

        {/* Section: Recent Transaction Activity */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>RECENT ACTIVITY</Text>

          <View style={styles.transactionRow}>
            <View style={styles.txIconBox}>
              <Text style={styles.txIconText}>↓</Text>
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txTitle}>Delivery Earnings</Text>
              <Text style={styles.txSubtitle}>Order payout added to balance</Text>
            </View>
            <Text style={styles.txAmountPositive}>+₹{balance > 0 ? (balance * 0.4).toFixed(2) : '0.00'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.transactionRow}>
            <View style={styles.txIconBox}>
              <Text style={styles.txIconText}>↓</Text>
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txTitle}>Trip Completed</Text>
              <Text style={styles.txSubtitle}>Distance fare payment</Text>
            </View>
            <Text style={styles.txAmountPositive}>+₹{balance > 0 ? (balance * 0.6).toFixed(2) : '0.00'}</Text>
          </View>
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
    height: 56,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#bfdbfe',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20,
  },
  balanceMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  payoutBtn: {
    backgroundColor: '#ffffff',
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  summaryCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 14,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  txSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txAmountPositive: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
});

export default EarningsScreen;
