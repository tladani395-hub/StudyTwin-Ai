import glob

dirs = ['frontend/app', 'frontend/components', 'frontend/lib']
for d in dirs:
    for f in glob.glob(f'{d}/**/*.tsx', recursive=True) + glob.glob(f'{d}/**/*.ts', recursive=True):
        with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
            c = fp.read()
            if "from 'three'" in c or 'from "three"' in c:
                print('Imports three:', f)
