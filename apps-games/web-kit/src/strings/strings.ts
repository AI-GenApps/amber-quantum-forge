export type StringTable = Readonly<Record<string, string>>;

export type ParamNames<S extends string> = S extends `${string}{${infer P}}${infer Rest}`
  ? P | ParamNames<Rest>
  : never;

export type StringParams = Readonly<Record<string, string | number>>;

export type StringParamsArg<S extends string> = [ParamNames<S>] extends [never]
  ? []
  : [params: Readonly<Record<ParamNames<S>, string | number>>];

export interface Strings<T extends StringTable> {
  t<K extends keyof T & string>(key: K, ...params: StringParamsArg<T[K]>): string;
  has(key: string): key is keyof T & string;
  keys(): Array<keyof T & string>;
}

export function interpolate(template: string, params: StringParams | undefined): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** English-only typed string table. Keys and `{placeholder}` names are checked at compile time. */
export function defineStrings<const T extends StringTable>(table: T): Strings<T> {
  return {
    t(key, ...params) {
      const template = table[key];
      if (template === undefined) throw new Error(`Unknown string key: ${key}`);
      return interpolate(template, params[0] as StringParams | undefined);
    },
    has: (key): key is keyof T & string => Object.hasOwn(table, key),
    keys: () => Object.keys(table) as Array<keyof T & string>,
  };
}

/** English plural selection: `plural(1, "star", "stars")`. */
export function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}
