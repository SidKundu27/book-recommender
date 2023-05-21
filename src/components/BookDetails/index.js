import React from 'react';
import DOMPurify from 'dompurify';
import './BookDetails.css';

function BookDetails({
  bookDetails,
  setActiveButton
}) {

  return (
    <div className="BookDetails-Container">
      <h2>Title: {bookDetails?.title}</h2>
      <div className='BookDetails-Content'>
        <img src={bookDetails?.imageLinks?.thumbnail} alt={bookDetails?.title} />
        <div className='BookDetails-Details'>
          <div>Author: {bookDetails?.authors && bookDetails.authors.join(', ')}</div>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(bookDetails?.description),
            }}
          />
          <button onClick={() => setActiveButton('recommendations')}>See Recommendations</button>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;
