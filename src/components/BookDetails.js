import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

function BookDetails({
  bookDetails
}) {

  const handleShowRecommendations = () => {
    // Send to Recommendations Page
  }

  return (
    <div className="BookDetails-Container">
      <div>
        <h2>Title: {bookDetails?.title}</h2>
        <p>Author: {bookDetails?.authors && bookDetails.authors.join(', ')}</p>
        <img src={bookDetails?.imageLinks?.thumbnail} alt={bookDetails?.title} />
        <p>Description: {bookDetails?.description}</p>
        <button onClick={handleShowRecommendations}>See Recommendations</button>
      </div>
    </div>
  );
}

export default BookDetails;
