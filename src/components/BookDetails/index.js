import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import './BookDetails.css';

function BookDetails({
  bookDetails,
  setActiveButton,
  user,
  useMLRecommendations = false
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [userLists, setUserLists] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserLists();
    }
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getRating = () => {
    if (bookDetails?.averageRating) {
      return bookDetails.averageRating;
    }
    return null;
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
    
    return stars;
  };

  // User action functions
  const toggleFavorite = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const method = isFavorite ? 'DELETE' : 'POST';
      
      const response = await fetch('http://localhost:5000/api/reading-lists/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId: bookDetails.id, book: bookDetails })
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const addToReadingList = async (listId) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:5000/api/reading-lists/${listId}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book: bookDetails })
      });
      
      if (response.ok) {
        setIsInReadingList(true);
        setShowListModal(false);
      }
    } catch (error) {
      console.error('Error adding to reading list:', error);
    }
  };

  const fetchUserLists = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/reading-lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserLists(data.lists || []);
      }
    } catch (error) {
      console.error('Error fetching user lists:', error);
    }
  };

  return (
    <div className="book-details-page">
      <div className="book-details-container">
        <div className="navigation-bar">
          <button 
            className="back-button"
            onClick={() => setActiveButton('newBook')}
          >
            <span className="back-icon">←</span>
            New Search
          </button>
          
          <div className="page-title">
            <h2>Book Details</h2>
          </div>
        </div>
        
        <div className="book-hero-section">
          <div className="book-cover-wrapper">
            <div className="book-cover-container">
              <img 
                src={bookDetails?.imageLinks?.thumbnail || bookDetails?.imageLinks?.smallThumbnail} 
                alt={bookDetails?.title}
                className="book-cover-large"
              />
              <div className="cover-shadow"></div>
            </div>
            
            {getRating() && (
              <div className="rating-section">
                <div className="stars">
                  {renderStars(getRating())}
                </div>
                <span className="rating-text">
                  {getRating()}/5 ({bookDetails?.ratingsCount || 0} reviews)
                </span>
              </div>
            )}
          </div>
          
          <div className="book-main-info">
            <div className="book-header">
              <h1 className="book-title-large">{bookDetails?.title}</h1>
              
              {bookDetails?.subtitle && (
                <h2 className="book-subtitle">{bookDetails.subtitle}</h2>
              )}
              
              {bookDetails?.authors && (
                <div className="authors-section">
                  <span className="authors-label">by</span>
                  <div className="authors-list">
                    {bookDetails.authors.map((author, index) => (
                      <span key={index} className="author-name">
                        {author}
                        {index < bookDetails.authors.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="book-metadata">
              <div className="metadata-grid">
                {bookDetails?.publishedDate && (
                  <div className="metadata-item">
                    <span className="metadata-label">Published</span>
                    <span className="metadata-value">{formatDate(bookDetails.publishedDate)}</span>
                  </div>
                )}
                
                {bookDetails?.publisher && (
                  <div className="metadata-item">
                    <span className="metadata-label">Publisher</span>
                    <span className="metadata-value">{bookDetails.publisher}</span>
                  </div>
                )}
                
                {bookDetails?.pageCount && (
                  <div className="metadata-item">
                    <span className="metadata-label">Pages</span>
                    <span className="metadata-value">{bookDetails.pageCount}</span>
                  </div>
                )}
                
                {bookDetails?.language && (
                  <div className="metadata-item">
                    <span className="metadata-label">Language</span>
                    <span className="metadata-value">{bookDetails.language.toUpperCase()}</span>
                  </div>
                )}
                
                {bookDetails?.industryIdentifiers && (
                  <div className="metadata-item">
                    <span className="metadata-label">ISBN</span>
                    <span className="metadata-value">
                      {bookDetails.industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier || 
                       bookDetails.industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier || 
                       'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {bookDetails?.categories && (
              <div className="genres-section">
                <h3 className="section-title">Genres</h3>
                <div className="genre-tags">
                  {bookDetails.categories.map((category, index) => (
                    <span key={index} className="genre-tag-modern">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {bookDetails?.description && (
          <div className="description-section">
            <h3 className="section-title">About this book</h3>
            <div className={`description-content ${showFullDescription ? 'expanded' : 'collapsed'}`}>
              <div
                className="description-text"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(bookDetails.description),
                }}
              />
              {!showFullDescription && <div className="description-fade"></div>}
            </div>
            
            <button 
              className="toggle-description"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? 'Show Less' : 'Read More'}
            </button>
          </div>
        )}
        
        <div className="action-section">
          {user && (
            <div className="user-actions">
              <button 
                className={`action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={toggleFavorite}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span className="action-icon">{isFavorite ? '❤️' : '🤍'}</span>
                <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
              </button>
              
              <button 
                className="action-btn list-btn"
                onClick={() => {
                  fetchUserLists();
                  setShowListModal(true);
                }}
                title="Add to reading list"
              >
                <span className="action-icon">📚</span>
                <span>Add to List</span>
              </button>
            </div>
          )}
          
          <button 
            className="recommendations-button-new"
            onClick={() => setActiveButton('recommendations')}
          >
            <div className="button-content">
              <span className="button-icon">🎯</span>
              <div className="button-text">
                <span className="button-main">Get Recommendations</span>
                <span className="button-sub">
                  {useMLRecommendations && user ? 'AI powered suggestions' : 'Discover similar books'}
                </span>
              </div>
              <span className="button-arrow">→</span>
            </div>
          </button>
          
          {bookDetails?.previewLink && (
            <button 
              className="preview-button"
              onClick={() => window.open(bookDetails.previewLink, '_blank')}
            >
              <span className="button-icon">👁️</span>
              Preview Book
            </button>
          )}
          
          {bookDetails?.infoLink && (
            <button 
              className="info-button"
              onClick={() => window.open(bookDetails.infoLink, '_blank')}
            >
              <span className="button-icon">ℹ️</span>
              More Info
            </button>
          )}
        </div>
      </div>
      
      {/* Reading List Modal */}
      {showListModal && (
        <div className="modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add to Reading List</h3>
              <button className="modal-close" onClick={() => setShowListModal(false)}>×</button>
            </div>
            
            <div className="lists-container">
              {userLists.map(list => (
                <button
                  key={list.id}
                  className="list-option"
                  onClick={() => addToReadingList(list.id)}
                >
                  <span className="list-name">{list.name}</span>
                  <span className="list-count">{list.books?.length || 0} books</span>
                </button>
              ))}
              
              {userLists.length === 0 && (
                <p className="no-lists">No reading lists yet. Create one in your profile!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookDetails;
