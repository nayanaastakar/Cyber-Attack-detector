from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import asyncio
from datetime import datetime
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.graph import NetworkGraph, NetworkNode, NetworkEdge, AttackType
from algorithms.detection import AttackDetector
from algorithms.simulation import AttackSimulator

app = FastAPI(
    title="CyberAttack Detector API",
    description="Graph-based network security analysis API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
network_graph = NetworkGraph()
attack_detector = AttackDetector(network_graph)
attack_simulator = AttackSimulator(network_graph)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Pydantic models for API
class NodeCreate(BaseModel):
    id: str
    ip: str
    node_type: str
    metadata: Optional[Dict] = {}

class EdgeCreate(BaseModel):
    source: str
    target: str
    weight: float = 1.0
    protocol: str = "TCP"
    port: int = 80
    metadata: Optional[Dict] = {}

class SimulationRequest(BaseModel):
    attack_type: str
    parameters: Optional[Dict] = {}

class ThresholdUpdate(BaseModel):
    ddos_indegree: Optional[int] = None
    port_scan_outdegree: Optional[int] = None
    worm_reachability: Optional[int] = None
    c2_indegree_min: Optional[int] = None
    c2_outdegree_max: Optional[int] = None

# API Endpoints
@app.get("/")
async def root():
    return {"message": "CyberAttack Detector API", "version": "1.0.0"}

@app.get("/api/graph")
async def get_graph():
    """Get the current network graph"""
    return network_graph.to_dict()

@app.get("/api/graph/stats")
async def get_graph_stats():
    """Get network graph statistics"""
    return network_graph.get_graph_stats()

@app.post("/api/graph/nodes")
async def add_node(node: NodeCreate):
    """Add a new node to the network"""
    network_node = NetworkNode(
        id=node.id,
        ip=node.ip,
        node_type=node.node_type,
        metadata=node.metadata
    )
    network_graph.add_node(network_node)
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "node_added",
        "data": network_node.__dict__
    }))
    
    return {"message": "Node added successfully", "node_id": node.id}

@app.post("/api/graph/edges")
async def add_edge(edge: EdgeCreate):
    """Add a new edge to the network"""
    network_edge = NetworkEdge(
        source=edge.source,
        target=edge.target,
        weight=edge.weight,
        protocol=edge.protocol,
        port=edge.port,
        metadata=edge.metadata
    )
    network_graph.add_edge(network_edge)
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "edge_added",
        "data": network_edge.__dict__
    }))
    
    return {"message": "Edge added successfully"}

@app.delete("/api/graph/nodes/{node_id}")
async def remove_node(node_id: str):
    """Remove a node from the network"""
    if node_id not in network_graph.nodes:
        raise HTTPException(status_code=404, detail="Node not found")
    
    network_graph.remove_node(node_id)
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "node_removed",
        "data": {"node_id": node_id}
    }))
    
    return {"message": "Node removed successfully"}

@app.delete("/api/graph/edges/{source}/{target}")
async def remove_edge(source: str, target: str):
    """Remove an edge from the network"""
    edge_key = (source, target)
    if edge_key not in network_graph.edges:
        raise HTTPException(status_code=404, detail="Edge not found")
    
    network_graph.remove_edge(source, target)
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "edge_removed",
        "data": {"source": source, "target": target}
    }))
    
    return {"message": "Edge removed successfully"}

@app.post("/api/simulation/generate")
async def generate_network(node_count: int = 50, edge_count: int = 150):
    """Generate a random network topology"""
    attack_simulator.generate_network_topology(node_count, edge_count)
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "graph_generated",
        "data": network_graph.to_dict()
    }))
    
    return {"message": f"Network generated with {node_count} nodes and {edge_count} edges"}

