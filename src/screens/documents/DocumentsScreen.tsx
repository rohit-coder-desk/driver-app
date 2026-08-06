import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
];

const getPhotoKeyFromDocKey = (key?: string): string | null => {
  if (!key) return null;
  const cleanKey = key.toLowerCase();
  if (cleanKey.includes('licence') || cleanKey.includes('license')) return 'drivingLicencePhoto';
  if (cleanKey.includes('rc')) return 'rcPhoto';
  if (cleanKey.includes('insurance')) return 'insurancePhoto';
  if (cleanKey.includes('identity') || cleanKey.includes('aadhaar')) return 'identityCardPhoto';
  if (cleanKey.includes('avatar')) return 'avatarPhoto';
  if (cleanKey.includes('vehicle')) return 'vehiclePhoto';
  return key;
};

export const DocumentsScreen = () => {
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const scrollViewRef = useRef<ScrollView | null>(null);
  const cardLayoutsRef = useRef<Record<string, number>>({});
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  // Handle auto-scroll & card highlighting when navigating via targetDocKey
  useEffect(() => {
    const rawTarget = route.params?.targetDocKey || route.params?.highlightDocKey;
    if (rawTarget) {
      const mappedKey = getPhotoKeyFromDocKey(rawTarget);
      if (mappedKey) {
        setHighlightedKey(mappedKey);

        const timerId = setTimeout(() => {
          const yOffset = cardLayoutsRef.current[mappedKey];
          if (yOffset !== undefined && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: Math.max(0, yOffset - 30), animated: true });
          }
        }, 350);

        const clearTimer = setTimeout(() => {
          setHighlightedKey(null);
        }, 5000);

        return () => {
          clearTimeout(timerId);
          clearTimeout(clearTimer);
        };
      }
    }
  }, [route.params?.targetDocKey, route.params?.highlightDocKey]);

  console.log(`[STEP-16] [DOCUMENTS SCREEN RENDER] authStatus="${driver?.authorizationStatus}", docStatuses=`, JSON.stringify(driver?.documentStatuses || {}));

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

  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    uri: string;
    title: string;
    status: string;
  }>({
    visible: false,
    uri: '',
    title: '',
    status: '',
  });

  const openImagePreview = useCallback((uri: string, title: string, status: string) => {
    setPreviewModal({
      visible: true,
      uri,
      title,
      status,
    });
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = useCallback((key: string) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  }, []);

  const getFullUrl = useCallback((filePath?: string | null) => {
    if (!filePath || typeof filePath !== 'string') return '';
    let clean = filePath.trim();
    if (!clean) return '';

    // Replace Windows backslashes
    clean = clean.replace(/\\/g, '/');

    // Local device image URI or data URI
    if (
      clean.startsWith('file:') ||
      clean.startsWith('content:') ||
      clean.startsWith('data:') ||
      clean.startsWith('ph:') ||
      clean.startsWith('assets-library:')
    ) {
      return clean;
    }

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      // Handle localhost or 127.0.0.1 in stored URLs
      if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
        const baseUrlClean = API_BASE_URL.replace(/\/+$/, '');
        if (!baseUrlClean.includes('localhost') && !baseUrlClean.includes('127.0.0.1')) {
          clean = clean.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, baseUrlClean);
        } else if (Platform.OS === 'android') {
          clean = clean.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
        }
      }
      return encodeURI(clean);
    }

    // Relative path handling
    const base = API_BASE_URL.replace(/\/+$/, '');
    const path = clean.startsWith('/') ? clean : `/${clean}`;
    return encodeURI(`${base}${path}`);
  }, []);

  const documentItems = useMemo(
    () =>
      documentKeys.map((item) => {
        let rawPath = driver?.[item.key as keyof typeof driver] as string | undefined | null;
        if (!rawPath && driver) {
          const d = driver as any;
          if (item.key === 'identityCardPhoto') rawPath = d.aadhaarPhoto || d.identityCard;
          if (item.key === 'identityCardBackPhoto') rawPath = d.aadhaarBackPhoto || d.identityCardBack;
          if (item.key === 'drivingLicencePhoto') rawPath = d.licencePhoto || d.drivingLicence;
          if (item.key === 'drivingLicenceBackPhoto') rawPath = d.licenceBackPhoto || d.drivingLicenceBack;
        }
        return {
          ...item,
          uri: getFullUrl(rawPath),
          selectedFile: selectedFiles[item.key],
        };
      }),
    [driver, selectedFiles, getFullUrl]
  );

  const hasNewUploads = Object.values(selectedFiles).some(Boolean);
  const authStatus = driver?.authorizationStatus; // 'approved' | 'pending' | 'rejected'
  const rejectionReason = driver?.authorizationDescription;

  const rejectedDocNames = useMemo(() => {
    const docStatuses = driver?.documentStatuses as Record<string, any> | undefined;
    const list: string[] = [];
    documentKeys.forEach((item) => {
      const raw = docStatuses?.[item.key];
      const st = typeof raw === 'object' ? raw?.status : raw;
      if (st === 'rejected') {
        list.push(item.label);
      }
    });
    return list;
  }, [driver]);

  const openDocumentPicker = useCallback((key: string, useCamera: boolean) => {
    const options = { mediaType: 'photo' as const, quality: 0.8 as any };

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
      setFailedImages((prev) => ({
        ...prev,
        [key]: false,
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
      showModal('accept', 'Success', 'Documents submitted successfully. Admin will review them shortly.');
      setSelectedFiles((prev) => {
        const reset: Record<string, SelectedFile | null> = {};
        Object.keys(prev).forEach((key) => {
          reset[key] = null;
        });
        return reset;
      });
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : error?.message || error?.error || 'Could not upload documents.';
      showModal('error', 'Upload failed', msg);
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
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Upload and manage your documents</Text>
        <Text style={styles.description}>
          Keep your driver licence, insurance, and registration documents up to date. This section shows the status of each uploaded document.
        </Text>

        {/* Status Banner */}
        {authStatus === 'rejected' && (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedBannerTitle}>⚠️ Document Verification Rejected</Text>
            <Text style={styles.rejectedBannerText}>
              {rejectedDocNames.length > 0
                ? `Rejected document(s): ${rejectedDocNames.join(', ')}.\n${rejectionReason ? `Reason: ${rejectionReason}` : 'Please re-upload the highlighted document(s) below.'}`
                : rejectionReason ? `Reason: ${rejectionReason}` : 'One or more documents were rejected. Please re-upload the highlighted document(s) below.'}
            </Text>
          </View>
        )}
        {authStatus === 'pending' && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingBannerTitle}>⏳ Verification Under Review</Text>
            <Text style={styles.pendingBannerText}>
              Your documents have been submitted and are currently being reviewed by admin.
            </Text>
          </View>
        )}
        {authStatus === 'approved' && (
          <View style={styles.approvedBanner}>
            <Text style={styles.approvedBannerTitle}>✓ Verification Approved</Text>
            <Text style={styles.approvedBannerText}>
              All your documents have been verified and approved by admin.
            </Text>
          </View>
        )}

        <View style={styles.documentsGrid}>
          {documentItems.map((item) => {
            const isSelected = !!item.selectedFile;
            const isUploaded = !!item.uri;
            const displayUri = item.selectedFile?.uri || item.uri;

            const docStatuses = driver?.documentStatuses as Record<string, { status: string; reason?: string } | string> | undefined;
            const rawDocObj = docStatuses?.[item.key];
            const docStatus = typeof rawDocObj === 'object' ? rawDocObj?.status : rawDocObj;
            const docReason = typeof rawDocObj === 'object' ? rawDocObj?.reason : undefined;

            // Determine status state for each card
            let cardState: 'selected' | 'approved' | 'pending' | 'rejected' | 'empty' = 'empty';
            if (isSelected) {
              cardState = 'selected';
            } else if (isUploaded) {
              if (docStatus === 'rejected') {
                cardState = 'rejected';
              } else if (docStatus === 'pending') {
                cardState = 'pending';
              } else if (docStatus === 'approved') {
                cardState = 'approved';
              } else {
                // Default to approved if uploaded, unless overall status is pending
                cardState = authStatus === 'pending' ? 'pending' : 'approved';
              }
            }

            const itemRejectionReason = docReason || rejectionReason;
            const isHighlighted = highlightedKey === item.key;

            return (
              <View
                key={item.key}
                onLayout={(e) => {
                  cardLayoutsRef.current[item.key] = e.nativeEvent.layout.y;
                }}
                style={[
                  styles.documentCard,
                  cardState === 'rejected' && styles.documentCardRejected,
                  isHighlighted && styles.highlightedCardRing,
                ]}
              >
                <Text style={styles.documentLabel}>{item.label}</Text>

                {displayUri ? (
                  <TouchableOpacity
                    style={[
                      styles.imageWrapper,
                      cardState === 'selected' && styles.imageWrapperSelected,
                      cardState === 'rejected' && styles.imageWrapperRejected,
                      cardState === 'approved' && styles.imageWrapperApproved,
                      cardState === 'pending' && styles.imageWrapperPending,
                    ]}
                    onPress={() => openImagePreview(displayUri, item.label, cardState)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: displayUri }}
                      style={styles.documentImage}
                      resizeMode="cover"
                      onError={() => handleImageError(item.key)}
                    />

                    {/* Badge Overlay */}
                    {cardState === 'rejected' && (
                      <View style={[styles.badgeOverlay, styles.badgeRejected]}>
                        <Text style={styles.badgeText}>✕ Rejected</Text>
                      </View>
                    )}
                    {cardState === 'approved' && (
                      <View style={[styles.badgeOverlay, styles.badgeApproved]}>
                        <Text style={styles.badgeText}>✓ Approved</Text>
                      </View>
                    )}
                    {cardState === 'pending' && (
                      <View style={[styles.badgeOverlay, styles.badgePending]}>
                        <Text style={styles.badgeText}>⏳ Under Review</Text>
                      </View>
                    )}
                    {cardState === 'selected' && (
                      <View style={[styles.badgeOverlay, styles.badgeSelected]}>
                        <Text style={styles.badgeText}>Selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyDocument}>
                    <Text style={styles.emptyText}>No file uploaded</Text>
                  </View>
                )}

                {/* Rejection Reason Notice below image if rejected */}
                {cardState === 'rejected' && (
                  <View style={styles.rejectionReasonBox}>
                    <Text style={styles.rejectionReasonText} numberOfLines={2}>
                      {itemRejectionReason ? `Reason: ${itemRejectionReason}` : 'Document rejected by admin'}
                    </Text>
                  </View>
                )}

                {/* Status Text Indicator */}
                <Text style={[
                  styles.statusText,
                  cardState === 'approved' && styles.statusApprovedText,
                  cardState === 'pending' && styles.statusPendingText,
                  cardState === 'rejected' && styles.statusRejectedText,
                  cardState === 'selected' && styles.statusSelectedText,
                  cardState === 'empty' && styles.statusEmptyText,
                ]}>
                  {cardState === 'selected' && 'Selected to upload'}
                  {cardState === 'approved' && 'Approved'}
                  {cardState === 'pending' && 'Under Review'}
                  {cardState === 'rejected' && 'Rejected'}
                  {cardState === 'empty' && 'Not uploaded'}
                </Text>

                {/* Action Buttons */}
                {cardState === 'approved' && (
                  <TouchableOpacity style={styles.approvedUpdateButton} onPress={() => selectDocument(item.key)} activeOpacity={0.8}>
                    <Text style={styles.approvedUpdateButtonText}>Replace Photo</Text>
                  </TouchableOpacity>
                )}

                {cardState === 'pending' && (
                  <TouchableOpacity style={styles.approvedUpdateButton} onPress={() => selectDocument(item.key)} activeOpacity={0.8}>
                    <Text style={styles.approvedUpdateButtonText}>Replace Photo</Text>
                  </TouchableOpacity>
                )}

                {cardState === 'rejected' && (
                  <TouchableOpacity style={[styles.selectButton, styles.uploadAgainButton]} onPress={() => selectDocument(item.key)} activeOpacity={0.8}>
                    <Text style={styles.selectButtonText}>Upload Again</Text>
                  </TouchableOpacity>
                )}

                {cardState === 'selected' && (
                  <TouchableOpacity style={styles.selectButton} onPress={() => selectDocument(item.key)} activeOpacity={0.8}>
                    <Text style={styles.selectButtonText}>Replace</Text>
                  </TouchableOpacity>
                )}

                {cardState === 'empty' && (
                  <TouchableOpacity style={styles.selectButton} onPress={() => selectDocument(item.key)} activeOpacity={0.8}>
                    <Text style={styles.selectButtonText}>Upload</Text>
                  </TouchableOpacity>
                )}
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

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={previewModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImagePreview}
      >
        <View style={styles.fullScreenModalBg}>
          <StatusBar backgroundColor="#0A1220" barStyle="light-content" translucent={true} />
          
          {/* Header with Back Button & Close Button */}
          <View style={[styles.fullScreenHeaderContainer, { paddingTop: Platform.OS === 'ios' ? 50 : Math.max(StatusBar.currentHeight || 0, 24) + 10 }]}>
            <TouchableOpacity
              style={styles.fullScreenBackBtn}
              onPress={closeImagePreview}
              activeOpacity={0.8}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.fullScreenBackBtnText}>←</Text>
            </TouchableOpacity>

            <View style={styles.fullScreenTitleContainer}>
              <Text style={styles.fullScreenTitleText}>{previewModal.title}</Text>
              {previewModal.status === 'approved' && (
                <Text style={styles.fullScreenStatusApprovedText}>✓ Approved</Text>
              )}
              {previewModal.status === 'pending' && (
                <Text style={styles.fullScreenStatusPendingText}>⏳ Under Review</Text>
              )}
              {previewModal.status === 'rejected' && (
                <Text style={styles.fullScreenStatusRejectedText}>✕ Rejected</Text>
              )}
              {previewModal.status === 'selected' && (
                <Text style={styles.fullScreenStatusSelectedText}>Selected to upload</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.fullScreenCloseBtn}
              onPress={closeImagePreview}
              activeOpacity={0.8}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.fullScreenCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Full Screen Image */}
          <TouchableOpacity
            style={styles.fullScreenImageContent}
            onPress={closeImagePreview}
            activeOpacity={1}
          >
            {previewModal.uri ? (
              <Image
                source={{ uri: previewModal.uri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : null}
          </TouchableOpacity>
        </View>
      </Modal>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginBottom: 20,
  },
  rejectedBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  rejectedBannerTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  rejectedBannerText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  pendingBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  pendingBannerTitle: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  pendingBannerText: {
    color: '#FDE68A',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  approvedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  approvedBannerTitle: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  approvedBannerText: {
    color: '#A7F3D0',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
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
  documentCardRejected: {
    borderColor: '#EF4444',
    backgroundColor: '#121F38',
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageWrapperSelected: {
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  imageWrapperRejected: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  imageWrapperApproved: {
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  imageWrapperPending: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  documentImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D2A54',
  },
  failedImageWrapper: {
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedImageContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  failedImageText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  failedImageSubtext: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  badgeRejected: {
    backgroundColor: '#DC2626',
  },
  badgeApproved: {
    backgroundColor: '#059669',
  },
  badgePending: {
    backgroundColor: '#D97706',
  },
  badgeSelected: {
    backgroundColor: '#0066FF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyDocument: {
    width: '100%',
    height: 120,
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
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  rejectionReasonBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectionReasonText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statusApprovedText: {
    color: '#10B981',
  },
  statusPendingText: {
    color: '#F59E0B',
  },
  statusRejectedText: {
    color: '#EF4444',
  },
  statusSelectedText: {
    color: '#0066FF',
  },
  statusEmptyText: {
    color: '#94A3B8',
  },
  statusPillBtn: {
    marginTop: 12,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusPillTextApproved: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statusPillTextPending: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  selectButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#0066FF',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadAgainButton: {
    backgroundColor: '#EF4444',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  approvedUpdateButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#16325B',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedUpdateButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    height: 54,
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  fullScreenModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
  },
  fullScreenHeaderContainer: {
    backgroundColor: '#0A1220',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 9999,
  },
  fullScreenBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fullScreenBackBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fullScreenTitleContainer: {
    flex: 1,
  },
  fullScreenTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fullScreenStatusApprovedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  fullScreenStatusPendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 2,
  },
  fullScreenStatusRejectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 2,
  },
  fullScreenStatusSelectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 2,
  },
  fullScreenCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  fullScreenCloseText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fullScreenImageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  highlightedCardRing: {
    borderColor: '#2563EB',
    borderWidth: 2.5,
    backgroundColor: '#EFF6FF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default DocumentsScreen;
