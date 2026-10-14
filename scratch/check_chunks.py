import glob, os, gzip

for f in glob.glob('frontend/.next/static/chunks/**/*.js', recursive=True):
    raw = os.path.getsize(f)
    with open(f, 'rb') as fp:
        content = fp.read()
        gz = len(gzip.compress(content))
        text = content.decode('utf-8', errors='ignore')
        has_canvas = "ThreeDIntroCanvas" in text
        has_webgl = "WebGLRenderer" in text
        has_three = "three" in f.lower() or "three-core" in f.lower()
        if has_canvas or has_webgl or has_three:
            basename = os.path.basename(f)
            print(f"Chunk: {basename:40} | Raw: {raw/1024:7.2f} KB | Gzip: {gz/1024:7.2f} KB | Canvas: {has_canvas} | WebGL: {has_webgl}")
