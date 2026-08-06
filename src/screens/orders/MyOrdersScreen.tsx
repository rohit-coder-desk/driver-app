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
    backgroundColor: '#061A3A',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : Math.max(StatusBar.currentHeight || 0, 24) + 8,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#0D2A54',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderCode: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusAssigned: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  statusNeutral: {
    backgroundColor: '#0B2246',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0066FF',
  },
  orderLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginTop: 10,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginTop: 4,
    lineHeight: 22,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E3A8A',
  },
  orderSummaryText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  viewDetailsBtn: {
    marginTop: 16,
    width: '100%',
    height: 54,
    backgroundColor: '#0066FF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    paddingVertical: 14,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    marginBottom: 10,
  },
  retryBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loader: {
    marginVertical: 12,
  },
});

export default MyOrdersScreen;
