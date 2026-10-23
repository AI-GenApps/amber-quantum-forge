import { useEffect, useRef } from "preact/hooks";
import type { AppRouter } from "../nav";

/** Registers a back interceptor while `active`; the handler may change without re-registering. */
export function useBack(router: AppRouter, active: boolean, handler: () => boolean): void {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!active) return undefined;
    return router.pushBackInterceptor(() => latest.current());
  }, [router, active]);
}
