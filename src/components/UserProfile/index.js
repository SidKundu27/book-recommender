import React, { useState, useEffect } from 'react';
import './UserProfile.css';

// Define reading list types
const readingListTypes = [
  {
    id: 'want-to-read',
    name: 'Want to Read',
    icon: '📚',
    description: 'Books you plan to read in the future'
  },
  {
    id: 'currently-reading',
    name: 'Currently Reading',
    icon: '📖',
    description: 'Books you are actively reading now'
  },
  {
    id: 'read',
    name: 'Read',
    icon: '✅',
    description: 'Books you have finished reading'
  },
  {
    id: 'dropped',
    name: 'Dropped',
    icon: '❌',
    description: 'Books you started but decided not to finish'
  },
  {
    id: 'on-hiatus',
    name: 'On Hiatus',
    icon: '⏸️',
    description: 'Books you paused and might return to later'
  },
  {
    id: 'favorites',
    name: 'Favorites',
    icon: '⭐',
    description: 'Your most beloved books'
  },
  {
    id: 'custom',
    name: 'Custom List',
    icon: '📝',
    description: 'Create your own custom reading list'
  }
];

const UserProfile = ({ user, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [readingLists, setReadingLists] = useState([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState('custom');

  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch favorites
      const favResponse = await fetch('http://localhost:5000/api/reading-lists/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (favResponse.ok) {
        const favData = await favResponse.json();
        setFavorites(favData.favorites || []);
      }

      // Fetch reading lists
      const listsResponse = await fetch('http://localhost:5000/api/reading-lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (listsResponse.ok) {
        const listsData = await listsResponse.json();
        setReadingLists(listsData.lists || []);
      }

      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/reading-lists/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (bookId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/reading-lists/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(book => book.id !== bookId));
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const removeFromList = async (listId, bookId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/reading-lists/${listId}/books`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });

      if (response.ok) {
        setReadingLists(prev => 
          prev.map(list => 
            list.id === listId 
              ? { ...list, books: list.books.filter(book => book.id !== bookId) }
              : list
          )
        );
      }
    } catch (error) {
      console.error('Error removing from list:', error);
    }
  };

  const createNewList = async () => {
    setShowCreateListModal(true);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const listData = {
        name: newListName,
        type: newListType,
        description: readingListTypes.find(t => t.id === newListType)?.description || ''
      };

      const response = await fetch('http://localhost:5000/api/reading-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(listData)
      });

      if (response.ok) {
        const newList = await response.json();
        setReadingLists(prev => [...prev, newList.list]);
        setShowCreateListModal(false);
        setNewListName('');
        setNewListType('custom');
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2>{user?.username}</h2>
              <p>{user?.email}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Stats Overview */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{stats.favorites || 0}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.lists || 0}</div>
            <div className="stat-label">Reading Lists</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.booksRead || 0}</div>
            <div className="stat-label">Books Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.booksToRead || 0}</div>
            <div className="stat-label">Want to Read</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites ({favorites.length})
          </button>
          <button 
            className={`tab ${activeTab === 'lists' ? 'active' : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            Reading Lists ({readingLists.length})
          </button>
        </div>

        <div className="tab-content">
          {loading ? (
            <div className="loading">Loading your books...</div>
          ) : activeTab === 'favorites' ? (
            <div className="favorites-section">
              {favorites.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>No favorites yet</h3>
                  <p>Start adding books to your favorites to see them here!</p>
                </div>
              ) : (
                <div className="books-grid">
                  {favorites.map(book => (
                    <div key={book.id} className="book-card">
                      <div className="book-cover">
                        {book.imageLinks?.thumbnail ? (
                          <img src={book.imageLinks.thumbnail} alt={book.title} />
                        ) : (
                          <div className="no-cover">{book.title?.[0] || '?'}</div>
                        )}
                      </div>
                      <div className="book-info">
                        <h4>{book.title}</h4>
                        <p>{book.authors?.join(', ') || 'Unknown Author'}</p>
                        <div className="book-meta">
                          {book.averageRating && (
                            <span className="rating">⭐ {book.averageRating}</span>
                          )}
                          {book.publishedDate && (
                            <span className="year">{new Date(book.publishedDate).getFullYear()}</span>
                          )}
                        </div>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromFavorites(book.id)}
                        title="Remove from favorites"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="lists-section">
              <div className="lists-header">
                <h3>Your Reading Lists</h3>
                <button className="create-list-btn" onClick={createNewList}>
                  + Create New List
                </button>
              </div>
              
              {readingLists.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No reading lists yet</h3>
                  <p>Create your first reading list to organize your books!</p>
                </div>
              ) : (
                <div className="lists-container">
                  {readingLists.map(list => (
                    <div key={list.id} className="list-card">
                      <div className="list-header">
                        <h4>{list.name}</h4>
                        <span className="book-count">{list.books?.length || 0} books</span>
                      </div>
                      
                      {list.books && list.books.length > 0 ? (
                        <div className="list-books">
                          {list.books.slice(0, 3).map(book => (
                            <div key={book.id} className="mini-book-card">
                              <div className="mini-book-cover">
                                {book.imageLinks?.thumbnail ? (
                                  <img src={book.imageLinks.thumbnail} alt={book.title} />
                                ) : (
                                  <div className="mini-no-cover">{book.title?.[0] || '?'}</div>
                                )}
                              </div>
                              <div className="mini-book-info">
                                <div className="mini-book-title">{book.title}</div>
                                <div className="mini-book-author">{book.authors?.[0] || 'Unknown'}</div>
                              </div>
                              <button 
                                className="mini-remove-btn"
                                onClick={() => removeFromList(list.id, book.id)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {list.books.length > 3 && (
                            <div className="more-books">
                              +{list.books.length - 3} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="empty-list">
                          <p>No books in this list yet</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create List Modal */}
        {showCreateListModal && (
          <div className="create-list-modal-overlay" onClick={() => setShowCreateListModal(false)}>
            <div className="create-list-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Reading List</h3>
                <button 
                  className="modal-close" 
                  onClick={() => setShowCreateListModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-content">
                <div className="list-types-grid">
                  {readingListTypes.map(type => (
                    <div
                      key={type.id}
                      className={`list-type-option ${newListType === type.id ? 'selected' : ''}`}
                      onClick={() => {
                        setNewListType(type.id);
                        if (type.id !== 'custom') {
                          setNewListName(type.name);
                        } else {
                          setNewListName('');
                        }
                      }}
                    >
                      <div className="type-icon">{type.icon}</div>
                      <div className="type-name">{type.name}</div>
                      <div className="type-description">{type.description}</div>
                    </div>
                  ))}
                </div>

                {(newListType === 'custom' || newListName !== readingListTypes.find(t => t.id === newListType)?.name) && (
                  <div className="custom-name-input">
                    <label>List Name:</label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Enter list name..."
                      autoFocus
                    />
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    className="cancel-btn" 
                    onClick={() => setShowCreateListModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="create-btn" 
                    onClick={handleCreateList}
                    disabled={!newListName.trim()}
                  >
                    Create List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
