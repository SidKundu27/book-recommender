import React from 'react';
import './Navigation.css';

const Navigation = ({ 
  user, 
  onLogin, 
  onLogout, 
  onShowSettings, 
  onShowProfile, 
  onNewSearch,
  currentView 
}) => {
  return (
    <nav className="navigation">
      <div className="nav-left">
        <div className="logo" onClick={onNewSearch}>
          📚 BookFinder
        </div>
        {currentView !== 'advancedSearch' && (
          <button className="nav-btn" onClick={onNewSearch}>
            New Search
          </button>
        )}
      </div>

      <div className="nav-right">
        {user ? (
          <div className="user-menu">
            <div className="user-info" onClick={onShowProfile}>
              <div className="user-avatar">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="username">{user.username}</span>
            </div>
            
            <div className="user-actions">
              <button className="nav-btn" onClick={onShowProfile} title="My Books">
                📚
              </button>
              <button className="nav-btn" onClick={onShowSettings} title="Settings">
                ⚙️
              </button>
              <button className="nav-btn logout" onClick={onLogout} title="Logout">
                ↗️
              </button>
            </div>
          </div>
        ) : (
          <button className="login-btn" onClick={onLogin}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
