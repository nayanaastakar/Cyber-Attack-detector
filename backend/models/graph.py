from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import networkx as nx
import numpy as np

class AttackType(Enum):
    DDOS = "ddos"
    BOTNET = "botnet"
    PORT_SCAN = "port_scan"
    WORM = "worm"
    C2 = "c2"

@dataclass
class NetworkNode:
    id: str
    ip: str
    node_type: str  # server, client, router, etc.
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class NetworkEdge:
    source: str
    target: str
    weight: float = 1.0
    protocol: str = "TCP"
    port: int = 80
    timestamp: float = 0.0
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class AttackAlert:
    attack_type: AttackType
    source_nodes: List[str]
    target_nodes: List[str]
    confidence: float
    timestamp: float
    description: str
    severity: str = "medium"

class NetworkGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.nodes: Dict[str, NetworkNode] = {}
        self.edges: Dict[Tuple[str, str], NetworkEdge] = {}
        self.attack_thresholds = {
            'ddos_indegree': 50,
            'port_scan_outdegree': 30,
            'worm_reachability': 100,
            'c2_indegree_min': 10,
            'c2_outdegree_max': 5
        }
    
    def add_node(self, node: NetworkNode) -> None:
        """Add a node to the network graph"""
        self.nodes[node.id] = node
        self.graph.add_node(node.id, **node.__dict__)
    
    def add_edge(self, edge: NetworkEdge) -> None:
        """Add an edge to the network graph"""
        edge_key = (edge.source, edge.target)
        self.edges[edge_key] = edge
        self.graph.add_edge(
            edge.source, 
            edge.target, 
            weight=edge.weight,
            protocol=edge.protocol,
            port=edge.port,
            timestamp=edge.timestamp
        )
    
    def remove_node(self, node_id: str) -> None:
        """Remove a node and all its edges"""
        if node_id in self.nodes:
            del self.nodes[node_id]
            self.graph.remove_node(node_id)
    
    def remove_edge(self, source: str, target: str) -> None:
        """Remove an edge from the graph"""
        edge_key = (source, target)
        if edge_key in self.edges:
            del self.edges[edge_key]
            self.graph.remove_edge(source, target)
    
    def get_indegree(self, node_id: str) -> int:
        """Get the indegree of a node"""
        return self.graph.in_degree(node_id)
    
    def get_outdegree(self, node_id: str) -> int:
        """Get the outdegree of a node"""
        return self.graph.out_degree(node_id)
    
    def get_neighbors(self, node_id: str) -> List[str]:
        """Get all neighbors of a node"""
        return list(self.graph.neighbors(node_id))
    
    def get_predecessors(self, node_id: str) -> List[str]:
        """Get all predecessors of a node"""
        return list(self.graph.predecessors(node_id))
    
    def get_subgraph(self, nodes: List[str]) -> 'NetworkGraph':
        """Create a subgraph with specified nodes"""
        subgraph = NetworkGraph()
        subgraph.graph = self.graph.subgraph(nodes).copy()
        for node_id in nodes:
            if node_id in self.nodes:
                subgraph.nodes[node_id] = self.nodes[node_id]
        for edge_key, edge in self.edges.items():
            if edge_key[0] in nodes and edge_key[1] in nodes:
                subgraph.edges[edge_key] = edge
        return subgraph
    
    def get_graph_stats(self) -> Dict:
        """Get basic graph statistics"""
        stats = {
            'node_count': self.graph.number_of_nodes(),
            'edge_count': self.graph.number_of_edges(),
            'density': nx.density(self.graph) if self.graph.number_of_nodes() > 0 else 0,
            'is_connected': nx.is_weakly_connected(self.graph) if self.graph.number_of_nodes() > 0 else True,
            'average_clustering': nx.average_clustering(self.graph.to_undirected()) if self.graph.number_of_nodes() > 0 else 0
        }
        return stats
    
    def to_dict(self) -> Dict:
        """Convert graph to dictionary format for JSON serialization"""
        return {
            'nodes': [node.__dict__ for node in self.nodes.values()],
            'edges': [edge.__dict__ for edge in self.edges.values()],
            'stats': self.get_graph_stats()
        }
