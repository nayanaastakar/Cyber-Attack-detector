import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Network, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGraphStats, scanForAttacks, getAttackHistory, generateNetwork } from '../services/api';
import { SeverityCalculator } from '../utils/severityCalculator';

interface Alert {
  id: number;
  type: string;
  severity: string;
  description: string;
  timestamp: string;
  severityScore?: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    activeAttacks: 0,
    networkHealth: 'Good',
    networkRiskScore: 0
  });

  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Good': return 'text-green-600';
      case 'Caution': return 'text-yellow-600';
      case 'Warning': return 'text-orange-600';
      case 'Critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBgColor = (health: string) => {
    switch (health) {
      case 'Good': return 'bg-green-100';
      case 'Caution': return 'bg-yellow-100';
      case 'Warning': return 'bg-orange-100';
      case 'Critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateNetworkHealth = (activeAttacks: number, recentAlerts: Alert[]) => {
    // Check for high severity attacks
    const highSeverityAttacks = recentAlerts.filter(alert => alert.severity === 'high').length;
    
    if (highSeverityAttacks > 0) {
      return 'Critical';
    } else if (activeAttacks > 2) {
      return 'Warning';
    } else if (activeAttacks > 0) {
      return 'Caution';
    } else {
      return 'Good';
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch graph statistics
      const graphStats = await getGraphStats();
      
      // Fetch recent attacks
      const attackData = await scanForAttacks();
      
      // Fetch attack history
      const historyData = await getAttackHistory();
      const alerts = historyData.history.slice(0, 5).map((alert: any, index: number) => {
        const attackData = {
          attack_type: alert.attack_type,
          source_nodes: alert.source_nodes,
          target_nodes: alert.target_nodes,
          confidence: alert.confidence,
          severity: alert.severity || 'medium'
        };
        
        return {
          id: index + 1,
          type: alert.attack_type,
          severity: alert.severity || 'medium',
          description: alert.description,
          timestamp: new Date(alert.timestamp).toLocaleString(),
          severityScore: SeverityCalculator.calculateSeverityScore(attackData)
        };
      });
      
      const networkHealth = calculateNetworkHealth(attackData.total || 0, alerts);
      const networkRiskScore = SeverityCalculator.calculateNetworkRiskScore(alerts);
      
      setStats({
        totalNodes: graphStats.node_count || 0,
        totalEdges: graphStats.edge_count || 0,
        activeAttacks: attackData.total || 0,
        networkHealth: networkHealth,
        networkRiskScore: networkRiskScore
      });
      
      setRecentAlerts(alerts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleGenerateNetwork = async () => {
    try {
      await generateNetwork(20, 40);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error generating network:', error);
    }
  };

  const statCards = [
    {
      title: 'Network Nodes',
      value: stats.totalNodes,
      icon: Network,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Connections',
      value: stats.totalEdges,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Attacks',
      value: stats.activeAttacks,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Network Risk Score',
      value: `${stats.networkRiskScore}/100`,
      icon: AlertTriangle,
      color: stats.networkRiskScore >= 70 ? 'text-red-600' : stats.networkRiskScore >= 40 ? 'text-yellow-600' : 'text-green-600',
      bgColor: stats.networkRiskScore >= 70 ? 'bg-red-100' : stats.networkRiskScore >= 40 ? 'bg-yellow-100' : 'bg-green-100'
    },
    {
      title: 'Network Health',
      value: stats.networkHealth,
      icon: TrendingUp,
      color: getHealthColor(stats.networkHealth),
      bgColor: getHealthBgColor(stats.networkHealth)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={handleGenerateNetwork}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Generate Network
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Security Alerts</h2>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold uppercase">{alert.type}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-60">
                        {alert.severity}
                      </span>
                      {alert.severityScore && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                          Score: {alert.severityScore}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1">{alert.description}</p>
                    <p className="text-xs mt-2 opacity-75">{alert.timestamp}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/attack-details/${alert.id}`)}
                    className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={fetchDashboardData}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Scanning...' : 'Run Full Scan'}
            </button>
            <button 
              onClick={handleGenerateNetwork}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Generate Network
            </button>
            <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              View Logs
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium">99.9%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Scan</span>
              <span className="text-sm font-medium">2 mins ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Version</span>
              <span className="text-sm font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
