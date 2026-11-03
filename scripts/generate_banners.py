import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def make_pill_banner(
    filename,
    is_dark=True,
    width=360,
    height=68,
    scale=3,
    show_arrow=True,
    show_dot=True
):
    W, H = width * scale, height * scale
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad_x = 8 * scale
    pad_y = 6 * scale
    bx1, by1 = pad_x, pad_y
    bx2, by2 = W - pad_x, H - pad_y
    pill_h = by2 - by1
    radius = pill_h // 2

    # Color themes
    if is_dark:
        bg_fill = (9, 18, 28, 250)
        border_col = (16, 185, 129, 200)
        sub_col = (148, 163, 184, 255) # Slate 400
        orbit_col = (255, 255, 255, 255)
        saas_col = (52, 211, 153, 255) # Emerald 400
        div_col = (51, 65, 85, 200)
        arrow_col = (148, 163, 184, 255)
        dot_col = (16, 185, 129, 255)
    else:
        bg_fill = (255, 255, 255, 252)
        border_col = (203, 213, 225, 255) # Slate 300
        sub_col = (100, 116, 139, 255) # Slate 500
        orbit_col = (15, 23, 42, 255) # Slate 900
        saas_col = (5, 150, 105, 255) # Emerald 600
        div_col = (226, 232, 240, 255)
        arrow_col = (100, 116, 139, 255)
        dot_col = (5, 150, 105, 255)

    # Ambient glow on dark
    if is_dark:
        glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_draw.ellipse(
            [bx1 - 20 * scale, by1 - 20 * scale, bx1 + 100 * scale, by2 + 20 * scale],
            fill=(16, 185, 129, 45)
        )
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(15 * scale))
        img = Image.alpha_composite(img, glow_layer)
        draw = ImageDraw.Draw(img)

    # Pill shape
    draw.rounded_rectangle(
        [bx1, by1, bx2, by2],
        radius=radius,
        fill=bg_fill,
        outline=border_col,
        width=max(2, int(1.6 * scale))
    )

    # Logo Icon
    icon_path = 'frontend/public/orbit-icon.png'
    icon_size = int(pill_h * 0.76)
    icon_x = bx1 + int(pill_h * 0.12)
    icon_y = by1 + (pill_h - icon_size) // 2

    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert('RGBA')
        icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        img.paste(icon, (icon_x, icon_y), icon)

    # Fonts
    font_sub = None
    font_main = None
    for font_name in ['segoeuib.ttf', 'arialbd.ttf', 'arial.ttf']:
        try:
            font_sub = ImageFont.truetype(f'C:/Windows/Fonts/{font_name}', int(9.5 * scale))
            font_main = ImageFont.truetype(f'C:/Windows/Fonts/{font_name}', int(18 * scale))
            break
        except:
            continue
    if not font_sub:
        font_sub = ImageFont.load_default()
        font_main = ImageFont.load_default()

    text_x = icon_x + icon_size + int(12 * scale)

    # Line 1: A PRODUCT OF
    draw.text((text_x, by1 + int(11 * scale)), 'A PRODUCT OF', fill=sub_col, font=font_sub)

    # Line 2: OrbitSaaS
    draw.text((text_x, by1 + int(24 * scale)), 'Orbit', fill=orbit_col, font=font_main)
    # Measure 'Orbit' width to place 'SaaS'
    orbit_bbox = draw.textbbox((text_x, by1 + int(24 * scale)), 'Orbit', font=font_main)
    saas_x = orbit_bbox[2]
    draw.text((saas_x, by1 + int(24 * scale)), 'SaaS', fill=saas_col, font=font_main)

    # Right side elements: divider, live dot, arrow
    if show_arrow or show_dot:
        div_x = bx2 - int(48 * scale)
        draw.line(
            [(div_x, by1 + int(14 * scale)), (div_x, by2 - int(14 * scale))],
            fill=div_col,
            width=max(1, int(1 * scale))
        )

        # Pulse dot
        if show_dot:
            dot_cx = div_x + int(16 * scale)
            dot_cy = by1 + pill_h // 2
            dot_r = int(3.2 * scale)
            draw.ellipse(
                [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
                fill=dot_col
            )
            # Faint ring around dot
            ring_r = dot_r + int(2.5 * scale)
            draw.ellipse(
                [dot_cx - ring_r, dot_cy - ring_r, dot_cx + ring_r, dot_cy + ring_r],
                outline=(dot_col[0], dot_col[1], dot_col[2], 90),
                width=max(1, int(0.8 * scale))
            )

        # Arrow ↗
        if show_arrow:
            arr_x = div_x + int(28 * scale)
            arr_y = by1 + pill_h // 2
            s = int(5 * scale)
            draw.line([(arr_x - s, arr_y + s), (arr_x + s, arr_y - s)], fill=arrow_col, width=int(1.8 * scale))
            draw.line([(arr_x + s, arr_y - s), (arr_x, arr_y - s)], fill=arrow_col, width=int(1.8 * scale))
            draw.line([(arr_x + s, arr_y - s), (arr_x + s, arr_y)], fill=arrow_col, width=int(1.8 * scale))

    # Save crisp version
    img.save(filename, 'PNG', optimize=True)
    print(f"Generated: {filename} ({W}x{H} @ {scale}x scale)")

def make_compact_badge(filename, is_dark=True, scale=3):
    width, height = 240, 44
    W, H = width * scale, height * scale
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad_x, pad_y = 4 * scale, 3 * scale
    bx1, by1 = pad_x, pad_y
    bx2, by2 = W - pad_x, H - pad_y
    radius = (by2 - by1) // 2

    bg_fill = (9, 18, 28, 250) if is_dark else (255, 255, 255, 252)
    border_col = (16, 185, 129, 180) if is_dark else (203, 213, 225, 255)
    text_prefix_col = (148, 163, 184, 255) if is_dark else (100, 116, 139, 255)
    orbit_col = (255, 255, 255, 255) if is_dark else (15, 23, 42, 255)
    saas_col = (52, 211, 153, 255) if is_dark else (5, 150, 105, 255)

    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=radius, fill=bg_fill, outline=border_col, width=max(1, int(1.4 * scale)))

    # Icon
    icon_path = 'frontend/public/orbit-icon.png'
    icon_size = int((by2 - by1) * 0.72)
    icon_x = bx1 + int(6 * scale)
    icon_y = by1 + (by2 - by1 - icon_size) // 2

    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert('RGBA')
        icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        img.paste(icon, (icon_x, icon_y), icon)

    try:
        font_light = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', int(12.5 * scale))
        font_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', int(13.5 * scale))
    except:
        font_light = ImageFont.load_default()
        font_bold = ImageFont.load_default()

    text_x = icon_x + icon_size + int(8 * scale)
    text_y = by1 + int(11 * scale)

    draw.text((text_x, text_y), 'A product of ', fill=text_prefix_col, font=font_light)
    prefix_bbox = draw.textbbox((text_x, text_y), 'A product of ', font=font_light)
    brand_x = prefix_bbox[2]

    draw.text((brand_x, text_y - int(0.5 * scale)), 'Orbit', fill=orbit_col, font=font_bold)
    orbit_bbox = draw.textbbox((brand_x, text_y - int(0.5 * scale)), 'Orbit', font=font_bold)
    saas_x = orbit_bbox[2]

    draw.text((saas_x, text_y - int(0.5 * scale)), 'SaaS', fill=saas_col, font=font_bold)

    # Arrow
    arr_x = bx2 - int(16 * scale)
    arr_y = by1 + (by2 - by1) // 2
    s = int(3.5 * scale)
    arrow_col = (148, 163, 184, 255) if is_dark else (100, 116, 139, 255)
    draw.line([(arr_x - s, arr_y + s), (arr_x + s, arr_y - s)], fill=arrow_col, width=int(1.5 * scale))
    draw.line([(arr_x + s, arr_y - s), (arr_x, arr_y - s)], fill=arrow_col, width=int(1.5 * scale))
    draw.line([(arr_x + s, arr_y - s), (arr_x + s, arr_y)], fill=arrow_col, width=int(1.5 * scale))

    img.save(filename, 'PNG', optimize=True)
    print(f"Generated: {filename} ({W}x{H} @ {scale}x scale)")

