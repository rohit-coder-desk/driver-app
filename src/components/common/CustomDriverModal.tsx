import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type DriverModalType =
  | 'new_order'
  | 'accept'
  | 'reject'
  | 'order_accepted'
  | 'navigate_pickup'
  | 'arrived_pickup'
  | 'confirm_pickup'
  | 'picked_up'
  | 'start_delivery'
  | 'near_destination'
  | 'confirm_delivery'
  | 'delivered'
  | 'cancel'
  | 'error'
  | 'warning'
  | 'info'
  | 'location_required';

export interface CustomDriverModalProps {
  visible: boolean;
  type?: DriverModalType;
  title: string;
  message?: string;
  primaryButtonText?: string;
  onPrimaryAction?: () => void;
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
  loading?: boolean;
  badgeText?: string;
  children?: React.ReactNode;
}

// Crisp, professional vector primitives with balanced strokes & clean proportions
const TruckIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 }}>
      {/* Cargo Body */}
      <View
        style={{
          width: size * 0.46,
          height: size * 0.36,
          backgroundColor: color,
          borderRadius: 3,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ width: size * 0.24, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 }} />
      </View>
      {/* Driver Cabin */}
      <View
        style={{
          width: size * 0.24,
          height: size * 0.26,
          backgroundColor: color,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 2,
          marginLeft: 2,
        }}
      />
    </View>
    {/* Wheels */}
    <View style={{ flexDirection: 'row', width: size * 0.68, justifyContent: 'space-between' }}>
      <View
        style={{
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: (size * 0.15) / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
      />
      <View
        style={{
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: (size * 0.15) / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  </View>
);

const CheckCircleIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <View
      style={{
        width: size * 0.26,
        height: size * 0.46,
        borderColor: '#FFFFFF',
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderRadius: 1,
        transform: [{ rotate: '45deg' }],
        marginTop: -size * 0.06,
      }}
    />
  </View>
);

const CloseCircleIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <View
      style={{
        width: size * 0.44,
        height: 3,
        backgroundColor: '#FFFFFF',
        borderRadius: 1.5,
        transform: [{ rotate: '45deg' }],
        position: 'absolute',
      }}
    />
    <View
      style={{
        width: size * 0.44,
        height: 3,
        backgroundColor: '#FFFFFF',
        borderRadius: 1.5,
        transform: [{ rotate: '-45deg' }],
        position: 'absolute',
      }}
    />
  </View>
);

const LocationPinIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: size * 0.52,
        height: size * 0.52,
        borderRadius: (size * 0.52) / 2,
        backgroundColor: color,
        borderBottomRightRadius: 0,
        transform: [{ rotate: '-45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -size * 0.08,
      }}
    >
      <View
        style={{
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: (size * 0.2) / 2,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  </View>
);

const NavigationArrowIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.26,
        borderRightWidth: size * 0.26,
        borderBottomWidth: size * 0.6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
        transform: [{ rotate: '30deg' }],
        marginTop: -size * 0.04,
      }}
    />
  </View>
);

const PackageCheckIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: size * 0.6,
        height: size * 0.5,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.18,
          height: size * 0.3,
          borderColor: color,
          borderBottomWidth: 2,
          borderRightWidth: 2,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
          marginTop: -2,
        }}
      />
    </View>
  </View>
);

const WarningIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.34,
        borderRightWidth: size * 0.34,
        borderBottomWidth: size * 0.6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.32, fontWeight: '900', marginTop: size * 0.16 }}>!</Text>
    </View>
  </View>
);

