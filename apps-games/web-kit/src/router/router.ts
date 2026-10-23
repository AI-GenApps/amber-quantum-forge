export type RouteMap = Record<string, unknown>;

type Name<R extends RouteMap> = keyof R & string;

export type ScreenEntry<R extends RouteMap> = {
  [K in Name<R>]: { readonly name: K; readonly params: R[K] };
}[Name<R>];

/** Screens whose params may be undefined take no second argument. */
export type ParamsArg<R extends RouteMap, K extends Name<R>> = undefined extends R[K]
  ? [params?: R[K]]
  : [params: R[K]];

export type RouterAction = "push" | "pop" | "replace" | "reset";

export type RouterListener<R extends RouteMap> = (
  current: ScreenEntry<R>,
  action: RouterAction,
) => void;

export interface Router<R extends RouteMap> {
  readonly current: ScreenEntry<R>;
  readonly stack: readonly ScreenEntry<R>[];
  readonly canGoBack: boolean;
  push<K extends Name<R>>(name: K, ...params: ParamsArg<R, K>): void;
  /** Removes the top screen. False (and no change) when only the root is left. */
  pop(): boolean;
  /** Pops until `name` is on top. False when it is not in the stack. */
  popTo(name: Name<R>): boolean;
  replace<K extends Name<R>>(name: K, ...params: ParamsArg<R, K>): void;
  /** Drops the whole history and shows one screen. */
  reset<K extends Name<R>>(name: K, ...params: ParamsArg<R, K>): void;
  /**
   * Handles a back press: the newest interceptor that returns true wins, otherwise the top
   * screen is popped. Returns false at the root so the caller can exit or ask to quit.
   */
  handleBack(): boolean;
  /** Lets an open sheet, modal or tutorial consume back presses. Returns a remover. */
  pushBackInterceptor(interceptor: () => boolean): () => void;
  subscribe(listener: RouterListener<R>): () => void;
}

export function createRouter<R extends RouteMap, K extends Name<R> = Name<R>>(
  initialName: K,
  ...initialParams: ParamsArg<R, K>
): Router<R> {
  const entry = (name: Name<R>, params: unknown): ScreenEntry<R> =>
    ({ name, params }) as ScreenEntry<R>;

  let stack: ScreenEntry<R>[] = [entry(initialName, initialParams[0])];
  const interceptors: Array<() => boolean> = [];
  const listeners = new Set<RouterListener<R>>();

  const top = (): ScreenEntry<R> => stack[stack.length - 1] as ScreenEntry<R>;
  const emit = (action: RouterAction): void => {
    const current = top();
    for (const listener of [...listeners]) listener(current, action);
  };

  const router: Router<R> = {
    get current() {
      return top();
    },
    get stack() {
      return stack.slice();
    },
    get canGoBack() {
      return stack.length > 1;
    },
    push(name, ...params) {
      stack = [...stack, entry(name, params[0])];
      emit("push");
    },
    pop() {
      if (stack.length <= 1) return false;
      stack = stack.slice(0, -1);
      emit("pop");
      return true;
    },
    popTo(name) {
      const index = stack.map((e) => e.name).lastIndexOf(name);
      if (index < 0) return false;
      if (index < stack.length - 1) {
        stack = stack.slice(0, index + 1);
        emit("pop");
      }
      return true;
    },
    replace(name, ...params) {
      stack = [...stack.slice(0, -1), entry(name, params[0])];
      emit("replace");
    },
    reset(name, ...params) {
      stack = [entry(name, params[0])];
      emit("reset");
    },
    handleBack() {
      for (let i = interceptors.length - 1; i >= 0; i -= 1) {
        if ((interceptors[i] as () => boolean)()) return true;
      }
      return router.pop();
    },
    pushBackInterceptor(interceptor) {
      interceptors.push(interceptor);
      return () => {
        const index = interceptors.lastIndexOf(interceptor);
        if (index >= 0) interceptors.splice(index, 1);
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
  return router;
}