@app.post("/api/simulation/attack")
async def simulate_attack(request: SimulationRequest):
    """Simulate a specific attack type"""
    attack_type = request.attack_type.lower()
    params = request.parameters or {}
    
    if attack_type == "ddos":
        attack_simulator.simulate_ddos_attack(
            target_node=params.get("target_node"),
            attacker_count=params.get("attacker_count", 20)
        )
    elif attack_type == "botnet":
        attack_simulator.simulate_botnet_attack(
            bot_count=params.get("bot_count", 8)
        )
    elif attack_type == "port_scan":
        attack_simulator.simulate_port_scan_attack(
            attacker_node=params.get("attacker_node"),
            target_count=params.get("target_count", 35)
        )
    elif attack_type == "worm":
        attack_simulator.simulate_worm_propagation(
            start_node=params.get("start_node"),
            propagation_steps=params.get("propagation_steps", 5)
        )
    elif attack_type == "c2":
        attack_simulator.simulate_c2_attack(
            c2_server=params.get("c2_server"),
            infected_count=params.get("infected_count", 15)
        )
    elif attack_type == "mixed":
        results = attack_simulator.simulate_mixed_attack_scenario()
        return {"message": "Mixed attack scenario simulated", "results": results}
    else:
        raise HTTPException(status_code=400, detail="Invalid attack type")
    
    # Broadcast update
    await manager.broadcast(json.dumps({
        "type": "attack_simulated",
        "data": {"attack_type": attack_type, "graph": network_graph.to_dict()}
    }))
    
    return {"message": f"{attack_type.upper()} attack simulated successfully"}

@app.get("/api/detection/scan")
async def scan_for_attacks():
    """Scan for all types of attacks"""
    alerts = attack_detector.detect_all_attacks()
    
    # Convert alerts to dict format
    alerts_dict = []
    for alert in alerts:
        alert_dict = {
            "attack_type": alert.attack_type.value,
            "source_nodes": alert.source_nodes,
            "target_nodes": alert.target_nodes,
            "confidence": alert.confidence,
            "timestamp": alert.timestamp,
            "description": alert.description,
            "severity": alert.severity
        }
        alerts_dict.append(alert_dict)
    
    # Broadcast alerts
    await manager.broadcast(json.dumps({
        "type": "attacks_detected",
        "data": {"alerts": alerts_dict}
    }))
    
    return {"alerts": alerts_dict, "total": len(alerts_dict)}

@app.get("/api/detection/statistics")
async def get_attack_statistics():
    """Get attack detection statistics"""
    return attack_detector.get_attack_statistics()

@app.get("/api/detection/history")
async def get_attack_history():
    """Get historical attack alerts"""
    history = []
    for alert in attack_detector.detection_history:
        alert_dict = {
            "attack_type": alert.attack_type.value,
            "source_nodes": alert.source_nodes,
            "target_nodes": alert.target_nodes,
            "confidence": alert.confidence,
            "timestamp": alert.timestamp,
            "description": alert.description,
            "severity": alert.severity
        }
        history.append(alert_dict)
    
    return {"history": history}

@app.put("/api/thresholds")
async def update_thresholds(thresholds: ThresholdUpdate):
    """Update attack detection thresholds"""
    if thresholds.ddos_indegree is not None:
        network_graph.attack_thresholds['ddos_indegree'] = thresholds.ddos_indegree
    if thresholds.port_scan_outdegree is not None:
        network_graph.attack_thresholds['port_scan_outdegree'] = thresholds.port_scan_outdegree
    if thresholds.worm_reachability is not None:
        network_graph.attack_thresholds['worm_reachability'] = thresholds.worm_reachability
    if thresholds.c2_indegree_min is not None:
        network_graph.attack_thresholds['c2_indegree_min'] = thresholds.c2_indegree_min
    if thresholds.c2_outdegree_max is not None:
        network_graph.attack_thresholds['c2_outdegree_max'] = thresholds.c2_outdegree_max
    
    return {"message": "Thresholds updated successfully", "thresholds": network_graph.attack_thresholds}

@app.get("/api/thresholds")
async def get_thresholds():
    """Get current attack detection thresholds"""
    return network_graph.attack_thresholds

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back or handle client messages
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "graph_stats": network_graph.get_graph_stats()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
