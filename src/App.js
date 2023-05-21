import React, {useEffect, useState} from 'react';
import './App.css';
import BookForm from './components/BookForm';
import BookDetails from './components/BookDetails'
import Recommendations from './components/Recommendation';
import MenuBar from './components/MenuBar';

function App() {
  const [bookDetails, setBookDetails] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [activeButton, setActiveButton] = useState('');

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch("/api/findBook", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookTitle: bookTitle }),
    })

    if (response.status === 200) {
      const responseJSON = await response.json();
      setBookDetails(responseJSON.book);
      setGenre(responseJSON.genre);
      setActiveButton('bookDetails')
    }
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
        // For Consistant Loading
        setActiveButton(value)
      } catch (error) {
        console.log(error)
      }
    };
  
    fetchData();
  }, [])

  const handleInputChange = (event) => {
    setBookTitle(event.target.value);
  };
  
  return (
    <div className='App'>
      <MenuBar
        activeButton={activeButton}
        setActiveButton={setActiveButton}
        bookSelected={!bookDetails}
      />
      {activeButton === "newBook" &&
        <BookForm
          bookTitle={bookTitle}
          handleInputChange={handleInputChange}
          handleFormSubmit={handleFormSubmit}
        />
      }
      {activeButton === "bookDetails" &&
        <BookDetails 
          bookDetails={bookDetails}
          setActiveButton={setActiveButton}
        />
      }
      {activeButton === "recommendations" &&
        // {viewRecommendations &&
          <Recommendations
            genre={genre}
          />
        // }
      }
    </div>
  );
}

export default App;
