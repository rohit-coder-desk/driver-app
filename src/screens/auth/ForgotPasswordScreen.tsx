import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../services/AuthService';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';
import { EyeIcon } from '../../components/common/EyeIcon';
import { ALL_COUNTRY_CODES, CountryCode } from '../../constants/countryCodes';
import { CustomDriverModal } from '../../components/common/CustomDriverModal';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();

  // Step state: 1 = Send OTP (Enter Phone), 2 = Verify OTP & Reset Password
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(ALL_COUNTRY_CODES[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  // Feedback State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Success Dialog State
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Format and validate phone
  const getFullPhone = () => {
    let raw = phoneInput.trim().replace(/\s+/g, '');
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    raw = raw.replace(/^0+/, '');
    return `${selectedCountry.code}${raw}`;
  };

  // Handle Step 1: Send OTP
  const handleSendOtp = async () => {
    setError(null);
    setInfoMsg(null);
    setDevOtp(null);

    const fullPhone = getFullPhone();
    if (!fullPhone) {
      setError('Please enter your registered mobile number or username.');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.sendOtp(fullPhone);
      setFormattedPhone(fullPhone);
      if (res?.otp) {
        setDevOtp(res.otp);
      }
      setInfoMsg('OTP sent successfully to your mobile number.');
      setStep(2);
    } catch (err: any) {
      setError(err.toString() || 'Failed to send OTP. Account not found.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP in Step 2
  const handleResendOtp = async () => {
    setError(null);
    setInfoMsg(null);
    setDevOtp(null);

    if (!formattedPhone) return;

    setLoading(true);
    try {
      const res = await AuthService.sendOtp(formattedPhone);
      if (res?.otp) {
        setDevOtp(res.otp);
      }
      setInfoMsg('A new OTP has been sent to your mobile number.');
    } catch (err: any) {
      setError(err.toString() || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Submit Reset Password
  const handleResetPassword = async () => {
    setError(null);
    setInfoMsg(null);

    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword({
        phone: formattedPhone,
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });
      setSuccessModalVisible(true);
    } catch (err: any) {
      setError(err.toString() || 'Failed to reset password. Please check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Loader visible={loading} message={step === 1 ? 'Sending OTP...' : 'Resetting Password...'} />

        {/* Back Link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 2) {
              setStep(1);
              setError(null);
              setInfoMsg(null);
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(ROUTES.LOGIN);
            }
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Top Header & Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your registered phone number to receive an OTP'
              : `Enter the OTP sent to ${formattedPhone} and your new password`}
          </Text>
        </View>

        {/* Error Box */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Info / Dev OTP Box */}
        {infoMsg && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>✅ {infoMsg}</Text>
            {devOtp && (
              <Text style={styles.devOtpText}>
                (Development OTP Code: <Text style={{ fontWeight: '800' }}>{devOtp}</Text>)
              </Text>
            )}
          </View>
        )}

        {/* STEP 1: ENTER PHONE NUMBER */}
        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Registered Mobile Number</Text>
            <View style={styles.phoneInputRow}>
              {/* Country Code Picker Button */}
              <TouchableOpacity
                style={styles.countryPickerBtn}
                onPress={() => setCountryModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlagText}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              {/* Mobile Number Input */}
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={phoneInput}
                onChangeText={(txt) => {
                  setPhoneInput(txt);
                  setError(null);
                }}
                maxLength={15}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Send OTP Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryLinkText}>
                Remember your password? <Text style={styles.highlightText}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* STEP 2: ENTER OTP & NEW PASSWORD */
          <View style={styles.card}>
            {/* OTP Code Field */}
            <Text style={styles.label}>6-Digit Verification Code</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { letterSpacing: 4, fontWeight: '700', fontSize: 18 }]}
                placeholder="------"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(txt) => {
                  setOtp(txt);
                  setError(null);
                }}
              />
            </View>

            {/* New Password */}
            <Text style={[styles.label, { marginTop: 16 }]}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#64748B"
                secureTextEntry={securePassword}
                value={newPassword}
                onChangeText={(txt) => {
                  setNewPassword(txt);
                  setError(null);
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setSecurePassword(!securePassword)}
                activeOpacity={0.7}
              >
                <EyeIcon visible={!securePassword} />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <Text style={[styles.label, { marginTop: 16 }]}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#64748B"
                secureTextEntry={secureConfirmPassword}
                value={confirmPassword}
                onChangeText={(txt) => {
                  setConfirmPassword(txt);
                  setError(null);
                }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                activeOpacity={0.7}
              >
                <EyeIcon visible={!secureConfirmPassword} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Reset Password</Text>
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive OTP? </Text>
              <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                <Text style={styles.resendBtnText}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Country Code Modal */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryList}>
              {ALL_COUNTRY_CODES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryModalVisible(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Password Reset Success Modal */}
      <CustomDriverModal
        visible={successModalVisible}
        type="order_accepted"
        title="Password Reset Successful! 🎉"
        message="Your password has been reset successfully. Please log in with your new password."
        primaryButtonText="Go to Login"
        onPrimaryAction={() => {
          setSuccessModalVisible(false);
          navigation.navigate(ROUTES.LOGIN);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3A',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#052E16',
    borderColor: '#15803D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  devOtpText: {
    color: '#86EFAC',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter-Medium',
  },
  card: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    marginRight: 8,
  },
  countryFlagText: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#94A3B8',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    height: '100%',
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  secondaryLink: {
    marginTop: 20,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryLinkText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  highlightText: {
    color: '#0066FF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    minHeight: 48,
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  resendBtnText: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 58, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0B2246',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  countryList: {
    maxHeight: 300,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
    minHeight: 52,
  },
  countryItemFlag: {
    fontSize: 22,
    marginRight: 14,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  countryItemCode: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

export default ForgotPasswordScreen;
