import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { COLORS } from '../../constants/colors';
import { Loader } from '../../components/common/Loader';
import { API_BASE_URL } from '../../config/env';

interface SelectedFile {
  uri: string;
  type: string;
  fileName: string;
}

export const ProfileScreen = () => {
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  const [avatar, setAvatar] = useState<SelectedFile | null>(null);
  const [licence, setLicence] = useState<SelectedFile | null>(null);
  const [rc, setRc] = useState<SelectedFile | null>(null);
  const [insurance, setInsurance] = useState<SelectedFile | null>(null);

  const [loading, setLoading] = useState(false);

  const selectImage = (field: string) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const selected = {
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `${field}.jpg`,
          };

          if (field === 'avatarPhoto') setAvatar(selected);
          else if (field === 'drivingLicencePhoto') setLicence(selected);
          else if (field === 'rcPhoto') setRc(selected);
          else if (field === 'insurancePhoto') setInsurance(selected);
        }
      }
    );
  };

  const handleUpload = async () => {
    const hasNewUploads = avatar || licence || rc || insurance;
    if (!hasNewUploads) {
      Alert.alert('No Changes', 'Please select at least one document to upload.');
      return;
    }

    const formData = new FormData();

    if (avatar) {
      formData.append('avatarPhoto', {
        uri: avatar.uri,
        type: avatar.type,
        name: avatar.fileName,
      } as any);
    }
    if (licence) {
      formData.append('drivingLicencePhoto', {
        uri: licence.uri,
        type: licence.type,
        name: licence.fileName,
      } as any);
    }
    if (rc) {
      formData.append('rcPhoto', {
        uri: rc.uri,
        type: rc.type,
        name: rc.fileName,
      } as any);
    }
    if (insurance) {
      formData.append('insurancePhoto', {
        uri: insurance.uri,
        type: insurance.type,
        name: insurance.fileName,
      } as any);
    }

    setLoading(true);
    try {
      await DriverService.uploadDocuments(formData);
      await refreshProfile();
      Alert.alert('Success', 'Documents submitted successfully. Waiting for Admin approval.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.toString() || 'Could not upload files.');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (docPath: string | undefined | null) => {
    if (!docPath) {
      return {
        text: 'Not Uploaded',
        color: COLORS.error,
        borderColor: COLORS.error,
        bgColor: 'rgba(244, 63, 94, 0.05)',
      };
    }

    const authStatus = driver?.authorizationStatus || 'pending';
    if (authStatus === 'approved') {
      return {
        text: 'Your document has been approved',
        color: COLORS.success,
        borderColor: COLORS.success,
        bgColor: 'rgba(16, 185, 129, 0.05)',
      };
    } else if (authStatus === 'rejected') {
      return {
        text: 'Document rejected. Please re-upload.',
        color: COLORS.error,
        borderColor: COLORS.error,
        bgColor: 'rgba(244, 63, 94, 0.05)',
      };
    } else {
      return {
        text: 'Submitted - Waiting for Admin Approval',
        color: COLORS.warning,
        borderColor: COLORS.warning,
        bgColor: 'rgba(245, 158, 11, 0.05)',
      };
    }
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} message="Uploading documents..." />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>ℹ️</Text>
          <Text style={styles.warningText}>
            Updating a document will reset verification, and you cannot accept orders until we review.
          </Text>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => selectImage('avatarPhoto')}
          >
            {avatar ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
            ) : driver?.avatarPhoto ? (
              <Image source={{ uri: getFullUrl(driver.avatarPhoto) }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Driver Profile Photo</Text>
        </View>

        {/* 1. Driving Licence Card */}
        {(() => {
          const status = getDocumentStatus(licence?.uri || driver?.drivingLicencePhoto);
          return (
            <View style={[styles.docCard, { borderColor: status.borderColor, backgroundColor: status.bgColor }]}>
              <View style={styles.docHeader}>
                <Text style={[styles.docTitle, { color: status.color }]}>Driving Licence</Text>
                <TouchableOpacity onPress={() => selectImage('drivingLicencePhoto')}>
                  <Text style={styles.uploadLink}>[ Choose File ]</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.docStatus, { color: status.color }]}>{status.text}</Text>
              {(licence || driver?.drivingLicencePhoto) && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewText}>👁️ View Current Document</Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* 2. Registration Certificate Card */}
        {(() => {
          const status = getDocumentStatus(rc?.uri || driver?.rcPhoto);
          return (
            <View style={[styles.docCard, { borderColor: status.borderColor, backgroundColor: status.bgColor }]}>
              <View style={styles.docHeader}>
                <Text style={[styles.docTitle, { color: status.color }]}>Registration Certificate (RC)</Text>
                <TouchableOpacity onPress={() => selectImage('rcPhoto')}>
                  <Text style={styles.uploadLink}>[ Choose File ]</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.docStatus, { color: status.color }]}>{status.text}</Text>
              {(rc || driver?.rcPhoto) && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewText}>👁️ View Current Document</Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* 3. Insurance Card */}
        {(() => {
          const status = getDocumentStatus(insurance?.uri || driver?.insurancePhoto);
          return (
            <View style={[styles.docCard, { borderColor: status.borderColor, backgroundColor: status.bgColor }]}>
              <View style={styles.docHeader}>
                <Text style={[styles.docTitle, { color: status.color }]}>Insurance</Text>
                <TouchableOpacity onPress={() => selectImage('insurancePhoto')}>
                  <Text style={styles.uploadLink}>[ Choose File ]</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.docStatus, { color: status.color }]}>{status.text}</Text>
              {(insurance || driver?.insurancePhoto) && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewText}>👁️ View Current Document</Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleUpload}>
          <Text style={styles.submitButtonText}>Finish Registration</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  avatarLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  docCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  uploadLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  docStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  submitButton: {
    backgroundColor: '#5F093D',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
export default ProfileScreen;
