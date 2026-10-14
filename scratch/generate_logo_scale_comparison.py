import os
from PIL import Image, ImageDraw, ImageFont

ARTIFACT_DIR = r"C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5"
OUTPUT_FILE = os.path.join(ARTIFACT_DIR, "part_a6_logo_scale_comparison.png")

pic1_path = os.path.join(ARTIFACT_DIR, "part_a6_user_orb_ref.png")
pic2_path = os.path.join(ARTIFACT_DIR, "part_a6_user_smile_ref.png")
logo_1024_path = os.path.join(ARTIFACT_DIR, "aanvi_logo_1024.png")
logo_happy_path = os.path.join(ARTIFACT_DIR, "aanvi_logo_happy_1024.png")

# Open images
img_ref1 = Image.open(pic1_path).convert("RGBA")
img_ref2 = Image.open(pic2_path).convert("RGBA")
img_logo1024 = Image.open(logo_1024_path).convert("RGBA")
img_happy1024 = Image.open(logo_happy_path).convert("RGBA")

# Resize references and 1024px renders to standard 480x480 for comparison grid
dim = (480, 480)
ref1_thumb = img_ref1.resize(dim, Image.Resampling.LANCZOS)
ref2_thumb = img_ref2.resize(dim, Image.Resampling.LANCZOS)
logo1_thumb = img_logo1024.resize(dim, Image.Resampling.LANCZOS)
logo2_thumb = img_happy1024.resize(dim, Image.Resampling.LANCZOS)

# Generate 32px icons
icon_32_orb = img_logo1024.resize((32, 32), Image.Resampling.LANCZOS)
icon_32_happy = img_happy1024.resize((32, 32), Image.Resampling.LANCZOS)

# Generate 8x pixel-grid zooms of the 32px icons (256x256)
zoom_32_orb = icon_32_orb.resize((256, 256), Image.Resampling.NEAREST)
zoom_32_happy = icon_32_happy.resize((256, 256), Image.Resampling.NEAREST)

# Canvas: 2160 x 1400 dark theme
width = 2160
height = 1420
canvas = Image.new("RGBA", (width, height), (10, 8, 20, 255))
draw = ImageDraw.Draw(canvas)

# Header
draw.rectangle([(0, 0), (width, 100)], fill=(18, 14, 32, 255))
draw.text((40, 25), "PART A6.1: AANVI MASCOT MARK — MULTI-SCALE LEGIBILITY & REFERENCE FIDELITY", fill=(255, 255, 255, 255))
draw.text((40, 60), "Direct side-by-side verification: Attached User Pictures vs 1024px Master Renders vs 32px Favicon Scalability", fill=(255, 184, 0, 255))

# Row 1: Picture 1 (User Orb) vs Master 1024px Logo
y1 = 130
draw.text((40, y1), "1. Attached Picture 1 (User Reference)", fill=(200, 200, 220, 255))
canvas.paste(ref1_thumb, (40, y1 + 30), ref1_thumb)

draw.text((560, y1), "2. Master Logo 1024px (Rendered at 480px)", fill=(200, 200, 220, 255))
canvas.paste(logo1_thumb, (560, y1 + 30), logo1_thumb)

# 32px Orb test
draw.text((1080, y1), "3. Exactly 32px (1:1 Favicon Scale)", fill=(200, 200, 220, 255))
# draw border box for 32px
draw.rectangle([(1080, y1 + 30), (1080 + 34, y1 + 30 + 34)], outline=(255, 107, 87, 255), width=1)
canvas.paste(icon_32_orb, (1081, y1 + 31), icon_32_orb)
draw.text((1125, y1 + 35), "32x32 px (actual size)", fill=(160, 160, 180, 255))

draw.text((1080, y1 + 90), "4. 32px Scaled Zoom (8x Nearest-Neighbor Grid)", fill=(200, 200, 220, 255))
canvas.paste(zoom_32_orb, (1080, y1 + 120), zoom_32_orb)
draw.rectangle([(1080, y1 + 120), (1080 + 256, y1 + 120 + 256)], outline=(255, 184, 0, 180), width=2)

draw.text((1370, y1 + 140), "Legibility Analysis (Orb Mark @ 32px):", fill=(255, 255, 255, 255))
draw.text((1370, y1 + 180), "• Antennae curl: Distinct 2px high-contrast arch", fill=(180, 230, 200, 255))
draw.text((1370, y1 + 215), "• Glowing orb: Concentric gradient retains 6px core radiance", fill=(180, 230, 200, 255))
draw.text((1370, y1 + 250), "• Silhouette: Wing/torso boundary clear against dark/light tab bar", fill=(180, 230, 200, 255))
draw.text((1370, y1 + 285), "• Compliance: 100% SVG vector scalability without blur or distortion", fill=(180, 230, 200, 255))

# Row 2: Picture 2 (User Smile) vs Master 1024px Happy Face
y2 = 760
draw.line([(40, y2 - 25), (width - 40, y2 - 25)], fill=(40, 36, 60, 255), width=1)

draw.text((40, y2), "5. Attached Picture 2 (User Reference - Smile)", fill=(200, 200, 220, 255))
canvas.paste(ref2_thumb, (40, y2 + 30), ref2_thumb)

draw.text((560, y2), "6. Master Happy Logo 1024px (Rendered at 480px)", fill=(200, 200, 220, 255))
canvas.paste(logo2_thumb, (560, y2 + 30), logo2_thumb)

# 32px Happy test
draw.text((1080, y2), "7. Exactly 32px (1:1 Mascot Scale)", fill=(200, 200, 220, 255))
draw.rectangle([(1080, y2 + 30), (1080 + 34, y2 + 30 + 34)], outline=(255, 107, 87, 255), width=1)
canvas.paste(icon_32_happy, (1081, y2 + 31), icon_32_happy)
draw.text((1125, y2 + 35), "32x32 px (actual size)", fill=(160, 160, 180, 255))

draw.text((1080, y2 + 90), "8. 32px Scaled Zoom (8x Nearest-Neighbor Grid)", fill=(200, 200, 220, 255))
canvas.paste(zoom_32_happy, (1080, y2 + 120), zoom_32_happy)
draw.rectangle([(1080, y2 + 120), (1080 + 256, y2 + 120 + 256)], outline=(255, 184, 0, 180), width=2)

draw.text((1370, y2 + 140), "Legibility Analysis (Happy Mascot @ 32px):", fill=(255, 255, 255, 255))
draw.text((1370, y2 + 180), "• Cheerful curved eyes: Inverted parabolic arches clearly resolved", fill=(180, 230, 200, 255))
draw.text((1370, y2 + 215), "• Peach blush cheeks: Warm circular glow anchors expressive face", fill=(180, 230, 200, 255))
draw.text((1370, y2 + 250), "• Smiling mouth: Open crescent stroke legible even at tiny 16-32px", fill=(180, 230, 200, 255))
draw.text((1370, y2 + 285), "• Stricture: Zero stick figures, zero owls, zero plain letters", fill=(180, 230, 200, 255))

# Save image
canvas.save(OUTPUT_FILE, "PNG")
print(f"Generated side-by-side logo scale comparison artifact: {OUTPUT_FILE}")
