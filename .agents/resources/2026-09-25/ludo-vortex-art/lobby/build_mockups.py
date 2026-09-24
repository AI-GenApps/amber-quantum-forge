#!/usr/bin/env python3
"""Compose lobby mockups from generated background + tile assets using PIL only (no generation)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

W, H = 1080, 2400
GOLD = (255, 200, 60, 255)
GOLD_DARK = (200, 150, 30, 255)
NAVY_CARD = (16, 33, 82, 235)
WHITE = (255, 255, 255, 255)
DIM_TEXT = (170, 180, 200, 255)
PILL_BG = (90, 90, 70, 220)


def load_font(size, bold=True):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                pass
    return ImageFont.load_default()


def rounded_card(size, radius, fill, outline, outline_width):
    w, h = size
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=fill)
    d.rounded_rectangle([outline_width // 2, outline_width // 2, w - 1 - outline_width // 2, h - 1 - outline_width // 2],
                         radius=radius, outline=outline, width=outline_width)
    return card


def fit_contain(img, box_w, box_h):
    iw, ih = img.size
    scale = min(box_w / iw, box_h / ih)
    return img.resize((max(1, int(iw * scale)), max(1, int(ih * scale))), Image.LANCZOS)


def text_center(draw, xy_center, text, font, fill, stroke_fill=None, stroke_width=0):
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = xy_center[0] - tw / 2 - bbox[0]
    y = xy_center[1] - th / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=fill, stroke_fill=stroke_fill, stroke_width=stroke_width)


def build_mockup(bg_path, wordmark_path, tiles, labels, dimmed, out_path):
    bg = Image.open(bg_path).convert("RGBA")
    bg = fit_contain(bg, W, H)
    # cover-crop to exactly WxH (bg is already ~9:16 so this centers safely)
    canvas = Image.new("RGBA", (W, H), (10, 15, 40, 255))
    bx, by = bg.size
    scale = max(W / bx, H / by)
    bg2 = bg.resize((int(bx * scale), int(by * scale)), Image.LANCZOS)
    ox = (canvas.width - bg2.width) // 2
    oy = (canvas.height - bg2.height) // 2
    canvas.paste(bg2, (ox, oy))

    draw = ImageDraw.Draw(canvas)

    # Wordmark, ~80% width, top
    wm = Image.open(wordmark_path).convert("RGBA")
    wm_w = int(W * 0.8)
    wm = fit_contain(wm, wm_w, 420)
    wm_x = (W - wm.width) // 2
    wm_y = 60
    canvas.alpha_composite(wm, (wm_x, wm_y))

    # Player name bar
    bar_y = wm_y + wm.height + 30
    bar_h = 130
    bar_margin = 50
    bar = rounded_card((W - 2 * bar_margin, bar_h), 30, NAVY_CARD, GOLD, 5)
    canvas.alpha_composite(bar, (bar_margin, bar_y))
    # avatar circle placeholder
    av_d = bar_h - 30
    av = Image.new("RGBA", (av_d, av_d), (0, 0, 0, 0))
    ad = ImageDraw.Draw(av)
    ad.ellipse([0, 0, av_d - 1, av_d - 1], fill=(210, 70, 70, 255), outline=GOLD, width=4)
    canvas.alpha_composite(av, (bar_margin + 15, bar_y + 15))
    font_name = load_font(56)
    draw.text((bar_margin + 15 + av_d + 25, bar_y + bar_h / 2), "Player1000", font=font_name,
               fill=WHITE, anchor="lm")

    # 2x2 grid of cards
    grid_top = bar_y + bar_h + 50
    grid_margin = 50
    gap = 30
    card_w = (W - 2 * grid_margin - gap) // 2
    card_h = 620
    font_label = load_font(46)
    font_sub = load_font(30, bold=False)
    font_pill = load_font(26)

    positions = [
        (grid_margin, grid_top),
        (grid_margin + card_w + gap, grid_top),
        (grid_margin, grid_top + card_h + gap),
        (grid_margin + card_w + gap, grid_top + card_h + gap),
    ]

    for i, (pos, tile_path, label, is_dim) in enumerate(zip(positions, tiles, labels, dimmed)):
        card = rounded_card((card_w, card_h), 36, NAVY_CARD, GOLD_DARK if is_dim else GOLD, 5)
        canvas.alpha_composite(card, pos)

        tile = Image.open(tile_path).convert("RGBA")
        tile_box = int(card_w * 0.62)
        tile = fit_contain(tile, tile_box, tile_box)
        if is_dim:
            # desaturate + darken for "coming soon"
            gray = tile.convert("LA").convert("RGBA")
            tile = Image.blend(tile, gray, 0.7)
            alpha = tile.getchannel("A").point(lambda a: int(a * 0.55))
            tile.putalpha(alpha)
        tx = pos[0] + (card_w - tile.width) // 2
        ty = pos[1] + 70
        canvas.alpha_composite(tile, (tx, ty))

        label_color = DIM_TEXT if is_dim else WHITE
        text_center(draw, (pos[0] + card_w / 2, pos[1] + 70 + tile_box + 60), label, font_label, label_color)

        if is_dim:
            pill_w, pill_h = 260, 56
            pill_x = pos[0] + (card_w - pill_w) // 2
            pill_y = pos[1] + 30
            pill = rounded_card((pill_w, pill_h), pill_h // 2, PILL_BG, (120, 120, 100, 255), 2)
            canvas.alpha_composite(pill, (pill_x, pill_y))
            text_center(draw, (pill_x + pill_w / 2, pill_y + pill_h / 2), "Coming soon", font_pill, (230, 220, 190, 255))
            text_center(draw, (pos[0] + card_w / 2, pos[1] + 70 + tile_box + 105), "Not available yet", font_sub, (140, 150, 175, 255))
        else:
            sub = {"Computer": "Play locally vs. the bot", "Pass N Play": "Share this device, take turns"}.get(label, "")
            text_center(draw, (pos[0] + card_w / 2, pos[1] + 70 + tile_box + 105), sub, font_sub, (190, 200, 220, 255))

    canvas.convert("RGB").save(out_path, "PNG")
    print(f"Saved {out_path}")


build_mockup(
    "bg-a.png", "../logo/wordmark-final-v1-transparent.png",
    ["tile-a-computer.png", "tile-a-pass.png", "tile-a-friends.png", "tile-a-online.png"],
    ["Computer", "Pass N Play", "Play with Friends", "Online"],
    [False, False, True, True],
    "mockup-a.png",
)

build_mockup(
    "bg-b.png", "../logo/wordmark-final-v1-transparent.png",
    ["tile-b-computer.png", "tile-b-pass.png", "tile-b-friends.png", "tile-b-online.png"],
    ["Computer", "Pass N Play", "Play with Friends", "Online"],
    [False, False, True, True],
    "mockup-b.png",
)

# Contact sheet
def make_contact_sheet():
    names = [
        "bg-a.png", "bg-b.png",
        "tile-a-computer.png", "tile-a-pass.png", "tile-a-friends.png", "tile-a-online.png",
        "tile-b-computer.png", "tile-b-pass.png", "tile-b-friends.png", "tile-b-online.png",
        "mockup-a.png", "mockup-b.png",
    ]
    cell = 340
    cols = 4
    rows = (len(names) + cols - 1) // cols
    pad = 20
    label_h = 40
    sheet_w = cols * (cell + pad) + pad
    sheet_h = rows * (cell + label_h + pad) + pad
    sheet = Image.new("RGB", (sheet_w, sheet_h), (30, 30, 35))
    d = ImageDraw.Draw(sheet)
    font = load_font(22)
    for i, name in enumerate(names):
        img = Image.open(name).convert("RGBA")
        # checker background for transparency visibility
        checker = Image.new("RGBA", img.size, (255, 255, 255, 255))
        cd = ImageDraw.Draw(checker)
        sq = 20
        for yy in range(0, img.size[1], sq):
            for xx in range(0, img.size[0], sq):
                if (xx // sq + yy // sq) % 2 == 0:
                    cd.rectangle([xx, yy, xx + sq, yy + sq], fill=(210, 210, 210, 255))
        composited = Image.alpha_composite(checker, img)
        thumb = fit_contain(composited.convert("RGB"), cell, cell)
        col = i % cols
        row = i // cols
        x = pad + col * (cell + pad)
        y = pad + row * (cell + label_h + pad)
        tx = x + (cell - thumb.width) // 2
        ty = y + (cell - thumb.height) // 2
        sheet.paste(thumb, (tx, ty))
        d.rectangle([x, y, x + cell, y + cell], outline=(90, 90, 90), width=1)
        d.text((x + 4, y + cell + 6), name, font=font, fill=(230, 230, 230))
    sheet.save("contact-sheet.png")
    print("Saved contact-sheet.png")

make_contact_sheet()
