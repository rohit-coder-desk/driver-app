import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { ZoomableImageViewer } from './ZoomableImageViewer';

export interface ImagePreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  title: string;
  status?: 'approved' | 'pending' | 'rejected' | 'selected' | string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  visible,
  imageUri,
  title,
  status,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" translucent={true} />

        {/* Notch-safe Translucent Header */}
        <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'ios' ? 50 : Math.max(StatusBar.currentHeight || 0, 24) + 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
            {status === 'approved' && (
              <Text style={styles.statusApprovedText}>✓ Approved</Text>
            )}
            {status === 'pending' && (
              <Text style={styles.statusPendingText}>⏳ Under Review</Text>
            )}
            {status === 'rejected' && (
              <Text style={styles.statusRejectedText}>✕ Rejected</Text>
            )}
            {status === 'selected' && (
              <Text style={styles.statusSelectedText}>Selected to upload</Text>
            )}
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Full-Screen Zoomable Image Container */}
        <View style={styles.imageContent}>
          {imageUri ? (
            <ZoomableImageViewer uri={imageUri} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderIcon}>📄</Text>
              <Text style={styles.placeholderText}>Image preview unavailable</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statusApprovedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  statusPendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 2,
  },
  statusRejectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 2,
  },
  statusSelectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 2,
  },
  headerSpacer: {
    width: 38,
  },
  imageContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
});
