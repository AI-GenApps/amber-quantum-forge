import sharp, { type Sharp } from "sharp";

/**
 * Keys a flat magenta (#FF00FF) background out of a generated PNG. "Magentaness" is
 * min(r, b) - g: it is ~255 on the key colour and about 0 on teal, red-orange, dark grey and the
 * blue-grey windows, so the car body is never eaten. Edge pixels get a partial alpha and the key
 * colour is subtracted from them (despill) so no pink fringe is left.
 */
export async function keyOutMagenta(input: string): Promise<Sharp> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const magenta = Math.min(r, b) - g;
    if (magenta < 24) continue;
    const alpha = Math.max(0, Math.min(1, 1 - (magenta - 24) / 200));
    if (alpha <= 0.02) {
      out[i + 3] = 0;
      continue;
    }
    const unspill = (value: number, key: number) =>
      Math.max(0, Math.min(255, Math.round((value - (1 - alpha) * key) / alpha)));
    out[i] = unspill(r, 255);
    out[i + 1] = unspill(g, 0);
    out[i + 2] = unspill(b, 255);
    out[i + 3] = Math.round(alpha * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
}
