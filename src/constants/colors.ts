export interface AppColors {
  background: string;
  surface: string;
  surfaceSoft: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryBorder: string;
  accent: string;
  border: string;
  borderSolid: string;
  error: string;
  errorLight: string;
  errorBorder: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  shadow: string;
}

export const COLORS: AppColors = {
  background: '#061A3A',       // Deep Navy background
  surface: '#0B2246',          // Surface Navy
  surfaceSoft: '#0D2A54',      // Elevated Surface Navy
  card: '#0B2246',             // Surface Navy Card
  textPrimary: '#FFFFFF',      // Crisp White Primary Text
  textSecondary: '#94A3B8',    // Muted Slate Secondary Text
  textMuted: '#64748B',        // Muted Slate Text
  primary: '#0066FF',          // Electric Blue Primary
  primaryLight: '#0D2A54',     // Dark Navy Tint
  primaryBorder: '#1E3A8A',    // Navy Border
  accent: '#0066FF',           // Bright Accent Blue
  border: '#1E3A8A',           // Crisp Navy Border
  borderSolid: '#1E3A8A',      // Solid Navy Border
  error: '#EF4444',            // Vibrant Red
  errorLight: 'rgba(239, 68, 68, 0.15)', // Soft Red Tint
  errorBorder: '#EF4444',      // Red Border
  success: '#10B981',          // Emerald Green
  successLight: '#052E16',     // Soft Green Tint
  warning: '#F59E0B',          // Warm Amber
  warningLight: '#451A03',     // Soft Amber Tint
  shadow: 'rgba(0, 0, 0, 0.4)', // Deep shadow
};
