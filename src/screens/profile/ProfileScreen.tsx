import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { Loader } from '../../components/common/Loader';
import { CustomDriverModal } from '../../components/common/CustomDriverModal';
import { DatePickerModal } from '../../components/common/DatePickerModal';
import { ROUTES } from '../../constants/routes';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
}

const InputField = memo(({ label, value, onChangeText, placeholder, editable = true }: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.textInput, !editable && styles.disabledInput]}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      value={value}
      onChangeText={onChangeText}
      editable={editable}
    />
  </View>
));

const MultilineInputField = memo(({ label, value, onChangeText, placeholder }: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.textInput, styles.multilineInput]}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      value={value}
      onChangeText={onChangeText}
      multiline={true}
      numberOfLines={3}
      textAlignVertical="top"
    />
  </View>
));

const DatePickerInputField = memo(({ label, value, onPress, placeholder }: { label: string; value: string; onPress: () => void; placeholder: string }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.dateInputWrapper}>
      <Text style={[styles.dateInputText, !value && styles.dateInputPlaceholder]}>
        {value || placeholder}
      </Text>
      <Text style={styles.dateCalendarIcon}>📅</Text>
    </View>
  </TouchableOpacity>
));

export const ProfileScreen = () => {
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  // Personal Info
  const [name, setName] = useState('');
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

  // Date Picker active target
  const [activeDatePickerField, setActiveDatePickerField] = useState<'drivingLicenceExpiry' | 'rcExpiry' | 'insuranceExpiry' | null>(null);

  const [loading, setLoading] = useState(false);

  // Sync profile details on mount/update
  useEffect(() => {
    if (driver) {
      setName(driver.name || '');
      setPhone(driver.phone || '');
      setEmail(driver.email || '');
      setCity(driver.city || '');
      setAddress(driver.address || '');
      setDrivingLicenceNumber(driver.drivingLicenceNumber || '');
      setDrivingLicenceExpiry(driver.drivingLicenceExpiry || '');
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

      setRcExpiry(driver.rcExpiry || docObj.rcExpiry || docObj.rcPhoto?.expiry || '');
      setInsuranceExpiry(driver.insuranceExpiry || docObj.insuranceExpiry || docObj.insurancePhoto?.expiry || '');
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

  const handleDateSelect = useCallback((dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const selDate = new Date(y, m - 1, d);
      if (selDate < today) {
        showModal('error', 'Invalid Date', 'Expiry date cannot be in the past.');
        setActiveDatePickerField(null);
        return;
      }
    }

    if (activeDatePickerField === 'drivingLicenceExpiry') {
      setDrivingLicenceExpiry(dateStr);
    } else if (activeDatePickerField === 'rcExpiry') {
      setRcExpiry(dateStr);
    } else if (activeDatePickerField === 'insuranceExpiry') {
      setInsuranceExpiry(dateStr);
    }
    setActiveDatePickerField(null);
  }, [activeDatePickerField, showModal]);

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

  const handleSaveProfile = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedLicence = drivingLicenceNumber.trim();
    const trimmedCity = city.trim();
    const trimmedAddress = address.trim();
    const trimmedBrand = vehicleBrand.trim();
    const trimmedModel = vehicleModel.trim();
    const trimmedColor = vehicleColor.trim();
    const trimmedPlate = vehiclePlate.trim();

    if (!trimmedName) {
      showModal('error', 'Validation Error', 'Please enter your full name.');
      return;
    }
    if (!trimmedPhone) {
      showModal('error', 'Validation Error', 'Please enter your phone number.');
      return;
    }
    if (!trimmedEmail) {
      showModal('error', 'Validation Error', 'Please enter your email address.');
      return;
    }

    // Validate Expiry Dates (cannot be in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validateExpiry = (dateStr: string, fieldName: string) => {
      if (!dateStr) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true;
      const [y, m, d] = dateStr.split('-').map(Number);
      const expDate = new Date(y, m - 1, d);
      if (expDate < today) {
        showModal('error', 'Validation Error', `${fieldName} cannot be in the past.`);
        return false;
      }
      return true;
    };

    if (!validateExpiry(drivingLicenceExpiry, 'Driving Licence Expiry')) return;
    if (!validateExpiry(rcExpiry, 'RC Expiry')) return;
    if (!validateExpiry(insuranceExpiry, 'Vehicle Insurance Expiry')) return;

    const docStatuses = driver?.documentStatuses as Record<string, any> | undefined;

    const hasChanges =
      trimmedName !== (driver?.name || '') ||
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

    console.log('📤 [FRONTEND SUBMITTING PROFILE]:', {
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      city: trimmedCity,
      address: trimmedAddress,
      drivingLicenceNumber: trimmedLicence,
      drivingLicenceExpiry,
      vehicleBrand: trimmedBrand,
      vehicleModel: trimmedModel,
      vehicleColor: trimmedColor,
      vehiclePlate: trimmedPlate,
      rcExpiry,
      insuranceExpiry,
    });

    const formData = new FormData();
    formData.append('name', trimmedName);
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
  }, [address, city, driver, drivingLicenceExpiry, drivingLicenceNumber, email, insuranceExpiry, name, navigation, phone, rcExpiry, refreshProfile, showModal, vehicleBrand, vehicleColor, vehicleModel, vehiclePlate]);

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} message="Updating profile details..." />
      <StatusBar backgroundColor="#0B2246" barStyle="light-content" />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.6}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
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
        >
          {/* Personal Information */}
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

          {/* Driver Information */}
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Driver Information</Text>

          <InputField
            label="Driving Licence Number"
            placeholder="e.g. DL-123456789"
            value={drivingLicenceNumber}
            onChangeText={setDrivingLicenceNumber}
          />

          <DatePickerInputField
            label="Driving Licence Expiry"
            placeholder="Select Licence Expiry Date (YYYY-MM-DD)"
            value={drivingLicenceExpiry}
            onPress={() => setActiveDatePickerField('drivingLicenceExpiry')}
          />

          {/* Address Information */}
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Address Information</Text>

          <InputField
            label="City"
            placeholder="Enter your city"
            value={city}
            onChangeText={setCity}
          />

          <MultilineInputField
            label="Address"
            placeholder="Enter full address"
            value={address}
            onChangeText={setAddress}
          />

          {/* Vehicle Information */}
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Vehicle Information</Text>

          <InputField
            label="Vehicle Brand"
            placeholder="e.g. Toyota"
            value={vehicleBrand}
            onChangeText={setVehicleBrand}
          />

          <InputField
            label="Vehicle Model"
            placeholder="e.g. Camry"
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />

          <InputField
            label="Vehicle Color"
            placeholder="e.g. White"
            value={vehicleColor}
            onChangeText={setVehicleColor}
          />

          <InputField
            label="Vehicle Plate Number"
            placeholder="e.g. ABC-1234"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
          />

          <DatePickerInputField
            label="RC Expiry"
            placeholder="Select RC Expiry Date (YYYY-MM-DD)"
            value={rcExpiry}
            onPress={() => setActiveDatePickerField('rcExpiry')}
          />

          <DatePickerInputField
            label="Vehicle Insurance Expiry"
            placeholder="Select Insurance Expiry Date (YYYY-MM-DD)"
            value={insuranceExpiry}
            onPress={() => setActiveDatePickerField('insuranceExpiry')}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSaveProfile}
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

      <DatePickerModal
        visible={!!activeDatePickerField}
        value={activeDatePickerValue}
        onSelect={handleDateSelect}
        onClose={() => setActiveDatePickerField(null)}
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
    paddingTop: Platform.OS === 'ios' ? 44 : Math.max(StatusBar.currentHeight || 0, 24) + 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0B2246',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
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
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 20,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  disabledInput: {
    opacity: 0.6,
  },
  multilineInput: {
    height: 90,
    paddingTop: 14,
  },
  dateInputWrapper: {
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    paddingHorizontal: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  dateInputPlaceholder: {
    color: '#94A3B8',
  },
  dateCalendarIcon: {
    fontSize: 18,
  },
  submitBtn: {
    marginTop: 24,
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
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

export default ProfileScreen;
