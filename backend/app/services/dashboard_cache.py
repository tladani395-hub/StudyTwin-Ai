import time
from typing import Dict, Any, Optional

_dashboard_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 30  # 30 seconds TTL cache per hackathon requirement

def get_cached_dashboard(user_id: int, course_id: int, endpoint: str = "summary") -> Optional[Dict[str, Any]]:
    key = f"{user_id}:{course_id}:{endpoint}"
    if key in _dashboard_cache:
        entry = _dashboard_cache[key]
        if time.time() - entry["timestamp"] < CACHE_TTL:
            return entry["data"]
        else:
            del _dashboard_cache[key]
    return None

def set_cached_dashboard(user_id: int, course_id: int, data: Dict[str, Any], endpoint: str = "summary"):
    key = f"{user_id}:{course_id}:{endpoint}"
    _dashboard_cache[key] = {
        "timestamp": time.time(),
        "data": data
    }

def invalidate_dashboard_cache(user_id: int, course_id: Optional[int] = None):
    if course_id:
        keys_to_del = [k for k in _dashboard_cache if k.startswith(f"{user_id}:{course_id}:")]
    else:
        keys_to_del = [k for k in _dashboard_cache if k.startswith(f"{user_id}:")]
    for k in keys_to_del:
        _dashboard_cache.pop(k, None)
