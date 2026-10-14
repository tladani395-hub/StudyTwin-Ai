import re

with open('frontend/components/brand/ThreeDIntroCanvas.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "import THREE from '@/lib/threeIntro';",
    "import type * as THREE_TYPES from 'three';\nimport { THREE } from '@/lib/threeIntro';"
)

text = re.sub(r':\s*THREE\.([A-Za-z0-9_]+)', r': THREE_TYPES.\1', text)
text = re.sub(r'as\s+THREE\.([A-Za-z0-9_]+)', r'as THREE_TYPES.\1', text)

with open('frontend/components/brand/ThreeDIntroCanvas.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated types to THREE_TYPES in ThreeDIntroCanvas.tsx successfully!')
