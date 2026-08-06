import { TextStyle, Platform } from 'react-native';

export const FONT_FAMILY = {
  regular: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'System' }),
  medium: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium', default: 'System' }),
  semibold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'System' }),
  bold: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'System' }),
};

export const FONT_WEIGHT = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const TYPOGRAPHY = {
  screenTitle: {
    fontSize: 30,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 36,
  } as TextStyle,
  
  screenTitleBold: {
    fontSize: 30,
    fontFamily: FONT_FAMILY.bold,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 36,
  } as TextStyle,

  sectionTitle: {
    fontSize: 22,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 28,
  } as TextStyle,

  cardTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 24,
  } as TextStyle,

  modalTitle: {
    fontSize: 24,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 30,
  } as TextStyle,

  modalBody: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.regular,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: 24,
  } as TextStyle,

  body: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.regular,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: 22,
  } as TextStyle,

  bodyMedium: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.medium,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 22,
  } as TextStyle,

  bodySemiBold: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 22,
  } as TextStyle,

  secondary: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: 20,
  } as TextStyle,

  secondaryMedium: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 20,
  } as TextStyle,

  secondarySemiBold: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 20,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 16,
  } as TextStyle,

  captionRegular: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: 16,
  } as TextStyle,

  button: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.semibold,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 22,
  } as TextStyle,

  navLabel: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.medium,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 20,
  } as TextStyle,

  inputText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.regular,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: 22,
  } as TextStyle,

  inputLabel: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 20,
  } as TextStyle,
};
