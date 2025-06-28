import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import './BookDetails.css';

function BookDetails({
  bookDetails,
  setActiveButton,
  goBack,
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
        {/* Navigation Header */}
        <div className="navigation-header">
          <button 
            className="back-button"
            onClick={goBack}
          >
            <span className="back-icon">←</span>
            Back
          </button>
          
          <div className="page-title">
            <h1>Book Details</h1>
          </div>
        </div>
        
        {/* Three-Column Layout */}
        <div className="book-content-grid">
          {/* Left Column - Book Info */}
          <div className="book-info-column">
            <div className="book-cover-container">
              <img 
                src={bookDetails?.imageLinks?.thumbnail || bookDetails?.imageLinks?.smallThumbnail || 'https://dog.ceo/api/breeds/image/random'} 
                alt={bookDetails?.title}
                className="book-cover-large"
                onError={(e) => {
                  if (!e.target.src.includes('dog.ceo')) {
                    fetch('https://dog.ceo/api/breeds/image/random')
                      .then(response => response.json())
                      .then(data => {
                        e.target.src = data.message;
                      })
                      .catch(() => {
                        e.target.src = 'https://images.dog.ceo/breeds/hound-english/n02089973_612.jpg';
                      });
                  }
                }}
              />
            </div>
            
            <div className="book-basic-info">
              <h2 className="book-title">{bookDetails?.title}</h2>
              
              {bookDetails?.subtitle && (
                <h3 className="book-subtitle">{bookDetails.subtitle}</h3>
              )}
              
              {bookDetails?.authors && (
                <p className="book-authors">
                  by {bookDetails.authors.join(', ')}
                </p>
              )}
              
              {getRating() && (
                <div className="rating-section">
                  <div className="stars">
                    {renderStars(getRating())}
                  </div>
                  <span className="rating-text">
                    {getRating()} ({bookDetails?.ratingsCount || 0} reviews)
                  </span>
                </div>
              )}
              
              {bookDetails?.categories && (
                <div className="genres-section">
                  <h4>Genres</h4>
                  <div className="genres-list">
                    {bookDetails.categories.slice(0, 4).map((category, index) => (
                      <span key={index} className="genre-tag">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="book-metadata">
                {bookDetails?.publishedDate && (
                  <div className="metadata-item">
                    <span className="metadata-label">Published:</span>
                    <span className="metadata-value">{formatDate(bookDetails.publishedDate)}</span>
                  </div>
                )}
                
                {bookDetails?.publisher && (
                  <div className="metadata-item">
                    <span className="metadata-label">Publisher:</span>
                    <span className="metadata-value">{bookDetails.publisher}</span>
                  </div>
                )}
                
                {bookDetails?.pageCount && (
                  <div className="metadata-item">
                    <span className="metadata-label">Pages:</span>
                    <span className="metadata-value">{bookDetails.pageCount}</span>
                  </div>
                )}
                
                {bookDetails?.language && (
                  <div className="metadata-item">
                    <span className="metadata-label">Language:</span>
                    <span className="metadata-value">{bookDetails.language.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Middle Column - Description */}
          <div className="book-description-column">
            <h3>Description</h3>
            {bookDetails?.description ? (
              <div className="description-content">
                <div 
                  className={`description-text ${showFullDescription ? 'expanded' : 'collapsed'}`}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(bookDetails.description)
                  }}
                />
                {bookDetails.description.replace(/<[^>]*>/g, '').length > 300 && (
                  <button 
                    className="read-more-btn"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            ) : (
              <p className="no-description">No description available for this book.</p>
            )}
          </div>
          
          {/* Right Column - Actions */}
          <div className="book-actions-column">
            <h3>Actions</h3>
            
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
              className="recommendations-button"
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
                onClick={() => {
                  if (bookDetails.infoLink.includes('google.com/books')) {
                    window.open(bookDetails.infoLink, '_blank');
                  } else {
                    alert('Purchase link may not be available for this book.');
                  }
                }}
                title="View on Google Books (may include purchase options)"
              >
                <span className="button-icon">🛒</span>
                <span>View/Purchase</span>
              </button>
            )}
          </div>
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
