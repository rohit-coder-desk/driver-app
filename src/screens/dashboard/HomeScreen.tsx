import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { COLORS } from '../../constants/colors';
import { Loader } from '../../components/common/Loader';

export const HomeScreen = () => {
  const { driver, logout, refreshProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize online toggle based on stored driver state
  useEffect(() => {
    if (driver) {
      setIsOnline(driver.isOnline || driver.status === 'online');
    }
  }, [driver]);

  // Fetch updated profile on mount
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (e) {
      console.error('Failed to sync profile on refresh:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (value: boolean) => {
    const nextStatus = value ? 'online' : 'offline';
    setLoading(true);
    try {
      await DriverService.updateStatus(nextStatus);
      setIsOnline(value);
      await refreshProfile(); // Refresh context profile with new status
    } catch (error: any) {
      Alert.alert('Status Error', error.toString() || 'Failed to update availability status.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency display
  const formatCurrency = (amount: number = 0) => {
    return `₹ ${amount.toFixed(2)}`;
  };

  // Get status badge colors
  const getAuthStatusStyle = (status: string = 'pending') => {
    const s = status.toLowerCase();
    if (s === 'approved') return styles.badgeApproved;
    if (s === 'rejected') return styles.badgeRejected;
    return styles.badgePending;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} message="Updating status..." />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>CDX <Text style={styles.blueText}>LAST</Text></Text>
            <Text style={styles.headerSubtitle}>Driver Operations Control</Text>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Availability Toggle Box */}
        <View style={styles.statusBox}>
          <View>
            <Text style={styles.statusLabel}>Availability Status</Text>
            <Text style={[styles.statusValue, isOnline ? styles.textOnline : styles.textOffline]}>
              {isOnline ? 'ONLINE - RECEIVING TASKS' : 'OFFLINE - ON BREAK'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#334155', true: 'rgba(16, 185, 129, 0.3)' }}
            thumbColor={isOnline ? COLORS.success : '#94a3b8'}
            ios_backgroundColor="#334155"
            onValueChange={handleToggleStatus}
            value={isOnline}
          />
        </View>

        {/* Driver Summary Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Driver Details</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{driver?.name || 'Not available'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{driver?.phone || 'Not available'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{driver?.email || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verification Status</Text>
            <View style={[styles.badge, getAuthStatusStyle(driver?.authorizationStatus)]}>
              <Text style={styles.badgeText}>
                {(driver?.authorizationStatus || 'PENDING').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletValue}>{formatCurrency(driver?.balance)}</Text>
          <Text style={styles.walletDesc}>Earnings will be credited automatically upon task completion.</Text>
        </View>

        {/* Sync Prompt */}
        <Text style={styles.syncPrompt}>Swipe down to sync profile information</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  blueText: {
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  textOnline: {
    color: COLORS.success,
  },
  textOffline: {
    color: '#94a3b8',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeRejected: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  walletCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  walletValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  walletDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  syncPrompt: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
export default HomeScreen;
