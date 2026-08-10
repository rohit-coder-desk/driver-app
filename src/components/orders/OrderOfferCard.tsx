import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { OrderOfferData } from '../../services/OrderService';
import { COLORS } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrderOfferCardProps {
  offer: OrderOfferData;
  onAccept: (offer: OrderOfferData) => void;
  onReject: (offer: OrderOfferData) => void;
  loading?: boolean;
}

export const OrderOfferCard: React.FC<OrderOfferCardProps> = ({
  offer,
  onAccept,
  onReject,
  loading = false,
}) => {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!offer || !offer.order) return null;

  const order = offer.order;
  const isPriceVisible = offer.workingTypeConfig?.showPrice !== false;
  const hasPrice =
    (order.price !== undefined && order.price !== null) ||
    (order.calculatedPrice !== undefined && order.calculatedPrice !== null);
  const showPrice = isPriceVisible && hasPrice;

  const fareValue = order.price ?? order.calculatedPrice;
  const fareDisplay =
    fareValue !== undefined && fareValue !== null ? `₹${Number(fareValue).toFixed(2)}` : null;
  const distanceDisplay = order.estimatedDistance ? `${order.estimatedDistance} km` : 'N/A';

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      {/* Top Header Badge Row */}
      <View style={styles.headerRow}>
        <View style={styles.newOrderBadge}>
          <Text style={styles.newOrderBadgeText}>New Delivery Request</Text>
        </View>
        {showPrice && fareDisplay ? (
          <View style={styles.fareBadgeTag}>
            <Text style={styles.fareBadgeText}>{fareDisplay}</Text>
          </View>
        ) : null}
      </View>

      {/* Body Content: Addresses */}
      <View style={styles.body}>
        {/* Pickup Location Node */}
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

        {/* Delivery Location Node */}
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

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => onReject(offer)}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => onAccept(offer)}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Accept Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: '#0B2246',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  newOrderBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  newOrderBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#2563EB',
  },
  fareBadgeTag: {
    backgroundColor: '#0D2A54',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  fareBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#0066FF',
  },
  body: {
    width: '100%',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  greenCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  innerGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  redCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  innerRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  dottedLineContainer: {
    paddingLeft: 9,
    height: 16,
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
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#0D2A54',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
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
    height: 24,
    backgroundColor: '#1E3A8A',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1.35,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#94A3B8',
  },
});
