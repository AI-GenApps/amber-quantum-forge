function decodeExp(jwt: string): number {
  const payload = jwt.split(".")[1];
  const decoded = JSON.parse(atob(payload)) as { exp: number };
  return decoded.exp;
}

export function isTokenExpired(jwt: string): boolean {
  return decodeExp(jwt) < Date.now() / 1000;
}

export function isTokenExpiringSoon(jwt: string, windowSeconds = 300): boolean {
  return decodeExp(jwt) < Date.now() / 1000 + windowSeconds;
}
