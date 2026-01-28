import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Network, AlertTriangle, Play, BarChart3, Clock } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Network', href: '/network', icon: Network },
    { name: 'Detection', href: '/detection', icon: AlertTriangle },
    { name: 'Simulation', href: '/simulation', icon: Play },
    { name: 'Attack History', href: '/attack-history', icon: Clock },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              CyberAttack Detector
            </h1>
          </div>
          
          <nav className="flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
