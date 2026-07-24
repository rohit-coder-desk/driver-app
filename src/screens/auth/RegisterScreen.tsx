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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';

// Custom Graphical Eye Icon Component with Slash toggle
const EyeIcon = ({ visible }: { visible: boolean }) => {
  return (
    <View style={styles.eyeIconContainer}>
      <View style={styles.eyeOuter} />
      <View style={styles.eyeInner} />
      {!visible && <View style={styles.eyeSlash} />}
    </View>
  );
};

interface CountryCode {
  code: string;
  flag: string;
  name: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', flag: '🇮🇳', name: 'India (+91)' },
  { code: '+1', flag: '🇺🇸', name: 'USA/Canada (+1)' },
  { code: '+44', flag: '🇬🇧', name: 'UK (+44)' },
  { code: '+971', flag: '🇦🇪', name: 'UAE (+971)' },
  { code: '+61', flag: '🇦🇺', name: 'Australia (+61)' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore (+65)' },
];

export const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
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
      setError('Full Name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Full Name must be at least 2 characters long.');
      return;
    }

    // 2. Username Validation
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Username is required.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
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
      // Remove leading zeros if typed
      rawPhone = rawPhone.replace(/^0+/, '');
      if (rawPhone.length < 7 || rawPhone.length > 12) {
        setError('Please enter a valid mobile number (e.g. 10 digits).');
        return;
      }
      finalPhone = `${selectedCountry.code}${rawPhone}`;
    }

    // 4. Email Validation (if provided)
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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
        trimmedEmail || undefined,
        password,
        undefined,
        trimmedUsername
      );
      // Navigate to OTP verification screen on success
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
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Loader visible={loading} message="Registering Driver..." />

        {/* Screen Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Register Driver</Text>
          <Text style={styles.subtitle}>Join CDX Last Mile Fleet</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Mobile Number with Country Code Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
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

              <TextInput
                style={styles.phoneInput}
                placeholder="Enter mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={12}
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={securePassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setSecurePassword(!securePassword)} style={styles.eyeButton}>
                <EyeIcon visible={!securePassword} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            <Text style={styles.footerLink}>
              Already have an account? <Text style={styles.footerLinkHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
          <View style={styles.countryModalCard}>
            <Text style={styles.countryModalTitle}>Select Country Code</Text>
            {COUNTRY_CODES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.countryItem,
                  selectedCountry.code === item.code && styles.selectedCountryItem,
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setCountryModalVisible(false);
                }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                {selectedCountry.code === item.code && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '500',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 12,
  },
  flagText: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCodeText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  dropdownArrow: {
    color: '#64748b',
    fontSize: 10,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  eyeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eyeOuter: {
    width: 20,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    backgroundColor: 'transparent',
  },
  eyeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748b',
    position: 'absolute',
  },
  eyeSlash: {
    width: 24,
    height: 2,
    backgroundColor: '#64748b',
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerLink: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  footerLinkHighlight: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  countryModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
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
    backgroundColor: '#eff6ff',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  checkIcon: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
    marginBottom: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
});

export default RegisterScreen;
