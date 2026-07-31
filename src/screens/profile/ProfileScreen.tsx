import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { Loader } from '../../components/common/Loader';
import { CustomDriverModal } from '../../components/common/CustomDriverModal';
import { ROUTES } from '../../constants/routes';

interface SelectedFile {
  uri: string;
  type: string;
  fileName: string;
}

interface UploadCardProps {
  label: string;
  fileText: string;
  onPress: () => void;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

const UploadCard = memo(({ label, fileText, onPress }: UploadCardProps) => (
  <View style={styles.uploadCard}>
    <Text style={styles.documentLabel}>{label}</Text>
    <View style={styles.uploadRow}>
      <TouchableOpacity style={styles.uploadBtn} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.uploadBtnText}>Upload Image</Text>
      </TouchableOpacity>
      <Text style={styles.fileNameText} numberOfLines={1}>
        {fileText}
      </Text>
    </View>
  </View>
));

const InputField = memo(({ label, value, onChangeText, placeholder }: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      value={value}
      onChangeText={onChangeText}
      returnKeyType="next"
      blurOnSubmit={false}
    />
  </View>
));

export const ProfileScreen = () => {
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  // Selected Files state
  const [avatar, setAvatar] = useState<SelectedFile | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<SelectedFile | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<SelectedFile | null>(null);
  const [licenceFront, setLicenceFront] = useState<SelectedFile | null>(null);
  const [licenceBack, setLicenceBack] = useState<SelectedFile | null>(null);
  const [rc, setRc] = useState<SelectedFile | null>(null);
  const [insurance, setInsurance] = useState<SelectedFile | null>(null);

  // Text Inputs state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState('');
  const [drivingLicenceExpiry, setDrivingLicenceExpiry] = useState('');

  const [loading, setLoading] = useState(false);

  // Sync details from profile on mount/update
  useEffect(() => {
    if (driver) {
      setName(driver.name || '');
      setPhone(driver.phone || '');
      setEmail(driver.email || '');
      setVehicleBrand(driver.vehicleBrand || '');
      setVehicleModel(driver.vehicleModel || '');
      setVehiclePlate(driver.vehiclePlate || '');
      setVehicleColor(driver.vehicleColor || '');
      setDrivingLicenceNumber(driver.drivingLicenceNumber || '');
      setDrivingLicenceExpiry(driver.drivingLicenceExpiry || '');
    }
  }, [driver]);

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

  const openImagePicker = useCallback((field: string, useCamera: boolean) => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
    };

    const handleResponse = (response: any) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        showModal('error', 'Error', response.errorMessage);
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
        else if (field === 'identityCardPhoto') setAadhaarFront(selected);
        else if (field === 'identityCardBackPhoto') setAadhaarBack(selected);
        else if (field === 'drivingLicencePhoto') setLicenceFront(selected);
        else if (field === 'drivingLicenceBackPhoto') setLicenceBack(selected);
        else if (field === 'rcPhoto') setRc(selected);
        else if (field === 'insurancePhoto') setInsurance(selected);
      }
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

  const selectImage = useCallback((field: string) => {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to upload your photo:',
      [
        {
          text: '📷 Take Photo',
          onPress: () => openImagePicker(field, true),
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => openImagePicker(field, false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [openImagePicker]);

  const handleUpload = useCallback(async () => {
    const hasTextChanges =
      name !== (driver?.name || '') ||
      phone !== (driver?.phone || '') ||
      email !== (driver?.email || '') ||
      vehicleBrand !== (driver?.vehicleBrand || '') ||
      vehicleModel !== (driver?.vehicleModel || '') ||
      vehiclePlate !== (driver?.vehiclePlate || '') ||
      vehicleColor !== (driver?.vehicleColor || '') ||
      drivingLicenceNumber !== (driver?.drivingLicenceNumber || '') ||
      drivingLicenceExpiry !== (driver?.drivingLicenceExpiry || '');

    const hasNewUploads =
      avatar || aadhaarFront || aadhaarBack || licenceFront || licenceBack || rc || insurance;

    if (!hasNewUploads && !hasTextChanges) {
      showModal('info', 'No Changes', 'Please enter profile or vehicle details or select a document to upload.');
      return;
    }

    const formData = new FormData();

    if (avatar) formData.append('avatarPhoto', { uri: avatar.uri, type: avatar.type, name: avatar.fileName } as any);
    if (aadhaarFront) formData.append('identityCardPhoto', { uri: aadhaarFront.uri, type: aadhaarFront.type, name: aadhaarFront.fileName } as any);
    if (aadhaarBack) formData.append('identityCardBackPhoto', { uri: aadhaarBack.uri, type: aadhaarBack.type, name: aadhaarBack.fileName } as any);
    if (licenceFront) formData.append('drivingLicencePhoto', { uri: licenceFront.uri, type: licenceFront.type, name: licenceFront.fileName } as any);
    if (licenceBack) formData.append('drivingLicenceBackPhoto', { uri: licenceBack.uri, type: licenceBack.type, name: licenceBack.fileName } as any);
    if (rc) formData.append('rcPhoto', { uri: rc.uri, type: rc.type, name: rc.fileName } as any);
    if (insurance) formData.append('insurancePhoto', { uri: insurance.uri, type: insurance.type, name: insurance.fileName } as any);

    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('vehicleBrand', vehicleBrand);
    formData.append('vehicleModel', vehicleModel);
    formData.append('vehiclePlate', vehiclePlate);
    formData.append('vehicleColor', vehicleColor);
    formData.append('drivingLicenceNumber', drivingLicenceNumber);
    formData.append('drivingLicenceExpiry', drivingLicenceExpiry);

    setLoading(true);
    try {
      await DriverService.uploadDocuments(formData);
      await refreshProfile();

      const isDocUpload = !!(avatar || aadhaarFront || aadhaarBack || licenceFront || licenceBack || rc || insurance || drivingLicenceNumber !== (driver?.drivingLicenceNumber || '') || drivingLicenceExpiry !== (driver?.drivingLicenceExpiry || ''));
      const successMessage = isDocUpload
        ? 'Profile documents submitted successfully. Waiting for Admin approval.'
        : 'Profile updated successfully!';

      showModal('accept', 'Success', successMessage, () => navigation.goBack());
    } catch (error: any) {
      showModal('error', 'Submission Failed', error.toString() || 'Could not save profile details.');
    } finally {
      setLoading(false);
    }
  }, [avatar, aadhaarBack, aadhaarFront, driver, drivingLicenceExpiry, drivingLicenceNumber, email, insurance, licenceBack, licenceFront, name, navigation, phone, refreshProfile, rc, showModal, vehicleBrand, vehicleColor, vehicleModel, vehiclePlate]);

  const getFileText = useCallback((selected: SelectedFile | null, serverPath: string | undefined | null) => {
    if (selected) return selected.fileName;
    if (serverPath) return 'Already Uploaded';
    return 'No file chosen';
  }, []);

  const uploadItems = useMemo(
    () => [
      {
        key: 'avatarPhoto',
        label: 'Selfie / Profile Photo',
        fileText: getFileText(avatar, driver?.avatarPhoto),
      },
      {
        key: 'identityCardPhoto',
        label: 'Aadhaar Front',
        fileText: getFileText(aadhaarFront, driver?.identityCardPhoto),
      },
      {
        key: 'identityCardBackPhoto',
        label: 'Aadhaar Back',
        fileText: getFileText(aadhaarBack, driver?.identityCardBackPhoto),
      },
      {
        key: 'drivingLicencePhoto',
        label: 'License Front',
        fileText: getFileText(licenceFront, driver?.drivingLicencePhoto),
      },
      {
        key: 'drivingLicenceBackPhoto',
        label: 'License Back',
        fileText: getFileText(licenceBack, driver?.drivingLicenceBackPhoto),
      },
      {
        key: 'rcPhoto',
        label: 'RC Document',
        fileText: getFileText(rc, driver?.rcPhoto),
      },
      {
        key: 'insurancePhoto',
        label: 'Vehicle Insurance',
        fileText: getFileText(insurance, driver?.insurancePhoto),
      },
    ], [avatar, aadhaarBack, aadhaarFront, getFileText, insurance, licenceBack, licenceFront, rc, driver]);

  const inputFields = useMemo(
    () => [
      {
        key: 'vehicleBrand',
        label: 'Vehicle Brand',
        placeholder: 'e.g. Toyota',
        value: vehicleBrand,
        onChangeText: setVehicleBrand,
      },
      {
        key: 'vehicleModel',
        label: 'Vehicle Model',
        placeholder: 'e.g. Camry',
        value: vehicleModel,
        onChangeText: setVehicleModel,
      },
      {
        key: 'vehiclePlate',
        label: 'Vehicle Plate',
        placeholder: 'ABC-1234',
        value: vehiclePlate,
        onChangeText: setVehiclePlate,
      },
      {
        key: 'vehicleColor',
        label: 'Vehicle Color',
        placeholder: 'e.g. White',
        value: vehicleColor,
        onChangeText: setVehicleColor,
      },
      {
        key: 'drivingLicenceNumber',
        label: 'Driving Licence Number',
        placeholder: 'e.g. DL-123456789',
        value: drivingLicenceNumber,
        onChangeText: setDrivingLicenceNumber,
      },
      {
        key: 'drivingLicenceExpiry',
        label: 'Driving Licence Expiry',
        placeholder: 'YYYY-MM-DD',
        value: drivingLicenceExpiry,
        onChangeText: setDrivingLicenceExpiry,
      },
    ], [drivingLicenceExpiry, drivingLicenceNumber, vehicleBrand, vehicleColor, vehicleModel, vehiclePlate]);

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} message="Submitting profile documents..." />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(ROUTES.HOME);
            }
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          nestedScrollEnabled={false}
        >
          <Text style={styles.sectionHeader}>Personal Information</Text>
          <InputField
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />
          <InputField
            label="Phone Number"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
          />
          <InputField
            label="Email Address"
            placeholder="Enter email address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Documents & Photos</Text>

          {uploadItems.map((item) => (
            <UploadCard
              key={item.key}
              label={item.label}
              fileText={item.fileText}
              onPress={() => selectImage(item.key)}
            />
          ))}

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Vehicle Details</Text>

          {inputFields.slice(0, 4).map((field) => (
            <InputField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={field.value}
              onChangeText={field.onChangeText}
            />
          ))}

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Licence Details</Text>

          {inputFields.slice(4).map((field) => (
            <InputField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={field.value}
              onChangeText={field.onChangeText}
            />
          ))}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Save Changes</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

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
    backgroundColor: '#ffffff',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : Math.max(StatusBar.currentHeight || 0, 24) + 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  uploadCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 12,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  fileNameText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default ProfileScreen;
