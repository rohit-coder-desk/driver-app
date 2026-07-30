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
  background: '#f8fafc',       // Modern ultra-light slate background
  surface: '#ffffff',          // Pure white surface
  surfaceSoft: '#f1f5f9',      // Subtle slate surface tint
  card: '#ffffff',             // Pure white card
  textPrimary: '#0f172a',      // Dark slate primary text
  textSecondary: '#334155',    // Slate-700 secondary text
  textMuted: '#64748b',        // Slate-500 muted text
  primary: '#2563eb',          // Electric blue primary
  primaryLight: '#eff6ff',     // Light blue tint
  primaryBorder: '#bfdbfe',    // Soft blue border
  accent: '#3b82f6',           // Bright accent blue
  border: '#e2e8f0',           // Crisp subtle border
  borderSolid: '#cbd5e1',      // Slate border
  error: '#ef4444',            // Vibrant red
  errorLight: '#fef2f2',       // Soft red tint
  errorBorder: '#fecaca',      // Light red border
  success: '#10b981',          // Emerald green
  successLight: '#ecfdf5',     // Soft emerald tint
  warning: '#f59e0b',          // Warm amber
  warningLight: '#fffbe8',     // Soft amber tint
  shadow: 'rgba(15, 23, 42, 0.08)', // Soft drop shadow
};