export const CustomDriverModal: React.FC<CustomDriverModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  primaryButtonText = 'OK',
  onPrimaryAction,
  secondaryButtonText,
  onSecondaryAction,
  loading = false,
  badgeText,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 10,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Modern, soft visual style configuration per type
  const getTypeConfig = () => {
    switch (type) {
      case 'new_order':
        return {
          badgeBg: '#EFF6FF',
          badgeBorder: '#BFDBFE',
          iconColor: '#2563EB',
          primaryBtnBg: '#2563EB',
          renderIcon: (s: number) => <TruckIcon color="#2563EB" size={s} />,
        };
      case 'accept':
      case 'order_accepted':
      case 'delivered':
        return {
          badgeBg: '#ECFDF5',
          badgeBorder: '#A7F3D0',
          iconColor: '#059669',
          primaryBtnBg: '#059669',
          renderIcon: (s: number) => <CheckCircleIcon color="#059669" size={s} />,
        };
      case 'reject':
      case 'cancel':
      case 'error':
        return {
          badgeBg: '#FEF2F2',
          badgeBorder: '#FECACA',
          iconColor: '#DC2626',
          primaryBtnBg: '#DC2626',
          renderIcon: (s: number) => <CloseCircleIcon color="#DC2626" size={s} />,
        };
      case 'warning':
        return {
          badgeBg: '#FFFBEB',
          badgeBorder: '#FDE68A',
          iconColor: '#D97706',
          primaryBtnBg: '#D97706',
          renderIcon: (s: number) => <WarningIcon color="#D97706" size={s} />,
        };
      case 'location_required':
      case 'navigate_pickup':
      case 'arrived_pickup':
        return {
          badgeBg: '#EFF6FF',
          badgeBorder: '#BFDBFE',
          iconColor: '#2563EB',
          primaryBtnBg: '#2563EB',
          renderIcon: (s: number) => <LocationPinIcon color="#2563EB" size={s} />,
        };
      case 'confirm_pickup':
      case 'picked_up':
      case 'confirm_delivery':
        return {
          badgeBg: '#FFFBEB',
          badgeBorder: '#FDE68A',
          iconColor: '#D97706',
          primaryBtnBg: '#2563EB',
          renderIcon: (s: number) => <PackageCheckIcon color="#D97706" size={s} />,
        };
      case 'start_delivery':
      case 'near_destination':
        return {
          badgeBg: '#EFF6FF',
          badgeBorder: '#BFDBFE',
          iconColor: '#2563EB',
          primaryBtnBg: '#2563EB',
          renderIcon: (s: number) => <NavigationArrowIcon color="#2563EB" size={s} />,
        };
      case 'info':
      default:
        return {
          badgeBg: '#EFF6FF',
          badgeBorder: '#BFDBFE',
          iconColor: '#2563EB',
          primaryBtnBg: '#2563EB',
          renderIcon: (s: number) => <CheckCircleIcon color="#2563EB" size={s} />,
        };
    }
  };

  const config = getTypeConfig();

  const handleBackdropPress = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.cardContainer,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* Outer Icon Badge */}
              <View
                style={[
                  styles.iconBadgeOuter,
                  {
                    backgroundColor: config.badgeBg,
                    borderColor: config.badgeBorder,
                  },
                ]}
              >
                {config.renderIcon(32)}
              </View>

              {/* Optional Badge Tag */}
              {badgeText ? (
                <View style={styles.badgeTagContainer}>
                  <Text style={styles.badgeTagText}>{badgeText}</Text>
                </View>
              ) : null}

              {/* Title & Message */}
              <Text style={styles.titleText}>{title}</Text>
              {message ? <Text style={styles.messageText}>{message}</Text> : null}

              {/* Custom Children Content */}
              {children}

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                {secondaryButtonText && onSecondaryAction ? (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={onSecondaryAction}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryBtnText}>{secondaryButtonText}</Text>
                  </TouchableOpacity>
                ) : null}

                {onPrimaryAction ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: config.primaryBtnBg },
                      secondaryButtonText ? { flex: 1.35 } : { flex: 1 },
                    ]}
                    onPress={onPrimaryAction}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>{primaryButtonText}</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 58, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: Math.min(SCREEN_WIDTH - 32, 380),
    backgroundColor: '#0B2246',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  iconBadgeOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeTagContainer: {
    backgroundColor: '#0D2A54',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    marginBottom: 12,
  },
  badgeTagText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#0066FF',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Inter-Regular' : 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter-SemiBold' : 'Inter-SemiBold',
    color: '#94A3B8',
  },
});
