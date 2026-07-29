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
import { COLORS } from '../../constants/colors';
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

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
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : Math.max(StatusBar.currentHeight || 0, 24) + 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
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
    zIndex: 10,
  },
  backBtnText: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  editHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
  },
  editHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: COLORS.primary,
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
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  driverName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  driverEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
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
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  verifyBadge: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  verifyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
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
    backgroundColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  editProfileBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  editProfileBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MyProfileScreen;
