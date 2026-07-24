import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { COLORS } from '../../constants/colors';
import { Loader } from '../../components/common/Loader';

interface SelectedFile {
  uri: string;
  type: string;
  fileName: string;
}

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
      setVehicleBrand(driver.vehicleBrand || '');
      setVehicleModel(driver.vehicleModel || '');
      setVehiclePlate(driver.vehiclePlate || '');
      setVehicleColor(driver.vehicleColor || '');
      setDrivingLicenceNumber(driver.drivingLicenceNumber || '');
      setDrivingLicenceExpiry(driver.drivingLicenceExpiry || '');
    }
  }, [driver]);

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
          else if (field === 'identityCardPhoto') setAadhaarFront(selected);
          else if (field === 'identityCardBackPhoto') setAadhaarBack(selected);
          else if (field === 'drivingLicencePhoto') setLicenceFront(selected);
          else if (field === 'drivingLicenceBackPhoto') setLicenceBack(selected);
          else if (field === 'rcPhoto') setRc(selected);
          else if (field === 'insurancePhoto') setInsurance(selected);
        }
      }
    );
  };

  const handleUpload = async () => {
    const hasTextChanges =
      vehicleBrand !== (driver?.vehicleBrand || '') ||
      vehicleModel !== (driver?.vehicleModel || '') ||
      vehiclePlate !== (driver?.vehiclePlate || '') ||
      vehicleColor !== (driver?.vehicleColor || '') ||
      drivingLicenceNumber !== (driver?.drivingLicenceNumber || '') ||
      drivingLicenceExpiry !== (driver?.drivingLicenceExpiry || '');

    const hasNewUploads =
      avatar || aadhaarFront || aadhaarBack || licenceFront || licenceBack || rc || insurance;

    if (!hasNewUploads && !hasTextChanges) {
      Alert.alert('No Changes', 'Please enter vehicle details or select a document to upload.');
      return;
    }

    const formData = new FormData();

    // Append newly chosen files
    if (avatar) formData.append('avatarPhoto', { uri: avatar.uri, type: avatar.type, name: avatar.fileName } as any);
    if (aadhaarFront) formData.append('identityCardPhoto', { uri: aadhaarFront.uri, type: aadhaarFront.type, name: aadhaarFront.fileName } as any);
    if (aadhaarBack) formData.append('identityCardBackPhoto', { uri: aadhaarBack.uri, type: aadhaarBack.type, name: aadhaarBack.fileName } as any);
    if (licenceFront) formData.append('drivingLicencePhoto', { uri: licenceFront.uri, type: licenceFront.type, name: licenceFront.fileName } as any);
    if (licenceBack) formData.append('drivingLicenceBackPhoto', { uri: licenceBack.uri, type: licenceBack.type, name: licenceBack.fileName } as any);
    if (rc) formData.append('rcPhoto', { uri: rc.uri, type: rc.type, name: rc.fileName } as any);
    if (insurance) formData.append('insurancePhoto', { uri: insurance.uri, type: insurance.type, name: insurance.fileName } as any);

    // Append text inputs
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
      Alert.alert('Success', 'Profile documents and details submitted successfully. Waiting for Admin approval.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Submission Failed', error.toString() || 'Could not save profile details.');
    } finally {
      setLoading(false);
    }
  };

  const getFileText = (selected: SelectedFile | null, serverPath: string | undefined | null) => {
    if (selected) return selected.fileName;
    if (serverPath) return 'Already Uploaded';
    return 'No file chosen';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} message="Submitting profile documents..." />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.sectionHeader}>Documents & Photos</Text>

          {/* 1. Selfie / Profile Photo */}
          <View style={styles.uploadCard}>
            <Text style={styles.documentLabel}>Selfie / Profile Photo</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => selectImage('avatarPhoto')}>
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {getFileText(avatar, driver?.avatarPhoto)}
              </Text>
            </View>
          </View>

          {/* 2. Aadhaar Front */}
          <View style={styles.uploadCard}>
            <Text style={styles.documentLabel}>Aadhaar Front</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => selectImage('identityCardPhoto')}>
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {getFileText(aadhaarFront, driver?.identityCardPhoto)}
              </Text>
            </View>
          </View>

          {/* 3. Aadhaar Back */}
          <View style={styles.uploadCard}>
            <Text style={styles.documentLabel}>Aadhaar Back</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => selectImage('identityCardBackPhoto')}>
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {getFileText(aadhaarBack, driver?.identityCardBackPhoto)}
              </Text>
            </View>
          </View>

          {/* 4. License Front */}
          <View style={styles.uploadCard}>
            <Text style={styles.documentLabel}>License Front</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => selectImage('drivingLicencePhoto')}>
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {getFileText(licenceFront, driver?.drivingLicencePhoto)}
              </Text>
            </View>
          </View>

          {/* 5. License Back */}
          <View style={styles.uploadCard}>
            <Text style={styles.documentLabel}>License Back</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => selectImage('drivingLicenceBackPhoto')}>
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {getFileText(licenceBack, driver?.drivingLicenceBackPhoto)}
              </Text>
            </View>
          </View>

          {/* 6. RC Document */}
          <View style={styles.uploadCard}>
            <Text style={styles.documentLabel}>RC Document</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => selectImage('rcPhoto')}>
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {getFileText(rc, driver?.rcPhoto)}
              </Text>
            </View>
          </View>

          {/* 7. Vehicle Insurance */}
          <View style={styles.uploadCard}>
            <Text style={styles.documentLabel}>Vehicle Insurance</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => selectImage('insurancePhoto')}>
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {getFileText(insurance, driver?.insurancePhoto)}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Vehicle Details</Text>

          {/* Vehicle Brand */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Brand</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Toyota"
              placeholderTextColor="#94a3b8"
              value={vehicleBrand}
              onChangeText={setVehicleBrand}
            />
          </View>

          {/* Vehicle Model */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Model</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Camry"
              placeholderTextColor="#94a3b8"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
          </View>

          {/* Vehicle Plate */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Plate</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ABC-1234"
              placeholderTextColor="#94a3b8"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
            />
          </View>

          {/* Vehicle Color */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Color</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. White"
              placeholderTextColor="#94a3b8"
              value={vehicleColor}
              onChangeText={setVehicleColor}
            />
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Licence Details</Text>

          {/* Driving Licence Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Driving Licence Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. DL-123456789"
              placeholderTextColor="#94a3b8"
              value={drivingLicenceNumber}
              onChangeText={setDrivingLicenceNumber}
            />
          </View>

          {/* Driving Licence Expiry */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Driving Licence Expiry</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={drivingLicenceExpiry}
              onChangeText={setDrivingLicenceExpiry}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Finish Registration</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
