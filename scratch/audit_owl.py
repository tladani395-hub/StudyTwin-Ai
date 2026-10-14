import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

search_dirs = [r"d:\StudyTwin-AI\frontend", r"d:\StudyTwin-AI\backend"]
ignore_dirs = {".git", "node_modules", ".next", "venv", "__pycache__", "coverage", ".turbo"}

hits_owl_emoji = []
hits_owl_text = []

for base_dir in search_dirs:
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in [".ts", ".tsx", ".js", ".jsx", ".json", ".py", ".md", ".html", ".css"]:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        for line_num, line in enumerate(f, 1):
                            if "🦉" in line:
                                hits_owl_emoji.append((file_path, line_num, line.strip()))
                            line_lower = line.lower()
                            # check for word 'owl'
                            import re
                            if re.search(r'\bowl\b|\bowls\b', line_lower):
                                hits_owl_text.append((file_path, line_num, line.strip()))
                except Exception as e:
                    pass

print("=== OWL EMOJI HITS ===")
for p, l, text in hits_owl_emoji:
    print(f"{p}:{l} -> {text}")

print("\n=== OWL TEXT HITS ===")
for p, l, text in hits_owl_text:
    print(f"{p}:{l} -> {text}")
