import React from 'react';
import DOMPurify from 'dompurify';
import './BookDetails.css';

function BookDetails({
  bookDetails,
  setActiveButton
}) {

  return (
    <div className="book-details-page">
      <div className="book-details-container">
        <button 
          className="back-button"
          onClick={() => setActiveButton('newBook')}
        >
          ← Back to Search
        </button>
        
        <div className="book-card">
          <div className="book-image-section">
            <img 
              src={bookDetails?.imageLinks?.thumbnail || bookDetails?.imageLinks?.smallThumbnail} 
              alt={bookDetails?.title}
              className="book-cover"
            />
          </div>
          
          <div className="book-info-section">
            <h1 className="book-title">{bookDetails?.title}</h1>
            
            {bookDetails?.authors && (
              <p className="book-author">
                by {bookDetails.authors.join(', ')}
              </p>
            )}
            
            {bookDetails?.categories && (
              <div className="book-genres">
                {bookDetails.categories.map((category, index) => (
                  <span key={index} className="genre-tag">
                    {category}
                  </span>
                ))}
              </div>
            )}
            
            {bookDetails?.publishedDate && (
              <p className="publish-date">
                Published: {bookDetails.publishedDate}
              </p>
            )}
            
            {bookDetails?.pageCount && (
              <p className="page-count">
                {bookDetails.pageCount} pages
              </p>
            )}
            
            {bookDetails?.description && (
              <div className="book-description">
                <h3>Description</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(bookDetails.description),
                  }}
                />
              </div>
            )}
            
            <button 
              className="recommendations-button"
              onClick={() => setActiveButton('recommendations')}
            >
              <span className="button-icon">🎯</span>
              Get Recommendations
              <span className="button-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;
