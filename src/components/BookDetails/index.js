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
        {/* Small Back Button in Corner */}
        <button 
          className="back-button-small"
          onClick={goBack}
        >
          ← Back
        </button>
        
        {/* Two-Column Layout */}
        <div className="book-main-layout">
          {/* Left Column - Book Cover and Actions */}
          <div className="book-cover-column">
            <div className="book-cover-container">
              <img 
                src={bookDetails?.imageLinks?.thumbnail || bookDetails?.imageLinks?.smallThumbnail || defaultImage} 
                alt={bookDetails?.title}
                className="book-cover-large"
                onError={(e) => {
                  if (e.target.src !== defaultImage) {
                    e.target.src = defaultImage;
                  }
                }}
              />
            </div>
            
            {/* Actions under cover */}
            <div className="book-actions">
              {user && (
                <div className="user-actions">
                  <button 
                    className={`action-btn-new favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={toggleFavorite}
                  >
                    <span className="action-icon">{isFavorite ? '❤️' : '🤍'}</span>
                    <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                  
                  <button 
                    className="action-btn-new list-btn"
                    onClick={() => {
                      fetchUserLists();
                      setShowListModal(true);
                    }}
                  >
                    <span className="action-icon">📚</span>
                    <span>Add to List</span>
                  </button>
                </div>
              )}
              
              <button 
                className="action-btn-new recommendations-btn"
                onClick={() => setActiveButton('recommendations')}
              >
                <span className="action-icon">🎯</span>
                <span>Get Recommendations</span>
              </button>
              
              {bookDetails?.previewLink && (
                <button 
                  className="action-btn-new preview-btn"
                  onClick={() => window.open(bookDetails.previewLink, '_blank')}
                >
                  <span className="action-icon">👁️</span>
                  <span>Preview</span>
                </button>
              )}
              
              {bookDetails?.infoLink && (
                <button 
                  className="action-btn-new info-btn"
                  onClick={() => {
                    window.open(bookDetails.infoLink, '_blank');
                  }}
                >
                  <span className="action-icon">🛒</span>
                  <span>View/Purchase</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Right Column - Book Information */}
          <div className="book-info-column">
            <div className="book-header">
              <h1 className="book-title-main">{bookDetails?.title}</h1>
              
              {bookDetails?.subtitle && (
                <h2 className="book-subtitle-main">{bookDetails.subtitle}</h2>
              )}
              
              {bookDetails?.authors && (
                <div className="book-authors-main">
                  by {bookDetails.authors.join(', ')}
                </div>
              )}
              
              {getRating() && (
                <div className="rating-section-main">
                  <div className="stars-main">
                    {renderStars(getRating())}
                  </div>
                  <span className="rating-text-main">
                    {getRating()} ({bookDetails?.ratingsCount || 0} reviews)
                  </span>
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="description-section-main">
              <h3>Description</h3>
              {bookDetails?.description ? (
                <div className="description-content-main">
                  <div 
                    className={`description-text-main ${showFullDescription ? 'expanded' : 'collapsed'}`}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(bookDetails.description)
                    }}
                  />
                  {bookDetails.description.replace(/<[^>]*>/g, '').length > 400 && (
                    <button 
                      className="read-more-btn-main"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                    >
                      {showFullDescription ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="no-description-main">No description available for this book.</p>
              )}
            </div>
            
            {/* Genres */}
            {bookDetails?.categories && (
              <div className="genres-section-main">
                <h4>Genres</h4>
                <div className="genres-list-main">
                  {bookDetails.categories.slice(0, 6).map((category, index) => (
                    <span key={index} className="genre-tag-main">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Book Details */}
            <div className="book-metadata-main">
              <h4>Book Details</h4>
              <div className="metadata-grid-main">
                {bookDetails?.publishedDate && (
                  <div className="metadata-item-main">
                    <span className="metadata-label-main">Published:</span>
                    <span className="metadata-value-main">{formatDate(bookDetails.publishedDate)}</span>
                  </div>
                )}
                
                {bookDetails?.publisher && (
                  <div className="metadata-item-main">
                    <span className="metadata-label-main">Publisher:</span>
                    <span className="metadata-value-main">{bookDetails.publisher}</span>
                  </div>
                )}
                
                {bookDetails?.pageCount && (
                  <div className="metadata-item-main">
                    <span className="metadata-label-main">Pages:</span>
                    <span className="metadata-value-main">{bookDetails.pageCount}</span>
                  </div>
                )}
                
                {bookDetails?.language && (
                  <div className="metadata-item-main">
                    <span className="metadata-label-main">Language:</span>
                    <span className="metadata-value-main">{bookDetails.language.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
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
