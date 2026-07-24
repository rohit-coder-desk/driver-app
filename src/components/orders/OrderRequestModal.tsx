import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { OrderOfferData } from '../../services/OrderService';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface OrderRequestModalProps {
  visible: boolean;
  offer: OrderOfferData | null;
  onAccept: (offer: OrderOfferData) => void;
  onReject: (offer: OrderOfferData) => void;
  loading?: boolean;
}

export const OrderRequestModal = ({
  visible,
  offer,
  onAccept,
  onReject,
  loading = false,
}: OrderRequestModalProps) => {
  if (!offer || !offer.order) return null;

  const order = offer.order;
  const fareDisplay = order.price || order.calculatedPrice || 0;
  const distanceDisplay = order.estimatedDistance ? `${order.estimatedDistance} km` : 'N/A';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Banner */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚡ NEW DELIVERY REQUEST</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>
                ₹{fareDisplay ? fareDisplay.toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>

          {/* Details Body */}
          <View style={styles.body}>
            {/* Pickup Node */}
            <View style={styles.addressRow}>
              <View style={styles.greenCircle}>
                <View style={styles.innerGreenDot} />
              </View>
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressLabel}>PICKUP LOCATION</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {order.pickup?.address || 'Pickup Address'}
                </Text>
              </View>
            </View>

            {/* Connecting Dotted Line */}
            <View style={styles.dottedLineContainer}>
              <View style={styles.dottedLine} />
            </View>

            {/* Delivery Node */}
            <View style={styles.addressRow}>
              <View style={styles.redCircle}>
                <View style={styles.innerRedDot} />
              </View>
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressLabel}>DELIVERY LOCATION</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {order.dropoff?.address || 'Delivery Address'}
                </Text>
              </View>
            </View>

            {/* Distance & Info Snippet */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DISTANCE</Text>
                <Text style={styles.infoValue}>{distanceDisplay}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ESTIMATED FARE</Text>
                <Text style={styles.infoValue}>
                  ₹{fareDisplay ? fareDisplay.toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => onReject(offer)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => onAccept(offer)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptBtnText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  priceBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  body: {
    marginVertical: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  greenCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  innerGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  redCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  innerRedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  dottedLineContainer: {
    paddingLeft: 11,
    height: 20,
  },
  dottedLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#cbd5e1',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },
  acceptBtn: {
    flex: 1.5,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
