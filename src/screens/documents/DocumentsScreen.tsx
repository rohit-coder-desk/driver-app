import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { COLORS } from '../../constants/colors';
import { API_BASE_URL } from '../../config/env';
import { Loader } from '../../components/common/Loader';
import { CustomDriverModal } from '../../components/common/CustomDriverModal';

interface SelectedFile {
  uri: string;
  type: string;
  name: string;
}

const documentKeys = [
  { key: 'avatarPhoto', label: 'Profile Photo' },
  { key: 'identityCardPhoto', label: 'Aadhaar Front' },
  { key: 'identityCardBackPhoto', label: 'Aadhaar Back' },
  { key: 'drivingLicencePhoto', label: 'License Front' },
  { key: 'drivingLicenceBackPhoto', label: 'License Back' },
  { key: 'rcPhoto', label: 'RC Document' },
  { key: 'insurancePhoto', label: 'Vehicle Insurance' },
  { key: 'vehiclePhoto', label: 'Vehicle Photo' },
];

export const DocumentsScreen = () => {
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  const [selectedFiles, setSelectedFiles] = useState<Record<string, SelectedFile | null>>(() => {
    const initial: Record<string, SelectedFile | null> = {};
    documentKeys.forEach((item) => {
      initial[item.key] = null;
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);

  // Custom Modal State
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'info' | 'error' | 'warning' | 'accept' | 'delivered';
    title: string;
    message: string;
    onPrimaryAction?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = useCallback((
    type: 'info' | 'error' | 'warning' | 'accept' | 'delivered',
    title: string,
    message: string,
    onPrimaryAction?: () => void
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      onPrimaryAction,
    });
  }, []);

  const hideModal = useCallback(() => {
    if (modalConfig.onPrimaryAction) {
      modalConfig.onPrimaryAction();
    }
    setModalConfig((prev) => ({ ...prev, visible: false, onPrimaryAction: undefined }));
  }, [modalConfig]);

  const getFullUrl = (filePath?: string | null) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  const documentItems = useMemo(
    () =>
      documentKeys.map((item) => ({
        ...item,
        uri: getFullUrl(driver?.[item.key as keyof typeof driver] as string | undefined | null),
        selectedFile: selectedFiles[item.key],
      })),
    [driver, selectedFiles]
  );

  const hasDocuments = documentItems.some((item) => !!item.uri || !!item.selectedFile);
  const hasNewUploads = Object.values(selectedFiles).some(Boolean);

  const openDocumentPicker = useCallback((key: string, useCamera: boolean) => {
    const options = { mediaType: 'photo' as const, quality: 0.8 };

    const handleResponse = (response: any) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        showModal('error', 'Upload error', response.errorMessage);
        return;
      }
      const asset = response.assets?.[0];
      if (!asset || !asset.uri) {
        showModal('error', 'Upload error', 'Unable to select the document image.');
        return;
      }
      const newFile: SelectedFile = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `${key}.jpg`,
      };
      setSelectedFiles((prev) => ({
        ...prev,
        [key]: newFile,
      }));
    };

    if (useCamera) {
      if (Platform.OS === 'android') {
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)
          .then((granted) => {
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              launchCamera(options, handleResponse);
            } else {
              showModal('error', 'Camera Permission Denied', 'Camera permission is required to capture photos.');
            }
          })
          .catch((err) => {
            console.warn('Camera permission error:', err);
            showModal('error', 'Error', 'Failed to request camera permission.');
          });
      } else {
        launchCamera(options, handleResponse);
      }
    } else {
      launchImageLibrary(options, handleResponse);
    }
  }, [showModal]);

  const selectDocument = useCallback((key: string) => {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to upload your photo:',
      [
        {
          text: '📷 Take Photo with Camera',
          onPress: () => openDocumentPicker(key, true),
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => openDocumentPicker(key, false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [openDocumentPicker]);

  const handleUploadDocuments = useCallback(async () => {
    if (!hasNewUploads) {
      showModal('info', 'No files selected', 'Please select at least one document to upload.');
      return;
    }

    const formData = new FormData();
    Object.entries(selectedFiles).forEach(([key, file]) => {
      if (file) {
        formData.append(key, { uri: file.uri, type: file.type, name: file.name } as any);
      }
    });

    setLoading(true);
    try {
      await DriverService.uploadDocuments(formData);
      await refreshProfile();
      showModal('accept', 'Success', 'Documents uploaded successfully. Admin will review them shortly.');
      setSelectedFiles((prev) => {
        const reset: Record<string, SelectedFile | null> = {};
        Object.keys(prev).forEach((key) => {
          reset[key] = null;
        });
        return reset;
      });
    } catch (error: any) {
      showModal('error', 'Upload failed', error?.toString() || 'Could not upload documents.');
    } finally {
      setLoading(false);
    }
  }, [hasNewUploads, refreshProfile, selectedFiles, showModal]);

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} message="Uploading documents..." />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Upload and manage your documents</Text>
        <Text style={styles.description}>
          Keep your driver licence, insurance, and registration documents up to date. This section will show all approved and pending documents.
        </Text>

        <View style={styles.documentsGrid}>
          {documentItems.map((item) => {
            const displayUri = item.selectedFile?.uri || item.uri;
            const uploaded = !!item.uri;
            return (
              <View key={item.key} style={styles.documentCard}>
                <Text style={styles.documentLabel}>{item.label}</Text>
                {displayUri ? (
                  <Image source={{ uri: displayUri }} style={styles.documentImage} resizeMode="cover" />
                ) : (
                  <View style={styles.emptyDocument}>
                    <Text style={styles.emptyText}>No file uploaded</Text>
                  </View>
                )}
                <Text style={[styles.statusText, uploaded ? styles.statusUploaded : styles.statusPending]}>
                  {item.selectedFile ? 'Selected to upload' : uploaded ? 'Uploaded' : 'Not uploaded'}
                </Text>
                <TouchableOpacity style={styles.selectButton} onPress={() => selectDocument(item.key)} activeOpacity={0.7}>
                  <Text style={styles.selectButtonText}>{item.selectedFile ? 'Replace' : 'Upload'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !hasNewUploads && styles.submitButtonDisabled]}
          onPress={handleUploadDocuments}
          activeOpacity={0.8}
          disabled={!hasNewUploads}
        >
          <Text style={styles.submitButtonText}>Submit Documents</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomDriverModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText="OK"
        onPrimaryAction={hideModal}
      />
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
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#94A3B8',
    marginBottom: 20,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  documentCard: {
    width: '48%',
    backgroundColor: '#0B2246',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  documentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  documentImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    backgroundColor: '#0D2A54',
  },
  emptyDocument: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 12,
  },
  statusText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  statusUploaded: {
    color: '#22C55E',
  },
  statusPending: {
    color: '#94A3B8',
  },
  selectButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default DocumentsScreen;
