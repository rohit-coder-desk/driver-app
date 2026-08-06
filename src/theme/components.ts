import { ViewStyle } from 'react-native';
import { COLORS } from '../constants/colors';

export const COMPONENT_SIZE = {
  buttonHeight: 54,           // Taller buttons (52–56px)
  buttonHeightCompact: 48,
  touchTargetMin: 48,         // Minimum touch target 48px
  inputHeight: 54,
  iconSm: 20,
  iconMd: 24,                 // Larger icons (24–28px)
  iconLg: 28,
  iconXl: 36,
  avatarSm: 44,
  avatarMd: 56,
  avatarLg: 80,               // Larger profile avatar
  avatarXl: 96,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,                     // 12–16px border radius
  lg: 14,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,

  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,

  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,
};
