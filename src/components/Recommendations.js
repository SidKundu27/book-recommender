import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

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
      )}
    </div>
  );
}

// Possible code for a recomendation popup
{/* <div className="recommendations-overlay">
  <div className="recommendations-popup">
    <button className="close-btn" onClick={handleBookClose}>
      X
    </button>
    <h2>Recommendations</h2>
    <div className="recommendations-list">
      {recommendations.map((book) => (
        <div
          key={book.id}
          className="book"
          onClick={() => handleBookClick(book)}
        >
          <img src={book.imageLinks?.thumbnail} alt={book.title} />
          <h3>{book.title}</h3>
        </div>
      ))}
    </div>
  </div>
</div> */}

export default Recommendations;