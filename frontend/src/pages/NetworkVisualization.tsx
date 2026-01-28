import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, AlertTriangle, RefreshCw, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { getGraph, scanForAttacks } from '../services/api';

interface NetworkNode {
  id: string;
  ip: string;
  node_type: string;
  metadata: any;
  x?: number;
  y?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  protocol: string;
  port: number;
  metadata: any;
}

interface GraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: any;
}

const NetworkVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], stats: {} });
  const [attacks, setAttacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const [graphResponse, attacksResponse] = await Promise.all([
        getGraph(),
        scanForAttacks()
      ]);
      
      setGraphData(graphResponse);
      setAttacks(attacksResponse.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching network data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && canvasRef.current) {
      drawNetwork();
    }
  }, [graphData, attacks, zoom, offset]);

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Calculate node positions (force-directed layout simulation)
    const nodePositions = calculateNodePositions();
    
    // Draw edges
    graphData.edges.forEach(edge => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];
      
      if (sourcePos && targetPos) {
        // Check if edge is part of an attack
        const isAttackEdge = attacks.some(attack => 
          attack.source_nodes.includes(edge.source) && 
          attack.target_nodes.includes(edge.target)
        );
        
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.strokeStyle = isAttackEdge ? '#ef4444' : '#94a3b8';
        ctx.lineWidth = isAttackEdge ? 3 : 1;
        ctx.stroke();
        
        // Draw arrow for directed edge
        const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        ctx.beginPath();
        ctx.moveTo(targetPos.x, targetPos.y);
        ctx.lineTo(
          targetPos.x - arrowLength * Math.cos(angle - arrowAngle),
          targetPos.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(targetPos.x, targetPos.y);
        ctx.lineTo(
          targetPos.x - arrowLength * Math.cos(angle + arrowAngle),
          targetPos.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
      }
    });

    // Draw nodes
    Object.entries(nodePositions).forEach(([nodeId, pos]) => {
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Check if node is involved in attacks
      const isAttacked = attacks.some(attack => 
        attack.source_nodes.includes(nodeId) || 
        attack.target_nodes.includes(nodeId)
      );

      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = getNodeColor(node.node_type, isAttacked);
      ctx.fill();
      ctx.strokeStyle = selectedNode === nodeId ? '#3b82f6' : '#e5e7eb';
      ctx.lineWidth = selectedNode === nodeId ? 3 : 1;
      ctx.stroke();

      // Draw node label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, pos.x, pos.y + 35);
      
      // Draw node type
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(node.node_type, pos.x, pos.y + 48);
    });

    ctx.restore();
  };

  const calculateNodePositions = () => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const centerX = 400;
    const centerY = 300;
    const radius = 150;

    // Simple circular layout
    graphData.nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / graphData.nodes.length;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    return positions;
  };

  const getNodeColor = (nodeType: string, isAttacked: boolean) => {
    if (isAttacked) return '#ef4444'; // Red for attacked nodes
    
    switch (nodeType) {
      case 'server': return '#3b82f6'; // Blue
      case 'client': return '#10b981'; // Green
      case 'router': return '#f59e0b'; // Yellow
      case 'firewall': return '#8b5cf6'; // Purple
      case 'database': return '#06b6d4'; // Cyan
      default: return '#6b7280'; // Gray
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offset.x) / zoom;
    const y = (event.clientY - rect.top - offset.y) / zoom;

    // Find clicked node
    const positions = calculateNodePositions();
    const clickedNode = Object.entries(positions).find(([nodeId, pos]) => {
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      return distance <= 20;
    });

    setSelectedNode(clickedNode ? clickedNode[0] : null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'network-graph.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Network Visualization</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={exportImage}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Nodes</p>
              <p className="text-2xl font-bold text-gray-900">{graphData.stats.node_count || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connections</p>
              <p className="text-2xl font-bold text-gray-900">{graphData.stats.edge_count || 0}</p>
            </div>
            <Shield className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Attacks</p>
              <p className="text-2xl font-bold text-red-600">{attacks.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Density</p>
              <p className="text-2xl font-bold text-gray-900">
                {((graphData.stats.density || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Network Graph */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Interactive Network Graph</h2>
          <p className="text-sm text-gray-600">Click on nodes to see details. Red indicates compromised nodes.</p>
        </div>
        
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="cursor-pointer"
            onClick={handleCanvasClick}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Server</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Client</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Router</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span>Firewall</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
            <span>Database</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Compromised</span>
          </div>
        </div>
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Details: {selectedNode}</h3>
          {(() => {
            const node = graphData.nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">IP Address:</span>
                  <span className="ml-2 text-gray-900">{node.ip}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-900 capitalize">{node.node_type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    attacks.some(a => a.source_nodes.includes(selectedNode) || a.target_nodes.includes(selectedNode))
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {attacks.some(a => a.source_nodes.includes(selectedNode) || a.target_nodes.includes(selectedNode))
                      ? 'Compromised'
                      : 'Secure'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default NetworkVisualization;
