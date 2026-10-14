import json

with open(r'C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 11416:
            data = json.loads(line)
            content = data.get('content', '')
            with open(r'd:\StudyTwin-AI\scratch\user_request_f0.txt', 'w', encoding='utf-8') as out:
                out.write(content)
            print("Wrote user request to d:\\StudyTwin-AI\\scratch\\user_request_f0.txt")
            break
