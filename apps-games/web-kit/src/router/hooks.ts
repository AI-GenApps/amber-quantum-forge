import { useEffect, useState } from "preact/hooks";
import type { RouteMap, Router, ScreenEntry } from "./router";

/** Re-renders the component whenever the router's current screen changes. */
export function useCurrentScreen<R extends RouteMap>(router: Router<R>): ScreenEntry<R> {
  const [current, setCurrent] = useState<ScreenEntry<R>>(router.current);
  useEffect(() => {
    setCurrent(router.current);
    return router.subscribe((next) => setCurrent(next));
  }, [router]);
  return current;
}

/** Registers a back interceptor while `active` is true (a sheet or dialog being open). */
export function useBackInterceptor<R extends RouteMap>(
  router: Router<R>,
  active: boolean,
  interceptor: () => boolean,
): void {
  useEffect(() => {
    if (!active) return undefined;
    return router.pushBackInterceptor(interceptor);
  }, [router, active, interceptor]);
}
