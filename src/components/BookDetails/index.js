import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import './BookDetails.css';

function BookDetails({
  bookDetails,
  setActiveButton
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);

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
          <button 
            className="recommendations-button-new"
            onClick={() => setActiveButton('recommendations')}
          >
            <div className="button-content">
              <span className="button-icon">🎯</span>
              <div className="button-text">
                <span className="button-main">Get Recommendations</span>
                <span className="button-sub">Discover similar books</span>
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
    </div>
  );
}

export default BookDetails;
