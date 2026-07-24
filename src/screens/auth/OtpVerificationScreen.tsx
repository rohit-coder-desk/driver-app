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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';

export const OtpVerificationScreen = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { unverifiedPhone, otpCodeForTesting, verifyOtp, sendOtp } = useAuth();
  const navigation = useNavigation<any>();

  const handleVerify = async () => {
    setError(null);
    setResendMessage(null);
    if (!otp.trim()) {
      setError('Please enter the OTP verification code.');
      return;
    }

    if (!unverifiedPhone) {
      setError('No phone number selected for verification. Please register or login.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(unverifiedPhone, otp.trim());
      // RootNavigator will reactively switch stack to Home since token is set!
    } catch (err: any) {
      setError(err.message || err || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    if (!unverifiedPhone) {
      setError('No phone number found.');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(unverifiedPhone);
      setResendMessage('A new OTP has been sent successfully.');
    } catch (err: any) {
      setError(err.message || err || 'Failed to resend OTP.');
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
        <Loader visible={loading} message="Verifying Code..." />

        {/* Back Link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setError(null);
            navigation.goBack();
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verify Number</Text>
          <Text style={styles.subtitle}>Enter 6-Digit OTP Code</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.phoneLabel}>
            Sent to: <Text style={styles.phoneValue}>{unverifiedPhone || 'Unknown'}</Text>
          </Text>

          {/* Development Testing Aid Banner */}
          {otpCodeForTesting ? (
            <View style={styles.testBanner}>
              <Text style={styles.testBannerLabel}>🔧 DEV MODE OTP AID</Text>
              <Text style={styles.testBannerCode}>Use verification code: {otpCodeForTesting}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {resendMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{resendMessage}</Text>
            </View>
          ) : null}

          {/* OTP Code Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>6-Digit Verification Code</Text>
            <TextInput
              placeholder="e.g. 123456"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="center"
              style={[styles.input, styles.otpInput]}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity style={styles.button} onPress={handleVerify} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Verify & Proceed</Text>
          </TouchableOpacity>

          {/* Resend Action */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive code?</Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  phoneLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  phoneValue: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  testBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  testBannerLabel: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  testBannerCode: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  successText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '500',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  resendText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  resendLink: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default OtpVerificationScreen;
