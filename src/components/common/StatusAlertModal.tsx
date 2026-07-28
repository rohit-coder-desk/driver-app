import React from 'react';
import { CustomDriverModal, DriverModalType } from './CustomDriverModal';

export type AlertType = 'success' | 'location' | 'pickup' | 'destination' | 'delivery' | 'error' | 'info';

export interface StatusAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  buttonText?: string;
  onConfirm: () => void;
}

export const StatusAlertModal: React.FC<StatusAlertModalProps> = ({
  visible,
  title,
  message,
  type = 'success',
  buttonText = 'OK, Got it!',
  onConfirm,
}) => {
  const mapTypeToDriverModalType = (t: AlertType, titleStr: string): DriverModalType => {
    const titleLower = titleStr.toLowerCase();
    if (t === 'error' || titleLower.includes('fail') || titleLower.includes('error')) {
      return 'error';
    }
    if (t === 'location' || titleLower.includes('near destination') || titleLower.includes('reached')) {
      return 'near_destination';
    }
    if (t === 'pickup' || titleLower.includes('pickup')) {
      return 'confirm_pickup';
    }
    if (t === 'delivery' || titleLower.includes('completed')) {
      return 'delivered';
    }
    return 'order_accepted';
  };

  return (
    <CustomDriverModal
      visible={visible}
      type={mapTypeToDriverModalType(type, title)}
      title={title}
      message={message}
      primaryButtonText={buttonText}
      onPrimaryAction={onConfirm}
    />
  );
};
