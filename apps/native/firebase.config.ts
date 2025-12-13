import Constants from 'expo-constants';

const getEnvVar = (key: string, extraKey?: string): string | undefined => {
  if (extraKey && Constants.expoConfig?.extra?.[extraKey]) {
    return Constants.expoConfig.extra[extraKey] as string;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const getFirebaseConfig = () => {
  const apiKey = getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', 'firebaseApiKey');
  const authDomain = getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'firebaseAuthDomain');
  const projectId = getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'firebaseProjectId');
  const storageBucket = getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'firebaseStorageBucket');
  const messagingSenderId = getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'firebaseMessagingSenderId');
  const appId = getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID', 'firebaseAppId');

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    throw new Error('Firebase configuration is missing. Please set Firebase environment variables.');
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

export const firebaseConfig = getFirebaseConfig();

export const getApiUrl = (): string => {
  const apiUrl = getEnvVar('EXPO_PUBLIC_API_URL', 'apiUrl');
  return apiUrl || 'http://localhost:3000';
};

