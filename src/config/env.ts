import { Platform } from 'react-native';

// --- LIVE DISPATCHER SERVER ---
// export const API_BASE_URL = 'http://72.60.221.214:5016';

// --- LOCAL DEVELOPMENT BACKUP ---
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
// export const API_BASE_URL = 'https://assessing-football-reaction-zinc.trycloudflare.com';
