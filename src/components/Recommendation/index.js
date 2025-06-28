import React, { useState, useEffect } from 'react';
import Spinner from '../Spinner';
import DOMPurify from 'dompurify';
import './Recommendation.css'

function Recommendations({
  genre,
  setActiveButton,
  user,
  useMLRecommendations = false
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
          onClick={() => setActiveButton('bookDetails')}
        >
          ← Back to Book Details
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
              onClick={() => handleBookClick(book)}
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