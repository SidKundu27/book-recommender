import React, { useState } from 'react';
import './AdvancedSearch.css';

function AdvancedSearch({
  onSearch,
  isSearching
}) {
  const [searchType, setSearchType] = useState('title');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    author: '',
    genre: '',
    publishedYear: '',
    language: 'en'
  });

  const searchTypes = [
    { value: 'title', label: 'Book Title', icon: '📚', placeholder: 'Enter book title...' },
    { value: 'author', label: 'Author', icon: '✍️', placeholder: 'Enter author name...' },
    { value: 'isbn', label: 'ISBN', icon: '🔢', placeholder: 'Enter ISBN (10 or 13 digits)...' },
    { value: 'genre', label: 'Genre', icon: '🏷️', placeholder: 'Enter genre (fiction, mystery, etc.)...' },
    { value: 'advanced', label: 'Advanced Search', icon: '🔍', placeholder: 'Multiple criteria...' }
  ];

  const popularGenres = [
    'Fiction', 'Non-fiction', 'Mystery', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-help', 'Business',
    'Philosophy', 'Poetry', 'Drama', 'Adventure', 'Horror'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let searchData = {
      type: searchType,
      query: searchQuery,
      filters: searchType === 'advanced' ? filters : {}
    };

    if (!searchQuery.trim() && searchType !== 'advanced') return;
    if (searchType === 'advanced' && !Object.values(filters).some(v => v.trim())) return;

    onSearch(searchData);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenreSelect = (genre) => {
    if (searchType === 'genre') {
      setSearchQuery(genre);
    } else if (searchType === 'advanced') {
      handleFilterChange('genre', genre);
    }
  };

  return (
    <div className="advanced-search">
      <div className="search-container-new">
        <div className="search-header">
          <h1 className="search-title">
            Find Your Perfect Book
          </h1>
          <p className="search-subtitle">
            Search by title, author, ISBN, or use advanced filters
          </p>
        </div>

        <form onSubmit={handleSubmit} className="search-form-new">
          {/* Search Type Selector */}
          <div className="search-type-selector">
            {searchTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`search-type-btn ${searchType === type.value ? 'active' : ''}`}
                onClick={() => setSearchType(type.value)}
              >
                <span className="type-icon">{type.icon}</span>
                <span className="type-label">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Main Search Input */}
          {searchType !== 'advanced' && (
            <div className="main-search-section">
              <div className="search-input-wrapper">
                <span className="search-icon">
                  {searchTypes.find(t => t.value === searchType)?.icon}
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchTypes.find(t => t.value === searchType)?.placeholder}
                  className="main-search-input"
                  required
                  disabled={isSearching}
                />
                <button 
                  type="submit" 
                  className="search-submit-btn"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <div className="search-spinner"></div>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Advanced Search Section */}
          {searchType === 'advanced' && (
            <div className="advanced-section">
              <div className="advanced-inputs">
                <div className="input-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={filters.title || ''}
                    onChange={(e) => handleFilterChange('title', e.target.value)}
                    placeholder="Book title..."
                  />
                </div>
                
                <div className="input-group">
                  <label>Author</label>
                  <input
                    type="text"
                    value={filters.author}
                    onChange={(e) => handleFilterChange('author', e.target.value)}
                    placeholder="Author name..."
                  />
                </div>
                
                <div className="input-group">
                  <label>Genre</label>
                  <input
                    type="text"
                    value={filters.genre}
                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                    placeholder="Genre..."
                  />
                </div>
                
                <div className="input-group">
                  <label>Published Year</label>
                  <input
                    type="number"
                    value={filters.publishedYear}
                    onChange={(e) => handleFilterChange('publishedYear', e.target.value)}
                    placeholder="2023"
                    min="1000"
                    max={new Date().getFullYear()}
                  />
                </div>
                
                <div className="input-group">
                  <label>Language</label>
                  <select
                    value={filters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="advanced-search-btn"
                disabled={isSearching || !Object.values(filters).some(v => v.trim())}
              >
                {isSearching ? (
                  <>
                    <div className="search-spinner"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    Advanced Search
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* Popular Genres */}
        {(searchType === 'genre' || searchType === 'advanced') && (
          <div className="popular-genres">
            <h3>Popular Genres</h3>
            <div className="genre-chips">
              {popularGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className="genre-chip"
                  onClick={() => handleGenreSelect(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Tips */}
        <div className="search-tips">
          <h4>Search Tips:</h4>
          <ul>
            <li><strong>Title:</strong> Use exact or partial book titles</li>
            <li><strong>Author:</strong> Search by first name, last name, or both</li>
            <li><strong>ISBN:</strong> Use 10 or 13 digit ISBN numbers</li>
            <li><strong>Genre:</strong> Try broad categories like "fiction" or specific ones like "sci-fi"</li>
            <li><strong>Advanced:</strong> Combine multiple criteria for precise results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdvancedSearch;
