import { describe, expect, it } from "vitest";
import { RULES } from "../src/constants";
import { clampValue, formatDuration, formatNumber, formatNumberWords } from "../src/numbers";
import { lcg } from "./fixtures/catalog";

const FORMAT_CASES: ReadonlyArray<readonly [number, string]> = [
  [0, "0"],
  [0.2, "0.2"],
  [0.5, "0.5"],
  [1, "1"],
  [1.5, "1.5"],
  [5, "5"],
  [9.99, "9.99"],
  [9.994, "9.99"],
  [10, "10"],
  [10.04, "10"],
  [10.06, "10.1"],
  [12.34, "12.3"],
  [50, "50"],
  [99, "99"],
  [99.95, "100"],
  [100, "100"],
  [123.4, "123"],
  [999, "999"],
  [999.4, "999"],
  [999.5, "1.00K"],
  [1000, "1.00K"],
  [1234, "1.23K"],
  [12345, "12.3K"],
  [123456, "123K"],
  [999499, "999K"],
  [999999, "1.00M"],
  [1e6, "1.00M"],
  [1.5e9, "1.50B"],
  [1e12, "1.00T"],
  [1e15, "1.00Qa"],
  [1e18, "1.00Qi"],
  [1e21, "1.00Sx"],
  [1e24, "1.00Sp"],
  [1e27, "1.00Oc"],
  [1e30, "1.00No"],
  [1e33, "1.00Dc"],
  [9.99e35, "999Dc"],
  [1e36, "1.00e36"],
  [1.234e45, "1.23e45"],
  [1e100, "1.00e100"],
  [1e299, "1.00e299"],
  [9.999e299, "1.00e300+"],
  [1e300, "1.00e300+"],
  [1e301, "1.00e300+"],
  [1.7976931348623157e308, "1.00e300+"],
  [Number.NaN, "0"],
  [Number.POSITIVE_INFINITY, "1.00e300+"],
  [Number.NEGATIVE_INFINITY, "-1.00e300+"],
  [-5, "-5"],
  [-1234, "-1.23K"],
  [-0, "0"],
  [1e-9, "0"],
  [-1e-9, "0"],
];

describe("formatNumber", () => {
  it("has at least 40 cases", () => {
    expect(FORMAT_CASES.length).toBeGreaterThanOrEqual(40);
  });

  for (const [input, expected] of FORMAT_CASES) {
    it(`formats ${String(input)} as ${expected}`, () => {
      expect(formatNumber(input)).toBe(expected);
    });
  }

  it("never prints NaN, Infinity or undefined over 2000 values", () => {
    const next = lcg(20261023);
    const values: number[] = [
      0,
      -0,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      Number.EPSILON,
    ];
    while (values.length < 2000) {
      const exponent = -9 + next() * 317;
      const sign = next() < 0.1 ? -1 : 1;
      values.push(sign * 10 ** exponent);
    }
    for (const value of values) {
      const text = formatNumber(value);
      expect(typeof text).toBe("string");
      expect(text).not.toMatch(/NaN|Infinity|undefined/);
      expect(text.length).toBeGreaterThan(0);
      expect(text).toMatch(/^-?(\d+(\.\d+)?)(K|M|B|T|Qa|Qi|Sx|Sp|Oc|No|Dc|e\d+\+?)?$/);
    }
  });

  it("is monotonic in suffix order", () => {
    const order = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
    const rank = (text: string): number => {
      const sci = /e(\d+)\+?$/.exec(text);
      if (sci?.[1] !== undefined) return 100 + Number(sci[1]);
      const suffix = /[A-Za-z]+$/.exec(text)?.[0] ?? "";
      return order.indexOf(suffix);
    };
    const next = lcg(7);
    const values = Array.from({ length: 2000 }, () => 10 ** (next() * 305)).sort((a, b) => a - b);
    let previous = -1;
    for (const value of values) {
      const current = rank(formatNumber(value));
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it("keeps every suffix mantissa below 1000", () => {
    for (let exponent = 3; exponent < 36; exponent++) {
      for (const factor of [1, 9.994, 9.996, 99.96, 999.4, 999.6]) {
        const text = formatNumber(factor * 10 ** exponent);
        if (text.includes("e")) continue;
        const mantissa = Number.parseFloat(text);
        expect(mantissa).toBeLessThan(1000);
        expect(mantissa).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("formatNumberWords", () => {
  const cases: ReadonlyArray<readonly [number, string]> = [
    [0, "0"],
    [999, "999"],
    [1500, "1.5 thousand"],
    [1e6, "1 million"],
    [1.2e6, "1.2 million"],
    [1234567, "1.23 million"],
    [999999, "1 million"],
    [2.5e9, "2.5 billion"],
    [1e33, "1 decillion"],
    [1.5e36, "1.50 times ten to the 36"],
    [-2e6, "minus 2 million"],
    [Number.NaN, "0"],
    [1e300, "more than ten to the 300"],
    [Number.NEGATIVE_INFINITY, "minus more than ten to the 300"],
    [-0.0000001, "0"],
  ];
  for (const [input, expected] of cases) {
    it(`words for ${String(input)}`, () => {
      expect(formatNumberWords(input)).toBe(expected);
    });
  }
});

describe("formatDuration", () => {
  const cases: ReadonlyArray<readonly [number, string]> = [
    [0, "0s"],
    [45, "45s"],
    [59.9, "59s"],
    [60, "1m 00s"],
    [125, "2m 05s"],
    [3600, "1h 00m"],
    [7500, "2h 05m"],
    [28800, "8h 00m"],
    [86400, "1d 00h"],
    [93600, "1d 02h"],
    [-5, "0s"],
    [Number.NaN, "0s"],
    [Number.POSITIVE_INFINITY, "0s"],
  ];
  for (const [input, expected] of cases) {
    it(`duration ${String(input)}`, () => {
      expect(formatDuration(input)).toBe(expected);
    });
  }
});

describe("clampValue", () => {
  it("clamps to the value ceiling and removes NaN", () => {
    expect(clampValue(Number.NaN)).toBe(0);
    expect(clampValue(5)).toBe(5);
    expect(clampValue(-5)).toBe(-5);
    expect(clampValue(1e301)).toBe(RULES.MAX_VALUE);
    expect(clampValue(Number.POSITIVE_INFINITY)).toBe(RULES.MAX_VALUE);
    expect(clampValue(Number.NEGATIVE_INFINITY)).toBe(-RULES.MAX_VALUE);
    expect(clampValue(1e300)).toBe(1e300);
  });
});
