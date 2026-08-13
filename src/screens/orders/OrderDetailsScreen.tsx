import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { OrderData } from '../../services/OrderService';
import { ROUTES } from '../../constants/routes';

interface OrderDetailsRouteParams {
  order: OrderData;
}

export const OrderDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { order } = route.params as OrderDetailsRouteParams;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2246" />
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
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order</Text>
          <Text style={styles.valueText}>{order.code ? `#${order.code}` : `Order ${order.id}`}</Text>
          <Text style={styles.labelText}>Status</Text>
          <Text style={styles.valueText}>{order.status?.toUpperCase()}</Text>
          <Text style={styles.labelText}>Created</Text>
          <Text style={styles.valueText}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</Text>
        </View>

        {order.status?.toLowerCase() === 'cancelled' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cancellation Details</Text>
            <Text style={styles.labelText}>Reason</Text>
            <Text style={styles.valueText}>{order.cancellationReason || order.failedReason || 'Order cancelled at delivery location'}</Text>
            <Text style={styles.labelText}>Cancelled by</Text>
            <Text style={styles.valueText}>Driver</Text>
            <Text style={styles.labelText}>Cancelled at</Text>
            <Text style={styles.valueText}>{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'N/A'}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pickup</Text>
          <Text style={styles.valueText}>{order.pickup?.address || 'N/A'}</Text>
          {order.pickup?.contactName ? <Text style={styles.subText}>{order.pickup.contactName}</Text> : null}
          {order.pickup?.contactPhone ? <Text style={styles.subText}>{order.pickup.contactPhone}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dropoff</Text>
          <Text style={styles.valueText}>{order.dropoff?.address || 'N/A'}</Text>
          {order.dropoff?.contactName ? <Text style={styles.subText}>{order.dropoff.contactName}</Text> : null}
          {order.dropoff?.contactPhone ? <Text style={styles.subText}>{order.dropoff.contactPhone}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.labelText}>Price</Text>
          <Text style={styles.valueText}>₹{order.price ?? order.calculatedPrice ?? '0'}</Text>
          <Text style={styles.labelText}>Estimated Distance</Text>
          <Text style={styles.valueText}>{order.estimatedDistance ?? 'N/A'}</Text>
          <Text style={styles.labelText}>Customer</Text>
          <Text style={styles.valueText}>{order.customerName ?? 'N/A'}</Text>
          <Text style={styles.subText}>{order.customerPhone ?? 'N/A'}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    marginTop: 14,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: COLORS.textPrimary,
    marginTop: 6,
    lineHeight: 22,
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default OrderDetailsScreen;
