"""Compose the Glow Rescue feature graphic (1024x500, no alpha) from the
final integrated home-scene art and wide logo (task 22/23 integration).
"""

from PIL import Image, ImageFilter

REPO = "/home/ashutosh/PROJECTS/AI-GenApps/amber-quantum-forge"
ART = f"{REPO}/apps-native/games/merge_relay/assets/art"
OUT = f"{REPO}/.agents/resources/2026-09-25/merge-relay-store/feature-graphic.png"

W, H = 1024, 500

scene = Image.open(f"{ART}/homeScene.png").convert("RGB")
sw, sh = scene.size  # 1080 x 900

crop_h = round(sw * H / W)  # keep full width, crop height to the target aspect
crop = scene.crop((0, 0, sw, crop_h))
bg = crop.resize((W, H), Image.LANCZOS)

logo = Image.open(f"{ART}/logoWide.png").convert("RGBA")
lw, lh = logo.size
target_w = 560
target_h = round(lh * target_w / lw)
logo = logo.resize((target_w, target_h), Image.LANCZOS)

# Sit the wordmark in the calmer ocean band at the bottom, clear of the
# characters up top, so it never overlaps their faces.
logo_x = (W - target_w) // 2
logo_y = H - target_h - 24

shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
shadow_alpha = logo.split()[3].point(lambda a: min(a, 130))
shadow_layer = Image.new("RGBA", logo.size, (10, 14, 28, 255))
shadow_layer.putalpha(shadow_alpha)
shadow.paste(shadow_layer, (logo_x + 4, logo_y + 6), shadow_layer)
shadow = shadow.filter(ImageFilter.GaussianBlur(6))

canvas = bg.convert("RGBA")
canvas = Image.alpha_composite(canvas, shadow)
canvas.paste(logo, (logo_x, logo_y), logo)

canvas.convert("RGB").save(OUT, "PNG")
print("wrote", OUT, canvas.size)
