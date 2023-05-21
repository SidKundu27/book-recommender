import React, { useState, useEffect } from 'react';
import Spinner from '../Spinner';
import DOMPurify from 'dompurify';
import './Recommendation.css'

function Recommendations({
  genre
}) {
  const [isloading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/getBookRecommendation");
        if (response.status === 200) {
          const data = await response.json();
          setRecommendations(data);
        }
      } catch (error) {
        console.log(error)
      }
      setIsLoading(false);
    };
  
    fetchData();
  }, [genre])

  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleBookClose = () => {
    setSelectedBook(null);
  };

  return (
    <div className="Recommendations">
      {isloading ? (
        <div>
          <Spinner/>
        </div>
      ):(
        <div>
          {genre && (
            <div>
              <h2>Genre: {genre}</h2>
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
              <div className="content">
                <h2>{selectedBook.title}</h2>
                <img src={selectedBook.imageLinks?.thumbnail} alt={selectedBook.title} />
                {selectedBook.description && (
                  <div
                    className="description"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedBook.description),
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Recommendations;