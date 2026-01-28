interface AttackData {
  attack_type: string;
  source_nodes: string[];
  target_nodes: string[];
  confidence: number;
  severity: string;
}

interface SeverityWeights {
  [key: string]: number;
}

export class SeverityCalculator {
  private static attackTypeWeights: SeverityWeights = {
    'ddos': 0.9,      // Highest impact - can take down services
    'botnet': 0.85,   // Very high - coordinated attacks
    'c2': 0.8,        // High - command and control
    'worm': 0.7,      // Medium-high - rapid propagation
    'port_scan': 0.5  // Medium - reconnaissance
  };

  private static severityMultipliers: SeverityWeights = {
    'high': 1.5,
    'medium': 1.0,
    'low': 0.5
  };

  static calculateSeverityScore(attack: AttackData): number {
    const typeWeight = this.attackTypeWeights[attack.attack_type] || 0.5;
    const severityMultiplier = this.severityMultipliers[attack.severity] || 1.0;
    
    // Calculate node impact
    const sourceNodeCount = attack.source_nodes.length;
    const targetNodeCount = attack.target_nodes.length;
    const nodeImpact = Math.min((sourceNodeCount + targetNodeCount) / 10, 1.0);
    
    // Calculate confidence impact
    const confidenceImpact = attack.confidence;
    
    // Final severity score (0-100)
    const baseScore = typeWeight * severityMultiplier * nodeImpact * confidenceImpact;
    return Math.round(baseScore * 100);
  }

  static getSeverityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  static getSeverityColor(level: string): string {
    switch (level) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  static getAttackTypeDescription(type: string): string {
    switch (type) {
      case 'ddos':
        return 'Distributed Denial of Service - Overwhelming target with traffic';
      case 'botnet':
        return 'Botnet Detection - Coordinated compromised machines';
      case 'c2':
        return 'Command & Control - Centralized control of infected nodes';
      case 'worm':
        return 'Worm Propagation - Self-replicating malware spreading';
      case 'port_scan':
        return 'Port Scanning - Reconnaissance for open vulnerabilities';
      default:
        return 'Unknown attack type';
    }
  }

  static calculateNetworkRiskScore(attacks: AttackData[]): number {
    if (attacks.length === 0) return 0;
    
    const totalScore = attacks.reduce((sum, attack) => {
      return sum + this.calculateSeverityScore(attack);
    }, 0);
    
    // Normalize to 0-100 scale
    const averageScore = totalScore / attacks.length;
    return Math.min(Math.round(averageScore), 100);
  }

  static getRiskMitigationPriority(attacks: AttackData[]): AttackData[] {
    return attacks
      .map(attack => ({
        ...attack,
        severityScore: this.calculateSeverityScore(attack)
      }))
      .sort((a, b) => b.severityScore - a.severityScore);
  }
}
