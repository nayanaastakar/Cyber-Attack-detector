# CyberAttack Detector - Graph-Based Network Security Analysis

A comprehensive DSA project that implements graph algorithms to detect various types of cyberattacks in real-time network traffic.

## 🛡️ Attack Detection Capabilities

- **DDoS Attack Detection** - Indegree threshold analysis
- **Botnet Detection** - Cycle detection using DFS with recursion stack
- **Port Scan Detection** - Outdegree threshold analysis  
- **Worm Propagation Detection** - BFS reachability analysis
- **C2 (Command & Control) Detection** - Combined degree pattern analysis

## 🏗️ Project Structure

```
cyberattack-detector/
├── backend/                 # FastAPI backend with graph algorithms
├── frontend/               # React frontend with network visualization
├── docker/                 # Docker configuration files
├── docs/                   # Documentation
└── README.md
```

## 🚀 Features

- Real-time network graph visualization
- Interactive attack simulation
- Professional UI with modern design
- RESTful API backend
- Docker deployment support
- Comprehensive attack detection algorithms

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, NetworkX
- **Frontend**: React, TypeScript, D3.js, Tailwind CSS
- **Deployment**: Docker, Docker Compose
- **Visualization**: D3.js for network graphs

## 📊 Algorithms Implemented

1. **DDoS Detection**: Monitors incoming connections (indegree)
2. **Botnet Detection**: Identifies communication cycles using DFS
3. **Port Scan Detection**: Tracks outgoing connection attempts (outdegree)
4. **Worm Detection**: Analyzes network reachability using BFS
5. **C2 Detection**: Combined indegree/outdegree pattern analysis

## 🎯 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### Quick Start with Docker
```bash
docker-compose up --build
```

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend  
cd frontend
npm install
npm start
```

## 📈 Usage

1. **Network Visualization**: View real-time network topology
2. **Attack Simulation**: Simulate various attack scenarios
3. **Detection Dashboard**: Monitor detected threats and alerts
4. **Analytics**: View attack patterns and statistics

## 🔧 Configuration

Adjust detection thresholds and parameters in `backend/config/settings.py`

## 📚 Documentation

Detailed documentation available in the `docs/` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details
