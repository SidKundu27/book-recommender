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
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
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
      checkFavoriteStatus();
    }
  }, [user, bookDetails]);

  const checkFavoriteStatus = async () => {
    if (!user || !bookDetails) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/reading-lists/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const favorites = await response.json();
        const isBookFavorited = favorites.some(book => book.id === bookDetails.id);
        setIsFavorite(isBookFavorited);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

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
        body: JSON.stringify({ 
          bookId: bookDetails.id, 
          book: bookDetails 
        })
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite);
        console.log('Favorite toggled successfully');
        
        // Show success message
        const action = isFavorite ? 'removed from' : 'added to';
        console.log(`Book ${action} favorites`);
      } else {
        const errorData = await response.json();
        console.error('Error toggling favorite:', errorData);
        
        // Handle specific error cases
        if (errorData.error === 'Book already in favorites') {
          console.log('Book is already in favorites, updating UI state');
          setIsFavorite(true);
        } else {
          alert('Error updating favorites: ' + errorData.error);
        }
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
        console.log('Book added to reading list successfully');
        // Refresh the lists to show updated book count
        fetchUserLists();
      } else {
        const errorData = await response.json();
        console.error('Error adding to reading list:', errorData);
        if (errorData.error === 'Book already in this list') {
          alert('This book is already in that reading list.');
        } else {
          alert('Error adding book to list: ' + errorData.error);
        }
      }
    } catch (error) {
      console.error('Error adding to reading list:', error);
      alert('Error adding book to reading list');
    }
  };

  const createNewList = async () => {
    if (!user || !newListName.trim()) return;
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/reading-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newListName.trim(),
          description: newListDescription.trim() || '',
          type: 'custom'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('New list created:', data.list);
        
        // Add the book to the newly created list
        await addToReadingList(data.list.id);
        
        // Reset form and close modals
        setNewListName('');
        setNewListDescription('');
        setShowCreateListModal(false);
        setShowListModal(false);
        
        // Refresh the lists
        fetchUserLists();
      } else {
        const errorData = await response.json();
        console.error('Error creating list:', errorData);
        alert('Error creating list: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating new list:', error);
      alert('Error creating new list');
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
        console.log('User lists fetched:', data.lists);
      } else {
        console.error('Failed to fetch user lists');
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
              
              <button
                className="list-option create-new-list"
                onClick={() => setShowCreateListModal(true)}
              >
                <span className="list-name">+ Create New List</span>
              </button>
              
              {userLists.length === 0 && (
                <p className="no-lists">No reading lists yet. Create one above!</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Create New List Modal */}
      {showCreateListModal && (
        <div className="modal-overlay" onClick={() => setShowCreateListModal(false)}>
          <div className="list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Reading List</h3>
              <button className="modal-close" onClick={() => setShowCreateListModal(false)}>×</button>
            </div>
            
            <div className="create-list-form">
              <div className="form-group">
                <label htmlFor="listName">List Name *</label>
                <input
                  type="text"
                  id="listName"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                  maxLength={100}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="listDescription">Description (optional)</label>
                <textarea
                  id="listDescription"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Enter list description..."
                  maxLength={300}
                  rows={3}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowCreateListModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={createNewList}
                  disabled={!newListName.trim()}
                >
                  Create & Add Book
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookDetails;
