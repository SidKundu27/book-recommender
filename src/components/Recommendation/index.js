import React, { useState, useEffect } from 'react';
import Spinner from '../Spinner';
import DOMPurify from 'dompurify';
import './Recommendation.css'

function Recommendations({
  genre,
  setActiveButton,
  goBack,
  user,
  useMLRecommendations = false,
  onBookSelect
}) {
  const [isloading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
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
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Build request URL with parameters for ML recommendations
        const params = new URLSearchParams();
        if (useMLRecommendations && user) {
          params.append('useML', 'true');
          params.append('userId', user.id);
          console.log('🤖 Using ML recommendations for user:', user.id);
        } else {
          console.log('🔍 Using Google recommendations');
        }
        
        const url = `/api/getBookRecommendation${params.toString() ? '?' + params.toString() : ''}`;
        console.log('📞 API call:', url);
        
        const response = await fetch(url);
        
        if (response.status === 200) {
          const data = await response.json();
          console.log('📚 Received recommendations:', data.length, 'books');
          setRecommendations(data);
        }
      } catch (error) {
        console.log('❌ Recommendations error:', error)
      }
      setIsLoading(false);
    };
  
    fetchData();
  }, [genre, useMLRecommendations, user])

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleBookClose = () => {
    setSelectedBook(null);
  };

  const handleAddToFavorites = async (book) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/reading-lists/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book })
      });
      
      if (response.ok) {
        alert('Book added to favorites!');
      } else {
        const errorData = await response.json();
        if (errorData.error === 'Book already in favorites') {
          alert('This book is already in your favorites!');
        } else {
          alert('Error adding to favorites: ' + errorData.error);
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Error adding to favorites');
    }
  };

  const handleAddToList = async (book) => {
    if (!user) return;
    
    // For now, we'll show a simple prompt. In the future, this could open a list selection modal
    const listName = prompt('Enter list name or leave blank to add to "Want to Read" list:');
    const targetList = listName?.trim() || 'Want to Read';
    
    try {
      const token = localStorage.getItem('authToken');
      
      // First, get user's lists to find the target list
      const listsResponse = await fetch('http://localhost:5000/api/reading-lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (listsResponse.ok) {
        const listsData = await listsResponse.json();
        const targetListObj = listsData.lists.find(list => 
          list.name.toLowerCase() === targetList.toLowerCase()
        );
        
        if (targetListObj) {
          const response = await fetch(`http://localhost:5000/api/reading-lists/${targetListObj.id}/books`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ book })
          });
          
          if (response.ok) {
            alert(`Book added to "${targetListObj.name}" list!`);
          } else {
            const errorData = await response.json();
            alert('Error adding to list: ' + errorData.error);
          }
        } else {
          alert(`List "${targetList}" not found. Please check the list name.`);
        }
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      alert('Error adding to list');
    }
  };

  const handleViewFullDetails = (book) => {
    if (onBookSelect) {
      onBookSelect(book);
      setActiveButton('bookDetails');
    } else {
      // Fallback - open modal
      handleBookClick(book);
    }
  };

  if (isloading) {
    return (
      <div className="recommendations-page">
        <div className="loading-container">
          <Spinner/>
          <p className="loading-text">Finding perfect recommendations for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="recommendations-container">
        <button 
          className="back-button"
          onClick={() => goBack ? goBack() : setActiveButton('home')}
        >
          ← Back
        </button>
        
        <div className="recommendations-header">
          <div className="header-content">
            <h1>Recommended Books</h1>
            <div className="recommendation-mode">
              {useMLRecommendations && user ? (
                <span className="ml-mode">🤖 AI Powered Recommendations</span>
              ) : (
                <span className="google-mode">🔍 Google Books Recommendations</span>
              )}
            </div>
            
            {/* Debug info */}
            {user && (
              <div className="debug-info" style={{background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.9rem'}}>
                <p>Debug: User ID: {user.id}</p>
                <p>Debug: ML Mode: {useMLRecommendations ? 'ON' : 'OFF'}</p>
                <p>Debug: Recommendations Count: {recommendations.length}</p>
              </div>
            )}
          </div>
          {genre && (
            <p className="genre-subtitle">
              Based on the <span className="genre-highlight">{genre}</span> genre
              {useMLRecommendations && user && ' and your reading preferences'}
            </p>
          )}
        </div>

        <div className="book-grid">
          {recommendations.map((book, index) => (
            <div
              key={book.id || index}
              className="modern-book-card"
            >
              <div className="book-cover-section">
                <div className="book-cover-wrapper">
                  <img 
                    src={book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || defaultImage} 
                    alt={book.title}
                    className="book-cover"
                    onError={(e) => {
                      if (e.target.src !== defaultImage) {
                        e.target.src = defaultImage;
                      }
                    }}
                  />
                  <div className="book-overlay">
                    <div className="overlay-content">
                      <span className="view-text">📖 Quick Preview</span>
                    </div>
                  </div>
                </div>
                
                {book.averageRating && (
                  <div className="rating-badge">
                    <span className="rating-star">★</span>
                    <span className="rating-value">{book.averageRating.toFixed(1)}</span>
                  </div>
                )}
                
                {book.mlGenerated && (
                  <div className="ml-badge">
                    <span>🤖 AI Pick</span>
                  </div>
                )}
              </div>
              
              <div className="book-content">
                <div className="book-header">
                  <h3 className="book-title">{book.title}</h3>
                  {book.subtitle && (
                    <p className="book-subtitle">{book.subtitle}</p>
                  )}
                </div>
                
                {book.authors && (
                  <p className="book-authors">
                    <span className="author-label">by</span>
                    <span className="author-names">
                      {book.authors.slice(0, 2).join(', ')}
                      {book.authors.length > 2 && '...'}
                    </span>
                  </p>
                )}
                
                <div className="book-metadata">
                  {book.publishedDate && (
                    <div className="metadata-item">
                      <span className="metadata-icon">📅</span>
                      <span className="metadata-text">{book.publishedDate.split('-')[0]}</span>
                    </div>
                  )}
                  
                  {book.pageCount && (
                    <div className="metadata-item">
                      <span className="metadata-icon">📄</span>
                      <span className="metadata-text">{book.pageCount} pages</span>
                    </div>
                  )}
                  
                  {book.categories && book.categories[0] && (
                    <div className="metadata-item">
                      <span className="metadata-icon">🏷️</span>
                      <span className="metadata-text">{book.categories[0]}</span>
                    </div>
                  )}
                </div>
                
                {book.recommendationReasons && book.recommendationReasons.length > 0 && (
                  <div className="recommendation-reasons">
                    <p className="reasons-title">Why recommended:</p>
                    <ul className="reasons-list">
                      {book.recommendationReasons.slice(0, 2).map((reason, idx) => (
                        <li key={idx} className="reason-item">{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {book.description && (
                  <p className="book-description">
                    {book.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                    {book.description.length > 100 && '...'}
                  </p>
                )}
                
                <div className="card-actions">
                  <button 
                    className="action-btn primary-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookClick(book);
                    }}
                  >
                    <span className="btn-icon">📖</span>
                    <span>Quick View</span>
                  </button>
                  
                  {user && (
                    <>
                      <button 
                        className="action-btn secondary-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToFavorites(book);
                        }}
                      >
                        <span className="btn-icon">❤️</span>
                        <span>Favorite</span>
                      </button>
                      
                      <button 
                        className="action-btn secondary-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToList(book);
                        }}
                      >
                        <span className="btn-icon">📚</span>
                        <span>Add to List</span>
                      </button>
                    </>
                  )}
                  
                  <button 
                    className="action-btn accent-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewFullDetails(book);
                    }}
                  >
                    <span className="btn-icon">🔍</span>
                    <span>Full Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedBook && (
          <div className="modal-overlay" onClick={handleBookClose}>
            <div className="book-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={handleBookClose}>
                ×
              </button>
              <div className="modal-content">
                <div className="modal-image">
                  <img 
                    src={selectedBook.imageLinks?.thumbnail || selectedBook.imageLinks?.smallThumbnail || defaultImage} 
                    alt={selectedBook.title}
                    onError={(e) => {
                      if (e.target.src !== defaultImage) {
                        e.target.src = defaultImage;
                      }
                    }}
                  />
                </div>
                <div className="modal-details">
                  <h2 className="modal-title">{selectedBook.title}</h2>
                  {selectedBook.authors && (
                    <p className="modal-author">
                      by {selectedBook.authors.join(', ')}
                    </p>
                  )}
                  {selectedBook.publishedDate && (
                    <p className="modal-date">
                      Published: {selectedBook.publishedDate}
                    </p>
                  )}
                  {selectedBook.pageCount && (
                    <p className="modal-pages">
                      {selectedBook.pageCount} pages
                    </p>
                  )}
                  {selectedBook.description && (
                    <div className="modal-description">
                      <h3>Description</h3>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(selectedBook.description),
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Recommendations;