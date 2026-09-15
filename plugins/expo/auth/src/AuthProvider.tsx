import auth from "@react-native-firebase/auth";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { exchangeToken, refreshToken, revokeToken } from "./apiClient";
import { clearTokens, getTokens, saveTokens } from "./authStorage";
import { isTokenExpiringSoon } from "./tokenUtils";

export type { ExchangeResponse } from "./apiClient";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        try {
          const tokens = await exchangeToken(idToken, API_BASE_URL);
          await saveTokens(tokens.accessToken, tokens.refreshToken);
          setAccessToken(tokens.accessToken);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } catch {
          setUser(null);
          setAccessToken(null);
        }
      } else {
        setUser(null);
        setAccessToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { accessToken: stored, refreshToken: storedRefresh } = await getTokens();
    if (!stored || !storedRefresh) return null;
    if (!isTokenExpiringSoon(stored)) return stored;
    const tokens = await refreshToken(storedRefresh, API_BASE_URL);
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    return tokens.accessToken;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    throw new Error("signInWithGoogle: implement with GoogleSignin in consuming app");
  }, []);

  const signInWithApple = useCallback(async (): Promise<void> => {
    throw new Error("signInWithApple: implement with expo-apple-authentication in consuming app");
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const { refreshToken: storedRefresh } = await getTokens();
    if (storedRefresh) await revokeToken(storedRefresh, API_BASE_URL);
    await clearTokens();
    setUser(null);
    setAccessToken(null);
    await auth().signOut();
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      accessToken,
      signInWithGoogle,
      signInWithApple,
      signOut,
      getAccessToken,
    }),
    [user, loading, accessToken, signInWithGoogle, signInWithApple, signOut, getAccessToken],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
