import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';

// Custom Graphical Eye Icon Component
const EyeIcon = ({ visible }: { visible: boolean }) => {
  return (
    <View style={styles.eyeIconContainer}>
      <View style={styles.eyeOuter} />
      <View style={styles.eyeInner} />
      {!visible && <View style={styles.eyeSlash} />}
    </View>
  );
};

export const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, unverifiedPhone } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/phone and password.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      if (err.message === 'VERIFY_OTP_REQUIRED' || unverifiedPhone) {
        navigation.navigate(ROUTES.OTP_VERIFICATION);
      } else {
        setError(err.message || err || 'Invalid username or password.');
      }
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
        <Loader visible={loading} message="Authenticating..." />

        {/* Top Header & Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Driver Login</Text>
          <Text style={styles.subtitle}>Welcome back! Please login to continue your deliveries.</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input Form */}
        <View style={styles.formContainer}>
          {/* Username / Phone Field */}
          <Text style={styles.label}>Username or Phone Number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter username or phone number"
              placeholderTextColor="#64748B"
              value={username}
              onChangeText={(txt) => {
                setUsername(txt);
                setError(null);
              }}
              autoCapitalize="none"
            />
          </View>

          {/* Password Field */}
          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#64748B"
              secureTextEntry={securePassword}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
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

          {/* Options Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate(ROUTES.REGISTER)}
              activeOpacity={0.8}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate(ROUTES.REGISTER)}
            activeOpacity={0.8}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account? <Text style={styles.registerHighlight}>Register as Driver</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Dispatcher Logistics Partner Platform</Text>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
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
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 8,
  },
  eyeIconContainer: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeOuter: {
    width: 18,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#94A3B8',
  },
  eyeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    position: 'absolute',
  },
  eyeSlash: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#EF4444',
    transform: [{ rotate: '-45deg' }],
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#0066FF',
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#0066FF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066FF',
  },
  loginBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 18,
  },
  registerLinkText: {
    fontSize: 13.5,
    color: '#94A3B8',
  },
  registerHighlight: {
    color: '#0066FF',
    fontWeight: '700',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default LoginScreen;
