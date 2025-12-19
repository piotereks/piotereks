import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';

const Header = ({ title, icon, onRefresh, updateStatus, children }) => {
  const { isLight, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <header className="header-controls">
      <div className="header-title-group">
        <h1>
          <span className="title-icon">{icon}</span> {title}
        </h1>
        <div className="status-info">{updateStatus}</div>
      </div>
      <div className="header-actions">
        {/* Extra actions like Palette Selector */}
        {children}

        {onRefresh && (
          <button className="nav-btn" onClick={onRefresh}>
            <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>⟳</span>
            <span className="btn-text">Refresh</span>
          </button>
        )}

        {location.pathname === '/stats' && (
          <NavLink to="/" className="nav-btn">
            <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>🏠</span>
            <span className="btn-text">Dashboard</span>
          </NavLink>
        )}

        {location.pathname === '/' && (
          <NavLink to="/stats" className="nav-btn">
            <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>📊</span>
            <span className="btn-text">Statistics</span>
          </NavLink>
        )}

        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isLight ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
};

export default Header;
