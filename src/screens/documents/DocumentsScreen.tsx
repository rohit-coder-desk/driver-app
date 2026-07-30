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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
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

  const selectDocument = useCallback((key: string) => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      (response) => {
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
      }
    );
  }, [showModal]);

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
  },
  backBtnText: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  documentCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  documentImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  emptyDocument: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },
  statusText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  statusUploaded: {
    color: '#16a34a',
  },
  statusPending: {
    color: '#64748b',
  },
  selectButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default DocumentsScreen;
