import os
import gzip
import glob

CHUNKS_DIR = r"D:\StudyTwin-AI\frontend\.next\static\chunks"

def analyze_chunks():
    all_chunks = glob.glob(os.path.join(CHUNKS_DIR, "**", "*.js"), recursive=True)
    three_chunks = []
    for c in all_chunks:
        size_raw = os.path.getsize(c)
        with open(c, 'rb') as f:
            content = f.read()
            # Check if chunk contains three.js identifiers
            is_three = b'ACESFilmicToneMapping' in content or b'THREE.' in content or b'PerspectiveCamera' in content
            if is_three:
                gzipped = gzip.compress(content)
                size_gz = len(gzipped)
                three_chunks.append({
                    "path": os.path.relpath(c, r"D:\StudyTwin-AI\frontend"),
                    "raw_kb": size_raw / 1024.0,
                    "gz_kb": size_gz / 1024.0,
                    "budget_kb": 150.0,
                    "within_budget": size_gz / 1024.0 <= 150.0
                })

    print("--- 3D Three.js Bundle Chunk Analysis ---")
    for tc in three_chunks:
        status = "PASSED (Within 150KB budget)" if tc["within_budget"] else "EXCEEDS BUDGET"
        print(f"Chunk: {tc['path']}")
        print(f"  Uncompressed Size: {tc['raw_kb']:.2f} KB")
        print(f"  Gzipped Size:      {tc['gz_kb']:.2f} KB (Budget: {tc['budget_kb']:.1f} KB) -> {status}")
    
    return three_chunks

if __name__ == "__main__":
    analyze_chunks()
