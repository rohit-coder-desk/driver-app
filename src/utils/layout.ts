import { Platform } from 'react-native';

/**
 * Calculates consistent header paddingTop across devices.
 * On iOS, respects safe area top insets for notch / Dynamic Island.
 * On Android, avoids adding safe area inset double-padding when StatusBar is non-translucent.
 */
export const getHeaderPaddingTop = (insetsTop: number = 0): number => {
  if (Platform.OS === 'ios') {
    return Math.max(insetsTop, 44);
  }
  return 14;
};
