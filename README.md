# Book Recommendation App
The Book Recommendation App is a simple web application designed to provide personalized book recommendations based genres on previously read books. It aims to help users discover new books and enhance their reading experience.

## Getting Started
To run this project, you'll need to have Node.js and npm installed on your computer. Follow the steps below to get started:

1. Clone this repository to your local machine
2. Open a terminal and navigate to the project directory
3. Run the following command to install the required dependencies:

`npm install`

4. Start the application by running the following command:

`npm run start`

5. In a separate terminal window, navigate to the 'server' folder by running the following command:

`cd server`

6. Run the following command to start the server:

`npm run dev`

7. Open your web browser and go to http://localhost:3000 to view the app.

## Usage
To use the app, follow these steps:

1. Open your web browser and go to `http://localhost:3000`
2. On the book entry page, enter the details of a book you're interested in, such as the title or author.
3. Click on the "Find Recommendations" button.
4. After clicking the "Find Recommendations" button, you will be redirected to the book details page.
5. On the book details page, you will see the information about the book you entered, including the title, author, description, and cover image.
6. Click on the "See Recommendations" button to view a list of recommended books based on the book you entered.
7. Click on a recommended book to view its detailed information.
8. On the book details popup, you will find the book's description, reviews, and other relevant details.

## Backend

This project uses Express.js, a popular web framework for Node.js, to handle the backend functionality. Express.js makes it easy to build scalable web applications and provides a robust set of features for building RESTful APIs.

## Google Books API

This project utilizes the Google Books API to fetch book information and recommendations. The Google Books API is a powerful tool that allows you to search for books, retrieve book details, and gather recommendations based on specific criteria.
