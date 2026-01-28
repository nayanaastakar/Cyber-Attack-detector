import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Graph API
export const getGraph = async () => {
  const response = await api.get('/api/graph');
  return response.data;
};

export const getGraphStats = async () => {
  const response = await api.get('/api/graph/stats');
  return response.data;
};

export const addNode = async (node: any) => {
  const response = await api.post('/api/graph/nodes', node);
  return response.data;
};

export const addEdge = async (edge: any) => {
  const response = await api.post('/api/graph/edges', edge);
  return response.data;
};

export const removeNode = async (nodeId: string) => {
  const response = await api.delete(`/api/graph/nodes/${nodeId}`);
  return response.data;
};

export const removeEdge = async (source: string, target: string) => {
  const response = await api.delete(`/api/graph/edges/${source}/${target}`);
  return response.data;
};

// Simulation API
export const generateNetwork = async (nodeCount: number = 50, edgeCount: number = 150) => {
  const response = await api.post(`/api/simulation/generate?node_count=${nodeCount}&edge_count=${edgeCount}`);
  return response.data;
};

export const simulateAttack = async (attackType: string, parameters: any = {}) => {
  const response = await api.post('/api/simulation/attack', {
    attack_type: attackType,
    parameters
  });
  return response.data;
};

// Detection API
export const scanForAttacks = async () => {
  const response = await api.get('/api/detection/scan');
  return response.data;
};

export const getAttackStatistics = async () => {
  const response = await api.get('/api/detection/statistics');
  return response.data;
};

export const getAttackHistory = async () => {
  const response = await api.get('/api/detection/history');
  return response.data;
};

// Thresholds API
export const getThresholds = async () => {
  const response = await api.get('/api/thresholds');
  return response.data;
};

export const updateThresholds = async (thresholds: any) => {
  const response = await api.put('/api/thresholds', thresholds);
  return response.data;
};

// Health API
export const getHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export default api;
