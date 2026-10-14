import json

transcript_path = r'C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        content = data.get('content', '')
        if 'F0' in content or 'Part F0' in content:
            src = data.get('source', '')
            print(f"Line {i}, Source: {src}, Len: {len(content)}")
            # print snippets
            idx = content.find('F0')
            start = max(0, idx - 100)
            end = min(len(content), idx + 500)
            print(content[start:end])
            print("="*60)
