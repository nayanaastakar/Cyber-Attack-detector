import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, AlertTriangle, Clock, Download, Search } from 'lucide-react';
import { getAttackHistory } from '../services/api';
import { SeverityCalculator } from '../utils/severityCalculator';

interface AttackLog {
  attack_type: string;
  source_nodes: string[];
  target_nodes: string[];
  confidence: number;
  timestamp: string;
  description: string;
  severity: string;
  severityScore?: number;
  status?: 'active' | 'mitigated' | 'resolved';
}

const AttackHistory = () => {
  const [logs, setLogs] = useState<AttackLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AttackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    fetchAttackLogs();
  }, []);

  const fetchAttackLogs = async () => {
    try {
      const historyData = await getAttackHistory();
      const processedLogs = historyData.history.map((log: any, index: number) => {
        const attackData = {
          attack_type: log.attack_type,
          source_nodes: log.source_nodes,
          target_nodes: log.target_nodes,
          confidence: log.confidence,
          severity: log.severity || 'medium'
        };
        
        return {
          ...log,
          id: index + 1,
          severityScore: SeverityCalculator.calculateSeverityScore(attackData),
          status: Math.random() > 0.7 ? 'active' : Math.random() > 0.5 ? 'mitigated' : 'resolved'
        };
      });
      
      setLogs(processedLogs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attack logs:', error);
      setLoading(false);
    }
  };

  const filterLogs = useCallback(() => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.attack_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source_nodes.some((node: string) => node.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.target_nodes.some((node: string) => node.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by attack type
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.attack_type === filterType);
    }

    // Filter by severity
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(log => log.severity === filterSeverity);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterType, filterSeverity]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'mitigated': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttackIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ddos': return Shield;
      case 'botnet': return Activity;
      case 'port_scan': return Search;
      case 'worm': return AlertTriangle;
      case 'c2': return Shield;
      default: return AlertTriangle;
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Attack Type', 'Severity', 'Score', 'Source Nodes', 'Target Nodes', 'Confidence', 'Status', 'Description'];
    const csvData = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.attack_type,
      log.severity,
      log.severityScore || 0,
      log.source_nodes.join(';'),
      log.target_nodes.join(';'),
      log.confidence.toFixed(2),
      log.status || 'unknown',
      log.description
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        <h1 className="text-3xl font-bold text-gray-900">Attack History & Logs</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search attacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attack Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="ddos">DDoS</option>
              <option value="botnet">Botnet</option>
              <option value="port_scan">Port Scan</option>
              <option value="worm">Worm</option>
              <option value="c2">C2</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredLogs.length}</span> of {logs.length} attacks
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attacks</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Threats</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.status === 'active').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mitigated</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.status === 'mitigated').length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.status === 'resolved').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Attack Logs</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nodes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.slice(0, 50).map((log, index) => {
                const Icon = getAttackIcon(log.attack_type);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {log.attack_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {log.severityScore || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs">
                        <div>{log.source_nodes.length} sources</div>
                        <div>{log.target_nodes.length} targets</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {(log.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2 ml-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${log.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(log.status || 'unknown')}`}>
                        {(log.status || 'unknown').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length > 50 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-600">
            Showing first 50 of {filteredLogs.length} attacks
          </div>
        )}
      </div>
    </div>
  );
};

export default AttackHistory;
