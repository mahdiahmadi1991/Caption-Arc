from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
BRANDING_DIR = ROOT / "docs" / "assets" / "images" / "branding"


ACCENT = "#10A37F"
ACCENT_STRONG = "#0C8A6D"
MIST = "#DFF5EE"
CREAM = "#F7F7F2"
SURFACE = "#FCFCF9"
TEXT = "#161A17"
TEXT_MUTED = "#5E655F"
TEXT_FAINT = "#848B85"
DARK = "#0F1210"
DARK_RAISED = "#171B18"
ICON_TOP = "#F9FFFC"
ICON_BOTTOM = "#EAF8F2"
ICON_STROKE = "#136F5B"
ICON_LINE = "#17322A"


def hex_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    font_name = (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    )
    return ImageFont.truetype(font_name, size=size)


def vertical_gradient(size: tuple[int, int], top: str, bottom: str) -> Image.Image:
    width, height = size
    top_rgba = hex_rgba(top)
    bottom_rgba = hex_rgba(bottom)
    image = Image.new("RGBA", size)
    draw = ImageDraw.Draw(image)

    for y in range(height):
      t = y / max(height - 1, 1)
      r = int(top_rgba[0] * (1 - t) + bottom_rgba[0] * t)
      g = int(top_rgba[1] * (1 - t) + bottom_rgba[1] * t)
      b = int(top_rgba[2] * (1 - t) + bottom_rgba[2] * t)
      a = int(top_rgba[3] * (1 - t) + bottom_rgba[3] * t)
      draw.line((0, y, width, y), fill=(r, g, b, a))

    return image


def radial_glow(size: tuple[int, int], color: str, center: tuple[float, float], radius: float) -> Image.Image:
    width, height = size
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    pixels = image.load()
    glow = hex_rgba(color, 255)
    cx = center[0] * width
    cy = center[1] * height
    max_distance = radius * min(width, height)

    for y in range(height):
        for x in range(width):
            distance = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if distance > max_distance:
                continue
            intensity = 1 - (distance / max_distance)
            pixels[x, y] = (
                glow[0],
                glow[1],
                glow[2],
                int(140 * intensity * intensity),
            )

    return image.filter(ImageFilter.GaussianBlur(radius=max(10, int(max_distance * 0.12))))


