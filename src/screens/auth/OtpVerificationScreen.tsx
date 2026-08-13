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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';

export const OtpVerificationScreen = () => {
  const insets = useSafeAreaInsets();
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top + 16, 24), paddingBottom: Math.max(insets.bottom + 20, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Loader visible={loading} message="Verifying Code..." />

        {/* Back Link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setError(null);
            if (navigation.canGoBack()) {
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
    backgroundColor: '#061A3A',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#0066FF',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  phoneLabel: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  phoneValue: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  testBanner: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  testBannerLabel: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  testBannerCode: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
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
  successContainer: {
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#15803D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  successText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 8,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    minHeight: 48,
    gap: 8,
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  resendLink: {
    color: '#0066FF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});

export default OtpVerificationScreen;
