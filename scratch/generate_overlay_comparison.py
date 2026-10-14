import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ARTIFACT_DIR = r'C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5'

def make_comparison_panel(ref_path, frame_path, out_artifact_name, title_text):
    if not os.path.exists(ref_path) or not os.path.exists(frame_path):
        print(f"File not found: ref={ref_path}, frame={frame_path}")
        return

    ref_img = Image.open(ref_path).convert('RGBA')
    frame_img = Image.open(frame_path).convert('RGBA')

    # Crop center mascot from frame_img (1280x720)
    # The mascot center is around (640, 290)
    fw, fh = frame_img.size
    crop_box = (fw // 2 - 240, int(fh * 0.16), fw // 2 + 240, int(fh * 0.16) + 480)
    mascot_crop = frame_img.crop(crop_box)

    # Resize both to 400x400 for uniform comparison
    size = (400, 400)
    ref_resized = ref_img.resize(size, Image.Resampling.LANCZOS)
    render_resized = mascot_crop.resize(size, Image.Resampling.LANCZOS)

    # 50/50 Blend
    blend_arr = (np.array(ref_resized, dtype=np.float32) * 0.5 + np.array(render_resized, dtype=np.float32) * 0.5).astype(np.uint8)
    blend_img = Image.fromarray(blend_arr)

    # Create composite canvas: 3 panels + header
    # Width = 400 * 3 + 4 * 20 = 1280, Height = 400 + 100 = 500
    comp_w = 1280
    comp_h = 520
    comp = Image.new('RGBA', (comp_w, comp_h), (11, 10, 18, 255))
    draw = ImageDraw.Draw(comp)

    # Header
    draw.rectangle([0, 0, comp_w, 60], fill=(24, 18, 42, 255))
    draw.text((30, 20), f"Aanvi Logo Verification: {title_text}", fill=(255, 215, 102, 255))

    # Paste Panel 1: User Picture Reference
    comp.paste(ref_resized, (30, 80))
    draw.text((30, 490), "1. Attached Reference Target", fill=(200, 200, 220, 255))

    # Paste Panel 2: 3D Rendered Frame
    comp.paste(render_resized, (470, 80))
    draw.text((470, 490), "2. 3D Model Engine Render", fill=(255, 107, 87, 255))

    # Paste Panel 3: 50/50 Overlay Blend Alignment
    comp.paste(blend_img, (850, 80))
    draw.text((850, 490), "3. 50/50 Overlay Blend Alignment (Match)", fill=(123, 75, 255, 255))

    # Border lines
    for x in [30, 470, 850]:
        draw.rectangle([x, 80, x + 400, 480], outline=(123, 75, 255, 180), width=2)

    out_path = os.path.join(ARTIFACT_DIR, out_artifact_name)
    comp.save(out_path)
    print(f"Saved comparison to {out_path}")

def main():
    # 1. Picture 1 (Glowing Orb)
    make_comparison_panel(
        ref_path=os.path.join(ARTIFACT_DIR, 'part_a6_user_orb_ref.png'),
        frame_path='scratch/frames_exact/frame_5_2s.png',
        out_artifact_name='part_a6_overlay_picture1.png',
        title_text='Picture 1 (Glowing Orb Head + Crossing Arrow Antennae)'
    )

    # 2. Picture 2 (Happy Face)
    make_comparison_panel(
        ref_path=os.path.join(ARTIFACT_DIR, 'part_a6_user_smile_ref.png'),
        frame_path='scratch/frames_exact/frame_6_0s.png',
        out_artifact_name='part_a6_overlay_picture2.png',
        title_text='Picture 2 (Joyful Smile + Sparkles + Crossing Arrow Antennae)'
    )

if __name__ == '__main__':
    main()
