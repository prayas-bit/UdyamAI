from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, is_maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background
    bg_color = (15, 23, 42, 255) # #0f172a
    if is_maskable:
        draw.rectangle([0, 0, size, size], fill=bg_color)
    else:
        radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=bg_color)
    
    # Inner border
    if not is_maskable:
        draw.rounded_rectangle([1, 1, size - 2, size - 2], radius=int(size * 0.21), outline=(30, 41, 59, 255), width=int(max(2, size*0.01)))
    
    # Center emblem
    cx, cy = size / 2, size / 2
    scale = size / 192.0
    
    # Glow circle
    glow_radius = int(50 * scale)
    draw.ellipse([cx - glow_radius, cy - glow_radius, cx + glow_radius, cy + glow_radius], fill=(16, 185, 129, 35))
    
    # Draw growth leaf / arches
    emerald = (16, 185, 129, 255) # #10b981
    emerald_light = (52, 211, 153, 255) # #34d399
    gold = (245, 158, 11, 255) # #f59e0b
    
    # Arch stroke
    arch_w = int(max(4, 7 * scale))
    draw.arc([cx - 44*scale, cy - 54*scale, cx + 44*scale, cy + 54*scale], start=180, end=0, fill=emerald, width=arch_w)
    draw.arc([cx - 44*scale, cy - 30*scale, cx + 44*scale, cy + 56*scale], start=0, end=180, fill=emerald, width=arch_w)
    
    # Center Sun/Spark
    sun_r = int(14 * scale)
    draw.ellipse([cx - sun_r, cy - 8*scale - sun_r, cx + sun_r, cy - 8*scale + sun_r], fill=gold)
    
    # Foundation nodes
    draw.ellipse([cx - 28*scale - 4*scale, cy + 22*scale - 4*scale, cx - 28*scale + 4*scale, cy + 22*scale + 4*scale], fill=emerald_light)
    draw.ellipse([cx + 28*scale - 4*scale, cy + 22*scale - 4*scale, cx + 28*scale + 4*scale, cy + 22*scale + 4*scale], fill=emerald_light)
    draw.ellipse([cx - 5*scale, cy + 42*scale - 5*scale, cx + 5*scale, cy + 42*scale + 5*scale], fill=gold)

    return img

out_dir = "/home/prayas/Documents/sih/UdyamAI/frontend/public/icons"
os.makedirs(out_dir, exist_ok=True)

create_icon(192).save(os.path.join(out_dir, "icon-192x192.png"), "PNG")
create_icon(512).save(os.path.join(out_dir, "icon-512x512.png"), "PNG")
create_icon(512, is_maskable=True).save(os.path.join(out_dir, "maskable-icon-512x512.png"), "PNG")
create_icon(180).save(os.path.join(out_dir, "apple-touch-icon.png"), "PNG")
print("Successfully generated PNG icons.")
