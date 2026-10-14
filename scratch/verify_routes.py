import urllib.request
import urllib.error
import time

ROUTES = [
    ('/', 'Home / Root Landing'),
    ('/welcome', 'Welcome Page (Sign in / Sign up)'),
    ('/login', 'Authentication: Log In'),
    ('/signup', 'Authentication: Sign Up'),
    ('/dashboard', 'Student Adaptive Dashboard'),
    ('/courses', 'Course Syllabus & Ingestion Hub'),
    ('/tutor', 'Source-Grounded AI Tutor'),
    ('/assessment', 'BKT Mastery & Quiz Engine'),
    ('/intro', 'Full Brand Intro Cinema Page'),
    ('/knowledge-map', 'Prerequisite DAG Knowledge Graph'),
    ('/settings', 'Settings (Theme, Sound, Intro toggles)'),
    ('/architecture', 'System Architecture & Citations'),
    ('http://localhost:8000/api/health', 'Backend FastAPI Health Status'),
]

def main():
    print("=" * 80)
    print(f"{'ROUTE':<35} | {'STATUS':<10} | {'LATENCY':<10} | {'DESCRIPTION'}")
    print("-" * 80)

    all_200 = True
    for route, desc in ROUTES:
        url = route if route.startswith('http') else f'http://localhost:3000{route}'
        start = time.time()
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'AanviRouteVerifier/1.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                elapsed_ms = (time.time() - start) * 1000
                status = resp.status
                print(f"{route:<35} | {status} OK    | {elapsed_ms:>6.1f} ms  | {desc}")
                if status != 200:
                    all_200 = False
        except urllib.error.HTTPError as e:
            elapsed_ms = (time.time() - start) * 1000
            print(f"{route:<35} | {e.code} ERR   | {elapsed_ms:>6.1f} ms  | {desc}")
            all_200 = False
        except Exception as e:
            elapsed_ms = (time.time() - start) * 1000
            print(f"{route:<35} | FAIL       | {elapsed_ms:>6.1f} ms  | {desc} ({e})")
            all_200 = False

    print("=" * 80)
    if all_200:
        print("ALL ROUTES VERIFIED: 100% 200 OK")
    else:
        print("ROUTE VERIFICATION DETECTED NON-200 CODES")

if __name__ == '__main__':
    main()
