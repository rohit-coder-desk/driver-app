import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { launchCamera, ImagePickerResponse, Asset } from 'react-native-image-picker';

interface ParcelPhotoModalProps {
  visible: boolean;
  mode: 'pickup' | 'delivery';
  onClose: () => void;
  onConfirmUpload: (photo: { uri: string; type?: string; fileName?: string }) => Promise<void>;
}

export const ParcelPhotoModal: React.FC<ParcelPhotoModalProps> = ({
  visible,
  mode,
  onClose,
  onConfirmUpload,
}) => {
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !photo) {
      handleLaunchCamera();
    }
  }, [visible]);

  const handleLaunchCamera = async () => {
    setErrorMsg(null);
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission Required',
            message: 'Camera permission is required to capture parcel proof photo.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setErrorMsg('Camera permission denied. Cannot capture photo.');
          return;
        }
      } catch (err) {
        console.warn('Camera permission request error:', err);
        setErrorMsg('Failed to request camera permission.');
        return;
      }
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        saveToPhotos: false,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          if (!photo) {
            setErrorMsg('Camera cancelled. Photo is required to proceed.');
          }
        } else if (response.errorCode) {
          setErrorMsg(response.errorMessage || 'Camera error occurred.');
        } else if (response.assets && response.assets.length > 0) {
          setPhoto(response.assets[0]);
          setErrorMsg(null);
        }
      }
    );
  };

  const handleConfirm = async () => {
    if (!photo || !photo.uri) {
      setErrorMsg('No photo captured. Please take a photo first.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    try {
      await onConfirmUpload({
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        fileName: photo.fileName || `parcel_${mode}_${Date.now()}.jpg`,
      });
      setPhoto(null);
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      setErrorMsg(err?.toString() || `Failed to upload ${mode} photo. Please try again.`);
    }
  };

  const handleModalClose = () => {
    if (uploading) return;
    setPhoto(null);
    setErrorMsg(null);
    onClose();
  };

  const titleText = mode === 'pickup' ? 'Pickup Parcel Photo Required' : 'Delivery Parcel Photo Required';
  const modeLabel = mode === 'pickup' ? 'Proof of Pickup' : 'Proof of Delivery';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleModalClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          {/* <View style={styles.header}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>
              Admin requires a mandatory {mode} photo of the parcel.
            </Text>
          </View> */}

          {/* Photo Preview Section */}
          <View style={styles.previewContainer}>
            {photo && photo.uri ? (
              <Image source={{ uri: photo.uri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No photo captured yet</Text>
              </View>
            )}
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            {photo ? (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.retakeBtn]}
                  onPress={handleLaunchCamera}
                  disabled={uploading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retakeBtnText}>📷 Retake Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={handleConfirm}
                  disabled={uploading}
                  activeOpacity={0.8}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm & Upload Photo</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.btn, styles.confirmBtn]}
                onPress={handleLaunchCamera}
                disabled={uploading}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>📷 Open Camera</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleModalClose}
              disabled={uploading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  emptyPreview: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: '#2563EB',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  retakeBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retakeBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
