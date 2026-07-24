export const ROUTES = {
  SPLASH: 'SPLASH',
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  OTP_VERIFICATION: 'OTP_VERIFICATION',
  HOME: 'HOME',
  PROFILE: 'PROFILE',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];
