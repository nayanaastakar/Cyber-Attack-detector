import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Activity, Clock, Users, Target } from 'lucide-react';

interface AttackDetail {
  attack_type: string;
  source_nodes: string[];
  target_nodes: string[];
  confidence: number;
  timestamp: string;
  description: string;
  severity: string;
  algorithm?: string;
}

const AttackDetails = () => {
  const { attackId } = useParams<{ attackId: string }>();
  const navigate = useNavigate();
  const [attack, setAttack] = useState<AttackDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration - in real app, fetch from API
    const mockAttack: AttackDetail = {
      attack_type: 'botnet',
      source_nodes: ['node_1', 'node_3', 'node_7', 'node_12', 'node_15'],
      target_nodes: ['node_1', 'node_3', 'node_7', 'node_12', 'node_15'],
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      description: 'Botnet communication cycle detected: 5 nodes in loop',
      severity: 'high',
      algorithm: 'DFS Cycle Detection'
    };

    setTimeout(() => {
      setAttack(mockAttack);
      setLoading(false);
    }, 500);
  }, [attackId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAttackIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ddos': return Shield;
      case 'botnet': return Users;
      case 'port_scan': return Activity;
      case 'worm': return Target;
      case 'c2': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getAlgorithmDescription = (algorithm: string) => {
    switch (algorithm) {
      case 'DFS Cycle Detection':
        return 'Depth-First Search identifies circular communication patterns between compromised nodes.';
      case 'Indegree Threshold':
        return 'Monitors incoming connection count to detect distributed denial-of-service patterns.';
      case 'Outdegree Threshold':
        return 'Tracks outgoing connection attempts to identify port scanning activities.';
      case 'BFS Reachability':
        return 'Breadth-First Search calculates network reachability to detect worm propagation.';
      case 'Degree Pattern Analysis':
        return 'Analyzes combined indegree/outdegree patterns to identify Command & Control servers.';
      default:
        return 'Advanced graph algorithm for network security analysis.';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!attack) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Attack not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const AttackIcon = getAttackIcon(attack.attack_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Attack Details</h1>
      </div>

      {/* Attack Overview */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${getSeverityColor(attack.severity).split(' ')[0]}`}>
              <AttackIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {attack.attack_type.replace('_', ' ')} Attack
              </h2>
              <p className="text-sm text-gray-600">Detected at {new Date(attack.timestamp).toLocaleString()}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(attack.severity)}`}>
            {attack.severity.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{(attack.confidence * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Confidence Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{attack.source_nodes.length}</div>
            <div className="text-sm text-gray-600">Source Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{attack.target_nodes.length}</div>
            <div className="text-sm text-gray-600">Target Nodes</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Attack Description</h3>
        <p className="text-gray-700">{attack.description}</p>
      </div>

      {/* Algorithm Information */}
      {attack.algorithm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Detection Algorithm
          </h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-900">Algorithm:</span>
              <span className="ml-2 text-gray-700">{attack.algorithm}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Description:</span>
              <p className="mt-1 text-gray-700">{getAlgorithmDescription(attack.algorithm)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Node Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Nodes */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Users className="h-5 w-5 mr-2 text-red-600" />
            Source Nodes ({attack.source_nodes.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attack.source_nodes.map((node, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="font-mono text-sm">{node}</span>
                <span className="text-xs text-red-600">Attacker</span>
              </div>
            ))}
          </div>
        </div>

        {/* Target Nodes */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Target Nodes ({attack.target_nodes.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attack.target_nodes.map((node, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="font-mono text-sm">{node}</span>
                <span className="text-xs text-blue-600">Victim</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mitigation Suggestions */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Mitigation Suggestions
        </h3>
        <div className="space-y-2">
          {attack.attack_type === 'botnet' && (
            <>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <span className="font-medium text-yellow-800">Isolate Compromised Nodes:</span>
                <span className="ml-2 text-yellow-700">Disconnect identified botnet nodes from the network</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <span className="font-medium text-blue-800">Block Communication:</span>
                <span className="ml-2 text-blue-700">Implement firewall rules to block C2 communication</span>
              </div>
            </>
          )}
          {attack.attack_type === 'ddos' && (
            <>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <span className="font-medium text-red-800">Rate Limiting:</span>
                <span className="ml-2 text-red-700">Implement rate limiting on target servers</span>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <span className="font-medium text-green-800">Traffic Filtering:</span>
                <span className="ml-2 text-green-700">Filter malicious traffic at network edge</span>
              </div>
            </>
          )}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <span className="font-medium text-gray-800">Monitor Continuously:</span>
            <span className="ml-2 text-gray-700">Maintain enhanced monitoring for similar patterns</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackDetails;
