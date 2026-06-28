// mobile_app/src/lib/api.ts
import { Platform } from 'react-native';

const LOCAL_IP = '192.168.1.46';
const PORT = '8000';
const PROD_URL = 'https://newdash-ciq9.onrender.com';

// Currently set to production. 
// For local testing, switch to: Platform.OS === 'web' ? `http://localhost:${PORT}` : `http://${LOCAL_IP}:${PORT}`
export const API_URL = PROD_URL;
