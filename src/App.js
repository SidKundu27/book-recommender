import React, {useEffect, useState} from 'react';
import './App.css';
import BookDetails from './components/BookDetails'
import Recommendations from './components/Recommendation';
import LandingPage from './components/LandingPage';
import AdvancedSearch from './components/AdvancedSearch';
import SearchResults from './components/SearchResults';
import Auth from './components/Auth';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';
import Navigation from './components/Navigation';

function App() {
  const [bookDetails, setBookDetails] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [activeButton, setActiveButton] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [isSearching, setIsSearching] = useState(false);
  
  // User authentication state
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userPreferences, setUserPreferences] = useState({ useML: false });

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSearching(true);

    try {
      const response = await fetch("/api/findBook", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookTitle: bookTitle }),
      });

      if (response.status === 200) {
        const responseJSON = await response.json();
        setBookDetails(responseJSON.book);
        setGenre(responseJSON.genre);
        setActiveButton('bookDetails');
        setSearchResults(null); // Clear any previous search results
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearch = async (searchData) => {
    setIsSearching(true);
    setSearchQuery(searchData);
    setSearchType(searchData.type);
    
    try {
      const response = await fetch("/api/searchBooks", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchData),
      });

      if (response.status === 200) {
        const responseJSON = await response.json();
        setSearchResults(responseJSON.books);
        setActiveButton('searchResults');
        setBookDetails(null); // Clear any previous book details
      } else {
        setSearchResults([]);
        setActiveButton('searchResults');
      }
    } catch (error) {
      console.error('Advanced search error:', error);
      setSearchResults([]);
      setActiveButton('searchResults');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookSelect = (book) => {
    setBookDetails(book);
    setGenre(book.categories && book.categories.length > 0 ? book.categories[0] : 'Unknown');
    setActiveButton('bookDetails');
  };

  const handleNewSearch = () => {
    setActiveButton('advancedSearch');
    setSearchResults(null);
    setBookDetails(null);
    setBookTitle('');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getBook");
        let value = "newBook"
        if (response.status === 200) {
          const data = await response.json();
          setBookDetails(data.book);
          setBookTitle(data.book.title)
          setGenre(data.genre)
          if (data.book){
            value = "bookDetails"
          }
        }
        // For Consistent Loading - default to advanced search for better UX
        setActiveButton(value === "newBook" ? "advancedSearch" : value);
      } catch (error) {
        console.log(error)
        setActiveButton("advancedSearch");
      }
    };
  
    fetchData();
  }, [])

  const handleInputChange = (event) => {
    setBookTitle(event.target.value);
  };

  // Authentication functions
  const handleLogin = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
    setShowAuth(false);
    fetchUserPreferences(userData.id);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setAuthToken(null);
    setUserPreferences({ useML: false });
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  };

  const fetchUserPreferences = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recommendation-settings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAuthToken(savedToken);
        fetchUserPreferences(userData.id);
      } catch (error) {
        console.error('Error restoring user session:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <div className={`App ${bookDetails ? 'has-book' : ''}`}>
      <Navigation
        user={user}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        onShowSettings={() => setShowSettings(true)}
        onShowProfile={() => setShowProfile(true)}
        onNewSearch={handleNewSearch}
        currentView={activeButton}
      />
      
      <div className="main-content">
        {activeButton === "newBook" &&
          <LandingPage
            bookTitle={bookTitle}
            handleInputChange={handleInputChange}
            handleFormSubmit={handleFormSubmit}
          />
        }
        {activeButton === "advancedSearch" &&
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            isSearching={isSearching}
          />
        }
        {activeButton === "searchResults" &&
          <SearchResults
            searchResults={searchResults}
            searchQuery={searchQuery}
            searchType={searchType}
            onBookSelect={handleBookSelect}
            onNewSearch={handleNewSearch}
            isLoading={isSearching}
          />
        }
        {activeButton === "bookDetails" &&
          <BookDetails 
            bookDetails={bookDetails}
            setActiveButton={setActiveButton}
            user={user}
            useMLRecommendations={userPreferences.useML}
          />
        }
        {activeButton === "recommendations" &&
          <Recommendations
            genre={genre}
            setActiveButton={setActiveButton}
            user={user}
            useMLRecommendations={userPreferences.useML}
          />
        }
      </div>

      {/* Modals */}
      <Auth
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLogin={handleLogin}
      />
      
      <Settings
        user={user}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      <UserProfile
        user={user}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}

export default App;
