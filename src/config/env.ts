import { Platform } from 'react-native';

// --- PHYSICAL PHONE / CLOUDFLARE TUNNEL URL (Active for Physical Phone & Remote Testing) ---
// export const API_BASE_URL = 'https://targets-directive-gsm-this.trycloudflare.com';
// --- LOCAL ANDROID EMULATOR DEVELOPMENT URL (Uncomment for local emulator only) ---
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';