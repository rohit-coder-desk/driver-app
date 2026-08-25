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
import {
  CheckIcon,
  CloseIcon,
  WarningIcon,
  TruckIcon,
  LocationPinIcon,
  NavigationArrowIcon,
  OrdersIcon,
} from './Icons';

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
          badgeBg: 'rgba(37, 99, 235, 0.15)',
          badgeBorder: 'rgba(37, 99, 235, 0.4)',
          iconColor: '#60A5FA',
          primaryBtnBg: '#0066FF',
          renderIcon: (s: number) => <TruckIcon color="#60A5FA" size={s} />,
        };
      case 'accept':
      case 'order_accepted':
      case 'delivered':
        return {
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          badgeBorder: 'rgba(16, 185, 129, 0.4)',
          iconColor: '#10B981',
          primaryBtnBg: '#10B981',
          renderIcon: (s: number) => <CheckIcon color="#34D399" size={s} />,
        };
      case 'reject':
      case 'cancel':
      case 'error':
        return {
          badgeBg: 'rgba(239, 68, 68, 0.15)',
          badgeBorder: 'rgba(239, 68, 68, 0.4)',
          iconColor: '#EF4444',
          primaryBtnBg: '#EF4444',
          renderIcon: (s: number) => <CloseIcon color="#F87171" size={s} />,
        };
      case 'warning':
        return {
          badgeBg: 'rgba(245, 158, 11, 0.15)',
          badgeBorder: 'rgba(245, 158, 11, 0.4)',
          iconColor: '#F59E0B',
          primaryBtnBg: '#F59E0B',
          renderIcon: (s: number) => <WarningIcon color="#FBBF24" size={s} />,
        };
      case 'location_required':
      case 'navigate_pickup':
      case 'arrived_pickup':
        return {
          badgeBg: 'rgba(0, 102, 255, 0.15)',
          badgeBorder: 'rgba(0, 102, 255, 0.4)',
          iconColor: '#0066FF',
          primaryBtnBg: '#0066FF',
          renderIcon: (s: number) => <LocationPinIcon color="#60A5FA" size={s} />,
        };
      case 'confirm_pickup':
      case 'picked_up':
      case 'confirm_delivery':
        return {
          badgeBg: 'rgba(0, 102, 255, 0.15)',
          badgeBorder: 'rgba(0, 102, 255, 0.4)',
          iconColor: '#0066FF',
          primaryBtnBg: '#0066FF',
          renderIcon: (s: number) => <OrdersIcon color="#60A5FA" size={s} />,
        };
      case 'start_delivery':
      case 'near_destination':
        return {
          badgeBg: 'rgba(0, 102, 255, 0.15)',
          badgeBorder: 'rgba(0, 102, 255, 0.4)',
          iconColor: '#0066FF',
          primaryBtnBg: '#0066FF',
          renderIcon: (s: number) => <NavigationArrowIcon color="#60A5FA" size={s} />,
        };
      case 'info':
      default:
        return {
          badgeBg: 'rgba(0, 102, 255, 0.15)',
          badgeBorder: 'rgba(0, 102, 255, 0.4)',
          iconColor: '#0066FF',
          primaryBtnBg: '#0066FF',
          renderIcon: (s: number) => <LocationPinIcon color="#60A5FA" size={s} />,
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
                {config.renderIcon(30)}
              </View>

              {/* Optional Badge Tag */}
              {badgeText ? (
                <View style={styles.badgeTagContainer}>
                  <Text style={styles.badgeTagText}>{badgeText}</Text>
                </View>
              ) : null}

              {/* Title & Message */}
              <Text style={styles.titleText}>
                {title ? title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}🎉✉️📞💬📷🎯🔍☰✓✕]/gu, '').trim() : title}
              </Text>
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
