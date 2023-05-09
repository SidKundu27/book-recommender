import React, { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';

function BookRecommender() {
  const [bookTitle, setBookTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const handleFormSubmit = (event) => {
    event.preventDefault();
    axios
      .get('https://www.googleapis.com/books/v1/volumes', {
        params: {
          q: `intitle:${bookTitle}`,
        },
      })
      .then((response) => {
        const book = response.data.items[0].volumeInfo;
        const genre =
          book.categories && book.categories.length > 0
            ? book.categories[0]
            : 'Unknown';
        setGenre(genre);
        axios
          .get('https://www.googleapis.com/books/v1/volumes', {
            params: {
              q: `subject:${genre}`,
              maxResults: 5,
            },
          })
          .then((response) => {
            const items = response.data.items;
            const bookIds = items.map((item) => item.id);
            const bookDetailsRequests = bookIds.map((id) =>
              axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`)
            );
            axios.all(bookDetailsRequests).then(
              axios.spread((...responses) => {
                const recommendations = responses.map(
                  (response) => response.data.volumeInfo
                );
                setRecommendations(recommendations);
              })
            );
          });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleInputChange = (event) => {
    setBookTitle(event.target.value);
  };


  const [selectedBook, setSelectedBook] = useState(null);

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleBookClose = () => {
    setSelectedBook(null);
  };

  return (
    <div className="App">
      <form className='form' onSubmit={handleFormSubmit}>
        <label htmlFor="bookTitle">Enter a book title:</label>
        <input
          id="bookTitle"
          type="text"
          value={bookTitle}
          onChange={handleInputChange}
        />
        <button type="submit">Find Recommendations</button>
      </form>
      {genre && (
        <div>
          <h2>Genre: {genre}</h2>
          <h2> </h2>
          <div className="book-list">
            {recommendations.map((book) => (
              <div
                key={book.id}
                className={`book ${selectedBook?.id === book.id ? 'active' : ''}`}
                onClick={() => handleBookClick(book)}
              >
                <img src={book.imageLinks?.thumbnail} alt={book.title} />
                <h3>{book.title}</h3>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedBook && (
        <div className="book-detail">
          <button className="close-btn" onClick={handleBookClose}>
            X
          </button>
          <h2>{selectedBook.title}</h2>
          <img src={selectedBook.image_url} alt={selectedBook.title} />
          {selectedBook.description && (
            <div
              className="description"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selectedBook.description),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default BookRecommender;