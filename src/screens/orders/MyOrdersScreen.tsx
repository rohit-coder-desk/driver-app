import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { OrderData, OrderService } from '../../services/OrderService';
import { DriverService } from '../../services/DriverService';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';

const ACTIVE_STATUSES = ['assigned', 'arrived', 'picked_up', 'near_destination'];

export const MyOrdersScreen = () => {
  const { driver } = useAuth();
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrice, setShowPrice] = useState<boolean>(true);

  const fetchOrders = useCallback(async () => {
    if (!driver?.id) {
      setOrders([]);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const driverOrders = await OrderService.getDriverOrders(driver.id);
      setOrders(driverOrders);
    } catch (err: any) {
      setError(err?.toString() || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [driver?.id]);

  useEffect(() => {
    fetchOrders();
    // Fetch driver working type visibility config to decide whether to show price
    (async () => {
      try {
        const cfg = await DriverService.getWorkingTypeConfig();
        if (cfg && typeof cfg.showPrice === 'boolean') {
          setShowPrice(cfg.showPrice !== false);
        } else {
          setShowPrice(true);
        }
      } catch (e) {
        console.warn('Failed to load working type config:', e);
      }
    })();
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const historyOrders = orders.filter((order) => !ACTIVE_STATUSES.includes(order.status));

  const renderOrderCard = (order: OrderData) => (
    <View key={`order-${order.id}`} style={styles.orderCard}>
      <View style={styles.orderRow}>
        <Text style={styles.orderCode}>{order.code ? `#${order.code}` : `Order ${order.id}`}</Text>
        <View style={[styles.statusBadge, order.status === 'assigned' ? styles.statusAssigned : styles.statusNeutral]}>
          <Text style={styles.statusBadgeText}>{order.status?.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.orderLabel}>Pickup</Text>
      <Text style={styles.orderText}>{order.pickup?.address || 'Pickup location'}</Text>
      <Text style={styles.orderLabel}>Dropoff</Text>
      <Text style={styles.orderText}>{order.dropoff?.address || 'Dropoff location'}</Text>
        <View style={styles.orderSummaryRow}>
          <Text style={styles.orderSummaryText}>Distance: {order.estimatedDistance ?? 'N/A'}</Text>
          {showPrice ? (
            <Text style={styles.orderSummaryText}>Price: ₹{order.price ?? order.calculatedPrice ?? '0'}</Text>
          ) : null}
        </View>
      <TouchableOpacity
        style={styles.viewDetailsBtn}
        onPress={() => navigation.navigate(ROUTES.ORDER_DETAILS, { order })}
        activeOpacity={0.8}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading && !refreshing} message="Loading orders..." />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          {loading && !refreshing ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
          ) : activeOrders.length === 0 ? (
            <Text style={styles.emptyText}>No active orders at the moment.</Text>
          ) : (
            activeOrders.map(renderOrderCard)
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order History</Text>
          {loading && !refreshing ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
          ) : historyOrders.length === 0 ? (
            <Text style={styles.emptyText}>No past orders yet.</Text>
          ) : (
            historyOrders.map(renderOrderCard)
          )}
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
    backgroundColor: COLORS.surface,
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
    paddingBottom: 28,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: COLORS.surfaceSoft,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusAssigned: {
    backgroundColor: COLORS.primaryLight,
  },
  statusNeutral: {
    backgroundColor: COLORS.surface,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  orderText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  orderSummaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  viewDetailsBtn: {
    marginTop: 14,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
  },
  viewDetailsText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingVertical: 12,
  },
  errorCard: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.errorBorder,
    borderWidth: 1,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 10,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  loader: {
    marginVertical: 12,
  },
});

export default MyOrdersScreen;
