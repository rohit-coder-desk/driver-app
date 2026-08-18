import { Platform } from 'react-native';

// --- LOCAL ANDROID EMULATOR / LOCAL DEVELOPMENT URL ---
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// --- PHYSICAL PHONE / CLOUDFLARE TUNNEL URL (Uncomment for physical phone testing) ---
// export const API_BASE_URL = 'https://assessing-football-reaction-zinc.trycloudflare.com';