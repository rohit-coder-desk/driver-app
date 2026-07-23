import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { VehicleType } from '../../types/api.types';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { Loader } from '../../components/common/Loader';

export const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const { register } = useAuth();
  const navigation = useNavigation<any>();

  // Fetch active vehicle types dynamically on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const list = await DriverService.getVehicleTypes();
        setVehicleTypes(list);
        if (list.length > 0) {
          setSelectedVehicleId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleRegister = async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || !password.trim()) {
      setError('Name, phone number, and password are required fields.');
      return;
    }

    if (!selectedVehicleId) {
      setError('Please select a vehicle type.');
      return;
    }

    // Format phone to have + country prefix if not present for compliance
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      // Default to Indian prefix (+91) if it starts with standard 10 digit series, or let users type it
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        setError('Please enter your phone number with country code (e.g. +919876543210).');
        return;
      }
    }

    setLoading(true);
    try {
      await register(
        name.trim(),
        formattedPhone,
        email.trim() || undefined,
        password,
        selectedVehicleId
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

        {/* Back Link */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Login</Text>
        </TouchableOpacity>

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
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Amit Kumar"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +919876543210 or 10-digit number"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. amit@example.com"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor="#475569"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Dynamic Vehicle Type Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            {loadingVehicles ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.vehicleLoader} />
            ) : (
              <View style={styles.vehicleGrid}>
                {vehicleTypes.map((vehicle) => {
                  const isSelected = selectedVehicleId === vehicle.id;
                  return (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[styles.vehicleCard, isSelected && styles.selectedVehicleCard]}
                      onPress={() => setSelectedVehicleId(vehicle.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.vehicleTitle, isSelected && styles.selectedVehicleText]}>
                        {vehicle.title}
                      </Text>
                      {vehicle.description ? (
                        <Text style={styles.vehicleDesc}>{vehicle.description}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity style={styles.button} onPress={handleRegister} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Submit Registration</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  vehicleLoader: {
    alignSelf: 'flex-start',
    marginVertical: 10,
    marginLeft: 8,
  },
  vehicleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  selectedVehicleCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  vehicleTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedVehicleText: {
    color: COLORS.primaryLight,
  },
  vehicleDesc: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
export default RegisterScreen;
