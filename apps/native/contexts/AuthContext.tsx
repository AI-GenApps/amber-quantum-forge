import auth, { type FirebaseAuthTypes } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import type React from "react";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { registerDevice } from "../services/deviceRegistration";
import {
  initializeRevenueCat,
  logoutRevenueCat,
  setRevenueCatUserId,
} from "../services/revenuecat";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    const initializeServices = async () => {
      try {
        await initializeRevenueCat();
      } catch (error) {
        console.error("Error initializing RevenueCat:", error);
      }
    };

    initializeServices();

    const unsubscribe = auth().onAuthStateChanged(
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        if (firebaseUser) {
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          setUser(userData);

          try {
            const idToken = await firebaseUser.getIdToken();
            await registerDevice(idToken);

            try {
              await setRevenueCatUserId(firebaseUser.uid);
            } catch (error) {
              console.error("Error setting RevenueCat user ID:", error);
            }
          } catch (error) {
            console.error("Error registering device:", error);
          }
        } else {
          setUser(null);
          try {
            await logoutRevenueCat();
          } catch (error) {
            console.error("Error logging out RevenueCat user:", error);
          }
        }
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      if (Platform.OS !== "ios") {
        throw new Error("Apple Sign In is only available on iOS");
      }

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = appleCredential;
      if (!identityToken) {
        throw new Error("Apple Sign In failed: No identity token");
      }

      const credential = auth.AppleAuthProvider.credential(identityToken);

      await auth().signInWithCredential(credential);
    } catch (error) {
      console.error("Apple Sign In Error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign Out Error:", error);
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error("Error getting ID token:", error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
