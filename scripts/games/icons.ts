import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { GAME_REGISTRY } from "./registry";
import { appDirectory, ROOT } from "./toolchain";

const IOS_SLOTS = [
  ["Icon-App-20x20@1x.png", 20],
  ["Icon-App-20x20@2x.png", 40],
  ["Icon-App-20x20@3x.png", 60],
  ["Icon-App-29x29@1x.png", 29],
  ["Icon-App-29x29@2x.png", 58],
  ["Icon-App-29x29@3x.png", 87],
  ["Icon-App-40x40@1x.png", 40],
  ["Icon-App-40x40@2x.png", 80],
  ["Icon-App-40x40@3x.png", 120],
  ["Icon-App-60x60@2x.png", 120],
  ["Icon-App-60x60@3x.png", 180],
  ["Icon-App-76x76@1x.png", 76],
  ["Icon-App-76x76@2x.png", 152],
  ["Icon-App-83.5x83.5@2x.png", 167],
  ["Icon-App-1024x1024@1x.png", 1024],
] as const;

const IOS_CONTENT_SLOTS = [
  ["20x20", "iphone", "Icon-App-20x20@2x.png", "2x"],
  ["20x20", "iphone", "Icon-App-20x20@3x.png", "3x"],
  ["29x29", "iphone", "Icon-App-29x29@1x.png", "1x"],
  ["29x29", "iphone", "Icon-App-29x29@2x.png", "2x"],
  ["29x29", "iphone", "Icon-App-29x29@3x.png", "3x"],
  ["40x40", "iphone", "Icon-App-40x40@2x.png", "2x"],
  ["40x40", "iphone", "Icon-App-40x40@3x.png", "3x"],
  ["60x60", "iphone", "Icon-App-60x60@2x.png", "2x"],
  ["60x60", "iphone", "Icon-App-60x60@3x.png", "3x"],
  ["20x20", "ipad", "Icon-App-20x20@1x.png", "1x"],
  ["20x20", "ipad", "Icon-App-20x20@2x.png", "2x"],
  ["29x29", "ipad", "Icon-App-29x29@1x.png", "1x"],
  ["29x29", "ipad", "Icon-App-29x29@2x.png", "2x"],
  ["40x40", "ipad", "Icon-App-40x40@1x.png", "1x"],
  ["40x40", "ipad", "Icon-App-40x40@2x.png", "2x"],
  ["76x76", "ipad", "Icon-App-76x76@1x.png", "1x"],
  ["76x76", "ipad", "Icon-App-76x76@2x.png", "2x"],
  ["83.5x83.5", "ipad", "Icon-App-83.5x83.5@2x.png", "2x"],
  ["1024x1024", "ios-marketing", "Icon-App-1024x1024@1x.png", "1x"],
] as const;

const ANDROID_SLOTS = [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192],
] as const;

const GENERIC_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#233047"/>
  <circle cx="512" cy="512" r="236" fill="#9be3d5"/>
  <path d="M512 324v376M324 512h376" stroke="#233047" stroke-width="48" stroke-linecap="round"/>
</svg>`;

function iconBackground(svg: string): string {
  return svg.match(/<rect[^>]*fill="(#[0-9a-fA-F]{6})"/)?.[1] ?? "#233047";
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

async function png(svg: string, size: number, background: string): Promise<Buffer> {
  return sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain" })
    .flatten({ background })
    .png()
    .toBuffer();
}

async function foregroundPng(svg: string, size: number): Promise<Buffer> {
  const foregroundSvg = svg.replace(/\s*<rect\b[^>]*\bwidth=["']1024["'][^>]*\/>/, "");
  const markSize = Math.round(size * 0.66);
  const mark = await sharp(Buffer.from(foregroundSvg))
    .resize(markSize, markSize, { fit: "contain" })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

function sameBytes(path: string, value: Buffer): boolean {
  return existsSync(path) && readFileSync(path).equals(value);
}

function writeOrCheck(path: string, value: Buffer, check: boolean, errors: string[]): void {
  if (check) {
    if (!sameBytes(path, value)) errors.push(`stale generated icon: ${path}`);
    return;
  }
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, value);
}

function writeTextOrCheck(path: string, value: string, check: boolean, errors: string[]): void {
  if (check) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== value)
      errors.push(`stale generated icon metadata: ${path}`);
    return;
  }
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, value);
}

function updateAndroidLabel(root: string, title: string, check: boolean, errors: string[]): void {
  const path = join(root, "android/app/src/main/AndroidManifest.xml");
  const source = readFileSync(path, "utf8");
  const expected = `android:label="${escapeXml(title)}"`;
  if (check) {
    if (!source.includes(expected)) errors.push(`stale Android launcher label: ${path}`);
    return;
  }
  const updated = source.replace(/android:label="[^"]+"/, `android:label="${escapeXml(title)}"`);
  if (updated === source && !source.includes(expected))
    errors.push(`Android launcher label missing: ${path}`);
  else writeFileSync(path, updated);
}

function updateIosLabel(root: string, title: string, check: boolean, errors: string[]): void {
  const path = join(root, "ios/Runner/Info.plist");
  const source = readFileSync(path, "utf8");
  const expected = `<string>${escapeXml(title)}</string>`;
  if (check) {
    if (!source.includes(expected)) errors.push(`stale iOS display name: ${path}`);
    return;
  }
  const updated = source.replace(
    /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${escapeXml(title)}$2`,
  );
  if (updated === source && !source.includes(expected))
    errors.push(`iOS display name missing: ${path}`);
  else writeFileSync(path, updated);
}

