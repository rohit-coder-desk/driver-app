import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Platform,
  PermissionsAndroid,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Switch,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { OrderService, OrderData, OrderOfferData } from '../../services/OrderService';
import { OrderRequestModal } from '../../components/orders/OrderRequestModal';
import { PaymentConfirmationModal } from '../../components/orders/PaymentConfirmationModal';
import { ActiveOrderCard } from '../../components/orders/ActiveOrderCard';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';
import { API_BASE_URL } from '../../config/env';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export const HomeScreen = () => {
  const { driver, logout, refreshProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shouldRenderDrawer, setShouldRenderDrawer] = useState(false);
  const [onlineSeconds, setOnlineSeconds] = useState(0);

  // Order & Offer state
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<OrderOfferData | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState<boolean>(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Default map center: Sector 83, Mohali, Punjab, India (WorldTech Square)
  const MOHALI_COORDS = {
    latitude: 30.6726,
    longitude: 76.7410,
  };

  // Map Region and Marker Coordinates
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: MOHALI_COORDS.latitude,
    longitude: MOHALI_COORDS.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });

  const mapRef = useRef<MapView | null>(null);
  // Animated Value for custom Drawer
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setShouldRenderDrawer(true);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Toggle Side Drawer Animation
  useEffect(() => {
    if (drawerOpen) {
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (shouldRenderDrawer) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRenderDrawer(false);
        }
      });
    }
  }, [drawerOpen]);

  // Online ticking stopwatch logic
  useEffect(() => {
    let intervalId: any;
    if (isOnline) {
      setOnlineSeconds(0);
      intervalId = setInterval(() => {
        setOnlineSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setOnlineSeconds(0);
    }
    return () => clearInterval(intervalId);
  }, [isOnline]);

  const formatOnlineTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Request Location Permissions & Subscribe to GPS tracking
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message: 'CDX Last Mile Driver App needs your location to display on the map and receive delivery offers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions
  };

  // Hydrate initial location from driver profile if present in DB
  useEffect(() => {
    if (driver?.latitude && driver?.longitude) {
      let lat = Number(driver.latitude);
      let lng = Number(driver.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        // If DB has default Android emulator coordinates, map to Mohali
        if (Math.abs(lat - 37.42199) < 0.05 && Math.abs(lng - (-122.084)) < 0.05) {
          lat = MOHALI_COORDS.latitude;
          lng = MOHALI_COORDS.longitude;
          syncDriverLocation(lat, lng);
        }
        setLocation({ latitude: lat, longitude: lng });
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        });
        return;
      }
    }
    // Default to Mohali & sync to DB if driver has no location set yet
    syncDriverLocation(MOHALI_COORDS.latitude, MOHALI_COORDS.longitude);
  }, [driver]);

  const syncDriverLocation = async (lat: number, lng: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

    let finalLat = lat;
    let finalLng = lng;

    // Detect Android Emulator default Googleplex location (37.42199..., -122.084...)
    if (Math.abs(lat - 37.42199) < 0.05 && Math.abs(lng - (-122.084)) < 0.05) {
      finalLat = MOHALI_COORDS.latitude;
      finalLng = MOHALI_COORDS.longitude;
    }

    const nextLoc = { latitude: finalLat, longitude: finalLng };
    setLocation(nextLoc);
    setRegion({
      latitude: finalLat,
      longitude: finalLng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    });

    try {
      await DriverService.updateLocation(finalLat, finalLng);
    } catch (e) {
      console.warn('Failed to sync location to backend database:', e);
    }
  };

  const centerMapOnDriver = () => {
    let targetLat = location?.latitude || (driver?.latitude ? Number(driver.latitude) : MOHALI_COORDS.latitude);
    let targetLng = location?.longitude || (driver?.longitude ? Number(driver.longitude) : MOHALI_COORDS.longitude);

    if (Math.abs(targetLat - 37.42199) < 0.05 && Math.abs(targetLng - (-122.084)) < 0.05) {
      targetLat = MOHALI_COORDS.latitude;
      targetLng = MOHALI_COORDS.longitude;
    }

    setLocation({ latitude: targetLat, longitude: targetLng });
    setRegion({
      latitude: targetLat,
      longitude: targetLng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.009,
    });

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: targetLat,
        longitude: targetLng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.009,
      }, 1000);
    }
  };

  useEffect(() => {
    let watchId: number;
    let pollIntervalId: any;

    const startTracking = async () => {
      const hasPermission = await requestLocationPermission();
      const isLinked = !!Geolocation && typeof Geolocation.getCurrentPosition === 'function';

      if (hasPermission && isLinked) {
        // Immediate GPS acquisition
        Geolocation.getCurrentPosition(
          (position: any) => {
            if (position?.coords) {
              const { latitude, longitude } = position.coords;
              syncDriverLocation(latitude, longitude);
            }
          },
          (error: any) => {
            console.warn('Geolocation initial lock warning:', error);
            let dLat = driver?.latitude ? Number(driver.latitude) : MOHALI_COORDS.latitude;
            let dLng = driver?.longitude ? Number(driver.longitude) : MOHALI_COORDS.longitude;
            if (isNaN(dLat) || isNaN(dLng) || (Math.abs(dLat - 37.42199) < 0.05 && Math.abs(dLng - (-122.084)) < 0.05)) {
              dLat = MOHALI_COORDS.latitude;
              dLng = MOHALI_COORDS.longitude;
            }
            setLocation({ latitude: dLat, longitude: dLng });
            setRegion({ latitude: dLat, longitude: dLng, latitudeDelta: 0.015, longitudeDelta: 0.0121 });
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

        // Continuous high-accuracy GPS watch stream
        try {
          watchId = Geolocation.watchPosition(
            (position: any) => {
              if (position?.coords) {
                const { latitude, longitude } = position.coords;
                syncDriverLocation(latitude, longitude);
              }
            },
            (error: any) => console.log('Location watch error:', error),
            {
              enableHighAccuracy: true,
              distanceFilter: 5, // Update on 5 meters movement
              interval: 4000,
              fastestInterval: 2000
            }
          );
        } catch (err) {
          console.warn('watchPosition failed:', err);
        }

        // Active background sync while online (polls every 5s if stationary)
        if (isOnline) {
          pollIntervalId = setInterval(() => {
            Geolocation.getCurrentPosition(
              (pos: any) => {
                if (pos?.coords) {
                  syncDriverLocation(pos.coords.latitude, pos.coords.longitude);
                }
              },
              (err: any) => { },
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
          }, 5000);
        }
      }
    };

    startTracking();

    return () => {
      if (watchId !== undefined && Geolocation && Geolocation.clearWatch) {
        Geolocation.clearWatch(watchId);
      }
      if (pollIntervalId !== undefined) {
        clearInterval(pollIntervalId);
      }
    };
  }, [isOnline]);

  // Active order recovery on mount & driver change
  const checkActiveOrder = async () => {
    if (!driver) return;
    try {
      const active = await OrderService.getActiveOrderForDriver(driver.id);
      if (active) {
        setActiveOrder(active);
        const isPickedUp = active.status === 'picked_up' || active.status === 'near_destination';
        const targetLoc = isPickedUp ? active.dropoff : active.pickup;
        if (targetLoc?.lat && targetLoc?.lng && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: targetLoc.lat,
            longitude: targetLoc.lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.012,
          }, 1000);
        }
      }
    } catch (err) {
      console.warn('Check active order failed:', err);
    }
  };

  useEffect(() => {
    if (driver) {
      checkActiveOrder();
    }
  }, [driver]);

  // Offer polling when driver is online and has no active order
  useEffect(() => {
    let offerInterval: any;

    if (isOnline && !activeOrder && !incomingOffer) {
      const fetchOffers = async () => {
        try {
          const offers = await OrderService.getDriverOffers();
          if (offers && offers.length > 0) {
            const latestOffer = offers[0];
            setIncomingOffer(latestOffer);
            setOfferModalVisible(true);
          }
        } catch (err) {
          console.warn('Error fetching driver offers:', err);
        }
      };

      fetchOffers();
      offerInterval = setInterval(fetchOffers, 4000);
    }

    return () => {
      if (offerInterval) clearInterval(offerInterval);
    };
  }, [isOnline, activeOrder, incomingOffer]);

  const handleAcceptOffer = async (offer: OrderOfferData) => {
    setActionLoading(true);
    try {
      await OrderService.acceptOffer(offer.id);
      setOfferModalVisible(false);
      setIncomingOffer(null);

      const orderData = offer.order;
      setActiveOrder({ ...orderData, status: 'assigned' });

      if (orderData.pickup?.lat && orderData.pickup?.lng && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: orderData.pickup.lat,
          longitude: orderData.pickup.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.012,
        }, 1000);
      }
      Alert.alert('Order Accepted!', 'Proceeding to pickup location.');
    } catch (err: any) {
      Alert.alert('Accept Failed', err.toString() || 'Offer is no longer available.');
      setOfferModalVisible(false);
      setIncomingOffer(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (offer: OrderOfferData) => {
    setActionLoading(true);
    try {
      await OrderService.rejectOffer(offer.id);
    } catch (err: any) {
      console.warn('Reject offer error:', err);
    } finally {
      setOfferModalVisible(false);
      setIncomingOffer(null);
      setActionLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      await OrderService.updateOrderStatus(activeOrder.id, 'picked_up');
      const updated = { ...activeOrder, status: 'picked_up' };
      setActiveOrder(updated);

      if (updated.dropoff?.lat && updated.dropoff?.lng && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: updated.dropoff.lat,
          longitude: updated.dropoff.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.012,
        }, 1000);
      }
      Alert.alert('Pickup Confirmed!', 'Heading to delivery destination.');
    } catch (err: any) {
      Alert.alert('Status Update Failed', err.toString() || 'Could not update pickup status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPaymentModal = () => {
    setPaymentModalVisible(true);
  };

  const handleConfirmDeliveryWithPayment = async (paymentMethod: string) => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      await OrderService.updateOrderStatus(activeOrder.id, 'completed', paymentMethod);
      setPaymentModalVisible(false);
      setActiveOrder(null);
      Alert.alert('Delivery Completed! 🎉', 'You are back online and waiting for new offers.');
    } catch (err: any) {
      Alert.alert('Delivery Update Failed', err.toString() || 'Could not complete delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  // Sync profile details on mount
  useEffect(() => {
    const syncProfile = async () => {
      try {
        await refreshProfile();
      } catch (e) {
        console.warn('Sync profile failed:', e);
      }
    };
    syncProfile();
  }, []);

  // Update Online Status
  useEffect(() => {
    if (driver) {
      setIsOnline(driver.status === 'online');
    }
  }, [driver]);

  const handleToggleOnline = async (value: boolean) => {
    if (!driver) return;

    setLoading(true);
    try {
      if (value) {
        // Refresh profile state from backend directly to ensure we have the absolute latest approval status
        const updatedProfile = await refreshProfile();
        const currentAuthStatus = updatedProfile?.authorizationStatus || driver.authorizationStatus;

        if (currentAuthStatus !== 'approved') {
          Alert.alert('Verification Required', 'Your documents must be approved by our team before you can go online.');
          setIsOnline(false);
          return;
        }
      }

      const nextStatus = value ? 'online' : 'offline';
      await DriverService.updateStatus(nextStatus);
      const updatedProfile = await refreshProfile();
      setIsOnline(value);

      // Auto-center map on driver's real coordinates when going online
      if (value) {
        let lat = location?.latitude || (updatedProfile?.latitude ? Number(updatedProfile.latitude) : MOHALI_COORDS.latitude);
        let lng = location?.longitude || (updatedProfile?.longitude ? Number(updatedProfile.longitude) : MOHALI_COORDS.longitude);

        if (Math.abs(lat - 37.42199) < 0.05 && Math.abs(lng - (-122.084)) < 0.05) {
          lat = MOHALI_COORDS.latitude;
          lng = MOHALI_COORDS.longitude;
        }

        setLocation({ latitude: lat, longitude: lng });
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.009,
        });

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.012,
            longitudeDelta: 0.009,
          }, 500);
        }
      }
    } catch (err: any) {
      Alert.alert('Status Change Failed', err.toString() || 'Something went wrong.');
      setIsOnline(!value);
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const navigationRef = useRef<any>(null);
  const navigation = require('@react-navigation/native').useNavigation();
  navigationRef.current = navigation;

  // Render document upload missing notice if authorizationStatus is not approved
  const isProfileIncomplete =
    driver?.authorizationStatus !== 'approved' &&
    (!driver?.drivingLicencePhoto || !driver?.rcPhoto || !driver?.insurancePhoto || !driver?.avatarPhoto);

  return (
    <View style={styles.container}>
      <Loader visible={loading} message="Processing..." />

      {isOnline ? (
        /* Online State: Full Screen Map */
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {(location || MOHALI_COORDS) && (
            <Marker
              coordinate={location || MOHALI_COORDS}
              title={driver?.name || 'Driver'}
              description="Online - Ready for tasks"
              zIndex={99}
            >
              <View style={styles.driverMarkerContainer}>
                <View style={styles.driverMarkerPulse} />
                <View style={styles.driverMarkerBadge}>
                  <Text style={styles.driverMarkerEmoji}>🚘</Text>
                </View>
              </View>
            </Marker>
          )}

          {/* Active Order Pickup & Delivery Markers + Route Polyline */}
          {activeOrder && (
            <>
              {/* Pickup Marker */}
              {activeOrder.pickup?.lat && activeOrder.pickup?.lng ? (
                <Marker
                  coordinate={{ latitude: activeOrder.pickup.lat, longitude: activeOrder.pickup.lng }}
                  title="Pickup Location"
                  description={activeOrder.pickup.address}
                >
                  <View style={styles.pickupMarkerBadge}>
                    <Text style={styles.markerBadgeEmoji}>🏪</Text>
                  </View>
                </Marker>
              ) : null}

              {/* Delivery Marker */}
              {activeOrder.dropoff?.lat && activeOrder.dropoff?.lng ? (
                <Marker
                  coordinate={{ latitude: activeOrder.dropoff.lat, longitude: activeOrder.dropoff.lng }}
                  title="Delivery Location"
                  description={activeOrder.dropoff.address}
                >
                  <View style={styles.deliveryMarkerBadge}>
                    <Text style={styles.markerBadgeEmoji}>🏁</Text>
                  </View>
                </Marker>
              ) : null}

              {/* Route Polyline connecting Driver to active target */}
              {location && (
                <Polyline
                  coordinates={[
                    { latitude: location.latitude, longitude: location.longitude },
                    activeOrder.status === 'picked_up' || activeOrder.status === 'near_destination'
                      ? { latitude: activeOrder.dropoff.lat, longitude: activeOrder.dropoff.lng }
                      : { latitude: activeOrder.pickup.lat, longitude: activeOrder.pickup.lng },
                  ]}
                  strokeColor={activeOrder.status === 'picked_up' ? '#22c55e' : '#2563eb'}
                  strokeWidth={4}
                />
              )}
            </>
          )}
        </MapView>
      ) : (
        /* Offline State: Styled Clean Dashboard Card */
        <View style={styles.offlineContainer}>
          <View style={styles.offlineCenterBox}>
            <View style={styles.carCircle}>
              <Text style={styles.carEmoji}>🚘</Text>
            </View>
            <Text style={styles.youreOfflineText}>YOU'RE OFFLINE</Text>
            <Text style={styles.offlineDesc}>
              Connect to start receiving ride requests and tracking your earnings in real-time.
            </Text>
          </View>
        </View>
      )}

      {/* Floating Header Panel directly positioned absolutely for touch reliability */}
      <View style={styles.floatingHeader}>
        {/* Hamburger Circular Button */}
        <TouchableOpacity
          style={styles.hamburgerCircle}
          onPress={openDrawer}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.hamburgerIconText}>☰</Text>
        </TouchableOpacity>

        {/* Center Status Display */}
        <View style={styles.statusDisplay}>
          {isOnline ? (
            <View style={styles.onlineStatusRow}>
              <View style={styles.greenDot} />
              <View style={styles.statusTextCol}>
                <Text style={styles.statusTitle}>You're Online</Text>
                {/* <Text style={styles.statusTimer}>{formatOnlineTime(onlineSeconds)}</Text> */}
              </View>
            </View>
          ) : (
            <View style={styles.offlineTextCol}>
              <Text style={styles.helloText}>Hello {driver?.name?.split(' ')[0] || 'driver'}</Text>
              <View style={styles.offlineStatusRow}>
                <View style={styles.redDot} />
                <Text style={styles.offlineStatusTitle}>offline</Text>
              </View>
            </View>
          )}
        </View>

        {/* Toggle Switch */}
        <Switch
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={isOnline ? '#22c55e' : '#64748b'}
          ios_backgroundColor="#cbd5e1"
          onValueChange={handleToggleOnline}
          value={isOnline}
        />
      </View>

      {/* Floating GPS Recenter Button - Only visible when Online */}
      {isOnline && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={centerMapOnDriver}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.gpsTargetIcon}>🎯</Text>
        </TouchableOpacity>
      )}

      {/* Floating Bottom Overlay Card */}
      {activeOrder ? (
        <ActiveOrderCard
          order={activeOrder}
          onConfirmPickup={handleConfirmPickup}
          onCompleteDelivery={handleOpenPaymentModal}
          loading={actionLoading}
        />
      ) : isProfileIncomplete ? (
        <TouchableOpacity
          style={styles.completeProfileCard}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
          activeOpacity={0.9}
        >
          <Text style={styles.completeProfileTitle}>⚠️ Complete Your Profile</Text>
          <Text style={styles.completeProfileSubtitle}>
            Please tap here to upload required vehicle documents (License, RC, Insurance, Photo) for admin review.
          </Text>
        </TouchableOpacity>
      ) : driver?.authorizationStatus === 'pending' ? (
        <View style={styles.submittedCard}>
          <Text style={styles.submittedTitle}>Documents Submitted</Text>
          <Text style={styles.submittedSubtitle}>Waiting for Admin Approval</Text>
        </View>
      ) : driver?.authorizationStatus === 'rejected' ? (
        <TouchableOpacity
          style={styles.rejectedCard}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
          activeOpacity={0.9}
        >
          <Text style={styles.rejectedTitle}>❌ Documents Rejected</Text>
          <Text style={styles.rejectedSubtitle}>Admin rejected your submission. Tap to review and re-upload.</Text>
        </TouchableOpacity>
      ) : isOnline ? (
        /* When approved and active online, show the status pill */
        <View style={styles.searchPill}>
          <Text style={styles.searchPillIcon}>🔍</Text>
          <Text style={styles.searchPillText}>Waiting for offers...</Text>
        </View>
      ) : (
        /* When approved and active offline, show the big "Go Online" button at the bottom */
        <TouchableOpacity
          style={styles.bigGoOnlineBtn}
          onPress={() => handleToggleOnline(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.bigGoOnlineText}>Go Online</Text>
        </TouchableOpacity>
      )}

      {/* Incoming Offer Request Modal */}
      <OrderRequestModal
        visible={offerModalVisible}
        offer={incomingOffer}
        onAccept={handleAcceptOffer}
        onReject={handleRejectOffer}
        loading={actionLoading}
      />

      {/* Payment Confirmation Modal for Order Completion */}
      <PaymentConfirmationModal
        visible={paymentModalVisible}
        onConfirm={handleConfirmDeliveryWithPayment}
        onCancel={() => setPaymentModalVisible(false)}
        loading={actionLoading}
      />

      {/* Backdrop for Custom Side Drawer */}
      {shouldRenderDrawer && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeDrawer}
          />

          {/* Custom Side Drawer Sidebar */}
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.avatarBorder}>
                {driver?.avatarPhoto ? (
                  <Image source={{ uri: getFullUrl(driver.avatarPhoto) }} style={styles.drawerAvatar} />
                ) : (
                  <View style={styles.avatarPlaceholder} />
                )}
              </View>
              <Text style={styles.drawerNameText}>{driver?.name || 'parveen driver'}</Text>
            </View>

            {/* Drawer Links */}
            <ScrollView style={styles.drawerMenu} contentContainerStyle={styles.drawerMenuContent}>
              <TouchableOpacity style={styles.drawerItem} onPress={() => setDrawerOpen(false)}>
                <Text style={styles.drawerItemText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setDrawerOpen(false);
                  Alert.alert(
                    'My Profile',
                    `Name: ${driver?.name || 'N/A'}\nUsername: ${driver?.username || 'N/A'}\nPhone: ${driver?.phone || 'N/A'}\nEmail: ${driver?.email || 'N/A'}\n\nStatus: ${driver?.status?.toUpperCase() || 'OFFLINE'}\nVerification: ${driver?.authorizationStatus?.toUpperCase() || 'PENDING'}\n\nVehicle: ${driver?.vehicleColor || ''} ${driver?.vehicleBrand || ''} ${driver?.vehicleModel || ''}\nPlate: ${driver?.vehiclePlate || 'N/A'}`
                  );
                }}
              >
                <Text style={styles.drawerItemText}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); navigation.navigate(ROUTES.PROFILE); }}>
                <Text style={styles.drawerItemText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('Earnings', `Total Earnings Balance: ₹${driver?.balance?.toFixed(2) || '0.00'}`); }}>
                <Text style={styles.drawerItemText}>Earnings</Text>
              </TouchableOpacity>

              {/* Drawer Bottom Logout Button */}
              <View style={styles.drawerFooter}>
                <TouchableOpacity style={styles.logoutBtn} onPress={() => { setDrawerOpen(false); logout(); }}>
                  <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  offlineContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineCenterBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  carCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  carEmoji: {
    fontSize: 64,
  },
  youreOfflineText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  offlineDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  bigGoOnlineBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#5F093D',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5F093D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 10,
  },
  bigGoOnlineText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : Math.max(StatusBar.currentHeight || 0, 24) + 12,
    left: 16,
    right: 16,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingRight: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hamburgerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  hamburgerIconText: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusTextCol: {
    alignItems: 'center',
  },
  onlineStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusTimer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 1,
  },
  offlineTextCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  offlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  offlineStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 100 : 84,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 10,
  },
  gpsTargetIcon: {
    fontSize: 20,
  },
  searchPill: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchPillIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  completeProfileCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  completeProfileTitle: {
    color: '#d97706',
    fontSize: 14,
    fontWeight: '700',
  },
  completeProfileSubtitle: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  submittedCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
    alignItems: 'center',
  },
  submittedTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  submittedSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  rejectedCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  rejectedTitle: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
  rejectedSubtitle: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    left: -DRAWER_WIDTH,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#5F093D',
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : Math.max(StatusBar.currentHeight || 0, 24) + 12,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-start',
  },
  avatarBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  drawerAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#cbd5e1',
  },
  drawerNameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  drawerMenu: {
    flex: 1,
  },
  drawerMenuContent: {
    paddingVertical: 12,
  },
  drawerItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  drawerItemText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  drawerFooter: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  logoutBtn: {
    paddingVertical: 10,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  driverMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  driverMarkerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  driverMarkerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  driverMarkerEmoji: {
    fontSize: 16,
  },
  pickupMarkerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  deliveryMarkerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerBadgeEmoji: {
    fontSize: 18,
  },
});
export default HomeScreen;
