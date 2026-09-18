import { app } from "@repo/api";
import { rewriteApiPath } from "./route-path";

const handle = (request: Request) => app.fetch(rewriteApiPath(request));

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
export const OPTIONS = handle;
export const HEAD = handle;
export const TRACE = handle;
export const CONNECT = handle;
export const MERGE = handle;
export const COPY = handle;
export const LOCK = handle;
export const MKCOL = handle;
