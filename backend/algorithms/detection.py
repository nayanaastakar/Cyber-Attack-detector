from typing import List, Set, Dict, Tuple
from collections import defaultdict, deque
import networkx as nx
from models.graph import NetworkGraph, AttackType, AttackAlert

class AttackDetector:
    def __init__(self, network_graph: NetworkGraph):
        self.graph = network_graph
        self.detection_history: List[AttackAlert] = []
    
    def detect_ddos_attack(self, threshold: int = None) -> List[AttackAlert]:
        """
        Detect DDoS attacks based on indegree threshold.
        Multiple computers sending requests to overwhelm a target server.
        """
        if threshold is None:
            threshold = self.graph.attack_thresholds['ddos_indegree']
        
        alerts = []
        
        for node_id in self.graph.graph.nodes():
            indegree = self.graph.get_indegree(node_id)
            
            if indegree > threshold:
                # Get all source nodes
                source_nodes = self.graph.get_predecessors(node_id)
                
                alert = AttackAlert(
                    attack_type=AttackType.DDOS,
                    source_nodes=source_nodes,
                    target_nodes=[node_id],
                    confidence=min(1.0, indegree / (threshold * 2)),
                    timestamp=0.0,  # Would be current time in real implementation
                    description=f"DDoS attack detected: {indegree} incoming connections to {node_id}",
                    severity="high" if indegree > threshold * 2 else "medium"
                )
                alerts.append(alert)
        
        return alerts
    
    def detect_botnet_attack(self) -> List[AttackAlert]:
        """
        Detect botnet attacks using cycle detection with DFS.
        Compromised machines communicating in loops to coordinate attacks.
        """
        alerts = []
        
        # Find all cycles in the directed graph
        try:
            cycles = list(nx.simple_cycles(self.graph.graph))
            
            for cycle in cycles:
                if len(cycle) >= 3:  # Only consider cycles with 3+ nodes
                    alert = AttackAlert(
                        attack_type=AttackType.BOTNET,
                        source_nodes=cycle,
                        target_nodes=cycle,  # In botnet, same nodes act as both
                        confidence=min(1.0, len(cycle) / 10.0),
                        timestamp=0.0,
                        description=f"Botnet communication cycle detected: {len(cycle)} nodes in loop",
                        severity="high" if len(cycle) >= 5 else "medium"
                    )
                    alerts.append(alert)
        
        except nx.NetworkXError:
            pass  # No cycles found
        
        return alerts
    
    def detect_port_scan_attack(self, threshold: int = None) -> List[AttackAlert]:
        """
        Detect port scan attacks based on outdegree threshold.
        Attackers checking many ports to find vulnerabilities.
        """
        if threshold is None:
            threshold = self.graph.attack_thresholds['port_scan_outdegree']
        
        alerts = []
        
        for node_id in self.graph.graph.nodes():
            outdegree = self.graph.get_outdegree(node_id)
            
            if outdegree > threshold:
                # Get all target nodes (different ports/services)
                target_nodes = self.graph.get_neighbors(node_id)
                
                alert = AttackAlert(
                    attack_type=AttackType.PORT_SCAN,
                    source_nodes=[node_id],
                    target_nodes=target_nodes,
                    confidence=min(1.0, outdegree / (threshold * 2)),
                    timestamp=0.0,
                    description=f"Port scan detected: {outdegree} connection attempts from {node_id}",
                    severity="medium"
                )
                alerts.append(alert)
        
        return alerts
    
    def detect_worm_propagation(self, start_node: str = None, threshold: int = None) -> List[AttackAlert]:
        """
        Detect worm propagation using BFS reachability analysis.
        Worm spreading from one machine to another.
        """
        if threshold is None:
            threshold = self.graph.attack_thresholds['worm_reachability']
        
        alerts = []
        
        # If no start node specified, check all nodes with high outdegree
        candidates = [start_node] if start_node else [
            node for node in self.graph.graph.nodes() 
            if self.graph.get_outdegree(node) > 5
        ]
        
        for candidate in candidates:
            if candidate not in self.graph.graph.nodes():
                continue
                
            # BFS to find reachable nodes
            reachable_nodes = self._bfs_reachable(candidate)
            
            if len(reachable_nodes) > threshold:
                alert = AttackAlert(
                    attack_type=AttackType.WORM,
                    source_nodes=[candidate],
                    target_nodes=reachable_nodes,
                    confidence=min(1.0, len(reachable_nodes) / (threshold * 2)),
                    timestamp=0.0,
                    description=f"Worm propagation detected: {len(reachable_nodes)} nodes reachable from {candidate}",
                    severity="high" if len(reachable_nodes) > threshold * 2 else "medium"
                )
                alerts.append(alert)
        
        return alerts
    
    def detect_c2_attack(self) -> List[AttackAlert]:
        """
        Detect Command & Control attacks using combined degree analysis.
        Infected machines reporting to one controller.
        Pattern: High indegree, low outdegree for C2 server
        """
        alerts = []
        
        for node_id in self.graph.graph.nodes():
            indegree = self.graph.get_indegree(node_id)
            outdegree = self.graph.get_outdegree(node_id)
            
            min_indegree = self.graph.attack_thresholds['c2_indegree_min']
            max_outdegree = self.graph.attack_thresholds['c2_outdegree_max']
            
            if indegree >= min_indegree and outdegree <= max_outdegree:
                # This node could be a C2 server
                infected_nodes = self.graph.get_predecessors(node_id)
                
                alert = AttackAlert(
                    attack_type=AttackType.C2,
                    source_nodes=infected_nodes,
                    target_nodes=[node_id],
                    confidence=min(1.0, indegree / (min_indegree * 2)),
                    timestamp=0.0,
                    description=f"C2 server detected: {indegree} infected nodes reporting to {node_id}",
                    severity="high" if indegree > min_indegree * 3 else "medium"
                )
                alerts.append(alert)
        
        return alerts
    
    def _bfs_reachable(self, start_node: str) -> List[str]:
        """BFS to find all reachable nodes from start_node"""
        visited = set()
        queue = deque([start_node])
        visited.add(start_node)
        
        while queue:
            current = queue.popleft()
            
            for neighbor in self.graph.get_neighbors(current):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        return list(visited)
    
    def detect_all_attacks(self) -> List[AttackAlert]:
        """Run all attack detection algorithms"""
        all_alerts = []
        
        # Run all detection algorithms
        all_alerts.extend(self.detect_ddos_attack())
        all_alerts.extend(self.detect_botnet_attack())
        all_alerts.extend(self.detect_port_scan_attack())
        all_alerts.extend(self.detect_worm_propagation())
        all_alerts.extend(self.detect_c2_attack())
        
        # Sort by confidence and severity
        severity_order = {"high": 3, "medium": 2, "low": 1}
        all_alerts.sort(key=lambda x: (severity_order[x.severity], x.confidence), reverse=True)
        
        # Store in history
        self.detection_history.extend(all_alerts)
        
        return all_alerts
    
    def get_attack_statistics(self) -> Dict:
        """Get statistics about detected attacks"""
        if not self.detection_history:
            return {}
        
        attack_counts = defaultdict(int)
        severity_counts = defaultdict(int)
        
        for alert in self.detection_history:
            attack_counts[alert.attack_type.value] += 1
            severity_counts[alert.severity] += 1
        
        return {
            'total_attacks': len(self.detection_history),
            'attack_types': dict(attack_counts),
            'severity_distribution': dict(severity_counts),
            'high_confidence_attacks': sum(1 for alert in self.detection_history if alert.confidence > 0.8)
        }
