"""Compose Glow Rescue store screenshots from final screen goldens.

Task 24 (16-games-portfolio-wave2), fix round 1 (orchestrator review):
Pillow-only, CC0/first-party assets only:
- Source screenshots, two folders:
  - apps-native/games/merge_relay/test/goldens/screens/*.png — the
    functional UI goldens (chapter map, result), unchanged from the first
    pass.
  - apps-native/games/merge_relay/test/goldens/store/*.png — NEW
    store-only captures (test/goldens/store/store_shots_test.dart) that
    seed real, rules-legal, mid-game boards (many tiles, several tiers)
    through the real game/controller, specifically for marketing use. The
    first pass reused the sparse functional goldens (a two-tile tutorial
    hint, an empty endless board, the home screen for "Daily"), which the
    orchestrator correctly flagged as weak marketing.
- Fonts: apps-native/games/merge_relay/assets/fonts/{Fredoka,NunitoSans}.
- Brand palette: apps-native/games/merge_relay/lib/src/merge_relay_theme.dart
  (signalRelayTheme) and lib/src/ui/mr_tokens.dart.

No new gameplay states are rendered *by this script* — every screenshot is a
crop/caption composite of an existing golden PNG. The rich board states
themselves are rendered by the Flutter test suite (real game object, real
`MergeBoard` legality), not by this Pillow step.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO = "/home/ashutosh/PROJECTS/AI-GenApps/amber-quantum-forge"
SCREENS = f"{REPO}/apps-native/games/merge_relay/test/goldens/screens"
STORE_SHOTS = f"{REPO}/apps-native/games/merge_relay/test/goldens/store"
ART = f"{REPO}/apps-native/games/merge_relay/assets/art"
FONTS = f"{REPO}/apps-native/games/merge_relay/assets/fonts"
OUT = f"{REPO}/.agents/resources/2026-09-25/merge-relay-store"

W, H = 1080, 2400
BAND_H = 320

INK = (30, 42, 68)  # 0xff1e2a44
CREAM = (255, 247, 234)  # 0xfffff7ea
WARM = (242, 145, 75)  # 0xfff2914b
CORAL = (192, 62, 79)  # 0xffc03e4f
SKY = (42, 122, 140)  # 0xff2a7a8c


def fredoka(size, name="Bold"):
    f = ImageFont.truetype(f"{FONTS}/Fredoka/Fredoka[wdth,wght].ttf", size)
    f.set_variation_by_name(name)
    return f


def nunito(size, name="SemiBold"):
    f = ImageFont.truetype(
        f"{FONTS}/NunitoSans/NunitoSans[YTLC,opsz,wdth,wght].ttf", size
    )
    f.set_variation_by_name(name)
    return f


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([(0, 0), (size[0] - 1, size[1] - 1)], radius=radius, fill=255)
    return mask


def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def compose(source_dir, source_name, headline, subcaption, accent, out_name):
    src = Image.open(f"{source_dir}/{source_name}").convert("RGB")
    assert src.size == (W, H), f"{source_name} is {src.size}, expected {(W, H)}"

    canvas = Image.new("RGB", (W, H), INK)
    draw = ImageDraw.Draw(canvas)

    # Caption band (top): ink background, accent underline, headline + sub.
    headline_font = fredoka(76, "Bold")
    sub_font = nunito(38, "SemiBold")

    pad_x = 72
    lines = wrap_text(draw, headline, headline_font, W - 2 * pad_x)
    line_h = headline_font.size + 10
    total_h = line_h * len(lines)
    y = 64
    for line in lines:
        w = draw.textlength(line, font=headline_font)
        draw.text(((W - w) / 2, y), line, font=headline_font, fill=CREAM)
        y += line_h

    y += 6
    sub_w = draw.textlength(subcaption, font=sub_font)
    draw.text(((W - sub_w) / 2, y), subcaption, font=sub_font, fill=(214, 222, 235))

    # Small accent rule under the caption block.
    rule_y = BAND_H - 28
    draw.rounded_rectangle(
        [((W - 140) / 2, rule_y), ((W + 140) / 2, rule_y + 8)],
        radius=4,
        fill=accent,
    )

    # Screenshot card, scaled to fit the remaining canvas, flush to the
    # bottom edge, with a soft shadow and rounded corners.
    avail_h = H - BAND_H
    scale = avail_h / H
    card_w = int(round(W * scale))
    card_h = avail_h
    card = src.resize((card_w, card_h), Image.LANCZOS)

    radius = 44
    mask = rounded_mask((card_w, card_h), radius)

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    off_x = (W - card_w) // 2
    off_y = BAND_H
    shadow_draw.rounded_rectangle(
        [
            (off_x, off_y + 14),
            (off_x + card_w, off_y + card_h + 14),
        ],
        radius=radius,
        fill=(0, 0, 0, 90),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow).convert("RGB")

    canvas.paste(card, (off_x, off_y), mask)

    canvas.save(f"{OUT}/screenshots/{out_name}", "PNG")
    print("wrote", out_name, canvas.size)


SHOTS = [
    (
        STORE_SHOTS,
        "store_hero_rescue.png",
        "Slide. Merge. Rescue.",
        "A real mid-game board — seven tiers deep.",
        WARM,
        "01-hero-board.png",
    ),
    (
        STORE_SHOTS,
        "store_merge_moment.png",
        "Feel every merge.",
        "Every pop is real — no two boards play the same.",
        SKY,
        "02-merge-moment.png",
    ),
    (
        SCREENS,
        "chapter_map.png",
        "60 boards. 6 chapters.",
        "A cozy campaign to clear, at your pace.",
        WARM,
        "03-chapter-map.png",
    ),
    (
        STORE_SHOTS,
        "store_daily_play.png",
        "A new board, daily.",
        "Beat today's chain in three moves.",
        CORAL,
        "04-daily.png",
    ),
    (
        STORE_SHOTS,
        "store_endless_best.png",
        "Keep the chain going.",
        "Endless mode: chase your best score.",
        SKY,
        "05-endless-best.png",
    ),
    (
        SCREENS,
        "result_win.png",
        "Path cleared.",
        "Every tile found its place.",
        CORAL,
        "06-result.png",
    ),
]

if __name__ == "__main__":
    for source_dir, source, headline, sub, accent, out_name in SHOTS:
        compose(source_dir, source, headline, sub, accent, out_name)