if __name__ == '__main__':
    os.makedirs('banners', exist_ok=True)
    os.makedirs('frontend/public/banners', exist_ok=True)

    make_pill_banner('banners/product-of-orbitsaas-dark.png', is_dark=True)
    make_pill_banner('banners/product-of-orbitsaas-light.png', is_dark=False)
    make_compact_badge('banners/product-of-orbitsaas-badge.png', is_dark=True)
    make_compact_badge('banners/product-of-orbitsaas-badge-light.png', is_dark=False)

    # Also save the primary default named exactly what the user asked for:
    make_pill_banner('banners/product-of-orbitsaas.png', is_dark=True)

    # Copy to public directories
    for f in os.listdir('banners'):
        if f.endswith('.png'):
            src = os.path.join('banners', f)
            dst = os.path.join('frontend/public/banners', f)
            with open(src, 'rb') as sf, open(dst, 'wb') as df:
                df.write(sf.read())

    # Also copy to Luvio public if it exists so it's directly ready in their customer project!
    luvio_pub = 'c:/Users/Adnan/Desktop/Orbit SaaS/0. Customer/Luvio.it-/frontend/public/banners'
    if os.path.exists('c:/Users/Adnan/Desktop/Orbit SaaS/0. Customer/Luvio.it-/frontend/public'):
        os.makedirs(luvio_pub, exist_ok=True)
        for f in os.listdir('banners'):
            if f.endswith('.png'):
                src = os.path.join('banners', f)
                dst = os.path.join(luvio_pub, f)
                with open(src, 'rb') as sf, open(dst, 'wb') as df:
                    df.write(sf.read())
        print(f"Also copied to Luvio project: {luvio_pub}")
