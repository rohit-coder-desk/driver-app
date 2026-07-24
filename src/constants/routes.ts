export const ROUTES = {
  SPLASH: 'SPLASH',
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  OTP_VERIFICATION: 'OTP_VERIFICATION',
  HOME: 'HOME',
  PROFILE: 'PROFILE',
  MY_PROFILE: 'MY_PROFILE',
  EARNINGS: 'EARNINGS',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];
