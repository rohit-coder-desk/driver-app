import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';
import { EyeIcon } from '../../components/common/EyeIcon';

import { ALL_COUNTRY_CODES, CountryCode } from '../../constants/countryCodes';

export const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(ALL_COUNTRY_CODES[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [securePassword, setSecurePassword] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    setError(null);

    // 1. Name Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('First name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('First name must be at least 2 characters long.');
      return;
    }

    // 2. Username Validation
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Last name is required.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('Last name must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Last name can only contain letters, numbers, and underscores.');
      return;
    }

    // 3. Mobile Number Validation
    let rawPhone = phone.trim().replace(/\s+/g, '');
    if (!rawPhone) {
      setError('Mobile Number is required.');
      return;
    }

    let finalPhone = '';
    if (rawPhone.startsWith('+')) {
      finalPhone = rawPhone;
    } else {
      rawPhone = rawPhone.replace(/^0+/, '');
      if (!/^\d{10}$/.test(rawPhone)) {
        setError('Mobile Number must be exactly 10 digits.');
        return;
      }
      finalPhone = `${selectedCountry.code}${rawPhone}`;
    }

    // 4. Email Validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // 5. Password Validation
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(
        trimmedName,
        finalPhone,
        trimmedEmail,
        password,
        undefined,
        trimmedUsername
      );
      navigation.navigate(ROUTES.OTP_VERIFICATION);
    } catch (err: any) {
      setError(err.message || err || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#061A3A" />
      <View style={styles.innerContainer}>
        <Loader visible={loading} message="Registering Driver..." />

        {/* Top Header & Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Register Driver</Text>
          <Text style={styles.subtitle}>Join CDX Last Mile Fleet</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* First Name & Last Name Row */}
          <View style={styles.nameRow}>
            <View style={styles.halfInputLeft}>
              <Text style={styles.label}>First Name *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={(txt) => {
                    setName(txt);
                    setError(null);
                  }}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.halfInputRight}>
              <Text style={styles.label}>Last Name *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#64748B"
                  value={username}
                  onChangeText={(txt) => {
                    setUsername(txt);
                    setError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          {/* Mobile Number */}
          <Text style={styles.fieldMargin}>Mobile Number *</Text>
          <View style={styles.phoneInputRow}>
            <TouchableOpacity
              style={styles.countryPickerBtn}
              onPress={() => setCountryModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.flagText}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <View style={styles.phoneInputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Mobile number"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(txt) => {
                  setPhone(txt);
                  setError(null);
                }}
                maxLength={10}
              />
            </View>
          </View>

          {/* Email Address */}
          <Text style={styles.fieldMargin}>Email Address *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                setError(null);
              }}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <Text style={styles.fieldMargin}>Password *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#64748B"
              secureTextEntry={securePassword}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setSecurePassword(!securePassword)}
              activeOpacity={0.7}
            >
              <EyeIcon visible={!securePassword} />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85}>
            <Text style={styles.registerBtnText}>Register</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
            activeOpacity={0.8}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Dispatcher Logistics Partner Platform</Text>
        </View>
      </View>

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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3A',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 58,
    height: 58,
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
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfInputLeft: {
    flex: 1,
    marginRight: 6,
  },
  halfInputRight: {
    flex: 1,
    marginLeft: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginBottom: 8,
  },
  fieldMargin: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  flagText: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginRight: 6,
  },
  dropdownArrow: {
    color: '#94A3B8',
    fontSize: 12,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
  },
  eyeBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  registerBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  loginLinkText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  loginHighlight: {
    color: '#0066FF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
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

export default RegisterScreen;
