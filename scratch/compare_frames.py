import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

brain_dir = r"C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5"
f0_dir = r"D:\StudyTwin-AI\scratch\f0_measurements"

timestamps = ["3_0s", "5_2s", "6_0s", "7_0s"]

print("=== FRAME AUDIT & PIXEL COMPARISON ===")

for ts in timestamps:
    before_path = os.path.join(brain_dir, f"part_a6_frame_{ts}.png")
    after_path = os.path.join(f0_dir, f"part_f0_frame_{ts}.png")

    if not os.path.exists(before_path) or not os.path.exists(after_path):
        print(f"Skipping {ts}: missing before or after file")
        continue

    img_before = Image.open(before_path).convert("RGB")
    img_after = Image.open(after_path).convert("RGB")

    # Resize if needed
    if img_before.size != img_after.size:
        img_after = img_after.resize(img_before.size, Image.Resampling.LANCZOS)

    diff = ImageChops.difference(img_before, img_after)
    # Compute RMS difference
    import math
    h = diff.histogram()
    sq = (value * ((idx % 256) ** 2) for idx, value in enumerate(h))
    sum_of_squares = sum(sq)
    rms_diff = math.sqrt(sum_of_squares / float(img_before.size[0] * img_before.size[1] * 3))

    w, h_dim = img_before.size
    comp_w = w * 2 + 40
    comp_h = h_dim + 80
    comparison = Image.new("RGB", (comp_w, comp_h), color=(15, 10, 25))

    draw = ImageDraw.Draw(comparison)
    draw.text((30, 25), f"A6.0 (Reference) — t = {ts.replace('_', '.')} | Original Mesh/Extrude", fill=(255, 255, 255))
    draw.text((w + 50, 25), f"A6.2 / F0 (Current) — t = {ts.replace('_', '.')} | Modular Subset (RMS Diff: {rms_diff:.2f})", fill=(255, 215, 0))

    comparison.paste(img_before, (20, 60))
    comparison.paste(img_after, (w + 40, 60))

    out_comp_path = os.path.join(brain_dir, f"part_f0_comparison_{ts}.png")
    comparison.save(out_comp_path)
    comparison.save(os.path.join(f0_dir, f"comparison_{ts}.png"))

    print(f"Timestamp {ts.replace('_', '.')}: RMS Difference = {rms_diff:.2f}")
    print(f"  Saved side-by-side comparison: {out_comp_path}")
