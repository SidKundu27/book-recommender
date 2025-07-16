import React, { useState, useEffect } from 'react';
import './Home.css';

function Home({ user, onBookSelect, onNavigate }) {
  const [favorites, setFavorites] = useState([]);
  const [readingLists, setReadingLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('favorites');
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
      fetchUserBooks();
    }
  }, [user]);

  const fetchUserBooks = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch favorites
      const favoritesResponse = await fetch('http://localhost:5000/api/reading-lists/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        console.log('Favorites data received:', favoritesData);
        setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
      } else {
        console.error('Failed to fetch favorites');
        setFavorites([]);
      }
      
      // Fetch reading lists
      const listsResponse = await fetch('http://localhost:5000/api/reading-lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (listsResponse.ok) {
        const listsData = await listsResponse.json();
        console.log('Reading lists data received:', listsData);
        setReadingLists(listsData.lists || []);
      } else {
        console.error('Failed to fetch reading lists');
        setReadingLists([]);
      }
      
    } catch (error) {
      console.error('Error fetching user books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllBooksFromLists = () => {
    const allBooks = [];
    readingLists.forEach(list => {
      if (list.books) {
        list.books.forEach(book => {
          allBooks.push({
            ...book,
            listName: list.name
          });
        });
      }
    });
    return allBooks;
  };

  const handleBookClick = (book) => {
    onBookSelect(book);
  };

  const renderBookCard = (book, showListName = false) => (
    <div 
      key={book.id} 
      className="modern-home-card"
      onClick={() => handleBookClick(book)}
    >
      <div className="home-card-cover-section">
        <div className="home-card-cover-wrapper">
          <img 
            src={book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || defaultImage} 
            alt={book.title}
            className="home-card-cover"
            onError={(e) => {
              if (e.target.src !== defaultImage) {
                e.target.src = defaultImage;
              }
            }}
          />
          <div className="home-card-overlay">
            <div className="home-overlay-content">
              <span className="home-view-text">📖 View Details</span>
            </div>
          </div>
        </div>
        
        {book.averageRating && (
          <div className="home-rating-badge">
            <span className="home-rating-star">★</span>
            <span className="home-rating-value">{book.averageRating.toFixed(1)}</span>
          </div>
        )}
        
        {showListName && book.listName && (
          <div className="home-list-badge">
            <span>📚 {book.listName}</span>
          </div>
        )}
      </div>
      
      <div className="home-card-content">
        <div className="home-card-header">
          <h3 className="home-card-title">{book.title}</h3>
        </div>
        
        {book.authors && (
          <p className="home-card-authors">
            <span className="home-author-label">by</span>
            <span className="home-author-names">
              {book.authors.slice(0, 2).join(', ')}
              {book.authors.length > 2 && '...'}
            </span>
          </p>
        )}
        
        <div className="home-card-metadata">
          {book.publishedDate && (
            <div className="home-metadata-item">
              <span className="home-metadata-icon">📅</span>
              <span className="home-metadata-text">{book.publishedDate.split('-')[0]}</span>
            </div>
          )}
          
          {book.pageCount && (
            <div className="home-metadata-item">
              <span className="home-metadata-icon">📄</span>
              <span className="home-metadata-text">{book.pageCount}p</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="home-page">
        <div className="home-container">
          <div className="welcome-section">
            <h1>Welcome to Your Book Library</h1>
            <p>Please log in to view your favorite books and reading lists.</p>
            <button 
              className="login-prompt-btn"
              onClick={() => onNavigate('login')}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="home-page">
        <div className="home-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your books...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1>Welcome back, {user.name}!</h1>
          <p>Here are your saved books and reading lists</p>
        </div>

        <div className="home-tabs">
          <button 
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ❤️ Favorites ({favorites.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'lists' ? 'active' : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            📚 Reading Lists ({readingLists.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📖 All Books ({favorites.length + getAllBooksFromLists().length})
          </button>
        </div>

        <div className="home-content">
          {activeTab === 'favorites' && (
            <div className="favorites-section">
              {favorites.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💔</div>
                  <h3>No favorites yet</h3>
                  <p>Start adding books to your favorites to see them here!</p>
                  <button 
                    className="search-btn"
                    onClick={() => onNavigate('search')}
                  >
                    Find Books
                  </button>
                </div>
              ) : (
                <div className="books-grid">
                  {favorites.map(book => renderBookCard(book))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'lists' && (
            <div className="lists-section">
              {readingLists.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>No reading lists yet</h3>
                  <p>Create reading lists to organize your books!</p>
                  <button 
                    className="profile-btn"
                    onClick={() => onNavigate('profile')}
                  >
                    Manage Lists
                  </button>
                </div>
              ) : (
                <div className="lists-container">
                  {readingLists.map(list => (
                    <div key={list.id} className="list-card">
                      <div className="list-header">
                        <h3>{list.name}</h3>
                        <span className="book-count">{list.books?.length || 0} books</span>
                      </div>
                      {list.books && list.books.length > 0 ? (
                        <div className="list-books">
                          {list.books.slice(0, 4).map(book => (
                            <div key={book.id} className="mini-book" onClick={() => handleBookClick(book)}>
                              <img 
                                src={book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || defaultImage}
                                alt={book.title}
                                onError={(e) => {
                                  if (e.target.src !== defaultImage) {
                                    e.target.src = defaultImage;
                                  }
                                }}
                              />
                            </div>
                          ))}
                          {list.books.length > 4 && (
                            <div className="more-books">+{list.books.length - 4}</div>
                          )}
                        </div>
                      ) : (
                        <p className="empty-list">No books in this list yet</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="all-books-section">
              {favorites.length === 0 && getAllBooksFromLists().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📖</div>
                  <h3>No books saved yet</h3>
                  <p>Start building your personal library by adding books to favorites or reading lists!</p>
                  <button 
                    className="search-btn"
                    onClick={() => onNavigate('search')}
                  >
                    Discover Books
                  </button>
                </div>
              ) : (
                <div className="books-grid">
                  {favorites.map(book => renderBookCard(book))}
                  {getAllBooksFromLists().map(book => renderBookCard(book, true))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
