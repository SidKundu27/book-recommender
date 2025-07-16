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
        }
        
        const url = `/api/getBookRecommendation${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        
        if (response.status === 200) {
          const data = await response.json();
          setRecommendations(data);
        }
      } catch (error) {
        console.log(error)
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
              className={`book-card ${selectedBook?.id === book.id ? 'active' : ''}`}
            >
              <div className="book-cover-container">
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
                  <span>View Details</span>
                </div>
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                {book.authors && (
                  <p className="book-author">
                    {book.authors.slice(0, 2).join(', ')}
                    {book.authors.length > 2 && '...'}
                  </p>
                )}
                {book.publishedDate && (
                  <p className="book-year">{book.publishedDate.split('-')[0]}</p>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="book-actions">
                <button 
                  className="action-btn details-btn"
                  onClick={() => handleBookClick(book)}
                >
                  📖 Details
                </button>
                
                {user && (
                  <>
                    <button 
                      className="action-btn favorite-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToFavorites(book);
                      }}
                    >
                      ❤️ Favorite
                    </button>
                    
                    <button 
                      className="action-btn list-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToList(book);
                      }}
                    >
                      📚 Add to List
                    </button>
                  </>
                )}
                
                <button 
                  className="action-btn view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewFullDetails(book);
                  }}
                >
                  🔍 View Full
                </button>
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