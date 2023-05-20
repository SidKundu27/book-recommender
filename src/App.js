import React, {useEffect, useState} from 'react';
import './App.css';
import BookForm from './components/BookForm';
import BookDetails from './components/BookDetails';
import Recommendations from './components/Recommendations';

function App() {
  const [bookDetails, setBookDetails] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [genre, setGenre] = useState('');

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
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/getBook");
        if (response.status === 200) {
          const data = await response.json();
          setBookDetails(data.book);
          setBookTitle(data.book.title)
          setGenre(data.genre)
        }
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
    <div>
      <BookForm
        bookTitle={bookTitle}
        handleInputChange={handleInputChange}
        handleFormSubmit={handleFormSubmit}
      />
      {bookDetails &&
        <div>
          <BookDetails 
            bookDetails={bookDetails}
          />
          <Recommendations
            genre={genre}
          />
        </div>
      }

    </div>
  );
}

export default App;
