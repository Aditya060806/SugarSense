import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, ShieldCheck, FileText, Settings,
  ChevronLeft, ChevronRight, Radio
} from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/process-control', icon: ShieldCheck, label: 'Process Control' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { wsStatus, isRunning } = useSimulationContext();

  const statusColor =
    wsStatus === 'connected' ? 'var(--accent-green)' :
    wsStatus === 'connecting' ? 'var(--accent-orange)' :
    'var(--accent-red)';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="logo-icon">🌾</span>
          {!collapsed && <span className="logo-text">SugarSense</span>}
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
          >
            <Icon size={20} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: Connection Status */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <Radio size={14} style={{ color: statusColor }} className={isRunning ? 'pulse-dot' : ''} />
          {!collapsed && (
            <span style={{ color: statusColor, fontSize: '0.8rem' }}>
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
