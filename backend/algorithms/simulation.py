import random
from typing import List, Dict, Tuple
from models.graph import NetworkGraph, NetworkNode, NetworkEdge, AttackType

class AttackSimulator:
    def __init__(self, network_graph: NetworkGraph):
        self.graph = network_graph
        self.simulation_id = 0
    
    def generate_network_topology(self, node_count: int = 50, edge_count: int = 150) -> None:
        """Generate a realistic network topology"""
        # Clear existing graph
        self.graph.graph.clear()
        self.graph.nodes.clear()
        self.graph.edges.clear()
        
        # Create nodes with different types
        node_types = ['server', 'client', 'router', 'firewall', 'database']
        
        for i in range(node_count):
            node_type = random.choices(node_types, weights=[0.1, 0.6, 0.15, 0.1, 0.05])[0]
            node = NetworkNode(
                id=f"node_{i}",
                ip=f"192.168.{random.randint(1, 255)}.{random.randint(1, 254)}",
                node_type=node_type,
                metadata={'status': 'active', 'os': random.choice(['Windows', 'Linux', 'Cisco'])}
            )
            self.graph.add_node(node)
        
        # Create edges (network connections)
        node_ids = list(self.graph.nodes.keys())
        
        for _ in range(edge_count):
            source = random.choice(node_ids)
            target = random.choice(node_ids)
            
            if source != target and not self.graph.graph.has_edge(source, target):
                edge = NetworkEdge(
                    source=source,
                    target=target,
                    weight=random.uniform(0.1, 1.0),
                    protocol=random.choice(['TCP', 'UDP', 'HTTP', 'HTTPS']),
                    port=random.choice([80, 443, 22, 21, 25, 53, 3306, 5432]),
                    timestamp=random.uniform(0, 1000)
                )
                self.graph.add_edge(edge)
    
    def simulate_ddos_attack(self, target_node: str = None, attacker_count: int = 20) -> None:
        """Simulate a DDoS attack"""
        if target_node is None:
            # Choose a server as target
            servers = [node_id for node_id, node in self.graph.nodes.items() 
                      if node.node_type == 'server']
            if servers:
                target_node = random.choice(servers)
            else:
                target_node = random.choice(list(self.graph.nodes.keys()))
        
        # Select random attacker nodes
        potential_attackers = [node_id for node_id in self.graph.nodes.keys() 
                              if node_id != target_node]
        attackers = random.sample(potential_attackers, min(attacker_count, len(potential_attackers)))
        
        # Create attack edges
        for attacker in attackers:
            edge = NetworkEdge(
                source=attacker,
                target=target_node,
                weight=1.0,
                protocol='TCP',
                port=80,
                timestamp=self.simulation_id
            )
            self.graph.add_edge(edge)
        
        self.simulation_id += 1
    
    def simulate_botnet_attack(self, bot_count: int = 8) -> None:
        """Simulate a botnet communication cycle"""
        # Select random nodes to be part of botnet
        potential_bots = list(self.graph.nodes.keys())
        bots = random.sample(potential_bots, min(bot_count, len(potential_bots)))
        
        # Create a cycle among bots
        for i in range(len(bots)):
            current_bot = bots[i]
            next_bot = bots[(i + 1) % len(bots)]
            
            edge = NetworkEdge(
                source=current_bot,
                target=next_bot,
                weight=0.8,
                protocol='HTTP',
                port=8080,
                timestamp=self.simulation_id
            )
            self.graph.add_edge(edge)
        
        self.simulation_id += 1
    
    def simulate_port_scan_attack(self, attacker_node: str = None, target_count: int = 35) -> None:
        """Simulate a port scan attack"""
        if attacker_node is None:
            attacker_node = random.choice(list(self.graph.nodes.keys()))
        
        # Select random target nodes
        potential_targets = [node_id for node_id in self.graph.nodes.keys() 
                           if node_id != attacker_node]
        targets = random.sample(potential_targets, min(target_count, len(potential_targets)))
        
        # Create scan edges to different ports
        common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 5432, 6379]
        
        for target in targets:
            port = random.choice(common_ports)
            edge = NetworkEdge(
                source=attacker_node,
                target=target,
                weight=0.3,
                protocol='TCP',
                port=port,
                timestamp=self.simulation_id
            )
            self.graph.add_edge(edge)
        
        self.simulation_id += 1
    
    def simulate_worm_propagation(self, start_node: str = None, propagation_steps: int = 5) -> None:
        """Simulate worm propagation through the network"""
        if start_node is None:
            start_node = random.choice(list(self.graph.nodes.keys()))
        
        current_infected = [start_node]
        newly_infected = []
        
        for step in range(propagation_steps):
            newly_infected = []
            
            for infected_node in current_infected:
                # Get neighbors of infected node
                neighbors = self.graph.get_neighbors(infected_node)
                
                # Infect some neighbors
                for neighbor in neighbors:
                    if random.random() < 0.3:  # 30% infection probability
                        newly_infected.append(neighbor)
                        
                        # Create worm propagation edge
                        edge = NetworkEdge(
                            source=infected_node,
                            target=neighbor,
                            weight=0.9,
                            protocol='TCP',
                            port=445,  # Common worm port
                            timestamp=self.simulation_id
                        )
                        self.graph.add_edge(edge)
            
            current_infected = newly_infected
            
            if not current_infected:
                break
        
        self.simulation_id += 1
    
    def simulate_c2_attack(self, c2_server: str = None, infected_count: int = 15) -> None:
        """Simulate Command & Control attack"""
        if c2_server is None:
            # Choose a server as C2
            servers = [node_id for node_id, node in self.graph.nodes.items() 
                      if node.node_type == 'server']
            if servers:
                c2_server = random.choice(servers)
            else:
                c2_server = random.choice(list(self.graph.nodes.keys()))
        
        # Select random infected nodes
        potential_victims = [node_id for node_id in self.graph.nodes.keys() 
                            if node_id != c2_server]
        infected_nodes = random.sample(potential_victims, min(infected_count, len(potential_victims)))
        
        # Create C2 communication edges (infected -> C2 server)
        for infected in infected_nodes:
            edge = NetworkEdge(
                source=infected,
                target=c2_server,
                weight=0.5,
                protocol='HTTPS',
                port=443,
                timestamp=self.simulation_id
            )
            self.graph.add_edge(edge)
        
        self.simulation_id += 1
    
    def simulate_mixed_attack_scenario(self) -> Dict[str, List[str]]:
        """Simulate a complex scenario with multiple attack types"""
        results = {}
        
        # Generate base network
        self.generate_network_topology(60, 200)
        
        # Simulate DDoS attack
        self.simulate_ddos_attack(attacker_count=25)
        results['ddos'] = ['DDoS attack simulated with 25 attackers']
        
        # Simulate botnet
        self.simulate_botnet_attack(bot_count=6)
        results['botnet'] = ['Botnet communication cycle simulated with 6 bots']
        
        # Simulate port scan
        self.simulate_port_scan_attack(target_count=40)
        results['port_scan'] = ['Port scan attack simulated targeting 40 nodes']
        
        # Simulate worm propagation
        self.simulate_worm_propagation(propagation_steps=4)
        results['worm'] = ['Worm propagation simulated over 4 steps']
        
        # Simulate C2 attack
        self.simulate_c2_attack(infected_count=12)
        results['c2'] = ['C2 attack simulated with 12 infected nodes']
        
        return results
