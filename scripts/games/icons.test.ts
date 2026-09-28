import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { renderIconAssets } from "./icons";

const sourceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#10243e"/>
  <circle cx="512" cy="512" r="200" fill="#9be3d5"/>
</svg>`;

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "gaming-icons-"));
  mkdirSync(join(root, "android/app/src/main/res"), { recursive: true });
  mkdirSync(join(root, "ios/Runner/Assets.xcassets/AppIcon.appiconset"), { recursive: true });
  writeFileSync(
    join(root, "android/app/src/main/AndroidManifest.xml"),
    '<application android:label="fixture" />\n',
  );
  writeFileSync(
    join(root, "ios/Runner/Info.plist"),
    "<key>CFBundleDisplayName</key>\n<string>fixture</string>\n",
  );
  return root;
}

test("icon renderer produces opaque Apple and adaptive Android assets", async () => {
  const root = fixtureRoot();
  try {
    expect(await renderIconAssets(root, "Fixture Game", sourceSvg)).toEqual([]);
    const metadata = await sharp(
      join(root, "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png"),
    ).metadata();
    expect({ width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha }).toEqual(
      {
        width: 1024,
        height: 1024,
        hasAlpha: false,
      },
    );
    const contents = JSON.parse(
      readFileSync(
        join(root, "ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json"),
        "utf8",
      ),
    ) as { images: Array<{ filename: string; size: string; idiom: string }> };
    expect(contents.images.find((image) => image.filename.includes("20x20"))?.size).toBe("20x20");
    expect(contents.images.find((image) => image.filename.includes("1024x1024"))?.size).toBe(
      "1024x1024",
    );
    expect(contents.images.filter((image) => image.idiom === "ipad")).toHaveLength(9);
    expect(
      contents.images.some(
        (image) => image.idiom === "ipad" && image.filename === "Icon-App-40x40@1x.png",
      ),
    ).toBeTrue();
    const foreground = await sharp(
      join(root, "android/app/src/main/res/drawable/ic_launcher_foreground.png"),
    ).metadata();
    expect({ channels: foreground.channels, hasAlpha: foreground.hasAlpha }).toEqual({
      channels: 4,
      hasAlpha: true,
    });
    expect(
      existsSync(join(root, "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml")),
    ).toBeTrue();
    expect(
      readFileSync(
        join(root, "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml"),
        "utf8",
      ),
    ).toContain("ic_launcher_foreground");
    expect(await renderIconAssets(root, "Fixture Game", sourceSvg, true)).toEqual([]);
    writeFileSync(
      join(root, "android/app/src/main/AndroidManifest.xml"),
      '<application android:label="Stale Fixture" />\n',
    );
    expect(await renderIconAssets(root, "Fixture Game", sourceSvg, true)).toContain(
      `stale Android launcher label: ${join(root, "android/app/src/main/AndroidManifest.xml")}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("android label placeholder is accepted when Gradle resolves it to the title", async () => {
  const root = fixtureRoot();
  try {
    expect(await renderIconAssets(root, "Fixture Game", sourceSvg)).toEqual([]);

    const manifestPath = join(root, "android/app/src/main/AndroidManifest.xml");
    const gradlePath = join(root, "android/app/build.gradle.kts");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal Android manifest placeholder syntax, not a JS template.
    writeFileSync(manifestPath, '<application android:label="${fixtureAppLabel}" />\n');
    writeFileSync(
      gradlePath,
      'manifestPlaceholders["fixtureAppLabel"] =\n' +
        '    if (debugSuffix.isEmpty()) "Fixture Game" else "Fixture Game QA"\n',
    );

    expect(await renderIconAssets(root, "Fixture Game", sourceSvg, true)).toEqual([]);

    writeFileSync(
      gradlePath,
      'manifestPlaceholders["fixtureAppLabel"] =\n' +
        '    if (debugSuffix.isEmpty()) "Stale Name" else "Stale Name QA"\n',
    );
    expect(await renderIconAssets(root, "Fixture Game", sourceSvg, true)).toContain(
      `Android launcher label placeholder \${fixtureAppLabel} in ${manifestPath} resolves to ` +
        '"Stale Name", expected "Fixture Game" — update manifestPlaceholders["fixtureAppLabel"] ' +
        "in android/app/build.gradle.kts",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
