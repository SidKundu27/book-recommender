import React from 'react';
import './Navigation.css';

const Navigation = ({ 
  user, 
  onLogin, 
  onLogout, 
  onShowSettings, 
  onShowProfile, 
  onNewSearch,
  onHome,
  currentView 
}) => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <div className="logo" onClick={onHome}>
            📚 BookFinder
          </div>
          
          <div className="nav-links">
            {user && (
              <button 
                className={`nav-btn ${currentView === 'home' ? 'active' : ''}`} 
                onClick={onHome} 
                title="My Library"
              >
                🏠 Home
              </button>
            )}
            <button 
              className={`nav-btn ${currentView === 'advancedSearch' || currentView === 'search' ? 'active' : ''}`} 
              onClick={onNewSearch}
            >
              🔍 Search
            </button>
          </div>
        </div>

        <div className="nav-right">
          {user ? (
            <div className="user-menu">
              <button 
                className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`} 
                onClick={onShowProfile} 
                title="My Books"
              >
                📚 My Books
              </button>
              <button 
                className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`} 
                onClick={onShowSettings} 
                title="Settings"
              >
                ⚙️ Settings
              </button>
              
              <div className="user-info" onClick={onShowProfile}>
                <div className="user-avatar">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="username">{user.username}</span>
              </div>
              
              <button className="nav-btn logout" onClick={onLogout} title="Logout">
                ↗️ Logout
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={onLogin}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
