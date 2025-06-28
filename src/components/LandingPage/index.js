import React, { useState } from 'react';
import './LandingPage.css';

function LandingPage({ 
  bookTitle, 
  handleInputChange, 
  handleFormSubmit 
}) {
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e) => {
    setIsSearching(true);
    await handleFormSubmit(e);
    setIsSearching(false);
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="hero-section">
          <h1 className="hero-title">
            Discover Your Next
            <span className="highlight"> Great Read</span>
          </h1>
          <p className="hero-subtitle">
            Enter any book title and we'll find amazing recommendations just for you
          </p>
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-container">
            <input
              type="text"
              value={bookTitle}
              onChange={handleInputChange}
              placeholder="Type a book title..."
              className="search-input"
              required
              disabled={isSearching}
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={isSearching}
            >
              {isSearching ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Search
                </>
              )}
            </button>
          </div>
        </form>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">📚</div>
            <h3>Smart Recommendations</h3>
            <p>AI-powered suggestions based on genre and style</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Instant Results</h3>
            <p>Get recommendations in seconds</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Personalized</h3>
            <p>Tailored to your reading preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