function iosContents(): string {
  const images = IOS_CONTENT_SLOTS.map(([size, idiom, filename, scale]) => ({
    size,
    idiom,
    filename,
    scale,
  }));
  return `${JSON.stringify({ images, info: { author: "xcode", version: 1 } }, null, 2)}\n`;
}

function adaptiveIcon(): string {
  return `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>\n`;
}

async function renderIos(
  root: string,
  svg: string,
  check: boolean,
  errors: string[],
): Promise<void> {
  const directory = join(root, "ios/Runner/Assets.xcassets/AppIcon.appiconset");
  const background = iconBackground(svg);
  if (!check) {
    mkdirSync(directory, { recursive: true });
    for (const filename of readdirSync(directory)) {
      if (filename.endsWith(".png")) rmSync(join(directory, filename));
    }
  }
  for (const [filename, size] of IOS_SLOTS) {
    writeOrCheck(join(directory, filename), await png(svg, size, background), check, errors);
  }
  writeTextOrCheck(join(directory, "Contents.json"), iosContents(), check, errors);
}

async function renderAndroid(
  root: string,
  svg: string,
  check: boolean,
  errors: string[],
): Promise<void> {
  const res = join(root, "android/app/src/main/res");
  const background = iconBackground(svg);
  for (const [density, size] of ANDROID_SLOTS) {
    writeOrCheck(
      join(res, `mipmap-${density}/ic_launcher.png`),
      await png(svg, size, background),
      check,
      errors,
    );
  }
  writeOrCheck(
    join(res, "drawable/ic_launcher_foreground.png"),
    await foregroundPng(svg, 432),
    check,
    errors,
  );
  writeTextOrCheck(
    join(res, "values/ic_launcher_colors.xml"),
    `<resources>\n    <color name="ic_launcher_background">${background}</color>\n</resources>\n`,
    check,
    errors,
  );
  for (const name of ["ic_launcher.xml", "ic_launcher_round.xml"]) {
    writeTextOrCheck(join(res, "mipmap-anydpi-v26", name), adaptiveIcon(), check, errors);
  }
}

export async function renderIconAssets(
  root: string,
  title: string,
  svg: string,
  check = false,
): Promise<string[]> {
  const errors: string[] = [];
  updateAndroidLabel(root, title, check, errors);
  updateIosLabel(root, title, check, errors);
  await renderIos(root, svg, check, errors);
  await renderAndroid(root, svg, check, errors);
  return errors;
}

export async function renderGeneratedIcon(root: string, title: string): Promise<void> {
  const errors = await renderIconAssets(root, title, GENERIC_ICON);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}

export function renderGeneratedIconSync(root: string, title: string): void {
  execFileSync(
    "bun",
    [resolve(ROOT, "scripts/games/icons.ts"), "--generated", root, "--title", title],
    { stdio: "inherit" },
  );
}

async function renderRegisteredIcons(appId: string | undefined, check: boolean): Promise<void> {
  const games = appId ? GAME_REGISTRY.filter((game) => game.id === appId) : GAME_REGISTRY;
  if (games.length === 0) throw new Error(`Unknown app '${appId ?? ""}'`);
  const errors: string[] = [];
  for (const game of games) {
    const root = appDirectory(game);
    const source = join(root, "assets/branding/icon.svg");
    if (!existsSync(source)) {
      errors.push(`missing source icon: ${source}`);
      continue;
    }
    errors.push(
      ...(await renderIconAssets(root, game.publicTitle, readFileSync(source, "utf8"), check)),
    );
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));
}

async function main(args: string[]): Promise<void> {
  const generatedIndex = args.indexOf("--generated");
  if (generatedIndex >= 0) {
    const root = args[generatedIndex + 1];
    const titleIndex = args.indexOf("--title");
    const title = titleIndex >= 0 ? args[titleIndex + 1] : undefined;
    if (!root || !title) throw new Error("--generated requires a root and --title");
    const errors = await renderIconAssets(resolve(root), title, GENERIC_ICON);
    if (errors.length > 0) throw new Error(errors.join("\n"));
    return;
  }
  await renderRegisteredIcons(
    args.includes("--app") ? args[args.indexOf("--app") + 1] : undefined,
    args.includes("--check"),
  );
}

if (import.meta.main) await main(process.argv.slice(2));
