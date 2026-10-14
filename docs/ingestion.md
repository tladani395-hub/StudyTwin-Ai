# Multimodal Ingestion Pipeline

StudyTwin AI ingests three major modalities without losing physical navigation metadata:

## 1. PDF Textbooks
- Extracted page-by-page.
- Page headings and section boundaries identified.
- Diagrams, tree figures, and memory layouts parsed with multimodal vision processing.
- Metadata stored: `page`, `document_id`, `topic`, `concept`.

## 2. PPT / PPTX Lecture Slides
- Parsed slide-by-slide.
- Bullet points, titles, table structures, and shape images extracted.
- Metadata stored: `slide`, `document_id`, `topic`, `concept`.

## 3. MP4 / MOV Lecture Videos
- Audio extracted and transcribed via Whisper timestamping.
- Continuous audio segmented into coherent conceptual chunks.
- Exact seconds (`timestamp_sec`) and clock time (`12:42–13:18`) preserved.
- Direct frontend deep link format: `/video?id=789&t=762`.

## Sample Multimodal Chunk Format
```json
{
  "text": "Binary search repeatedly divides a sorted search space into smaller halves...",
  "source_type": "pdf",
  "document": "DSA_Textbook.pdf",
  "page": 142,
  "slide": null,
  "timestamp_start": null,
  "timestamp_end": null,
  "topic": "Searching",
  "concept": "Binary Search"
}
```
