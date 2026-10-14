import json

transcript_path = r'C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5\.system_generated\logs\transcript_full.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 3972:
            data = json.loads(line)
            content = data.get('content', '')
            with open(r'd:\StudyTwin-AI\scratch\prompt_3972_full.txt', 'w', encoding='utf-8') as out:
                out.write(content)
            print(f"Wrote {len(content)} chars to d:\\StudyTwin-AI\\scratch\\prompt_3972_full.txt")
            break
