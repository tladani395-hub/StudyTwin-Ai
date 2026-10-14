from typing import Dict, Any, Optional
from app.database.schemas import Citation


def format_citation(chunk_dict: Dict[str, Any], doc_id: int = 1) -> Citation:
    """
    Constructs an exact citation link matching the hackathon requirements:
    - PDF: /open/pdf?id={id}&page={page}
    - PPT: /open/slide?id={id}&slide={slide}
    - Video: /video?id={id}&t={seconds}
    """
    source_type = chunk_dict.get("source_type", "pdf")
    doc_title = chunk_dict.get("document", "Course Material")
    page = chunk_dict.get("page")
    slide = chunk_dict.get("slide")
    timestamp = chunk_dict.get("timestamp_start")
    timestamp_sec = chunk_dict.get("timestamp_sec")
    snippet = chunk_dict.get("text", "")[:180] + "..."

    open_url = "#"
    if source_type == "pdf" and page is not None:
        open_url = f"/open/pdf?id={doc_id}&page={page}"
    elif source_type == "ppt" and slide is not None:
        open_url = f"/open/slide?id={doc_id}&slide={slide}"
    elif source_type == "video" and timestamp_sec is not None:
        open_url = f"/video?id={doc_id}&t={int(timestamp_sec)}"

    return Citation(
        source_type=source_type,
        document_title=doc_title,
        page=page,
        slide=slide,
        timestamp=timestamp,
        timestamp_sec=timestamp_sec,
        snippet=snippet,
        open_url=open_url
    )
