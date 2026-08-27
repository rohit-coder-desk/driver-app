import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  KeyboardTypeOptions,
  Modal,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHeaderPaddingTop } from '../../utils/layout';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { Loader } from '../../components/common/Loader';
import { CustomDriverModal } from '../../components/common/CustomDriverModal';
import { DatePickerModal } from '../../components/common/DatePickerModal';
import { ImagePreviewModal } from '../../components/common/ImagePreviewModal';
import { CameraIcon } from '../../components/common/Icons';
import { ROUTES } from '../../constants/routes';
import { ALL_COUNTRY_CODES, CountryCode } from '../../constants/countryCodes';
import { API_BASE_URL } from '../../config/env';

interface RowInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
  required?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  error?: string | null;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
}

const EditInfoRow = memo(({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  maxLength,
  keyboardType = 'default',
  error,
  autoCapitalize,
  multiline = false,
}: RowInputFieldProps) => (
  <View style={styles.rowWrapper}>
    <View style={[styles.infoRow, multiline && styles.infoRowMultiline]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={[
          styles.borderlessInput,
          multiline && styles.borderlessInputMultiline,
          !editable && styles.disabledInput,
          !!error && styles.errorInputText,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
      />
    </View>
    {!!error && <Text style={styles.errorSubtitle}>{error}</Text>}
  </View>
));

const EditDateRow = memo(({
  label,
  value,
  onPress,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onPress: () => void;
  placeholder: string;
  error?: string | null;
}) => (
  <View style={styles.rowWrapper}>
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.dateValueText, !value && styles.placeholderText, !!error && styles.errorInputText]}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
    {!!error && <Text style={styles.errorSubtitle}>{error}</Text>}
  </View>
));

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  // Personal Info
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Driver Info
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState('');
  const [drivingLicenceExpiry, setDrivingLicenceExpiry] = useState('');

  // Address Info
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Vehicle Info
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [rcExpiry, setRcExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Date Picker active target
  const [activeDatePickerField, setActiveDatePickerField] = useState<'drivingLicenceExpiry' | 'rcExpiry' | 'insuranceExpiry' | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Helper to get full photo URL
  const getFullUrl = useCallback((filePath?: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }, []);

  // Helper to safely format raw dates to YYYY-MM-DD
  const formatDateString = (val?: string | null) => {
    if (!val) return '';
    const str = String(val).trim();
    if (!str) return '';
    return str.split('T')[0];
  };

  // Country Code State
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(ALL_COUNTRY_CODES[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  // Modal for previewing full image
  const [fullImageModal, setFullImageModal] = useState<{
    visible: boolean;
    uri: string;
    title: string;
  }>({
    visible: false,
    uri: '',
    title: '',
  });

  // Sync profile details on mount/update
  useEffect(() => {
    if (driver) {
      let fn = driver.name || '';
      let ln = driver.lastName || '';
      if (!ln && fn.trim().includes(' ')) {
        const parts = fn.trim().split(/\s+/);
        fn = parts[0];
        ln = parts.slice(1).join(' ');
      }
      setName(fn);
      setLastName(ln);

      let rawP = driver.phone || '';
      let matchedCountry = ALL_COUNTRY_CODES[0];
      for (const cc of ALL_COUNTRY_CODES) {
        if (rawP.startsWith(cc.code)) {
          matchedCountry = cc;
          rawP = rawP.slice(cc.code.length);
          break;
        }
      }
      rawP = rawP.replace(/\D/g, '').slice(0, 10);
      setSelectedCountry(matchedCountry);
      setPhone(rawP);

      setEmail(driver.email || '');
      setCity(driver.city || '');
      setAddress(driver.address || '');
      setDrivingLicenceNumber(driver.drivingLicenceNumber || '');
      setDrivingLicenceExpiry(formatDateString(driver.drivingLicenceExpiry));
      setVehicleBrand(driver.vehicleBrand || '');
      setVehicleModel(driver.vehicleModel || '');
      setVehicleColor(driver.vehicleColor || '');
      setVehiclePlate(driver.vehiclePlate || '');

      let docObj: Record<string, any> = {};
      if (driver.documentStatuses) {
        if (typeof driver.documentStatuses === 'string') {
          try {
            docObj = JSON.parse(driver.documentStatuses);
          } catch (e) {
            docObj = {};
          }
        } else if (typeof driver.documentStatuses === 'object') {
          docObj = driver.documentStatuses;
        }
      }

      const rawRc = driver.rcExpiry || docObj.rcExpiry || docObj.rcPhoto?.expiry;
      const rawInsurance = driver.insuranceExpiry || docObj.insuranceExpiry || docObj.insurancePhoto?.expiry;

      setRcExpiry(formatDateString(rawRc));
      setInsuranceExpiry(formatDateString(rawInsurance));
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

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    try {
      navigation.navigate(ROUTES.HOME);
    } catch (error) {
      navigation.popToTop?.();
    }
  }, [navigation]);

  // Photo Upload logic
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
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatarPhoto', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'profile_photo.jpg',
      } as any);

      await DriverService.uploadDocuments(formData);
      await refreshProfile();
      showModal('accept', 'Success', 'Profile photo updated successfully!');
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to update profile photo.';
      showModal('error', 'Upload Failed', msg);
    } finally {
      setUploadingAvatar(false);
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
          text: 'Take Photo with Camera',
          onPress: () => handleSelectProfilePhoto(true),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => handleSelectProfilePhoto(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDateSelect = useCallback((dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const selDate = new Date(y, m - 1, d);

      if (activeDatePickerField === 'drivingLicenceExpiry') {
        const minLicenceDate = new Date();
        minLicenceDate.setMonth(minLicenceDate.getMonth() + 1);
        minLicenceDate.setHours(0, 0, 0, 0);

        if (selDate < minLicenceDate) {
          setErrors((prev) => ({ ...prev, drivingLicenceExpiry: 'Licence Expiry must be at least 1 month from today.' }));
          setDrivingLicenceExpiry(dateStr);
          setActiveDatePickerField(null);
          return;
        } else {
          setErrors((prev) => ({ ...prev, drivingLicenceExpiry: '' }));
        }
      } else if (selDate < today) {
        if (activeDatePickerField === 'rcExpiry') {
          setErrors((prev) => ({ ...prev, rcExpiry: 'RC Expiry must be today or a future date.' }));
        } else if (activeDatePickerField === 'insuranceExpiry') {
          setErrors((prev) => ({ ...prev, insuranceExpiry: 'Insurance Expiry must be today or a future date.' }));
        }
        if (activeDatePickerField === 'rcExpiry') setRcExpiry(dateStr);
        if (activeDatePickerField === 'insuranceExpiry') setInsuranceExpiry(dateStr);
        setActiveDatePickerField(null);
        return;
      }
    }

    if (activeDatePickerField === 'drivingLicenceExpiry') {
      setDrivingLicenceExpiry(dateStr);
      setErrors((prev) => ({ ...prev, drivingLicenceExpiry: '' }));
    } else if (activeDatePickerField === 'rcExpiry') {
      setRcExpiry(dateStr);
      setErrors((prev) => ({ ...prev, rcExpiry: '' }));
    } else if (activeDatePickerField === 'insuranceExpiry') {
      setInsuranceExpiry(dateStr);
      setErrors((prev) => ({ ...prev, insuranceExpiry: '' }));
    }
    setActiveDatePickerField(null);
  }, [activeDatePickerField]);

  const activeDatePickerValue = useMemo(() => {
    if (activeDatePickerField === 'drivingLicenceExpiry') return drivingLicenceExpiry;
    if (activeDatePickerField === 'rcExpiry') return rcExpiry;
    if (activeDatePickerField === 'insuranceExpiry') return insuranceExpiry;
    return '';
  }, [activeDatePickerField, drivingLicenceExpiry, insuranceExpiry, rcExpiry]);

  const activeDatePickerTitle = useMemo(() => {
    if (activeDatePickerField === 'drivingLicenceExpiry') return 'Licence Expiry Date';
    if (activeDatePickerField === 'rcExpiry') return 'RC Expiry Date';
    if (activeDatePickerField === 'insuranceExpiry') return 'Insurance Expiry Date';
    return 'Select Expiry Date';
  }, [activeDatePickerField]);

  const activeDatePickerMinDate = useMemo(() => {
    if (activeDatePickerField === 'drivingLicenceExpiry') {
      const minLicenceDate = new Date();
      minLicenceDate.setMonth(minLicenceDate.getMonth() + 1);
      minLicenceDate.setHours(0, 0, 0, 0);
      return minLicenceDate;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [activeDatePickerField]);

  const handleSaveProfile = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedLastName = lastName.trim();
    const fullCombinedName = trimmedLastName ? `${trimmedName} ${trimmedLastName}` : trimmedName;
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedLicence = drivingLicenceNumber.trim();
    const trimmedCity = city.trim();
    const trimmedAddress = address.trim();
    const trimmedBrand = vehicleBrand.trim();
    const trimmedModel = vehicleModel.trim();
    const trimmedColor = vehicleColor.trim();
    const trimmedPlate = vehiclePlate.trim();

    const errs: Record<string, string> = {};

    // 1. Basic Information Validation
    if (!trimmedName) {
      errs.name = 'Name is required.';
    }

    if (!trimmedPhone) {
      errs.phone = 'Phone number is required.';
    } else {
      const phoneDigits = trimmedPhone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        errs.phone = 'Phone number must be 10 digits.';
      }
    }

    if (!trimmedEmail) {
      errs.email = 'Email is required.';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        errs.email = 'Enter valid email.';
      }
    }

    // 2. Driving Licence Validation
    if (!trimmedLicence) {
      errs.drivingLicenceNumber = 'Licence number is required.';
    }

    if (!drivingLicenceExpiry || !drivingLicenceExpiry.trim()) {
      errs.drivingLicenceExpiry = 'Licence expiry is required.';
    } else {
      const dlExpDate = new Date(drivingLicenceExpiry);
      const minLicenceDate = new Date();
      minLicenceDate.setMonth(minLicenceDate.getMonth() + 1);
      minLicenceDate.setHours(0, 0, 0, 0);
      if (isNaN(dlExpDate.getTime()) || dlExpDate < minLicenceDate) {
        errs.drivingLicenceExpiry = 'Expiry must be >= 1 month from today.';
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 3. RC Expiry Validation
    if (!rcExpiry || !rcExpiry.trim()) {
      errs.rcExpiry = 'RC Expiry is required.';
    } else {
      const rcExpDate = new Date(rcExpiry);
      if (isNaN(rcExpDate.getTime()) || rcExpDate < todayStart) {
        errs.rcExpiry = 'RC Expiry must be today or future date.';
      }
    }

    // 4. Vehicle Insurance Expiry Validation
    if (!insuranceExpiry || !insuranceExpiry.trim()) {
      errs.insuranceExpiry = 'Insurance Expiry is required.';
    } else {
      const insExpDate = new Date(insuranceExpiry);
      if (isNaN(insExpDate.getTime()) || insExpDate < todayStart) {
        errs.insuranceExpiry = 'Insurance Expiry must be today or future date.';
      }
    }

    // 5. City Validation
    if (!trimmedCity) {
      errs.city = 'City is required.';
    } else if (trimmedCity.length < 3) {
      errs.city = 'City must be >= 3 chars.';
    }

    // 6. Address Validation
    if (!trimmedAddress) {
      errs.address = 'Address is required.';
    } else if (trimmedAddress.length < 10) {
      errs.address = 'Address must be >= 10 chars.';
    }

    // 7. Vehicle Details Validation
    if (!trimmedBrand) {
      errs.vehicleBrand = 'Brand is required.';
    }
    if (!trimmedModel) {
      errs.vehicleModel = 'Model is required.';
    }
    if (!trimmedColor) {
      errs.vehicleColor = 'Color is required.';
    }
    if (!trimmedPlate) {
      errs.vehiclePlate = 'Plate number is required.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});

    const docStatuses = driver?.documentStatuses as Record<string, any> | undefined;

    const hasChanges =
      fullCombinedName !== (driver?.name || '') ||
      trimmedLastName !== (driver?.lastName || '') ||
      trimmedPhone !== (driver?.phone || '') ||
      trimmedEmail !== (driver?.email || '') ||
      trimmedCity !== (driver?.city || '') ||
      trimmedAddress !== (driver?.address || '') ||
      trimmedLicence !== (driver?.drivingLicenceNumber || '') ||
      drivingLicenceExpiry !== (driver?.drivingLicenceExpiry || '') ||
      trimmedBrand !== (driver?.vehicleBrand || '') ||
      trimmedModel !== (driver?.vehicleModel || '') ||
      trimmedColor !== (driver?.vehicleColor || '') ||
      trimmedPlate !== (driver?.vehiclePlate || '') ||
      rcExpiry !== (docStatuses?.rcExpiry || '') ||
      insuranceExpiry !== (docStatuses?.insuranceExpiry || '');

    if (!hasChanges) {
      showModal('info', 'No Changes', 'No profile changes detected.');
      return;
    }

    const formData = new FormData();
    formData.append('name', fullCombinedName);
    if (trimmedLastName) formData.append('lastName', trimmedLastName);
    formData.append('phone', trimmedPhone);
    formData.append('email', trimmedEmail);
    formData.append('city', trimmedCity);
    formData.append('address', trimmedAddress);
    formData.append('drivingLicenceNumber', trimmedLicence);
    formData.append('drivingLicenceExpiry', drivingLicenceExpiry);
    formData.append('vehicleBrand', trimmedBrand);
    formData.append('vehicleModel', trimmedModel);
    formData.append('vehicleColor', trimmedColor);
    formData.append('vehiclePlate', trimmedPlate);
    formData.append('rcExpiry', rcExpiry);
    formData.append('insuranceExpiry', insuranceExpiry);

    setLoading(true);
    try {
      await DriverService.uploadDocuments(formData);
      await refreshProfile();
      showModal('accept', 'Success', 'Profile details updated successfully!', () => navigation.goBack());
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : error?.message || error?.error || 'Could not update profile details.';
      showModal('error', 'Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address, city, driver, drivingLicenceExpiry, drivingLicenceNumber, email, insuranceExpiry, lastName, name, navigation, phone, rcExpiry, refreshProfile, showModal, vehicleBrand, vehicleColor, vehicleModel, vehiclePlate]);

  const displayDriverName = useMemo(() => {
    const combined = `${name} ${lastName}`.trim();
    return combined || driver?.name || 'Driver';
  }, [name, lastName, driver?.name]);

  return (
    <View style={styles.container}>
      <Loader visible={loading || uploadingAvatar} message={uploadingAvatar ? 'Uploading Profile Photo...' : 'Updating profile details...'} />
      <StatusBar backgroundColor="#0B2246" barStyle="light-content" />

      {/* Header bar */}
      <View style={[styles.header, { paddingTop: getHeaderPaddingTop(insets.top) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={handleSaveProfile}
          activeOpacity={0.7}
        >
          <Text style={styles.editHeaderBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 36) }]}
          keyboardShouldPersistTaps="handled"
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
                      title: `${displayDriverName}'s Profile Photo`,
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
                      {displayDriverName ? displayDriverName.charAt(0).toUpperCase() : 'D'}
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
                <CameraIcon size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileHeaderInfo}>
              <Text style={styles.driverName}>{displayDriverName}</Text>
              {phone ? <Text style={styles.driverPhone}>{phone}</Text> : null}
              {email ? <Text style={styles.driverEmail}>{email}</Text> : null}

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

          {/* Section 1: Personal Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

            <EditInfoRow
              label="Name"
              placeholder="Enter name"
              value={name}
              onChangeText={(txt) => {
                setName(txt);
                setErrors((prev) => ({ ...prev, name: '' }));
              }}
              error={errors.name}
            />

            <View style={styles.divider} />

            <EditInfoRow
              label="Last Name"
              placeholder="Enter last name"
              value={lastName}
              onChangeText={(txt) => {
                setLastName(txt);
              }}
            />

            <View style={styles.divider} />

            <EditInfoRow
              label="Phone Number"
              placeholder="10-digit phone"
              value={phone}
              onChangeText={(txt) => {
                const cleaned = txt.replace(/\D/g, '').slice(0, 10);
                setPhone(cleaned);
                setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />

            <View style={styles.divider} />

            <EditInfoRow
              label="Email Address"
              placeholder="Enter email address"
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              multiline={true}
              error={errors.email}
            />
          </View>

          {/* Section 2: Address Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ADDRESS DETAILS</Text>

            <EditInfoRow
              label="City"
              placeholder="Enter city"
              value={city}
              onChangeText={(txt) => {
                setCity(txt);
                setErrors((prev) => ({ ...prev, city: '' }));
              }}
              error={errors.city}
            />

            <View style={styles.divider} />

            <EditInfoRow
              label="Address"
              placeholder="Enter address"
              value={address}
              onChangeText={(txt) => {
                setAddress(txt);
                setErrors((prev) => ({ ...prev, address: '' }));
              }}
              multiline={true}
              error={errors.address}
            />
          </View>

          {/* Section 3: Driver & Licence Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>DRIVER & LICENCE DETAILS</Text>

            <EditInfoRow
              label="Licence Number"
              placeholder="Enter licence number"
              value={drivingLicenceNumber}
              onChangeText={(txt) => {
                setDrivingLicenceNumber(txt);
                setErrors((prev) => ({ ...prev, drivingLicenceNumber: '' }));
              }}
              error={errors.drivingLicenceNumber}
            />

            <View style={styles.divider} />

            <EditDateRow
              label="Licence Expiry"
              placeholder="YYYY-MM-DD"
              value={drivingLicenceExpiry}
              onPress={() => {
                setErrors((prev) => ({ ...prev, drivingLicenceExpiry: '' }));
                setActiveDatePickerField('drivingLicenceExpiry');
              }}
              error={errors.drivingLicenceExpiry}
            />
          </View>

          {/* Section 4: Vehicle Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>

            <EditInfoRow
              label="Vehicle Brand"
              placeholder="e.g. Toyota"
              value={vehicleBrand}
              onChangeText={(txt) => {
                setVehicleBrand(txt);
                setErrors((prev) => ({ ...prev, vehicleBrand: '' }));
              }}
              error={errors.vehicleBrand}
            />

            <View style={styles.divider} />

            <EditInfoRow
              label="Vehicle Model"
              placeholder="e.g. Camry"
              value={vehicleModel}
              onChangeText={(txt) => {
                setVehicleModel(txt);
                setErrors((prev) => ({ ...prev, vehicleModel: '' }));
              }}
              error={errors.vehicleModel}
            />

            <View style={styles.divider} />

            <EditInfoRow
              label="Vehicle Color"
              placeholder="e.g. White"
              value={vehicleColor}
              onChangeText={(txt) => {
                setVehicleColor(txt);
                setErrors((prev) => ({ ...prev, vehicleColor: '' }));
              }}
              error={errors.vehicleColor}
            />

            <View style={styles.divider} />

            <EditInfoRow
              label="Plate Number"
              placeholder="e.g. ABC-1234"
              value={vehiclePlate}
              onChangeText={(txt) => {
                setVehiclePlate(txt);
                setErrors((prev) => ({ ...prev, vehiclePlate: '' }));
              }}
              error={errors.vehiclePlate}
            />

            <View style={styles.divider} />

            <EditDateRow
              label="RC Expiry"
              placeholder="YYYY-MM-DD"
              value={rcExpiry}
              onPress={() => {
                setErrors((prev) => ({ ...prev, rcExpiry: '' }));
                setActiveDatePickerField('rcExpiry');
              }}
              error={errors.rcExpiry}
            />

            <View style={styles.divider} />

            <EditDateRow
              label="Insurance Expiry"
              placeholder="YYYY-MM-DD"
              value={insuranceExpiry}
              onPress={() => {
                setErrors((prev) => ({ ...prev, insuranceExpiry: '' }));
                setActiveDatePickerField('insuranceExpiry');
              }}
              error={errors.insuranceExpiry}
            />
          </View>

          {/* Action Save Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={handleSaveProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.editProfileBtnText}>Save Profile Details</Text>
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

      <DatePickerModal
        visible={!!activeDatePickerField}
        value={activeDatePickerValue}
        title={activeDatePickerTitle}
        minDate={activeDatePickerMinDate}
        onSelect={handleDateSelect}
        onClose={() => setActiveDatePickerField(null)}
      />

      <ImagePreviewModal
        visible={fullImageModal.visible}
        imageUri={fullImageModal.uri}
        title={fullImageModal.title}
        onClose={() => setFullImageModal({ visible: false, uri: '', title: '' })}
      />

      {/* Country Code Selection Modal */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.countryModalCard}>
              <Text style={styles.countryModalTitle}>Select Country Code</Text>
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={true}>
                {ALL_COUNTRY_CODES.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.code}-${item.country}-${index}`}
                    style={[
                      styles.countryItem,
                      selectedCountry.country === item.country && selectedCountry.code === item.code && styles.selectedCountryItem,
                    ]}
                    onPress={() => {
                      setSelectedCountry(item);
                      setCountryModalVisible(false);
                    }}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryName}>{item.name}</Text>
                    {selectedCountry.country === item.country && selectedCountry.code === item.code && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
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
    height: 38,
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
  keyboardAvoiding: {
    flex: 1,
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
    marginBottom: 8,
  },
  rowWrapper: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 46,
  },
  infoRowMultiline: {
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#7C8BA1',
  },
  borderlessInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'right',
    marginLeft: 16,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  borderlessInputMultiline: {
    textAlign: 'right',
    minHeight: 40,
  },
  dateValueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'right',
    marginLeft: 16,
  },
  placeholderText: {
    color: '#475569',
  },
  errorInputText: {
    color: '#EF4444',
  },
  errorSubtitle: {
    color: '#EF4444',
    fontSize: 11,
    textAlign: 'right',
    marginTop: -4,
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  disabledInput: {
    opacity: 0.6,
  },
  editProfileBtn: {
    backgroundColor: '#0066FF',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 58, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  countryModalCard: {
    width: '100%',
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  selectedCountryItem: {
    backgroundColor: '#0D2A54',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  checkIcon: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
