import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { OrderService, OrderOfferData } from '../../services/OrderService';
import { voiceService } from '../../services/VoiceService';
import { OrderOfferCard } from './OrderOfferCard';
import { ROUTES } from '../../constants/routes';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height } = Dimensions.get('window');

interface GlobalOfferOverlayProps {
  children: React.ReactNode;
}

export const GlobalOfferOverlay: React.FC<GlobalOfferOverlayProps> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const navigation = useNavigation<any>();

  const [incomingOffers, setIncomingOffers] = useState<OrderOfferData[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const announcedOfferIdsRef = useRef<Set<number>>(new Set());

  const isOnline = driver?.status === 'online';

  useEffect(() => {
    voiceService.initialize();
    return () => {
      voiceService.stop();
    };
  }, []);

  useEffect(() => {
    let offerInterval: any;

    if (isOnline && driver?.id) {
      const fetchOffers = async () => {
        try {
          // If driver already has active order assigned/picked_up, suppress offers
          const activeOrder = await OrderService.getActiveOrderForDriver(driver.id);
          if (activeOrder) {
            setIncomingOffers([]);
            return;
          }

          const offers = await OrderService.getDriverOffers();
          if (offers && Array.isArray(offers)) {
            const pendingOffers = offers.filter((o) => o && o.id && o.status === 'pending');

            // Speak alert for newly arrived pending offers
            const newlyArrived = pendingOffers.filter(
              (o) => !announcedOfferIdsRef.current.has(o.id)
            );

            if (newlyArrived.length > 0) {
              newlyArrived.forEach((o) => announcedOfferIdsRef.current.add(o.id));
              voiceService.speakNewOffer(newlyArrived.length > 1);
            }

            setIncomingOffers((prev) => {
              const offerMap = new Map<number, OrderOfferData>();
              pendingOffers.forEach((o) => offerMap.set(o.id, o));

              const getOfferTime = (item: OrderOfferData): number => {
                const raw = (item as any).offeredAt || (item as any).createdAt || item.order?.createdAt;
                if (raw) {
                  const t = new Date(raw).getTime();
                  if (!isNaN(t)) return t;
                }
                return item.id || 0;
              };

              const sorted = Array.from(offerMap.values()).sort(
                (a, b) => getOfferTime(b) - getOfferTime(a)
              );

              if (sorted.length !== prev.length) {
                try {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                } catch (e) {}
              }
              return sorted;
            });
          }
        } catch (err) {
          console.warn('GlobalOfferOverlay fetch offers error:', err);
        }
      };

      fetchOffers();
      offerInterval = setInterval(fetchOffers, 4000);
    } else {
      setIncomingOffers([]);
      voiceService.stop();
    }

    return () => {
      if (offerInterval) clearInterval(offerInterval);
    };
  }, [isOnline, driver?.id]);

  const handleAcceptOffer = async (offer: OrderOfferData) => {
    setActionLoading(true);
    voiceService.stop();
    try {
      await OrderService.acceptOffer(offer.id);
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (e) {}
      setIncomingOffers((prev) => prev.filter((o) => o.id !== offer.id));

      DeviceEventEmitter.emit('ORDER_ACCEPTED', offer.order);

      // Navigate to Home screen to show active order map/details
      if (navigation && navigation.navigate) {
        navigation.navigate(ROUTES.HOME);
      }
    } catch (err: any) {
      Alert.alert('Accept Failed', err.toString() || 'Offer is no longer available.');
      setIncomingOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (offer: OrderOfferData) => {
    setActionLoading(true);
    voiceService.stop();
    try {
      await OrderService.rejectOffer(offer.id);
    } catch (err: any) {
      console.warn('Reject offer error:', err);
    } finally {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIncomingOffers((prev) => prev.filter((o) => o.id !== offer.id));
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {children}

      {isOnline && incomingOffers.length > 0 && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          hardwareAccelerated={true}
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              <ScrollView
                style={{ maxHeight: height * 0.55 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}
                showsVerticalScrollIndicator={true}
              >
                {incomingOffers.map((offer) => (
                  <OrderOfferCard
                    key={`global-offer-${offer.id}`}
                    offer={offer}
                    onAccept={handleAcceptOffer}
                    onReject={handleRejectOffer}
                    loading={actionLoading}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
