import json

transcript_path = r'C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5\.system_generated\logs\transcript_full.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        content = data.get('content', '')
        if any(term in content for term in ['PART F0', 'Part F0', 'PART F', 'Part F:', 'F0:']):
            src = data.get('source', '')
            print(f"Line {i}, Source: {src}, Len: {len(content)}")
            with open(f"d:\\StudyTwin-AI\\scratch\\f0_hit_{i}.txt", "w", encoding="utf-8") as out:
                out.write(content[:4000])
