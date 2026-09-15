#!/usr/bin/env python3
"""Rebuild the web fonts as subset WOFF2.

The two families are Latin display faces, and the shipped files are full TTFs:
392 KB across seven weights, of which a reader downloads the two or three a page
actually uses. Two thirds of each file is glyphs this site cannot render — CJK,
Cyrillic, Greek, and the whole of Latin Extended — so the coverage is reduced to
what the site can actually publish before the files are compressed.

Japanese and Korean guides are deliberately not covered: those scripts fall back
to the reader's system font, and pulling a CJK web font in would cost megabytes
to avoid a font they already have. Vietnamese is included even though it is not
published yet, because the extra glyphs cost a few kilobytes and turning that
language on should not quietly change how it renders.

    pip install fonttools brotli
    python3 scripts/make-font-subsets.py

Run it after adding a language or a glyph; it prints the before and after size
of every file and refuses to write a subset that dropped a character the site
publishes.
"""
from pathlib import Path
import sys

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit("fontTools is required: pip install fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
# The full TTFs are design sources kept out of the published directory; the
# subsets they produce are what ships.
SOURCE = ROOT / "brand" / "fonts"
ASSETS = ROOT / "public" / "assets"

# Latin, Latin-1 Supplement, Latin Extended-A and -B, Vietnamese, general
# punctuation, currency, arrows, letterlike symbols, and the handful of marks
# the site uses as icons in tables and callouts.
UNICODES = ",".join(
    [
        "U+0000-00FF",  # ASCII and Latin-1
        "U+0100-024F",  # Latin Extended-A and -B: Polish, Czech, Turkish, ...
        "U+1E00-1EFF",  # Latin Extended Additional: Vietnamese
        "U+2000-206F",  # General punctuation: dashes, curly quotes, ellipsis
        "U+20A0-20BF",  # Currency
        "U+2190-21FF",  # Arrows, for the links that end in one
        "U+2200-22FF",  # Mathematical operators
        "U+25A0-25FF",  # Geometric shapes
        "U+2600-26FF",  # Misc symbols
        "U+2700-27BF",  # Dingbats, including the check marks used in tables
    ]
)

# Characters the site publishes outside ASCII. The subset has to keep every one
# of these that the original file carried: a glyph the source never had is
# already being drawn by a system font and dropping it changes nothing, but a
# glyph the source had and the subset loses would silently change how a page
# looks.
SAMPLE = "äöüßéèêàçñ«»„“”–—’…→↗€£¥✓✗•°×"


def main() -> int:
    fonts = sorted(SOURCE.glob("*.ttf"))
    if not fonts:
        sys.exit(f"no .ttf files in {SOURCE}")

    before = after = 0
    failures = []
    unsupported = set()

    for source in fonts:
        target = ASSETS / f"{source.stem}.woff2"
        before += source.stat().st_size

        original = TTFont(source)
        original_cmap = original.getBestCmap()
        original.close()

        # Only what the source could actually draw can be lost by subsetting.
        expected = [character for character in SAMPLE if ord(character) in original_cmap]
        expected += [character for character in "abcXYZ0189.,:;()[]{}%&@#/\\-+=" if ord(character) in original_cmap]
        unsupported.update(character for character in SAMPLE if ord(character) not in original_cmap)

        subset.main(
            [
                str(source),
                f"--output-file={target}",
                f"--unicodes={UNICODES}",
                "--layout-features=*",  # keep kerning and ligatures
                "--flavor=woff2",
                "--with-zopfli",
            ]
        )
        after += target.stat().st_size

        font = TTFont(target)
        cmap = font.getBestCmap()
        missing = [character for character in expected if ord(character) not in cmap]
        if missing:
            failures.append(f"{target.name} lost {''.join(sorted(set(missing)))}")
        font.close()

        print(
            f"  {target.name:26} {source.stat().st_size / 1024:6.0f} KB -> "
            f"{target.stat().st_size / 1024:6.0f} KB  ({len(cmap)} glyphs)"
        )

    if unsupported:
        print(
            f"\nNote: the source fonts never carried {''.join(sorted(unsupported))}; "
            "those are drawn by a system font, as before."
        )

    if failures:
        print("\nSubsets that lost glyphs the source had:", file=sys.stderr)
        for failure in failures:
            print(f"  {failure}", file=sys.stderr)
        return 1

    print(f"\n{len(fonts)} fonts: {before / 1024:.0f} KB -> {after / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
