import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { CustomDriverModal } from '../common/CustomDriverModal';

interface PaymentConfirmationModalProps {
  visible: boolean;
  onConfirm: (paymentMethod: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const PaymentConfirmationModal = ({
  visible,
  onConfirm,
  onCancel,
  loading = false,
}: PaymentConfirmationModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');

  const paymentOptions = [
    { id: 'cash', label: 'Cash Collected', icon: '💵' },
    { id: 'paid_online', label: 'Paid Online', icon: '💳' },
    { id: 'already_paid', label: 'Already Paid', icon: '✅' },
  ];

  return (
    <CustomDriverModal
      visible={visible}
      type="confirm_delivery"
      title="How did customer pay?"
      message="Select the payment method used for this delivery to complete the order."
      primaryButtonText={loading ? 'Completing...' : 'Confirm & Complete'}
      onPrimaryAction={() => onConfirm(selectedMethod)}
      secondaryButtonText="Cancel"
      onSecondaryAction={onCancel}
      loading={loading}
    >
      <View style={styles.optionsContainer}>
        {paymentOptions.map((opt) => {
          const isSelected = selectedMethod === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.optionRow,
                isSelected && styles.optionRowSelected,
              ]}
              onPress={() => setSelectedMethod(opt.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{opt.icon}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
              <View
                style={[
                  styles.radioCircle,
                  isSelected && styles.radioCircleSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </CustomDriverModal>
  );
};

const styles = StyleSheet.create({
  optionsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  optionRowSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#0D2A54',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  optionLabelSelected: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0066FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066FF',
  },
});
