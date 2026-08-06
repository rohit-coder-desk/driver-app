import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { COMPONENT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/components';
import { FONT_FAMILY, FONT_WEIGHT } from '../../theme/typography';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = () => {
    let base: ViewStyle = { ...styles.baseButton };

    if (size === 'lg') {
      base.height = 56;
    } else if (size === 'sm') {
      base.height = 48;
      base.paddingHorizontal = 16;
    } else {
      base.height = COMPONENT_SIZE.buttonHeight; // 54px
    }

    if (fullWidth) {
      base.width = '100%';
    }

    switch (variant) {
      case 'secondary':
        base.backgroundColor = COLORS.surfaceSoft;
        base.borderWidth = 1;
        base.borderColor = COLORS.border;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = COLORS.primary;
        break;
      case 'danger':
        base.backgroundColor = COLORS.error;
        break;
      case 'primary':
      default:
        base.backgroundColor = COLORS.primary;
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    return base;
  };

  const getTextStyle = () => {
    let base: TextStyle = { ...styles.baseText };

    switch (variant) {
      case 'secondary':
        base.color = COLORS.textSecondary;
        break;
      case 'outline':
        base.color = COLORS.primary;
        break;
      case 'danger':
      case 'primary':
      default:
        base.color = '#FFFFFF';
        break;
    }

    if (size === 'sm') {
      base.fontSize = 14;
    } else {
      base.fontSize = 16;
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'secondary' ? COLORS.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), icon ? { marginLeft: 8 } : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 54,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: COMPONENT_SIZE.touchTargetMin,
    ...SHADOWS.sm,
  },
  baseText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
  },
});
