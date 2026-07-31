import { Platform } from 'react-native';

// --- PHYSICAL PHONE / CLOUDFLARE TUNNEL URL (Uncomment when testing on physical device) ---
// export const API_BASE_URL = 'https://registry-finger-therapeutic-newark.trycloudflare.com';

// --- LOCAL ANDROID EMULATOR DEVELOPMENT URL (Active for Local Emulator) ---
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';