import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ user, isOpen, onClose, onPreferencesChange }) => {
  const [preferences, setPreferences] = useState({
    useML: false,
    favoriteGenres: [],
    readingPreferences: {
      complexityLevel: 'medium',
      preferredLength: 'medium',
      preferredLanguages: ['en']
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Philosophy', 'Science',
    'Technology', 'Self-Help', 'Business', 'Travel', 'Cooking',
    'Art', 'Poetry', 'Drama', 'Horror', 'Thriller'
  ];

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPreferences();
    }
  }, [isOpen, user]);

  const fetchUserPreferences = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/recommendation-settings/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleMLToggle = async (useML) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/recommendation-settings/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useML }),
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, useML }));
        setMessage(useML ? 'ML recommendations enabled!' : 'Google recommendations enabled!');
        setTimeout(() => setMessage(''), 3000);
        
        // Notify parent component to refresh preferences
        if (onPreferencesChange) {
          onPreferencesChange();
        }
      }
    } catch (error) {
      console.error('Error updating ML preference:', error);
      setMessage('Error updating preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = async (genre) => {
    const newGenres = preferences.favoriteGenres.includes(genre)
      ? preferences.favoriteGenres.filter(g => g !== genre)
      : [...preferences.favoriteGenres, genre];

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ favoriteGenres: newGenres }),
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, favoriteGenres: newGenres }));
        setMessage('Genres updated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating genres:', error);
    }
  };

  const handleReadingPreferenceChange = async (key, value) => {
    const newReadingPreferences = {
      ...preferences.readingPreferences,
      [key]: value
    };

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ readingPreferences: newReadingPreferences }),
      });

      if (response.ok) {
        setPreferences(prev => ({ 
          ...prev, 
          readingPreferences: newReadingPreferences 
        }));
        setMessage('Reading preferences updated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating reading preferences:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings & Preferences</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {message && <div className="success-message">{message}</div>}

          {/* Recommendation Engine Selection */}
          <div className="settings-section">
            <h3>Recommendation Engine</h3>
            <p>Choose how you want to get book recommendations</p>
            
            <div className="recommendation-options">
              <div 
                className={`recommendation-card ${!preferences.useML ? 'active' : ''}`}
                onClick={() => handleMLToggle(false)}
              >
                <div className="recommendation-icon">🔍</div>
                <h4>Google Books</h4>
                <p>Fast, reliable recommendations based on Google Books database</p>
                <div className="pros">
                  <span>✓ Fast results</span>
                  <span>✓ Large database</span>
                  <span>✓ Always available</span>
                </div>
              </div>

              <div 
                className={`recommendation-card ${preferences.useML ? 'active' : ''}`}
                onClick={() => handleMLToggle(true)}
              >
                <div className="recommendation-icon">🤖</div>
                <h4>AI Recommendations</h4>
                <p>Personalized recommendations based on your reading history and preferences</p>
                <div className="pros">
                  <span>✓ Personalized</span>
                  <span>✓ Learns from you</span>
                  <span>✓ Improves over time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Favorite Genres */}
          <div className="settings-section">
            <h3>Favorite Genres</h3>
            <p>Select genres you enjoy reading (helps with recommendations)</p>
            
            <div className="genres-grid">
              {genres.map(genre => (
                <button
                  key={genre}
                  className={`genre-tag ${preferences.favoriteGenres.includes(genre) ? 'selected' : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Preferences */}
          <div className="settings-section">
            <h3>Reading Preferences</h3>
            
            <div className="preference-group">
              <label>Book Complexity</label>
              <select 
                value={preferences.readingPreferences.complexityLevel}
                onChange={(e) => handleReadingPreferenceChange('complexityLevel', e.target.value)}
              >
                <option value="easy">Easy reads</option>
                <option value="medium">Medium complexity</option>
                <option value="complex">Complex/Academic</option>
              </select>
            </div>

            <div className="preference-group">
              <label>Preferred Book Length</label>
              <select 
                value={preferences.readingPreferences.preferredLength}
                onChange={(e) => handleReadingPreferenceChange('preferredLength', e.target.value)}
              >
                <option value="short">Short (under 200 pages)</option>
                <option value="medium">Medium (200-400 pages)</option>
                <option value="long">Long (400+ pages)</option>
                <option value="any">Any length</option>
              </select>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="settings-section">
              <h3>Account Information</h3>
              <div className="user-info">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {loading && <div className="loading-overlay">Updating preferences...</div>}
      </div>
    </div>
  );
};

export default Settings;
