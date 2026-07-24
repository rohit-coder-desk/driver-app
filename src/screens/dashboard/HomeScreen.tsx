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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
let Geolocation: any = null;
try {
  Geolocation = require('@react-native-community/geolocation');
  if (Geolocation && Geolocation.default) {
    Geolocation = Geolocation.default;
  }
} catch (e) {
  console.log('Geolocation package not loaded natively yet:', e);
}
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
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

  // Map Region and Marker Coordinates
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 12.9716, // Default to Bangalore center
    longitude: 77.5946,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });

  // Animated Value for custom Drawer
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Toggle Side Drawer Animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen]);

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

  useEffect(() => {
    let watchId: number;
    let mockIntervalId: any;

    const initLocation = async () => {
      const hasPermission = await requestLocationPermission();
      const isLinked = !!Geolocation && Geolocation.getCurrentPosition;

      if (hasPermission && isLinked) {
        try {
          Geolocation.getCurrentPosition(
            (position: any) => {
              const { latitude, longitude } = position.coords;
              setLocation({ latitude, longitude });
              setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
              });
              // Update location in backend
              DriverService.updateLocation(latitude, longitude);
            },
            (error: any) => {
              console.warn('Geolocation Error:', error);
              // Default fallback coordinates if GPS is disabled but permission is granted
              setLocation({ latitude: 12.9716, longitude: 77.5946 });
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          );

          // Keep watching driver's live coordinates
          watchId = Geolocation.watchPosition(
            (position: any) => {
              const { latitude, longitude } = position.coords;
              setLocation({ latitude, longitude });
              // Sync with backend if online
              if (isOnline) {
                DriverService.updateLocation(latitude, longitude);
              }
            },
            (error: any) => console.log('Location watch error:', error),
            { enableHighAccuracy: true, distanceFilter: 10, interval: 10000 }
          );
          return;
        } catch (e) {
          console.warn('Native geolocation call failed:', e);
        }
      }

      // Fallback: Use standard location and simulate live location updates in dev mode
      const fallbackLat = 12.9716;
      const fallbackLng = 77.5946;
      setLocation({ latitude: fallbackLat, longitude: fallbackLng });
      setRegion({
        latitude: fallbackLat,
        longitude: fallbackLng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      });

      if (isOnline) {
        DriverService.updateLocation(fallbackLat, fallbackLng);
      }

      // Simulate movement if online
      if (isOnline) {
        let step = 0;
        mockIntervalId = setInterval(() => {
          step += 1;
          const latOffset = Math.sin(step / 5) * 0.002;
          const lngOffset = Math.cos(step / 5) * 0.002;
          const newLat = fallbackLat + latOffset;
          const newLng = fallbackLng + lngOffset;
          setLocation({ latitude: newLat, longitude: newLng });
          DriverService.updateLocation(newLat, newLng);
        }, 10000);
      }
    };

    initLocation();
    return () => {
      if (watchId !== undefined && Geolocation && Geolocation.clearWatch) {
        Geolocation.clearWatch(watchId);
      }
      if (mockIntervalId !== undefined) {
        clearInterval(mockIntervalId);
      }
    };
  }, [isOnline]);

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

  const handleToggleOnline = async () => {
    if (!driver) return;

    // Check if documents are approved by admin
    if (driver.authorizationStatus !== 'approved') {
      Alert.alert('Verification Required', 'Your documents must be approved by our team before you can go online.');
      return;
    }

    const nextStatus = isOnline ? 'offline' : 'online';
    setLoading(true);
    try {
      await DriverService.updateStatus(nextStatus);
      setIsOnline(nextStatus === 'online');
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Status Change Failed', err.toString() || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  // Navigates and closes the sidebar drawer
  const navigateTo = (route: string) => {
    setDrawerOpen(false);
    // Use setTimeout to allow the drawer to slide out before navigating
    setTimeout(() => {
      // Navigate to the target route using navigation prop or hook
      navigationRef.current?.navigate(route);
    }, 200);
  };

  const navigationRef = useRef<any>(null);
  const navigation = require('@react-navigation/native').useNavigation();
  navigationRef.current = navigation;

  // Render document upload missing notice
  const isProfileIncomplete = !driver?.drivingLicencePhoto || !driver?.rcPhoto || !driver?.insurancePhoto || !driver?.avatarPhoto;

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} message="Processing..." />

      {/* Header bar with Hamburger */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerButton} onPress={() => setDrawerOpen(true)}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CDX <Text style={styles.blueText}>LAST</Text></Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Home Screen Layout */}
      <View style={styles.content}>
        {/* Welcome Messages */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeLabel}>Welcome Driver,</Text>
          <Text style={styles.driverName}>{driver?.name || 'Loading Driver Info...'}</Text>
        </View>

        {/* Google Maps Container */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {location && (
              <Marker
                coordinate={location}
                title={driver?.name || 'Driver'}
                description={isOnline ? 'Online - Ready for tasks' : 'Offline'}
              />
            )}
          </MapView>
        </View>

        {/* Dynamic Status Banner */}
        <View style={styles.bottomCard}>
          {isOnline ? (
            <View style={styles.statusRow}>
              <Text style={styles.waitingText}>Waiting for Orders...</Text>
              <ActivityIndicator size="small" color={COLORS.success} />
            </View>
          ) : (
            <View style={styles.statusRow}>
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}

          {/* Profile incomplete warning */}
          {isProfileIncomplete ? (
            <TouchableOpacity
              style={styles.completeProfileCard}
              onPress={() => navigation.navigate(ROUTES.PROFILE)}
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
            >
              <Text style={styles.rejectedTitle}>❌ Documents Rejected</Text>
              <Text style={styles.rejectedSubtitle}>Admin rejected your submission. Tap to review and re-upload.</Text>
            </TouchableOpacity>
          ) : null}

          {/* Go Online / Go Offline Button */}
          <TouchableOpacity
            style={[
              styles.onlineButton,
              isOnline ? styles.offlineButtonBg : styles.onlineButtonBg,
              driver?.authorizationStatus !== 'approved' && styles.disabledButton,
            ]}
            onPress={handleToggleOnline}
            disabled={driver?.authorizationStatus !== 'approved'}
            activeOpacity={0.8}
          >
            <Text style={styles.onlineButtonText}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backdrop for Custom Side Drawer */}
      {drawerOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setDrawerOpen(false)}
        />
      )}

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
          <Text style={styles.drawerNameText}>{driver?.name || 'Test Driver'}</Text>
        </View>

        {/* Drawer Links */}
        <ScrollView style={styles.drawerMenu} contentContainerStyle={styles.drawerMenuContent}>
          <TouchableOpacity style={styles.drawerItem} onPress={() => setDrawerOpen(false)}>
            <Text style={styles.drawerItemText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('My Account', 'Driver Account Details (Dummy Feature)'); }}>
            <Text style={styles.drawerItemText}>My Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('Update Vehicle Info', 'Vehicle details registration interface (Dummy Feature)'); }}>
            <Text style={styles.drawerItemText}>Update Vehicle Info</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('Earnings', `Current Account Balance: ₹${driver?.balance?.toFixed(2) || '0.00'}`); }}>
            <Text style={styles.drawerItemText}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); navigation.navigate(ROUTES.PROFILE); }}>
            <Text style={styles.drawerItemText}>Manage Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('FAQ', 'CDX Fleets Support FAQ Guidelines (Dummy Feature)'); }}>
            <Text style={styles.drawerItemText}>FAQ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('Notifications', 'Task updates and admin notices list (Dummy Feature)'); }}>
            <Text style={styles.drawerItemText}>Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('Make Complaints', 'Submit support requests or driver help disputes (Dummy Feature)'); }}>
            <Text style={styles.drawerItemText}>Make Complaints</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('About', 'CDX Fleet Driver Portal v1.0.0 (Expo Free)'); }}>
            <Text style={styles.drawerItemText}>About</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('Privacy Policy', 'Review details regarding user location and telemetry data handling (Dummy Feature)'); }}>
            <Text style={styles.drawerItemText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); Alert.alert('Terms & Conditions', 'Driver agreement contracts and service guidelines (Dummy Feature)'); }}>
            <Text style={styles.drawerItemText}>Terms & Condition</Text>
          </TouchableOpacity>

          {/* Drawer Bottom Logout Button */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => { setDrawerOpen(false); logout(); }}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  hamburgerButton: {
    padding: 8,
  },
  hamburgerIcon: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  blueText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeBox: {
    marginBottom: 16,
  },
  welcomeLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    minHeight: 250,
  },
  map: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  bottomCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
    marginRight: 8,
  },
  offlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
  completeProfileCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  completeProfileTitle: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  completeProfileSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  submittedCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  submittedTitle: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
  submittedSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  rejectedCard: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  rejectedTitle: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
  rejectedSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 4,
  },
  onlineButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineButtonBg: {
    backgroundColor: COLORS.primary,
  },
  offlineButtonBg: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  onlineButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#5F093D',
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
});
export default HomeScreen;
