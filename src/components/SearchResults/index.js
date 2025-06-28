import React, { useState, useEffect } from 'react';
import './SearchResults.css';

function SearchResults({
  searchResults,
  searchQuery,
  searchType,
  onBookSelect,
  onNewSearch,
  isLoading
}) {
  const [sortBy, setSortBy] = useState('relevance');
  const [viewType, setViewType] = useState('grid');
  const [defaultImage, setDefaultImage] = useState('');

  // Fetch a default image on component mount
  useEffect(() => {
    const fetchDefaultImage = async () => {
      try {
        const response = await fetch('https://dog.ceo/api/breeds/image/random');
        const data = await response.json();
        setDefaultImage(data.message);
      } catch (error) {
        console.error('Error fetching default image:', error);
        setDefaultImage('https://images.dog.ceo/breeds/hound-english/n02089973_612.jpg');
      }
    };
    
    fetchDefaultImage();
  }, []);

  const sortResults = (results) => {
    if (!results) return [];
    
    const sorted = [...results];
    switch (sortBy) {
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'author':
        return sorted.sort((a, b) => {
          const authorA = a.authors?.[0] || 'Unknown';
          const authorB = b.authors?.[0] || 'Unknown';
          return authorA.localeCompare(authorB);
        });
      case 'year':
        return sorted.sort((a, b) => {
          const yearA = a.publishedDate ? new Date(a.publishedDate).getFullYear() : 0;
          const yearB = b.publishedDate ? new Date(b.publishedDate).getFullYear() : 0;
          return yearB - yearA;
        });
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      default:
        return sorted;
    }
  };

  const getSearchTypeLabel = (type) => {
    const labels = {
      title: 'Title',
      author: 'Author',
      isbn: 'ISBN',
      genre: 'Genre',
      advanced: 'Advanced'
    };
    return labels[type] || 'Unknown';
  };

  const formatSearchQuery = (query, type) => {
    if (type === 'advanced') {
      const filters = Object.entries(query.filters || {})
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: "${value}"`)
        .join(', ');
      return filters || 'Multiple criteria';
    }
    return query.query || query;
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    
    return <div className="rating-stars">{stars}</div>;
  };

  const sortedResults = sortResults(searchResults);

  if (isLoading) {
    return (
      <div className="search-results-page">
        <div className="loading-container">
          <div className="search-spinner-large"></div>
          <p className="loading-text">Searching for books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="search-results-container">
        {/* Header */}
        <div className="results-header">
          <button className="back-to-search-btn" onClick={onNewSearch}>
            ← New Search
          </button>
          
          <div className="search-info">
            <h1 className="results-title">Search Results</h1>
            <div className="search-meta">
              <span className="search-details">
                {getSearchTypeLabel(searchType)} search for 
                <strong> "{formatSearchQuery(searchQuery, searchType)}"</strong>
              </span>
              <span className="results-count">
                {sortedResults.length} book{sortedResults.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="results-controls">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="relevance">Relevance</option>
              <option value="title">Title (A-Z)</option>
              <option value="author">Author</option>
              <option value="year">Publication Year</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div className="view-controls">
            <button 
              className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
              onClick={() => setViewType('grid')}
            >
              ⊞ Grid
            </button>
            <button 
              className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
              onClick={() => setViewType('list')}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* Results */}
        {sortedResults.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">📚</div>
            <h3>No books found</h3>
            <p>Try adjusting your search criteria or using different keywords.</p>
            <button className="search-again-btn" onClick={onNewSearch}>
              Try Another Search
            </button>
          </div>
        ) : (
          <div className={`results-grid ${viewType}`}>
            {sortedResults.map((book, index) => (
              <div 
                key={book.id || index} 
                className="result-card"
                onClick={() => onBookSelect(book)}
              >
                <div className="book-cover-section">
                  <img 
                    src={book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || defaultImage} 
                    alt={book.title}
                    className="result-book-cover"
                    onError={(e) => {
                      if (e.target.src !== defaultImage) {
                        e.target.src = defaultImage;
                      }
                    }}
                  />
                  {book.averageRating && (
                    <div className="rating-badge">
                      ⭐ {book.averageRating.toFixed(1)}
                    </div>
                  )}
                </div>
                
                <div className="book-info-section">
                  <h3 className="result-book-title">{book.title}</h3>
                  
                  {book.subtitle && (
                    <p className="result-book-subtitle">{book.subtitle}</p>
                  )}
                  
                  {book.authors && (
                    <p className="result-book-author">
                      by {book.authors.slice(0, 2).join(', ')}
                      {book.authors.length > 2 && ` +${book.authors.length - 2} more`}
                    </p>
                  )}
                  
                  <div className="book-metadata">
                    {book.publishedDate && (
                      <span className="metadata-item">
                        📅 {book.publishedDate.split('-')[0]}
                      </span>
                    )}
                    
                    {book.pageCount && (
                      <span className="metadata-item">
                        📄 {book.pageCount} pages
                      </span>
                    )}
                    
                    {book.categories && (
                      <span className="metadata-item">
                        🏷️ {book.categories[0]}
                      </span>
                    )}
                  </div>
                  
                  {book.averageRating && (
                    <div className="rating-section">
                      {renderStars(book.averageRating)}
                      <span className="rating-text">
                        ({book.ratingsCount || 0} reviews)
                      </span>
                    </div>
                  )}
                  
                  {book.description && (
                    <p className="result-description">
                      {book.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>
                  )}
                  
                  <button className="view-details-btn">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
