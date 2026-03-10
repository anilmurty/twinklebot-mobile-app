#!/usr/bin/env python3
"""
Generate social media banners for TwinkleBot.

Requires: Pillow (pip install Pillow)
Also requires macOS qlmanage to convert SVG to PNG (or provide a pre-rendered icon PNG).

Usage:
    python3 scripts/generate-banners.py

Output:
    public/banners/twinklebot-twitter-banner.png  (1500x500)
    public/banners/twinklebot-facebook-banner.png (820x312)
    public/banners/twinklebot-linkedin-banner.png (1584x396)
"""

import os
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont

# Colors from app-icon-dark.svg
BG_COLOR = (26, 20, 8)        # #1a1408
AMBER = (245, 158, 11)        # #f59e0b
DARK_AMBER = (217, 119, 6)    # #d97706

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ICON_SVG = os.path.join(PROJECT_ROOT, "public", "app-icon-dark.svg")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "banners")

# macOS font paths
BOLD_FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REGULAR_FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"


def svg_to_png(svg_path: str, size: int = 800) -> Image.Image:
    """Convert SVG to PNG using macOS qlmanage."""
    with tempfile.TemporaryDirectory() as tmpdir:
        subprocess.run(
            ["qlmanage", "-t", "-s", str(size), "-o", tmpdir, svg_path],
            capture_output=True,
        )
        png_path = os.path.join(tmpdir, os.path.basename(svg_path) + ".png")
        return Image.open(png_path).convert("RGBA")


def clean_icon(icon: Image.Image) -> Image.Image:
    """Remove non-amber artifacts (white/grey corners from thumbnail)."""
    pixels = icon.load()
    for y in range(icon.height):
        for x in range(icon.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            is_amber = r > 100 and g > 50 and b < 80 and r > g
            is_dark = r < 50 and g < 45 and b < 35
            if not is_amber and not is_dark:
                pixels[x, y] = (0, 0, 0, 0)
            elif is_dark:
                pixels[x, y] = (BG_COLOR[0], BG_COLOR[1], BG_COLOR[2], a)
    return icon


def make_banner(icon: Image.Image, width: int, height: int, output_path: str) -> None:
    img = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)

    icon_size = int(height * 0.50)
    icon_resized = icon.resize((icon_size, icon_size), Image.LANCZOS)

    title_size = int(height * 0.18)
    title_font = ImageFont.truetype(BOLD_FONT, title_size)

    # Measure title
    full_bbox = draw.textbbox((0, 0), "TwinkleBot", font=title_font)
    title_total_w = full_bbox[2] - full_bbox[0]
    title_render_h = full_bbox[3] - full_bbox[1]
    title_top_offset = full_bbox[1]

    twinkle_bbox = draw.textbbox((0, 0), "Twinkle", font=title_font)
    twinkle_w = twinkle_bbox[2] - twinkle_bbox[0]

    # Size tagline to fit under title text
    tagline = "Storybooks Where Your Child Is The Hero"
    tagline_size = int(height * 0.08)
    tagline_font = ImageFont.truetype(REGULAR_FONT, tagline_size)
    tag_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
    tag_w = tag_bbox[2] - tag_bbox[0]
    while tag_w > title_total_w and tagline_size > 10:
        tagline_size -= 1
        tagline_font = ImageFont.truetype(REGULAR_FONT, tagline_size)
        tag_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
        tag_w = tag_bbox[2] - tag_bbox[0]
    tag_h = tag_bbox[3] - tag_bbox[1]

    # Layout
    gap = int(width * 0.02)
    line1_total_w = icon_size + gap + title_total_w
    line1_x = (width - line1_total_w) // 2
    text_x = line1_x + icon_size + gap

    text_gap = int(height * 0.04)
    two_lines_h = title_render_h + text_gap + tag_h
    text_block_y = (height - two_lines_h) // 2

    title_y = text_block_y - title_top_offset
    tagline_y = text_block_y + title_render_h + text_gap - tag_bbox[1]
    icon_y = text_block_y + (title_render_h - icon_size) // 2

    # Draw
    img.paste(icon_resized, (line1_x, icon_y), icon_resized)
    draw.text((text_x, title_y), "Twinkle", font=title_font, fill=AMBER)
    draw.text((text_x + twinkle_w, title_y), "Bot", font=title_font, fill=DARK_AMBER)

    tag_x = text_x + (title_total_w - tag_w) // 2
    draw.text((tag_x, tagline_y), tagline, font=tagline_font, fill=AMBER)

    img.save(output_path, "PNG")
    print(f"Saved: {output_path} ({width}x{height})")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Converting SVG icon to PNG...")
    icon = clean_icon(svg_to_png(ICON_SVG))

    banners = [
        (1500, 500, "twinklebot-twitter-banner.png"),
        (820, 312, "twinklebot-facebook-banner.png"),
        (1584, 396, "twinklebot-linkedin-banner.png"),
    ]

    for width, height, filename in banners:
        make_banner(icon, width, height, os.path.join(OUTPUT_DIR, filename))

    print("Done!")


if __name__ == "__main__":
    main()
