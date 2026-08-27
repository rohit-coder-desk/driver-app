import { Platform, StatusBar } from 'react-native';

/**
 * Calculates consistent header paddingTop across devices and screen types.
 * On iOS, respects safe area top insets for notch / Dynamic Island.
 * On Android, incorporates status bar height + safe area insets to prevent status bar overlap on all phone models.
 */
export const getHeaderPaddingTop = (insetsTop: number = 0): number => {
  if (Platform.OS === 'ios') {
    return Math.max(insetsTop, 44);
  }
  const androidStatusBar = StatusBar.currentHeight || 24;
  return Math.max(insetsTop, androidStatusBar) + 12;
};

