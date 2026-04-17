import messaging from '@react-native-firebase/messaging';
import { getApiUrl } from '../firebase.config';

export const registerDevice = async (idToken: string) => {
  try {
    let fcmToken: string | null = null;

    try {
      const authStatus = await messaging().requestPermission();
      if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        fcmToken = await messaging().getToken();
      }
    } catch (error) {
      console.warn('Error getting FCM token:', error);
    }

    if (!fcmToken) {
      console.warn('FCM token not available, skipping device registration');
      return;
    }

    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fcmToken,
        deviceInfo: {
          platform: 'react-native',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Device registration error:', error);
    throw error;
  }
};

export const unregisterDevice = async (idToken: string, fcmToken: string) => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/device/${encodeURIComponent(fcmToken)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Device unregistration error:', error);
    throw error;
  }
};




