import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderOfferData } from '../../services/OrderService';
import { COLORS } from '../../constants/colors';
import { CustomDriverModal } from '../common/CustomDriverModal';

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
  const isPriceVisible = offer.workingTypeConfig?.showPrice !== false;
  const hasPrice = (order.price !== undefined && order.price !== null) || (order.calculatedPrice !== undefined && order.calculatedPrice !== null);
  const showPrice = isPriceVisible && hasPrice;

  const fareValue = order.price ?? order.calculatedPrice;
  const fareDisplay = fareValue !== undefined && fareValue !== null ? `₹${Number(fareValue).toFixed(2)}` : null;
  const distanceDisplay = order.estimatedDistance ? `${order.estimatedDistance} km` : 'N/A';

  return (
    <CustomDriverModal
      visible={visible}
      type="new_order"
      title="New Delivery Request"
      badgeText={showPrice && fareDisplay ? fareDisplay : undefined}
      primaryButtonText="Accept Order"
      onPrimaryAction={() => onAccept(offer)}
      secondaryButtonText="Reject"
      onSecondaryAction={() => onReject(offer)}
      loading={loading}
    >
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

        {/* Dotted Connecting Line */}
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

        {/* Distance & Info Metrics */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>DISTANCE</Text>
            <Text style={styles.infoValue}>{distanceDisplay}</Text>
          </View>
          {showPrice && fareDisplay ? (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ESTIMATED FARE</Text>
                <Text style={styles.infoValue}>{fareDisplay}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </CustomDriverModal>
  );
};

const styles = StyleSheet.create({
  body: {
    width: '100%',
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  greenCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  innerGreenDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.primary,
  },
  redCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  innerRedDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.error,
  },
  dottedLineContainer: {
    paddingLeft: 10,
    height: 18,
  },
  dottedLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#CBD5E1',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E3A8A',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 4,
  },
});
