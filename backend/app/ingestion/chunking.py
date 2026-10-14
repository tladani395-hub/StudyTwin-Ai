import re
from typing import List, Dict, Any, Optional


def create_chunks_from_page(
    text: str,
    doc_title: str,
    page_num: int,
    source_type: str = "pdf",
    chunk_size: int = 500,
    overlap: int = 80,
    diagram_description: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Split page text into semantic chunks while strictly retaining the page number and document metadata.
    """
    chunks = []
    
    # Prepend diagram description if present
    full_text = text.strip()
    if diagram_description:
        full_text = f"{full_text}\n\n{diagram_description}"

    if not full_text:
        return []

    # Detect primary topic / concept
    topic = detect_topic_from_text(full_text)
    concept = detect_concept_from_text(full_text, topic)

    paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [full_text]

    current_chunk = ""
    for para in paragraphs:
        if len(current_chunk) + len(para) < chunk_size:
            current_chunk += ("\n\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append({
                    "text": current_chunk,
                    "source_type": source_type,
                    "document": doc_title,
                    "page": page_num,
                    "slide": None,
                    "timestamp_start": None,
                    "timestamp_end": None,
                    "timestamp_sec": None,
                    "topic": topic,
                    "concept": concept,
                    "metadata": {"has_diagram": bool(diagram_description)}
                })
            current_chunk = para

    if current_chunk:
        chunks.append({
            "text": current_chunk,
            "source_type": source_type,
            "document": doc_title,
            "page": page_num,
            "slide": None,
            "timestamp_start": None,
            "timestamp_end": None,
            "timestamp_sec": None,
            "topic": topic,
            "concept": concept,
            "metadata": {"has_diagram": bool(diagram_description)}
        })

    return chunks


def detect_language(text: str) -> str:
    devanagari_count = len(re.findall(r'[\u0900-\u097F]', text))
    gujarati_count = len(re.findall(r'[\u0A80-\u0AFF]', text))
    if gujarati_count > 10 and gujarati_count >= devanagari_count:
        return "Gujarati"
    elif devanagari_count > 10:
        return "Hindi"
    return "English"


def detect_topic_from_text(text: str) -> str:
    lang = detect_language(text)
    text_lower = text.lower()

    if lang == "Hindi":
        if any(k in text for k in ["ट्री", "वृक्ष", "बाइनरी सर्च ट्री", "बीएसटी", "ट्रैवर्सल"]):
            return "ट्री डेटा संरचना (Trees)"
        elif any(k in text for k in ["सर्च", "खोज", "बाइनरी सर्च"]):
            return "सर्चिंग एल्गोरिदम (Searching)"
        elif any(k in text for k in ["ग्राफ", "नेटवर्क", "डीएफएस", "बीएफएस"]):
            return "ग्राफ सिद्धांत (Graphs)"
        elif any(k in text for k in ["एरे", "सरणी", "मेमोरी", "सॉर्टिंग"]):
            return "एरे एवं मेमोरी (Arrays)"
        return "कंप्यूटर विज्ञान डेटा संरचनाएं"

    elif lang == "Gujarati":
        if any(k in text for k in ["ટ્રી", "વૃક્ષ", "બાઈનરી સર્ચ ટ્રી", "બીએસટી", "ટ્રાવર્સલ"]):
            return "વૃક્ષ ડેટા સ્ટ્રક્ચર (Trees)"
        elif any(k in text for k in ["સર્ચ", "શોધ", "બાઈનરી સર્ચ"]):
            return "શોધ અલ્ગોરિધમ (Searching)"
        elif any(k in text for k in ["ગ્રાફ", "નેટવર્ક"]):
            return "ગ્રાફ થિયરી (Graphs)"
        elif any(k in text for k in ["એરે", "શ્રેણી", "મેમરી", "સૉર્ટિંગ"]):
            return "એરે અને મેમરી (Arrays)"
        return "કમ્પ્યુટર વિજ્ઞાન ડેટા સ્ટ્રક્ચર"

    if any(k in text_lower for k in ["binary search tree", "bst", "binary tree", "tree traversal", "in-order", "pre-order", "post-order", "avl", "tree"]):
        return "Trees"
    elif any(k in text_lower for k in ["graph", "breadth first", "depth first", "bfs", "dfs", "dijkstra", "adjacency list", "shortest path"]):
        return "Graphs"
    elif any(k in text_lower for k in ["binary search", "linear search", "searching", "lookup", "divide and conquer"]):
        return "Searching"
    elif any(k in text_lower for k in ["array", "dynamic array", "matrix", "indexing", "subarray", "sorting", "merge sort", "quicksort"]):
        return "Arrays"
    elif any(k in text_lower for k in ["hash", "hash table", "hash map", "collision", "chaining"]):
        return "Hashing"
    return "Data Structures"


def detect_concept_from_text(text: str, topic: str) -> str:
    lang = detect_language(text)
    text_lower = text.lower()

    if lang == "Hindi":
        if "बाइनरी सर्च ट्री" in text or "bst" in text_lower or "इन-ऑर्डर" in text:
            return "बाइनरी सर्च ट्री इन-ऑर्डर ट्रैवर्सल (BST)"
        elif "बाइनरी सर्च" in text:
            return "बाइनरी सर्च सिद्धांत एवं जटिलता O(log n)"
        elif "एरे" in text:
            return "सतत मेमोरी और इंडेक्सिंग (Array Indexing)"
        return f"{topic} मुख्य सिद्धांत"

    elif lang == "Gujarati":
        if "બાઈનરી સર્ચ ટ્રી" in text or "bst" in text_lower or "ઇન-ઓર્ડર" in text:
            return "બાઈનરી સર્ચ ટ્રી ઇન-ઓર્ડર ટ્રાવર્સલ (BST)"
        elif "બાઈનરી સર્ચ" in text:
            return "બાઈનરી સર્ચ સિદ્ધાંત અને સમય જટિલતા O(log n)"
        elif "એરે" in text:
            return "સળંગ મેમરી અને ઇન્ડેક્સિંગ (Array Indexing)"
        return f"{topic} મુખ્ય સિદ્ધાંત"

    if "binary search" in text_lower:
        return "Binary Search Invariant & Complexity"
    elif "bst" in text_lower or "binary search tree" in text_lower:
        return "BST Insertion & In-order Traversal"
    elif "bfs" in text_lower or "breadth-first" in text_lower:
        return "Breadth-First Search (Queue Level-Order)"
    elif "dfs" in text_lower or "depth-first" in text_lower:
        return "Depth-First Search (Stack Recursion)"
    elif "array" in text_lower:
        return "Contiguous Memory & Indexing"
    return f"{topic} Core Principles"