def rounded_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def paste_shadow(base: Image.Image, box: tuple[int, int, int, int], radius: int, alpha: int) -> None:
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.rounded_rectangle(box, radius=radius, fill=(9, 12, 11, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(10, radius // 2)))
    base.alpha_composite(shadow)


def draw_sparkle(draw: ImageDraw.ImageDraw, center: tuple[float, float], size: float, color: str) -> None:
    cx, cy = center
    fill = hex_rgba(color)
    small = size * 0.36
    draw.polygon(
        [
            (cx, cy - size),
            (cx + small, cy - small),
            (cx + size, cy),
            (cx + small, cy + small),
            (cx, cy + size),
            (cx - small, cy + small),
            (cx - size, cy),
            (cx - small, cy - small),
        ],
        fill=fill,
    )


def create_icon(size: int) -> Image.Image:
    scale = 6 if size <= 24 else 5 if size <= 64 else 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    base = vertical_gradient((canvas_size, canvas_size), ICON_TOP, ICON_BOTTOM)
    base.alpha_composite(radial_glow((canvas_size, canvas_size), ACCENT, (0.2, 0.16), 0.52))

    mask = rounded_rect_mask((canvas_size, canvas_size), int(canvas_size * 0.24))
    image.paste(base, (0, 0), mask)

    draw = ImageDraw.Draw(image)

    if size <= 24:
        draw.rounded_rectangle(
            (
                int(canvas_size * 0.04),
                int(canvas_size * 0.04),
                int(canvas_size * 0.96),
                int(canvas_size * 0.96),
            ),
            radius=int(canvas_size * 0.22),
            outline=hex_rgba(ACCENT, 74),
            width=max(1, int(canvas_size * 0.06)),
        )
        draw.rounded_rectangle(
            (
                int(canvas_size * 0.20),
                int(canvas_size * 0.28),
                int(canvas_size * 0.80),
                int(canvas_size * 0.72),
            ),
            radius=int(canvas_size * 0.14),
            outline=hex_rgba(ICON_STROKE, 224),
            width=max(1, int(canvas_size * 0.07)),
        )
        draw.ellipse(
            (
                int(canvas_size * 0.57),
                int(canvas_size * 0.14),
                int(canvas_size * 0.84),
                int(canvas_size * 0.41),
            ),
            fill=hex_rgba(CREAM, 250),
            outline=hex_rgba(ACCENT, 110),
            width=max(1, int(canvas_size * 0.05)),
        )
        draw_sparkle(
            draw,
            (canvas_size * 0.705, canvas_size * 0.275),
            canvas_size * 0.058,
            ACCENT,
        )
        return image.resize((size, size), Image.Resampling.LANCZOS)

    draw.rounded_rectangle(
        tuple(int(canvas_size * value) for value in (0.03, 0.03, 0.97, 0.97)),
        radius=int(canvas_size * 0.22),
        outline=hex_rgba(ACCENT, 74),
        width=max(1, int(canvas_size * 0.02)),
    )

    panel_bounds = (
        int(canvas_size * 0.16),
        int(canvas_size * 0.22),
        int(canvas_size * 0.84),
        int(canvas_size * 0.74),
    )
    panel_radius = int(canvas_size * 0.15)
    draw.rounded_rectangle(
        panel_bounds,
        radius=panel_radius,
        fill=hex_rgba(SURFACE, 212),
        outline=hex_rgba(ICON_STROKE, 224),
        width=max(1, int(canvas_size * 0.03)),
    )

    dot_size = int(canvas_size * 0.12)
    dot_left = int(canvas_size * 0.26)
    dot_top = int(canvas_size * 0.42)
    draw.ellipse(
        (dot_left, dot_top, dot_left + dot_size, dot_top + dot_size),
        fill=hex_rgba(ACCENT),
    )

    line_height = max(2, int(canvas_size * 0.085))
    first_line_top = int(canvas_size * 0.34)
    second_line_top = int(canvas_size * 0.50)
    line_left = int(canvas_size * 0.43)
    first_line_width = int(canvas_size * 0.24)
    second_line_width = int(canvas_size * 0.17)
    for top, width_factor in (
        (first_line_top, first_line_width),
        (second_line_top, second_line_width),
    ):
        draw.rounded_rectangle(
            (line_left, top, line_left + width_factor, top + line_height),
            radius=line_height // 2,
            fill=hex_rgba(ICON_LINE, 238),
        )

    badge_size = int(canvas_size * 0.22)
    badge_left = int(canvas_size * 0.63)
    badge_top = int(canvas_size * 0.12)
    draw.ellipse(
        (badge_left, badge_top, badge_left + badge_size, badge_top + badge_size),
        fill=hex_rgba(CREAM, 250),
        outline=hex_rgba(ACCENT, 108),
        width=max(1, int(canvas_size * 0.02)),
    )
    draw_sparkle(
        draw,
        (badge_left + badge_size / 2, badge_top + badge_size / 2),
        canvas_size * 0.038,
        ACCENT,
    )

    return image.resize((size, size), Image.Resampling.LANCZOS)


@dataclass
class SupportFeature:
    title: str
    detail: str


@dataclass
class BannerCopy:
    title: str
    subtitle: str
    eyebrow: str
    chips: tuple[str, ...]
    feature_columns: tuple[SupportFeature, ...]
    panel_title: str
    panel_body: str
    panel_points: tuple[str, ...]


def draw_chip(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, fill: str, outline: str, text_color: str) -> int:
    font = get_font(24, bold=True)
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0] + 44
    height = 48
    draw.rounded_rectangle((x, y, x + width, y + height), radius=24, fill=hex_rgba(fill), outline=hex_rgba(outline), width=2)
    draw.text((x + 22, y + 10), text, font=font, fill=hex_rgba(text_color))
    return width


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
) -> str:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = words[0]
        for word in words[1:]:
            candidate = f"{current} {word}"
            bbox = draw.textbbox((0, 0), candidate, font=font)
            if bbox[2] - bbox[0] <= max_width:
                current = candidate
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return "\n".join(lines)


def draw_info_card(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(
        box,
        radius=28,
        fill=hex_rgba(SURFACE, 224),
        outline=hex_rgba("#D7DED8"),
        width=2,
    )
    wrapped = wrap_text(draw, text, get_font(24, bold=False), x2 - x1 - 44)
    draw.multiline_text(
        (x1 + 22, y1 + 18),
        wrapped,
        font=get_font(24, bold=False),
        fill=hex_rgba(TEXT),
        spacing=8,
    )


def draw_centered_badge(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    title: str,
    *,
    fill: str,
    outline: str,
    text_color: str,
    font_size: int = 22,
    bold: bool = False,
) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(
        box,
        radius=(y2 - y1) // 2,
        fill=hex_rgba(fill),
        outline=hex_rgba(outline),
        width=2,
    )
    font = get_font(font_size, bold=bold)
    bbox = draw.textbbox((0, 0), title, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    draw.text(
        (x1 + ((x2 - x1 - text_width) / 2), y1 + ((y2 - y1 - text_height) / 2) - 2),
        title,
        font=font,
        fill=hex_rgba(text_color),
    )


def draw_rule(
    draw: ImageDraw.ImageDraw,
    x1: int,
    y: int,
    x2: int,
    color: str,
    *,
    width: int = 2,
) -> None:
    draw.line((x1, y, x2, y), fill=hex_rgba(color), width=width)


def draw_feature_columns(
    draw: ImageDraw.ImageDraw,
    *,
    x: int,
    y: int,
    width: int,
    features: tuple[SupportFeature, ...],
) -> None:
    column_gap = 24
    column_width = (width - (column_gap * (len(features) - 1))) // len(features)
    title_font = get_font(24, bold=True)
    body_font = get_font(18, bold=False)

    for index, feature in enumerate(features):
        column_x = x + index * (column_width + column_gap)
        draw.rounded_rectangle(
            (column_x, y, column_x + 58, y + 6),
            radius=3,
            fill=hex_rgba(ACCENT),
        )
        if index < len(features) - 1:
            draw.line(
                (column_x + column_width + (column_gap // 2), y, column_x + column_width + (column_gap // 2), y + 134),
                fill=hex_rgba("#D7DED8"),
                width=2,
            )
        draw.multiline_text(
            (column_x, y + 26),
            wrap_text(draw, feature.title, title_font, column_width - 16),
            font=title_font,
            fill=hex_rgba(TEXT),
            spacing=6,
        )
        draw.multiline_text(
            (column_x, y + 76),
            wrap_text(draw, feature.detail, body_font, column_width - 16),
            font=body_font,
            fill=hex_rgba(TEXT_MUTED),
            spacing=7,
        )


def draw_panel_points(
    draw: ImageDraw.ImageDraw,
    *,
    x: int,
    y: int,
    width: int,
    items: tuple[str, ...],
    item_height: int = 62,
    gap: int = 16,
    font_size: int = 21,
    bottom_limit: int | None = None,
) -> None:
    font = get_font(font_size, bold=False)
    total_height = len(items) * item_height + max(0, len(items) - 1) * gap
    if bottom_limit is not None and y + total_height > bottom_limit:
        y = bottom_limit - total_height

    for index, item in enumerate(items):
        item_y = y + index * (item_height + gap)
        draw.rounded_rectangle(
            (x, item_y, x + width, item_y + item_height),
            radius=item_height // 2,
            fill=hex_rgba(SURFACE, 214 if index != 0 else 236),
            outline=hex_rgba(ACCENT if index == 0 else "#D7DED8", 220),
            width=2,
        )
        dot_size = 10
        dot_y = item_y + ((item_height - dot_size) // 2)
        draw.ellipse(
            (x + 18, dot_y, x + 18 + dot_size, dot_y + dot_size),
            fill=hex_rgba(ACCENT if index == 0 else TEXT_MUTED),
        )
        bbox = draw.textbbox((0, 0), item, font=font)
        text_height = bbox[3] - bbox[1]
        draw.text(
            (x + 44, item_y + ((item_height - text_height) / 2) - 2),
            item,
            font=font,
            fill=hex_rgba(TEXT if index != 0 else ACCENT_STRONG),
        )


def create_banner(size: tuple[int, int], copy: BannerCopy, path: Path) -> None:
    width, height = size
    image = vertical_gradient(size, "#FDFDF9", CREAM)
    image.alpha_composite(radial_glow(size, ACCENT, (0.12, 0.18), 0.58))
    image.alpha_composite(radial_glow(size, "#BDEADD", (0.9, 0.14), 0.36))
    image.alpha_composite(radial_glow(size, "#CAE7DE", (0.86, 0.84), 0.34))

    panel_box = (1006, 70, width - 84, height - 70)
    paste_shadow(image, panel_box, 44, 28)
    panel = Image.new("RGBA", size, (0, 0, 0, 0))
    panel_draw = ImageDraw.Draw(panel)
    panel_draw.rounded_rectangle(
        panel_box,
        radius=44,
        fill=hex_rgba(SURFACE, 236),
        outline=hex_rgba("#CBE7DE"),
        width=2,
    )
    image.alpha_composite(panel)

    panel_center_x = (panel_box[0] + panel_box[2]) // 2
    icon_size = 212
    icon = create_icon(icon_size)
    image.alpha_composite(icon, (panel_center_x - (icon_size // 2), 118))

    draw = ImageDraw.Draw(image)
    eyebrow_font = get_font(28, bold=True)
    title_font = get_font(82, bold=True)
    subtitle_font = get_font(31, bold=False)
    panel_title_font = get_font(34, bold=True)
    panel_body_font = get_font(21, bold=False)

    draw.text((92, 90), copy.eyebrow, font=eyebrow_font, fill=hex_rgba(ACCENT))
    draw.text((92, 142), copy.title, font=title_font, fill=hex_rgba(TEXT))
    wrapped_subtitle = wrap_text(draw, copy.subtitle.replace("\n", " "), subtitle_font, 790)
    draw.multiline_text(
        (92, 242),
        wrapped_subtitle,
        font=subtitle_font,
        fill=hex_rgba(TEXT_MUTED),
        spacing=14,
    )

    chip_x = 92
    for chip in copy.chips:
        chip_x += draw_chip(draw, chip_x, 392, chip, MIST, ACCENT, ACCENT) + 14

    draw_rule(draw, 92, 470, 922, "#D4DDD7")
    draw_feature_columns(
        draw,
        x=92,
        y=518,
        width=830,
        features=copy.feature_columns,
    )

    right_col_x1, right_col_x2 = 1050, width - 124
    right_col_width = right_col_x2 - right_col_x1

    title_bbox = draw.multiline_textbbox(
        (0, 0),
        wrap_text(draw, copy.panel_title, panel_title_font, right_col_width),
        font=panel_title_font,
        spacing=8,
        align="center",
    )
    title_width = title_bbox[2] - title_bbox[0]
    draw.multiline_text(
        (right_col_x1 + (right_col_width - title_width) / 2, 360),
        wrap_text(draw, copy.panel_title, panel_title_font, right_col_width),
        font=panel_title_font,
        fill=hex_rgba(TEXT),
        spacing=8,
        align="center",
    )

    wrapped_right_subtitle = wrap_text(
        draw,
        copy.panel_body,
        panel_body_font,
        right_col_width - 18,
    )
    subtitle_bbox = draw.multiline_textbbox(
        (0, 0),
        wrapped_right_subtitle,
        font=panel_body_font,
        spacing=8,
        align="center",
    )
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    draw.multiline_text(
        (right_col_x1 + (right_col_width - subtitle_width) / 2, 452),
        wrapped_right_subtitle,
        font=panel_body_font,
        fill=hex_rgba(TEXT_MUTED),
        spacing=8,
        align="center",
    )

    draw_rule(draw, right_col_x1 + 34, 552, right_col_x2 - 34, "#D4DDD7")
    draw_panel_points(
        draw,
        x=right_col_x1 + 26,
        y=584,
        width=right_col_width - 52,
        items=copy.panel_points,
        item_height=58,
        gap=12,
        font_size=20,
        bottom_limit=panel_box[3] - 26,
    )

    image.save(path)


def create_store_banner(path: Path) -> None:
    size = (1400, 560)
    image = vertical_gradient(size, "#FBFCF8", CREAM)
    image.alpha_composite(radial_glow(size, ACCENT, (0.12, 0.22), 0.62))
    image.alpha_composite(radial_glow(size, "#C8EADF", (0.82, 0.14), 0.32))
    draw = ImageDraw.Draw(image)

    panel_box = (912, 36, 1336, 526)
    paste_shadow(image, panel_box, 42, 28)
    panel = Image.new("RGBA", size, (0, 0, 0, 0))
    panel_draw = ImageDraw.Draw(panel)
    panel_draw.rounded_rectangle(
        panel_box,
        radius=42,
        fill=hex_rgba(SURFACE, 236),
        outline=hex_rgba("#CBE7DE"),
        width=2,
    )
    image.alpha_composite(panel)

    image.alpha_composite(create_icon(176), (1036, 66))

    eyebrow_font = get_font(22, bold=True)
    title_font = get_font(56, bold=True)
    copy_font = get_font(23, bold=False)
    panel_title_font = get_font(22, bold=True)
    panel_copy_font = get_font(18, bold=False)
    small_font = get_font(17, bold=False)

    draw.text((76, 76), "CaptionArc", font=eyebrow_font, fill=hex_rgba(ACCENT))
    draw.multiline_text(
        (76, 122),
        wrap_text(draw, "Browser meeting captions, translated with live AI help.", title_font, 710),
        font=title_font,
        fill=hex_rgba(TEXT),
        spacing=6,
    )
    draw.multiline_text(
        (76, 312),
        wrap_text(
            draw,
            "Capture on Google Meet, Microsoft Teams Web, and Zoom Web App. Review later with meeting profiles, searchable history, Markdown export, and local-first continuity.",
            copy_font,
            726,
        ),
        font=copy_font,
        fill=hex_rgba(TEXT_MUTED),
        spacing=8,
    )

    chip_x = 76
    for label in ("Chrome + Firefox", "AI assistant", "27 languages"):
        chip_x += draw_chip(draw, chip_x, 454, label, MIST, ACCENT, ACCENT) + 12

    draw_rule(draw, 76, 520, 868, "#D4DDD7")

    right_col_x1, right_col_x2 = 968, 1282
    right_col_width = right_col_x2 - right_col_x1
    panel_title = wrap_text(draw, "Built for live help and review", panel_title_font, right_col_width)
    panel_title_bbox = draw.multiline_textbbox(
        (0, 0),
        panel_title,
        font=panel_title_font,
        spacing=6,
        align="center",
    )
    panel_title_width = panel_title_bbox[2] - panel_title_bbox[0]
    draw.multiline_text(
        (right_col_x1 + (right_col_width - panel_title_width) / 2, 266),
        panel_title,
        font=panel_title_font,
        fill=hex_rgba(ACCENT),
        spacing=6,
        align="center",
    )

    panel_copy = wrap_text(
        draw,
        "Use live guidance in the moment, then search, export, and summarize later.",
        panel_copy_font,
        right_col_width - 6,
    )
    panel_copy_bbox = draw.multiline_textbbox(
        (0, 0),
        panel_copy,
        font=panel_copy_font,
        spacing=6,
        align="center",
    )
    panel_copy_width = panel_copy_bbox[2] - panel_copy_bbox[0]
    draw.multiline_text(
        (right_col_x1 + (right_col_width - panel_copy_width) / 2, 326),
        panel_copy,
        font=panel_copy_font,
        fill=hex_rgba(TEXT_MUTED),
        spacing=6,
        align="center",
    )

    draw_rule(draw, right_col_x1 + 20, 390, right_col_x2 - 20, "#D4DDD7")
    draw_panel_points(
        draw,
        x=right_col_x1 + 18,
        y=408,
        width=right_col_width - 36,
        items=("Meeting profiles", "Local-first archive"),
        item_height=44,
        gap=10,
        font_size=17,
        bottom_limit=panel_box[3] - 16,
    )

    draw.text(
        (76, 528),
        "Built for multilingual meetings, accessibility support, and practical post-meeting follow-up.",
        font=small_font,
        fill=hex_rgba(TEXT_FAINT),
    )

    image.save(path)


def create_logo_lockup(path: Path, dark_mode: bool) -> None:
    width, height = 1180, 320
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    if dark_mode:
        bg = vertical_gradient((width, height), DARK_RAISED, DARK)
        bg.alpha_composite(radial_glow((width, height), ACCENT, (0.18, 0.24), 0.58))
        image.alpha_composite(bg)
    else:
        bg = vertical_gradient((width, height), SURFACE, CREAM)
        bg.alpha_composite(radial_glow((width, height), ACCENT, (0.12, 0.18), 0.46))
        image.alpha_composite(bg)

    image.alpha_composite(create_icon(180), (68, 70))
    draw = ImageDraw.Draw(image)
    title_color = CREAM if dark_mode else TEXT
    subtitle_color = "#C5CDC7" if dark_mode else TEXT_MUTED
    draw.text((290, 106), "CaptionArc", font=get_font(74, bold=True), fill=hex_rgba(title_color))
    draw.text(
        (294, 198),
        "Browser meeting captions, translation, and AI follow-up",
        font=get_font(28, bold=False),
        fill=hex_rgba(subtitle_color),
    )
    image.save(path)


def write_svg(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def generate_svg_assets() -> None:
    light_logo_mark = f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="256" y1="24" x2="256" y2="488" gradientUnits="userSpaceOnUse">
      <stop stop-color="{ICON_TOP}"/>
      <stop offset="1" stop-color="{ICON_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(118 108) rotate(45) scale(214)">
      <stop stop-color="{ACCENT}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="{ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="20" y="20" width="472" height="472" rx="118" fill="url(#bg)"/>
  <rect x="20" y="20" width="472" height="472" rx="118" fill="url(#glow)"/>
  <rect x="16" y="16" width="480" height="480" rx="120" stroke="{ACCENT}" stroke-opacity="0.28" stroke-width="10"/>
  <rect x="84" y="112" width="344" height="264" rx="78" fill="{SURFACE}" fill-opacity="0.86" stroke="{ICON_STROKE}" stroke-width="16"/>
  <circle cx="152" cy="250" r="30" fill="{ACCENT}"/>
  <rect x="220" y="186" width="128" height="36" rx="18" fill="{ICON_LINE}" fill-opacity="0.96"/>
  <rect x="220" y="270" width="92" height="36" rx="18" fill="{ICON_LINE}" fill-opacity="0.96"/>
  <circle cx="372" cy="118" r="56" fill="{CREAM}" fill-opacity="0.94" stroke="{ACCENT}" stroke-opacity="0.46" stroke-width="10"/>
  <path d="M372 84L383 107L406 118L383 129L372 152L361 129L338 118L361 107L372 84Z" fill="{ACCENT}"/>
</svg>
"""
    dark_logo_mark = f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bg" x1="256" y1="24" x2="256" y2="488" gradientUnits="userSpaceOnUse">
      <stop stop-color="{DARK_RAISED}"/>
      <stop offset="1" stop-color="{DARK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(118 108) rotate(45) scale(214)">
      <stop stop-color="{ACCENT}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="{ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="20" y="20" width="472" height="472" rx="118" fill="url(#bg)"/>
  <rect x="20" y="20" width="472" height="472" rx="118" fill="url(#glow)"/>
  <rect x="16" y="16" width="480" height="480" rx="120" stroke="{ACCENT}" stroke-opacity="0.34" stroke-width="10"/>
  <rect x="84" y="112" width="344" height="264" rx="78" fill="#101613" fill-opacity="0.92" stroke="#7EE0C3" stroke-opacity="0.9" stroke-width="16"/>
  <circle cx="152" cy="250" r="30" fill="{ACCENT}"/>
  <rect x="220" y="186" width="128" height="36" rx="18" fill="{CREAM}" fill-opacity="0.94"/>
  <rect x="220" y="270" width="92" height="36" rx="18" fill="{CREAM}" fill-opacity="0.94"/>
  <circle cx="372" cy="118" r="56" fill="#0E1411" fill-opacity="0.96" stroke="#7EE0C3" stroke-opacity="0.86" stroke-width="10"/>
  <path d="M372 84L383 107L406 118L383 129L372 152L361 129L338 118L361 107L372 84Z" fill="#7EE0C3"/>
</svg>
"""
    write_svg(
        BRANDING_DIR / "logo-mark.svg",
        light_logo_mark,
    )
    write_svg(
        PUBLIC_DIR / "logo-mark.svg",
        (BRANDING_DIR / "logo-mark.svg").read_text(encoding="utf-8"),
    )
    write_svg(BRANDING_DIR / "logo-mark-light.svg", light_logo_mark)
    write_svg(PUBLIC_DIR / "logo-mark-light.svg", light_logo_mark)
    write_svg(BRANDING_DIR / "logo-mark-dark.svg", dark_logo_mark)
    write_svg(PUBLIC_DIR / "logo-mark-dark.svg", dark_logo_mark)
    write_svg(
        BRANDING_DIR / "logo-lockup-light.svg",
        f"""<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="320" viewBox="0 0 1180 320" fill="none">
  <defs>
    <linearGradient id="bg" x1="590" y1="0" x2="590" y2="320" gradientUnits="userSpaceOnUse">
      <stop stop-color="{SURFACE}"/>
      <stop offset="1" stop-color="{CREAM}"/>
    </linearGradient>
  </defs>
  <rect width="1180" height="320" rx="42" fill="url(#bg)"/>
  <rect x="0" y="0" width="1180" height="320" rx="42" fill="{ACCENT}" fill-opacity="0.06"/>
  <image href="logo-mark.svg" x="68" y="70" width="180" height="180"/>
  <text x="290" y="156" fill="{TEXT}" font-family="DejaVu Sans, Segoe UI, sans-serif" font-size="74" font-weight="700">CaptionArc</text>
  <text x="294" y="212" fill="{TEXT_MUTED}" font-family="DejaVu Sans, Segoe UI, sans-serif" font-size="28">Browser meeting captions, translation, and AI follow-up</text>
</svg>
""",
    )

    write_svg(
        BRANDING_DIR / "logo-lockup-dark.svg",
        f"""<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="320" viewBox="0 0 1180 320" fill="none">
  <defs>
    <linearGradient id="bg" x1="590" y1="0" x2="590" y2="320" gradientUnits="userSpaceOnUse">
      <stop stop-color="{DARK_RAISED}"/>
      <stop offset="1" stop-color="{DARK}"/>
    </linearGradient>
  </defs>
  <rect width="1180" height="320" rx="42" fill="url(#bg)"/>
  <rect width="1180" height="320" rx="42" fill="{ACCENT}" fill-opacity="0.08"/>
  <image href="logo-mark.svg" x="68" y="70" width="180" height="180"/>
  <text x="290" y="156" fill="{CREAM}" font-family="DejaVu Sans, Segoe UI, sans-serif" font-size="74" font-weight="700">CaptionArc</text>
  <text x="294" y="212" fill="#C5CDC7" font-family="DejaVu Sans, Segoe UI, sans-serif" font-size="28">Browser meeting captions, translation, and AI follow-up</text>
</svg>
""",
    )


def save_many_icon_sizes(sizes: Iterable[int]) -> None:
    for size in sizes:
        create_icon(size).save(PUBLIC_DIR / f"icon-{size}.png")

    create_icon(256).save(BRANDING_DIR / "icon-256.png")
    create_icon(512).save(BRANDING_DIR / "icon-512.png")


def main() -> None:
    BRANDING_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    save_many_icon_sizes((16, 32, 48, 128))
    create_logo_lockup(BRANDING_DIR / "logo-lockup-light.png", dark_mode=False)
    create_logo_lockup(BRANDING_DIR / "logo-lockup-dark.png", dark_mode=True)

    create_banner(
        (1600, 900),
        BannerCopy(
            eyebrow="BROWSER MEETING CAPTIONS, TRANSLATED LIVE",
            title="CaptionArc",
            subtitle="Capture live browser meeting captions.\nTranslate them clearly.\nGet AI guidance and review later.",
            chips=("Google Meet", "Microsoft Teams Web", "Zoom Web App"),
            feature_columns=(
                SupportFeature(
                    title="Live overlay",
                    detail="Keep captions and translation in view while the meeting keeps moving.",
                ),
                SupportFeature(
                    title="AI guidance",
                    detail="Shape assistant responses and summaries with reusable meeting profiles.",
                ),
                SupportFeature(
                    title="Local-first archive",
                    detail="Search history, export Markdown, and keep an encrypted backup when needed.",
                ),
            ),
            panel_title="Built for real meeting follow-up",
            panel_body="A calmer, more useful workflow from live captions to post-meeting review.",
            panel_points=("Chrome + Firefox", "27-language catalog", "Assistant + summaries"),
        ),
        BRANDING_DIR / "github-banner.png",
    )
    create_store_banner(BRANDING_DIR / "store-banner.png")
    generate_svg_assets()


if __name__ == "__main__":
    main()
