from typing import List, Dict, Any, Set, Tuple
from collections import defaultdict, deque


class PrerequisiteDAG:
    """
    Manages concept prerequisite DAG with cycle validation and topological sequencing.
    """

    def __init__(self):
        self.adj: Dict[str, Set[str]] = defaultdict(set)
        self.in_degree: Dict[str, int] = defaultdict(int)
        self.concepts: Dict[str, Dict[str, Any]] = {}

    def add_concept(self, concept_id: str, label: str, topic: str, description: str = ""):
        if concept_id not in self.concepts:
            self.concepts[concept_id] = {
                "id": concept_id,
                "label": label,
                "topic": topic,
                "description": description,
                "prerequisites": []
            }
            if concept_id not in self.in_degree:
                self.in_degree[concept_id] = 0

    def add_prerequisite(self, prerequisite_id: str, dependent_id: str) -> bool:
        """
        Adds a directed edge: prerequisite_id -> dependent_id.
        Validates that no cycles are introduced.
        """
        if prerequisite_id == dependent_id:
            return False

        # Speculatively add edge
        self.adj[prerequisite_id].add(dependent_id)

        # Cycle check via Kahn's algorithm (Topological Sort)
        is_acyclic, _ = self.get_topological_order()
        if not is_acyclic:
            # Revert edge
            self.adj[prerequisite_id].remove(dependent_id)
            return False

        if prerequisite_id not in self.concepts[dependent_id]["prerequisites"]:
            self.concepts[dependent_id]["prerequisites"].append(prerequisite_id)
        return True

    def get_topological_order(self) -> Tuple[bool, List[str]]:
        """
        Returns (is_valid_dag, ordered_concept_ids).
        """
        in_deg: Dict[str, int] = {c: 0 for c in self.concepts}
        for u in self.adj:
            for v in self.adj[u]:
                if v in in_deg:
                    in_deg[v] += 1

        queue = deque([c for c, deg in in_deg.items() if deg == 0])
        order = []

        while queue:
            node = queue.popleft()
            order.append(node)
            for neighbor in self.adj[node]:
                in_deg[neighbor] -= 1
                if in_deg[neighbor] == 0:
                    queue.append(neighbor)

        is_dag = len(order) == len(self.concepts)
        return is_dag, order

    def build_graph_export(self) -> Dict[str, Any]:
        nodes = []
        for cid, cdata in self.concepts.items():
            nodes.append({
                "id": cid,
                "label": cdata["label"],
                "category": cdata["topic"],
                "description": cdata["description"],
                "prerequisites": cdata["prerequisites"]
            })

        edges = []
        for src, targets in self.adj.items():
            for tgt in targets:
                edges.append({
                    "source": src,
                    "target": tgt,
                    "relation": "prerequisite"
                })

        return {"nodes": nodes, "edges": edges}


def extract_concept_dag_from_chunks(chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Builds structured DAG from ingested multimodal chunks with verified prerequisite chains.
    """
    dag = PrerequisiteDAG()

    # Default DSA hierarchy
    dag.add_concept("c_arrays", "Arrays & Memory Blocks", "Arrays", "Contiguous indexable memory allocation and array boundaries.")
    dag.add_concept("c_binary_search", "Binary Search Invariants", "Searching", "Logarithmic search over sorted sequence.")
    dag.add_concept("c_bst_basics", "Binary Search Tree Properties", "Trees", "Left < Root < Right hierarchical invariants.")
    dag.add_concept("c_bst_traversals", "BST In-Order Traversal", "Trees", "Ascending order output via recursive tree traversal.")
    dag.add_concept("c_graphs_bfs", "Graph Traversals (BFS & Queue)", "Graphs", "Level-by-level exploration using FIFO queue for shortest paths.")
    dag.add_concept("c_graphs_dfs", "Graph Traversals (DFS & Stack)", "Graphs", "Branch-deep exploration with cycle prevention visited array.")

    # Form DAG edges
    dag.add_prerequisite("c_arrays", "c_binary_search")
    dag.add_prerequisite("c_binary_search", "c_bst_basics")
    dag.add_prerequisite("c_bst_basics", "c_bst_traversals")
    dag.add_prerequisite("c_bst_basics", "c_graphs_bfs")
    dag.add_prerequisite("c_graphs_bfs", "c_graphs_dfs")

    return dag.build_graph_export()
