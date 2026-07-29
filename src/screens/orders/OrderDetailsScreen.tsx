import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, StatusBar, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { OrderData } from '../../services/OrderService';
import { ROUTES } from '../../constants/routes';

interface OrderDetailsRouteParams {
  order: OrderData;
}

export const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { order } = route.params as OrderDetailsRouteParams;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order</Text>
          <Text style={styles.valueText}>{order.code ? `#${order.code}` : `Order ${order.id}`}</Text>
          <Text style={styles.labelText}>Status</Text>
          <Text style={styles.valueText}>{order.status?.toUpperCase()}</Text>
          <Text style={styles.labelText}>Created</Text>
          <Text style={styles.valueText}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pickup</Text>
          <Text style={styles.valueText}>{order.pickup?.address || 'N/A'}</Text>
          {order.pickup.contactName ? <Text style={styles.subText}>{order.pickup.contactName}</Text> : null}
          {order.pickup.contactPhone ? <Text style={styles.subText}>{order.pickup.contactPhone}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dropoff</Text>
          <Text style={styles.valueText}>{order.dropoff?.address || 'N/A'}</Text>
          {order.dropoff.contactName ? <Text style={styles.subText}>{order.dropoff.contactName}</Text> : null}
          {order.dropoff.contactPhone ? <Text style={styles.subText}>{order.dropoff.contactPhone}</Text> : null}
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
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default OrderDetailsScreen;
