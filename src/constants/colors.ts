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
  background: '#eff5ff',       // Soft blue background
  surface: '#ffffff',          // Pure white surface
  surfaceSoft: '#f8fafc',      // Light surface tint
  card: '#ffffff',             // Pure white card
  textPrimary: '#0f172a',      // Dark slate text
  textSecondary: '#475569',    // Slate-600 secondary text
  textMuted: '#64748b',        // Slate-500 muted text
  primary: '#2563eb',          // Bold blue primary
  primaryLight: '#eff6ff',     // Light blue background tint
  primaryBorder: '#bfdbfe',    // Soft blue border
  accent: '#2563eb',           // Primary Accent
  border: '#e2e8f0',           // Soft light border
  borderSolid: '#cbd5e1',      // Solid slate border
  error: '#ef4444',            // Red (Destructive actions / Errors)
  errorLight: '#fef2f2',       // Light red background for logout & errors
  errorBorder: '#fecaca',      // Soft red border
  success: '#10b981',          // Green (Online state, Success)
  successLight: '#ecfdf5',     // Light green background
  warning: '#f59e0b',          // Amber / Orange
  warningLight: '#fffbe8',     // Soft warning background
  shadow: 'rgba(15, 23, 42, 0.08)', // Drop shadow
};
