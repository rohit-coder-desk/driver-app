import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { CustomDriverModal } from '../common/CustomDriverModal';
import { EarningsIcon, CheckIcon, DocumentsIcon } from '../common/Icons';

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
    {
      id: 'cash',
      label: 'Cash Collected',
      renderIcon: (color: string) => <EarningsIcon size={18} color={color} />,
    },
    {
      id: 'paid_online',
      label: 'Paid Online',
      renderIcon: (color: string) => <DocumentsIcon size={18} color={color} />,
    },
    {
      id: 'already_paid',
      label: 'Already Paid',
      renderIcon: (color: string) => <CheckIcon size={18} color={color} />,
    },
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
          const activeColor = isSelected ? '#0066FF' : '#64748B';
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
              <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                {opt.renderIcon(activeColor)}
              </View>
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
    gap: 12,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
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
    fontSize: 22,
    marginRight: 14,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  optionLabelSelected: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0066FF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066FF',
  },
});
