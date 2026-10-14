import glob
import re

for f in glob.glob('frontend/.next/static/chunks/*.js'):
    if 'bd904a5c' in f:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
            c = fp.read()
            # Look for function names or variable patterns
            strs = [s for s in re.findall(r'"([^"\\]{4,50})"', c) if not s.startswith('/')][:30]
            print('Strings found in bd904a5c:', strs[:25])
