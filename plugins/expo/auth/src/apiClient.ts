export interface ExchangeResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export async function exchangeToken(
  firebaseIdToken: string,
  apiBaseUrl: string,
): Promise<ExchangeResponse> {
  const res = await fetch(`${apiBaseUrl}/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebaseIdToken }),
  });
  if (!res.ok) throw new Error(`exchange failed: ${res.status}`);
  return res.json() as Promise<ExchangeResponse>;
}

export async function refreshToken(token: string, apiBaseUrl: string): Promise<RefreshResponse> {
  const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: token }),
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
  return res.json() as Promise<RefreshResponse>;
}

export async function revokeToken(token: string, apiBaseUrl: string): Promise<void> {
  await fetch(`${apiBaseUrl}/auth/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: token }),
  });
}

export async function registerDevice(
  apiAccessToken: string,
  fcmToken: string,
  deviceInfo: unknown,
  apiBaseUrl: string,
): Promise<void> {
  await fetch(`${apiBaseUrl}/auth/register-device`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiAccessToken}`,
    },
    body: JSON.stringify({ fcmToken, deviceInfo }),
  });
}
