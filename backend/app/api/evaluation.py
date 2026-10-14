import os
import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/eval", tags=["evaluation"])

@router.get("/results")
def get_evaluation_results() -> Dict[str, Any]:
    """
    Returns latest full system evaluation benchmark results.
    """
    possible_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "eval", "results", "evaluation_report.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "eval", "results", "evaluation_report.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "evaluation", "results", "evaluation_report.json")),
    ]

    for p in possible_paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)

    # Fallback to trigger run_all if not generated
    try:
        from eval.run_all import run_full_evaluation
        return run_full_evaluation()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation report not found: {e}")
