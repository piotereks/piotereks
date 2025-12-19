import React from 'react';
import { NavLink } from 'react-router-dom';
import { RefreshCw, BarChart2, Home, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

const Header = ({ title, icon, onRefresh, updateStatus }) => {
  const { isLight, toggleTheme } = useTheme();

  return (
    <header className="header-controls">
      <div className="header-title-group">
        <h1>
          <span className="title-icon">{icon}</span> {title}
        </h1>
        <div className="status-info">{updateStatus}</div>
      </div>
      <div className="header-actions">
        {onRefresh && (
          <button className="nav-btn" onClick={onRefresh}>
            <RefreshCw size={18} style={{ marginRight: '8px' }} />
            Refresh
          </button>
        )}
        <NavLink to="/" className="nav-btn">
          <Home size={18} style={{ marginRight: '8px' }} />
          Dashboard
        </NavLink>
        <NavLink to="/stats" className="nav-btn">
          <BarChart2 size={18} style={{ marginRight: '8px' }} />
          Statistics
        </NavLink>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isLight ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
