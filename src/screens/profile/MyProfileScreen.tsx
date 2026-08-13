import React, { useState, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import {
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { API_BASE_URL } from '../../config/env';
import { ZoomableImageViewer } from '../../components/common/ZoomableImageViewer';
import { ImagePreviewModal } from '../../components/common/ImagePreviewModal';
import { DriverService } from '../../services/DriverService';
import { Loader } from '../../components/common/Loader';

export const MyProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();
  const [uploading, setUploading] = useState(false);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App requires camera access to take your profile photo.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const uploadNewAvatarPhoto = async (file: { uri: string; type: string; name: string }) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatarPhoto', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'profile_photo.jpg',
      } as any);

      await DriverService.uploadDocuments(formData);
      const updated = await refreshProfile();
      const newPath = updated?.avatarPhoto || driver?.avatarPhoto;
      if (newPath) {
        setFullImageModal((prev) => ({
          ...prev,
          uri: getFullUrl(newPath),
        }));
      }
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to update profile photo.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectProfilePhoto = async (useCamera: boolean) => {
    if (useCamera) {
      const hasCamPerm = await requestCameraPermission();
      if (!hasCamPerm) {
        Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
        return;
      }
    }

    const options: any = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      saveToPhotos: false,
    };

    const callback = (response: any) => {
      if (response.didCancel) return;
      if (response.errorCode || response.errorMessage) {
        Alert.alert('Error', response.errorMessage || 'Image selection failed.');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          uploadNewAvatarPhoto({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'profile_photo.jpg',
          });
        }
      }
    };

    if (useCamera) {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const promptChangeProfilePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose how you would like to upload your profile photo:',
      [
        {
          text: '📷 Take Photo with Camera',
          onPress: () => handleSelectProfilePhoto(true),
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => handleSelectProfilePhoto(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Modal for viewing profile photo in full-screen
  const [fullImageModal, setFullImageModal] = useState<{
    visible: boolean;
    uri: string;
    title: string;
  }>({
    visible: false,
    uri: '',
    title: '',
  });

  const getFullUrl = (filePath?: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  const docStatuses = useMemo(() => {
    const raw = driver?.documentStatuses;
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return {};
      }
    }
    return (raw as Record<string, any>) || {};
  }, [driver]);

  const rcExpiry = driver?.rcExpiry || docStatuses.rcExpiry || docStatuses.rcPhoto?.expiry;
  const insuranceExpiry = driver?.insuranceExpiry || docStatuses.insuranceExpiry || docStatuses.insurancePhoto?.expiry;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2246" />
      <Loader visible={uploading} message="Uploading Profile Photo..." />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 44 : 16) }]}>
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => {
                if (driver?.avatarPhoto) {
                  setFullImageModal({
                    visible: true,
                    uri: getFullUrl(driver.avatarPhoto),
                    title: `${driver?.name || 'Driver'}'s Profile Photo`,
                  });
                } else {
                  promptChangeProfilePhoto();
                }
              }}
              activeOpacity={0.8}
            >
              {driver?.avatarPhoto ? (
                <Image source={{ uri: getFullUrl(driver.avatarPhoto) }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {driver?.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraIconBadge}
              onPress={promptChangeProfilePhoto}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cameraIconText}>📷</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileHeaderInfo}>
            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
            {driver?.phone ? <Text style={styles.driverPhone}>{driver.phone}</Text> : null}
            {driver?.email ? <Text style={styles.driverEmail}>{driver.email}</Text> : null}

            <View style={styles.statusBadgesRow}>
              <View style={[styles.badge, styles.statusBadge]}>
                <View style={styles.activeDot} />
                <Text style={styles.statusBadgeText}>
                  {driver?.status?.toUpperCase() || 'OFFLINE'}
                </Text>
              </View>
              <View style={[styles.badge, styles.verifyBadge]}>
                <Text style={styles.verifyBadgeText}>
                  {driver?.authorizationStatus?.toUpperCase() || 'APPROVED'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section: Personal Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{driver?.name || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
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

        {/* Section: Address Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ADDRESS DETAILS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoValue}>{driver?.city || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', marginLeft: 16 }]} numberOfLines={2}>
              {driver?.address || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Section: Driver & Licence Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DRIVER & LICENCE DETAILS</Text>
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
            <Text style={styles.infoLabel}>RC Expiry</Text>
            <Text style={styles.infoValue}>{rcExpiry || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Insurance Expiry</Text>
            <Text style={styles.infoValue}>{insuranceExpiry || 'N/A'}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
        </TouchableOpacity>
      </ScrollView>

      <ImagePreviewModal
        visible={fullImageModal.visible}
        imageUri={fullImageModal.uri}
        title={fullImageModal.title}
        onClose={() => setFullImageModal({ visible: false, uri: '', title: '' })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3A',
  },
  header: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  editHeaderBtn: {
    paddingHorizontal: 16,
    height: 40,
    backgroundColor: '#0D2A54',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0066FF',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  profileCard: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#0066FF',
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
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0066FF',
  },
  profileHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginBottom: 2,
  },
  driverEmail: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginBottom: 8,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#15803D',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#22C55E',
  },
  verifyBadge: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  verifyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0066FF',
  },
  sectionCard: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E3A8A',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#0066FF',
  },
  editProfileBtn: {
    backgroundColor: '#0066FF',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },

  // Full-Screen Image Modal Styles
  fullScreenModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    justifyContent: 'space-between',
  },
  fullScreenHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(10, 18, 32, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
    zIndex: 10,
  },
  fullScreenBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  fullScreenBackBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
  fullScreenTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  fullScreenTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  fullScreenHeaderSpacer: {
    width: 40,
  },
  fullScreenChangePhotoBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  fullScreenChangePhotoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  avatarWrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 8,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#0066FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B2246',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraIconText: {
    fontSize: 14,
  },
  changePhotoBtn: {
    backgroundColor: 'rgba(0, 102, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  changePhotoBtnText: {
    color: '#0066FF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  fullScreenImageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

export default MyProfileScreen;
