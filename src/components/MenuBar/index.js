import React from 'react';
import './MenuBar.css'

const MenuBar = ({
  activeButton,
  setActiveButton,
  bookSelected
}) => {

  const handleClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  return (
    <div className="menu-container">
      <button
        className={`menu-button ${activeButton === 'newBook' ? 'active' : ''}`}
        onClick={() => handleClick('newBook')}
      >
        Enter a New Book
      </button>
      <button
        className={`menu-button ${activeButton === 'bookDetails' ? 'active' : ''}`}
        onClick={() => handleClick('bookDetails')}
        disabled={bookSelected}
      >
        Book Details
      </button>
      <button
        className={`menu-button ${activeButton === 'recommendations' ? 'active' : ''}`}
        onClick={() => handleClick('recommendations')}
        disabled={bookSelected}
      >
        Recommendations
      </button>
    </div>
  );
};

export default MenuBar;
