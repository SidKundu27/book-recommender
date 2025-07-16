import React, {useEffect, useState, useCallback} from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import BookDetails from './components/BookDetails'
import Recommendations from './components/Recommendation';
import AdvancedSearch from './components/AdvancedSearch';
import SearchResults from './components/SearchResults';
import Auth from './components/Auth';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';
import Navigation from './components/Navigation';
import Home from './components/Home';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [bookDetails, setBookDetails] = useState(null);
  const [genre, setGenre] = useState('');
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

  // Get current view from URL
  const getCurrentView = useCallback(() => {
    const path = location.pathname;
    if (path === '/') return user ? 'home' : 'advancedSearch';
    if (path === '/home') return 'home';
    if (path === '/search') return 'advancedSearch';
    if (path === '/search-results') return 'searchResults';
    if (path.startsWith('/book/')) return 'bookDetails';
    if (path === '/recommendations') return 'recommendations';
    return 'advancedSearch';
  }, [location.pathname, user]);

  const [activeButton, setActiveButton] = useState(getCurrentView());

  // Update activeButton when route changes
  useEffect(() => {
    setActiveButton(getCurrentView());
  }, [getCurrentView]);

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
        navigate('/search-results');
        setBookDetails(null); // Clear any previous book details
      } else {
        setSearchResults([]);
        navigate('/search-results');
      }
    } catch (error) {
      console.error('Advanced search error:', error);
      setSearchResults([]);
      navigate('/search-results');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookSelect = (book) => {
    setBookDetails(book);
    setGenre(book.categories && book.categories.length > 0 ? book.categories[0] : 'Unknown');
    navigate(`/book/${book.id}`);
  };

  const handleNewSearch = () => {
    navigate('/search');
    setSearchResults(null);
    setBookDetails(null);
  };

  const handleHomeNavigation = () => {
    navigate('/home');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getBook");
        let targetRoute = "/search"; // Default to search
        if (response.status === 200) {
          const data = await response.json();
          setBookDetails(data.book);
          setGenre(data.genre);
          if (data.book) {
            targetRoute = `/book/${data.book.id}`;
          }
        }
        
        // Check if user is logged in and set appropriate default route
        const savedUser = localStorage.getItem('user');
        if (savedUser && targetRoute === "/search") {
          targetRoute = "/home"; // Go to home if user is logged in and no specific book
        }
        
        // Only navigate if we're on the root path
        if (location.pathname === '/') {
          navigate(targetRoute);
        }
      } catch (error) {
        console.log(error);
        // If user is logged in, go to home, otherwise search
        const savedUser = localStorage.getItem('user');
        if (location.pathname === '/') {
          navigate(savedUser ? "/home" : "/search");
        }
      }
    };
  
    fetchData();
  }, [navigate, location.pathname]);

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
        console.log('🎯 User preferences loaded:', data);
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

  const goBack = () => {
    navigate(-1); // Use browser's back functionality
  };

  return (
    <div className={`App ${bookDetails ? 'has-book' : ''}`}>
      <Navigation
        user={user}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        onShowSettings={() => setShowSettings(true)}
        onShowProfile={() => setShowProfile(true)}
        onNewSearch={handleNewSearch}
        onHome={handleHomeNavigation}
        currentView={activeButton}
      />
      
      <div className="main-content">
        <Routes>
          <Route path="/" element={
            user ? (
              <Home
                user={user}
                onBookSelect={handleBookSelect}
                onNavigate={(view) => {
                  if (view === 'login') setShowAuth(true);
                  else if (view === 'profile') setShowProfile(true);
                  else navigate(`/${view}`);
                }}
              />
            ) : (
              <AdvancedSearch
                onSearch={handleAdvancedSearch}
                isSearching={isSearching}
              />
            )
          } />
          
          <Route path="/home" element={
            <Home
              user={user}
              onBookSelect={handleBookSelect}
              onNavigate={(view) => {
                if (view === 'login') setShowAuth(true);
                else if (view === 'profile') setShowProfile(true);
                else navigate(`/${view}`);
              }}
            />
          } />
          
          <Route path="/search" element={
            <AdvancedSearch
              onSearch={handleAdvancedSearch}
              isSearching={isSearching}
            />
          } />
          
          <Route path="/search-results" element={
            <SearchResults
              searchResults={searchResults}
              searchQuery={searchQuery}
              searchType={searchType}
              onBookSelect={handleBookSelect}
              onNewSearch={handleNewSearch}
              isLoading={isSearching}
            />
          } />
          
          <Route path="/book/:id" element={
            <BookDetails 
              bookDetails={bookDetails}
              setActiveButton={(view) => navigate(`/${view}`)}
              goBack={goBack}
              user={user}
              useMLRecommendations={userPreferences.useML}
            />
          } />
          
          <Route path="/recommendations" element={
            <Recommendations
              genre={genre}
              setActiveButton={(view) => navigate(`/${view}`)}
              user={user}
              useMLRecommendations={userPreferences.useML}
              onBookSelect={handleBookSelect}
            />
          } />
        </Routes>
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
        onPreferencesChange={() => user && fetchUserPreferences(user.id)}
      />
      
      <UserProfile
        user={user}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
