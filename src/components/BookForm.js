import React from 'react';

function BookForm({
    bookTitle,
    handleInputChange,
    handleFormSubmit,
}) {
  return (
    <div className="BookForm-Container">
      <form className='form' onSubmit={handleFormSubmit}>
        <label htmlFor="bookTitle">Enter a book title:</label>
        <input
          id="bookTitle"
          type="text"
          value={bookTitle}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Find Recommendations</button>
      </form>
    </div>
  );
}

export default BookForm;
