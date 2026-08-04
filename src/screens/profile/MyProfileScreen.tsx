import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { API_BASE_URL } from '../../config/env';

export const MyProfileScreen = () => {
  const { driver } = useAuth();
  const navigation = useNavigation<any>();

  const getFullUrl = (filePath?: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2246" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(ROUTES.HOME);
            }
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
          activeOpacity={0.7}
        >
          <Text style={styles.editHeaderBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Driver Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {driver?.avatarPhoto ? (
              <Image source={{ uri: getFullUrl(driver.avatarPhoto) }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {driver?.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
          <Text style={styles.driverPhone}>{driver?.phone || 'No Phone Number'}</Text>
          <Text style={styles.driverEmail}>{driver?.email || 'No Email Provided'}</Text>

          <View style={styles.statusBadgesRow}>
            <View style={[styles.badge, styles.statusBadge]}>
              <View style={styles.activeDot} />
              <Text style={styles.statusBadgeText}>
                {driver?.status?.toUpperCase() || 'OFFLINE'}
              </Text>
            </View>
            <View style={[styles.badge, styles.verifyBadge]}>
              <Text style={styles.verifyBadgeText}>
                {driver?.authorizationStatus?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Personal Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{driver?.username || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{driver?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{driver?.email || 'N/A'}</Text>
          </View>
        </View>

        {/* Section: Vehicle Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>
              {`${driver?.vehicleColor || ''} ${driver?.vehicleBrand || ''} ${driver?.vehicleModel || ''}`.trim() || 'Not Configured'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plate Number</Text>
            <Text style={styles.infoValueHighlight}>{driver?.vehiclePlate || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Licence Number</Text>
            <Text style={styles.infoValue}>{driver?.drivingLicenceNumber || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Licence Expiry</Text>
            <Text style={styles.infoValue}>{driver?.drivingLicenceExpiry || 'N/A'}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileBtnText}>Edit Profile & Upload Documents</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3A',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : Math.max(StatusBar.currentHeight || 0, 24) + 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0B2246',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#0D2A54',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  editHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066FF',
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  profileCard: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#0066FF',
    marginBottom: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  driverName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 2,
  },
  driverEmail: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 14,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#15803D',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22C55E',
  },
  verifyBadge: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  verifyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
  },
  sectionCard: {
    backgroundColor: '#0B2246',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E3A8A',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0066FF',
  },
  editProfileBtn: {
    backgroundColor: '#0066FF',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default MyProfileScreen;
