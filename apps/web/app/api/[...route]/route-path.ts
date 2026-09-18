export function rewriteApiPath(request: Request): Request {
  const url = new URL(request.url);
  if (url.pathname === "/api") url.pathname = "/";
  else if (url.pathname.startsWith("/api/")) url.pathname = url.pathname.slice(4);
  return new Request(url, request);
}
