import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Target, Play, RefreshCw, Download, BarChart3 } from 'lucide-react';
import { generateNetwork, simulateAttack, scanForAttacks, getGraphStats } from '../services/api';

interface SimulationScenario {
  name: string;
  description: string;
  attackType: string;
  parameters: any;
  icon: React.ComponentType<any>;
  color: string;
}

const Simulation = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null);
  const [results, setResults] = useState<any>(null);
  const [networkStats, setNetworkStats] = useState<any>({});
  const [detectedAttacks, setDetectedAttacks] = useState<any[]>([]);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const scenarios: SimulationScenario[] = [
    {
      name: 'DDoS Attack',
      description: 'Overwhelm a target server with massive traffic from multiple sources',
      attackType: 'ddos',
      parameters: { target_node: 'server_01', attacker_count: 25 },
      icon: Shield,
      color: 'text-red-600'
    },
    {
      name: 'Botnet Coordination',
      description: 'Compromised machines communicating in coordination cycles',
      attackType: 'botnet',
      parameters: { bot_count: 8 },
      icon: Activity,
      color: 'text-orange-600'
    },
    {
      name: 'Port Scanning',
      description: 'Systematic scanning of multiple ports to find vulnerabilities',
      attackType: 'port_scan',
      parameters: { attacker_node: 'scanner_01', target_count: 50 },
      icon: Target,
      color: 'text-yellow-600'
    },
    {
      name: 'Worm Propagation',
      description: 'Self-replicating malware spreading across the network',
      attackType: 'worm',
      parameters: { start_node: 'infected_01', propagation_steps: 6 },
      icon: AlertTriangle,
      color: 'text-purple-600'
    },
    {
      name: 'Command & Control',
      description: 'Infected nodes reporting to a central C2 server',
      attackType: 'c2',
      parameters: { c2_server: 'c2_master', infected_count: 12 },
      icon: Shield,
      color: 'text-indigo-600'
    },
    {
      name: 'Mixed Attack Scenario',
      description: 'Multiple simultaneous attack types for comprehensive testing',
      attackType: 'mixed',
      parameters: {},
      icon: BarChart3,
      color: 'text-gray-600'
    }
  ];

  useEffect(() => {
    fetchNetworkStats();
  }, []);

  const fetchNetworkStats = async () => {
    try {
      const stats = await getGraphStats();
      setNetworkStats(stats);
    } catch (error) {
      console.error('Error fetching network stats:', error);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSimulationLog(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const generateTestNetwork = async () => {
    setIsSimulating(true);
    addLog('Generating test network topology...');
    
    try {
      await generateNetwork(30, 60);
      await fetchNetworkStats();
      addLog(`Network generated: ${networkStats.node_count || 0} nodes, ${networkStats.edge_count || 0} edges`);
      addLog('Network topology ready for simulation');
    } catch (error) {
      addLog('Error generating network');
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  const runSimulation = async (scenario: SimulationScenario) => {
    setIsSimulating(true);
    setCurrentScenario(scenario);
    setResults(null);
    setDetectedAttacks([]);
    addLog(`Starting simulation: ${scenario.name}`);
    
    try {
      // Simulate attack
      addLog(`Executing ${scenario.attackType} attack with parameters: ${JSON.stringify(scenario.parameters)}`);
      const attackResult = await simulateAttack(scenario.attackType, scenario.parameters);
      addLog(`Attack simulation completed: ${attackResult.message}`);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Scan for attacks
      addLog('Scanning network for detected attacks...');
      const scanResult = await scanForAttacks();
      setDetectedAttacks(scanResult.alerts || []);
      
      addLog(`Detection complete: ${scanResult.total} attacks detected`);
      
      if (scanResult.alerts && scanResult.alerts.length > 0) {
        const attackTypes = scanResult.alerts.map((a: any) => a.attack_type);
        const uniqueTypes = Array.from(new Set(attackTypes));
        addLog(`Attack types detected: ${uniqueTypes.join(', ')}`);
        
        const highSeverityCount = scanResult.alerts.filter((a: any) => a.severity === 'high').length;
        if (highSeverityCount > 0) {
          addLog(`⚠️  ${highSeverityCount} high severity threats detected!`);
        }
      }
      
      // Calculate results
      const results = {
        scenario: scenario.name,
        attacksDetected: scanResult.total || 0,
        highSeverityThreats: scanResult.alerts?.filter((a: any) => a.severity === 'high').length || 0,
        detectionRate: scanResult.total > 0 ? 'Success' : 'No threats detected',
        timestamp: new Date().toISOString()
      };
      
      setResults(results);
      addLog(`Simulation results: ${JSON.stringify(results)}`);
      
    } catch (error) {
      addLog('Simulation failed');
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    setResults(null);
    setDetectedAttacks([]);
    setSimulationLog([]);
    setCurrentScenario(null);
    addLog('Simulation reset');
  };

  const exportResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      networkStats,
      scenario: currentScenario?.name,
      results,
      detectedAttacks,
      log: simulationLog
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attack Simulation Center</h1>
        <div className="flex space-x-2">
          <button
            onClick={resetSimulation}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={exportResults}
            disabled={!results}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Network Status */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Network Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{networkStats.node_count || 0}</div>
            <div className="text-sm text-gray-600">Network Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{networkStats.edge_count || 0}</div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {((networkStats.density || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Network Density</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {networkStats.is_connected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-sm text-gray-600">Network Status</div>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-4">
          <button
            onClick={generateTestNetwork}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Generate Test Network</span>
          </button>
        </div>
      </div>

      {/* Simulation Scenarios */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Attack Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario, index) => {
            const Icon = scenario.icon;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => !isSimulating && runSimulation(scenario)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-lg bg-gray-100`}>
                    <Icon className={`h-6 w-6 ${scenario.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                    <p className="text-sm text-gray-600">{scenario.attackType}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">{scenario.description}</p>
                <button
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Results */}
      {results && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Simulation Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.attacksDetected}</div>
              <div className="text-sm text-gray-600">Attacks Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{results.highSeverityThreats}</div>
              <div className="text-sm text-gray-600">High Severity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.detectionRate}</div>
              <div className="text-sm text-gray-600">Detection Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentScenario?.name}</div>
              <div className="text-sm text-gray-600">Scenario</div>
            </div>
          </div>
          
          {detectedAttacks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Detected Attacks</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detectedAttacks.map((attack, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{attack.attack_type}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        attack.severity === 'high' ? 'bg-red-100 text-red-800' :
                        attack.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {attack.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{attack.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {((attack.confidence || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulation Log */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Simulation Log</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
          {simulationLog.length > 0 ? (
            simulationLog.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          ) : (
            <div className="text-gray-500">No simulation activity yet...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;
