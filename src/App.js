import React, {useEffect, useState} from 'react';
import './App.css';
import BookForm from './components/BookForm';
import BookDetails from './components/BookDetails'
import Recommendations from './components/Recommendation';
import MenuBar from './components/MenuBar';
import LandingPage from './components/LandingPage';
import AdvancedSearch from './components/AdvancedSearch';
import SearchResults from './components/SearchResults';

function App() {
  const [bookDetails, setBookDetails] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [activeButton, setActiveButton] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [isSearching, setIsSearching] = useState(false);

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
  
  return (
    <div className={`App ${bookDetails ? 'has-book' : ''}`}>
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
        />
      }
      {activeButton === "recommendations" &&
        <Recommendations
          genre={genre}
          setActiveButton={setActiveButton}
        />
      }
    </div>
  );
}

export default App;
