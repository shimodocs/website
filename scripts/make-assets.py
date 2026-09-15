#!/usr/bin/env python3
"""Generate the brand assets the SEO layer references.

Run with: npm run assets

Produces, into public/:
  favicon.svg, favicon.ico, apple-touch-icon.png, logo.png, og-image.png

The Open Graph image is a real 1200x630 card rather than a raw screenshot so
shared links render a branded preview instead of an arbitrary crop.

Layout is measured, not guessed: text is auto-fitted to its column and the
script asserts that nothing overflows or collides with the product screenshot,
so a copy change can never silently produce an overlapping card.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
ASSETS = PUBLIC / "assets"
OUT = PUBLIC
# The designed brand artwork, kept out of public/ so it is not served: the icon
# and the favicon are generated from these.
BRAND = ROOT / "brand"

BG = (9, 7, 19)
INK = (247, 244, 255)
MUTED = (168, 163, 194)
LAVENDER = (198, 184, 255)
VIOLET = (93, 52, 208)
PINK = (255, 0, 110)
CYAN = (0, 240, 255)

# The design fonts live in brand/, not in public/assets: the browser loads the
# subset WOFF2 that make-font-subsets.py writes, and shipping the full TTFs in
# the published directory would put 392 KB of unused files in every deploy.
FONTS = BRAND / "fonts"
SPACE_BOLD = FONTS / "space-grotesk-700.ttf"
SPACE_SEMI = FONTS / "space-grotesk-600.ttf"
DM_REGULAR = FONTS / "dm-sans-400.ttf"
DM_MEDIUM = FONTS / "dm-sans-500.ttf"
SCREENSHOT = ASSETS / "extract-0.png"

FAVICON_SVG = (BRAND / "shimodocs-mark.svg").read_text(encoding="utf-8")
# The mark is dark, which is right for a light tab bar and invisible on a dark
# one, so the same artwork ships inverted for prefers-color-scheme: dark.
ICON_FILL = 'fill="#41464B"'
FAVICON_DARK_SVG = FAVICON_SVG.replace(ICON_FILL, 'fill="#f7f4ff"')
if FAVICON_DARK_SVG == FAVICON_SVG:
    raise SystemExit(f"brand mark no longer uses {ICON_FILL}; update FAVICON_DARK_SVG")
# The leaf mark the previous site shipped as its touch icon. A designed asset,
# so it is resampled rather than redrawn.
ICON_SOURCE = BRAND / "shimodocs-icon.png"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def text_width(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> float:
    return draw.textlength(text, font=f)


def fit_size(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    path: Path,
    max_width: float,
    start: int,
    minimum: int = 22,
) -> int:
    """Largest font size at which every line fits the column."""
    for size in range(start, minimum - 1, -1):
        f = font(path, size)
        if all(text_width(draw, line, f) <= max_width for line in lines):
            return size
    raise SystemExit(f"Cannot fit {lines!r} into {max_width:.0f}px")


def add_glow(
    base: Image.Image, center: tuple[int, int], radius: int, colour: tuple[int, int, int], strength: int
) -> Image.Image:
    mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(mask).ellipse(
        [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius], fill=strength
    )
    mask = mask.filter(ImageFilter.GaussianBlur(radius * 0.55))
    layer = Image.new("RGB", base.size, colour)
    return Image.composite(layer, base, mask)


def build_icon(size: int) -> Image.Image:
    """Resample the touch icon that ships with the brand.

    This used to paint a violet-to-pink tile with a typeset "S", which was not
    the mark the site was designed around: the logo the previous site used is the
    leaf cut out of a dark tile, kept in brand/ so it cannot drift.
    """
    return Image.open(ICON_SOURCE).convert("RGBA").resize((size, size), Image.LANCZOS)


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    f: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    tracking: float,
) -> float:
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=f, fill=fill)
        x += text_width(draw, char, f) + tracking
    return x - tracking


def build_og_image() -> Image.Image:
    width, height = 1200, 630
    pad = 72

    canvas = Image.new("RGB", (width, height), BG)
    canvas = add_glow(canvas, (90, 40), 420, VIOLET, 165)
    canvas = add_glow(canvas, (1120, 80), 360, PINK, 120)
    canvas = add_glow(canvas, (620, 640), 430, CYAN, 70)

    grid = Image.new("RGB", (width, height), (0, 0, 0))
    grid_mask = Image.new("L", (width, height), 0)
    gd = ImageDraw.Draw(grid_mask)
    for x in range(0, width, 60):
        gd.line([(x, 0), (x, height)], fill=22)
    for y in range(0, height, 60):
        gd.line([(0, y), (width, y)], fill=22)
    canvas = Image.composite(grid, canvas, grid_mask)

    draw = ImageDraw.Draw(canvas)

    # ---- column geometry -------------------------------------------------
    frame_w, frame_h = 448, 362
    frame_x = width - pad - frame_w
    frame_y = 148
    gutter = 40
    column_right = frame_x - gutter
    column_width = column_right - pad

    # ---- wordmark --------------------------------------------------------
    wordmark_font = font(SPACE_BOLD, 40)
    draw.text((pad, 60), "Shimo", font=wordmark_font, fill=INK)
    draw.text((pad + text_width(draw, "Shimo", wordmark_font), 60), "Docs", font=wordmark_font, fill=CYAN)

    # ---- eyebrow ---------------------------------------------------------
    eyebrow = "SELF-HOSTED DOCUMENT COLLABORATION"
    eyebrow_font = font(DM_MEDIUM, 14)
    draw_tracked(draw, (pad, 128), eyebrow, eyebrow_font, CYAN, 2.0)

    # ---- headline --------------------------------------------------------
    headline_lines = ["Private cloud", "document collaboration", "with AI agents"]
    headline_size = fit_size(draw, headline_lines, SPACE_SEMI, column_width, start=54)
    headline_font = font(SPACE_SEMI, headline_size)
    leading = round(headline_size * 1.15)
    headline_top = 158
    for index, line in enumerate(headline_lines):
        colour = LAVENDER if index == len(headline_lines) - 1 else INK
        draw.text((pad, headline_top + index * leading), line, font=headline_font, fill=colour)
    headline_bottom = headline_top + (len(headline_lines) - 1) * leading + headline_size

    # ---- supporting copy -------------------------------------------------
    support_lines = [
        "Docs, sheets, slides, forms and tables that stay",
        "inside your own network, with AI you control.",
    ]
    support_size = fit_size(draw, support_lines, DM_REGULAR, column_width, start=21, minimum=15)
    support_font = font(DM_REGULAR, support_size)
    support_top = headline_bottom + 34
    for index, line in enumerate(support_lines):
        draw.text((pad, support_top + index * round(support_size * 1.5)), line, font=support_font, fill=MUTED)

    # ---- proof chips -----------------------------------------------------
    chips = ["Enterprise permissions", "Audit logs", "Bring your own AI"]
    chip_top = support_top + round(support_size * 1.5) * len(support_lines) + 34
    chip_size = 17
    while chip_size > 12:
        chip_font = font(DM_MEDIUM, chip_size)
        widths = [text_width(draw, chip, chip_font) + 34 for chip in chips]
        if sum(widths) + 18 * (len(chips) - 1) <= column_width:
            break
        chip_size -= 1
    chip_font = font(DM_MEDIUM, chip_size)
    chip_h = round(chip_size * 2.45)
    x = pad
    for chip in chips:
        w = text_width(draw, chip, chip_font) + 34
        draw.rounded_rectangle([x, chip_top, x + w, chip_top + chip_h], radius=chip_h // 2, outline=(255, 255, 255, 48), width=1)
        draw.text((x + 17, chip_top + (chip_h - chip_size) / 2 - 2), chip, font=chip_font, fill=(216, 211, 232))
        x += w + 18
    chips_right = x - 18

    # ---- footer line -----------------------------------------------------
    draw.text((pad, 544), "shimodocs.com", font=font(DM_MEDIUM, 19), fill=(150, 144, 172))

    # ---- product screenshot ---------------------------------------------
    if SCREENSHOT.exists():
        shot = Image.open(SCREENSHOT).convert("RGB")
        inner_w, inner_h = frame_w - 22, frame_h - 22
        ratio = max(inner_w / shot.width, inner_h / shot.height)
        resized = shot.resize((round(shot.width * ratio), round(shot.height * ratio)), Image.LANCZOS)
        left = (resized.width - inner_w) // 2
        top = round((resized.height - inner_h) * 0.1)
        cropped = resized.crop((left, top, left + inner_w, top + inner_h))
        draw.rounded_rectangle(
            [frame_x, frame_y, frame_x + frame_w, frame_y + frame_h],
            radius=18,
            fill=(246, 245, 249),
            outline=(255, 255, 255, 60),
            width=1,
        )
        canvas.paste(cropped, (frame_x + 11, frame_y + 11))
        draw.rounded_rectangle(
            [frame_x + 11, frame_y + 11, frame_x + 11 + inner_w, frame_y + 11 + inner_h],
            radius=9,
            outline=(0, 0, 0, 30),
            width=1,
        )

    # ---- layout guarantees ----------------------------------------------
    for label, right in (
        ("eyebrow", pad + text_width(draw, eyebrow, eyebrow_font) + 2.0 * len(eyebrow)),
        ("headline", pad + max(text_width(draw, line, headline_font) for line in headline_lines)),
        ("support", pad + max(text_width(draw, line, support_font) for line in support_lines)),
        ("chips", chips_right),
    ):
        if right > column_right:
            raise SystemExit(f"OG layout: {label} overflows its column ({right:.0f} > {column_right})")
    if frame_x <= column_right:
        raise SystemExit("OG layout: screenshot frame overlaps the text column")
    if chip_top + chip_h > height - 24:
        raise SystemExit("OG layout: chips run past the bottom edge")

    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    (OUT / "favicon.svg").write_text(FAVICON_SVG, encoding="utf-8")
    (OUT / "favicon-dark.svg").write_text(FAVICON_DARK_SVG, encoding="utf-8")

    build_icon(512).save(OUT / "logo.png")
    build_icon(180).save(OUT / "apple-touch-icon.png")
    build_icon(64).save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

    og = build_og_image()
    og.save(OUT / "og-image.png", optimize=True)

    for name in ("favicon.svg", "favicon-dark.svg", "favicon.ico", "apple-touch-icon.png", "logo.png", "og-image.png"):
        path = OUT / name
        print(f"{name:22} {path.stat().st_size / 1024:8.1f} kB")
    print(f"{'og-image.png':22} {og.size[0]}x{og.size[1]}")


if __name__ == "__main__":
    main()
