import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { ROUTES } from '../../constants/routes';

export const EarningsScreen = () => {
  const insets = useSafeAreaInsets();
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [earningsData, setEarningsData] = useState<any>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      const data = await DriverService.getEarnings();
      if (data) {
        setEarningsData(data);
      }
      await refreshProfile();
    } catch (error) {
      console.warn('Error loading earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEarnings();
  }, [fetchEarnings]);

  const balance = earningsData?.balance ?? driver?.balance ?? 0;
  const blockedBalance = earningsData?.blockedBalance ?? (driver as any)?.blockedBalance ?? 0;
  const minimumBalance = earningsData?.minimumBalance ?? (driver as any)?.minimumBalance ?? 0;
  const todayEarnings = earningsData?.todayEarnings ?? 0;
  const todayOrdersCount = earningsData?.todayOrdersCount ?? 0;
  const weekEarnings = earningsData?.weekEarnings ?? 0;
  const weekOrdersCount = earningsData?.weekOrdersCount ?? 0;
  const transactions = earningsData?.transactions || [];

  const handleRequestPayout = () => {
    Alert.alert(
      'Payout Request',
      `Your current withdrawable balance is ₹${balance.toFixed(2)}.\nMinimum balance required: ₹${minimumBalance.toFixed(2)}.\n\nYour payout request has been queued for processing.`,
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2246" />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 44 : 16) }]}>
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0066FF"
            colors={['#0066FF']}
          />
        }
      >
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
            <Text style={styles.summaryCardValue}>₹{todayEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryCardSub}>{todayOrdersCount} completed order{todayOrdersCount !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>THIS WEEK</Text>
            <Text style={styles.summaryCardValue}>₹{weekEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryCardSub}>{weekOrdersCount} total order{weekOrdersCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3A',
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0B2246',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  balanceCard: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  balanceMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#0D2A54',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E3A8A',
  },
  payoutBtn: {
    backgroundColor: '#0066FF',
    width: '100%',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  payoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#0B2246',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  summaryCardSub: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 4,
  },
});

export default EarningsScreen;

