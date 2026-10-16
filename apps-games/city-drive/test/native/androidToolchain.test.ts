import { describe, expect, it } from "vitest";
import { checkToolchain, SDKMANAGER } from "../../scripts/androidToolchain";

const paths = { javaHome: "/t/jdk21", androidHome: "/t/sdk" };

function fs(present: string[]): (path: string) => boolean {
  const set = new Set(present);
  return (path) => set.has(path);
}

const JAVA = "/t/jdk21/bin/java";
const MANAGER = SDKMANAGER("/t/sdk");
const LICENCE = "/t/sdk/licenses/android-sdk-license";
const PACKAGES = [
  "/t/sdk/platform-tools",
  "/t/sdk/platforms/android-36",
  "/t/sdk/build-tools/36.0.0",
];

describe("android toolchain preflight", () => {
  it("reports a missing JDK and missing command-line tools", () => {
    const problems = checkToolchain(paths, fs([]));
    expect(problems.map((p) => p.kind)).toEqual(["missing", "missing"]);
  });

  it("returns the exact human command when licences are not accepted", () => {
    const problems = checkToolchain(paths, fs([JAVA, MANAGER]));
    expect(problems).toEqual([
      {
        kind: "licences",
        fix: "JAVA_HOME=/t/jdk21 /t/sdk/cmdline-tools/latest/bin/sdkmanager --licenses",
      },
    ]);
  });

  it("lists the SDK packages still to install once licences are accepted", () => {
    const problems = checkToolchain(paths, fs([JAVA, MANAGER, LICENCE, PACKAGES[0] as string]));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({
      kind: "packages",
      missing: ["platforms;android-36", "build-tools;36.0.0"],
    });
  });

  it("finds nothing wrong with a complete toolchain", () => {
    expect(checkToolchain(paths, fs([JAVA, MANAGER, LICENCE, ...PACKAGES]))).toEqual([]);
  });
});
