import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NetworkVisualization from './pages/NetworkVisualization';
import AttackDetection from './pages/AttackDetection';
import Simulation from './pages/Simulation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/network" element={<NetworkVisualization />} />
            <Route path="/detection" element={<AttackDetection />} />
            <Route path="/simulation" element={<Simulation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
