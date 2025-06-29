# Book Recommendation App
The Book Recommendation App is a comprehensive web application that helps users discover, organize, and track their reading journey. It provides personalized book recommendations, reading list management, and detailed book information powered by the Google Books API.

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

## Features

- **Advanced Book Search**: Search for books by title, author, ISBN, or keywords
- **Detailed Book Information**: View comprehensive book details including descriptions, ratings, publication info, and cover images
- **Personal Reading Lists**: Create and manage custom reading lists with different categories:
  - Want to Read 📚
  - Currently Reading 📖
  - Read ✅
  - Dropped ❌
  - On Hiatus ⏸️
  - Favorites ⭐
  - Custom Lists 📝
- **Smart Recommendations**: Get AI-powered book recommendations based on your reading preferences
- **User Authentication**: Secure user accounts with personalized data
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Usage

### Getting Started
1. **Sign Up/Login**: Create an account or sign in to access personalized features
2. **Search for Books**: Use the search functionality to find books by:
   - Title
   - Author name
   - ISBN
   - Keywords or genres

### Discovering Books
1. Navigate to the **Search** page from the navigation bar
2. Enter your search criteria in the search field
3. Browse through the search results
4. Click on any book to view detailed information

### Managing Your Library
1. **View Book Details**: Click on any book to see:
   - Full description and ratings
   - Author information and publication details
   - Genre tags and metadata
   - Preview and purchase links
2. **Add to Lists**: While viewing a book, you can:
   - Add to favorites ❤️
   - Add to reading lists 📚
   - Get personalized recommendations 🎯

### Reading Lists Management
1. **Access Your Profile**: Click on your username or the "My Books" button
2. **View Your Collections**: Browse through your different reading lists
3. **Organize Your Books**: Move books between different status categories
4. **Create Custom Lists**: Add your own personalized reading lists

### Getting Recommendations
1. From any book details page, click "Get Recommendations"
2. The app will suggest similar books based on:
   - Genre preferences
   - Author similarities
   - Your reading history
   - Popular books in similar categories

## Technology Stack

### Frontend
- **React.js**: Modern JavaScript library for building user interfaces
- **CSS3**: Custom styling with responsive design and modern animations
- **DOMPurify**: Secure HTML sanitization for book descriptions

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Fast, minimalist web framework for building RESTful APIs
- **JWT Authentication**: Secure user authentication and session management
- **CORS**: Cross-origin resource sharing for frontend-backend communication

### External APIs
- **Google Books API**: Comprehensive book information, search, and metadata
- **Dog CEO API**: Placeholder images for books without covers (with distinctive styling)

### Development Tools
- **npm**: Package management
- **Nodemon**: Development server with auto-restart functionality

## API Endpoints

The backend provides several key endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/reading-lists` - Fetch user's reading lists
- `POST /api/reading-lists` - Create new reading list
- `POST /api/reading-lists/:id/books` - Add book to reading list
- `DELETE /api/reading-lists/:id/books` - Remove book from reading list
- `GET /api/reading-lists/favorites` - Get user's favorite books
- `POST /api/reading-lists/favorites` - Add book to favorites
- `DELETE /api/reading-lists/favorites` - Remove book from favorites
- `GET /api/reading-lists/stats` - Get user's reading statistics

## Project Structure

```
book-recommender/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── AdvancedSearch/
│   │   ├── Auth/          # Authentication components
│   │   ├── BookDetails/   # Book information display
│   │   ├── BookForm/      # Book search form
│   │   ├── Home/          # Dashboard/home page
│   │   ├── LandingPage/   # Welcome page
│   │   ├── Navigation/    # Navigation bar
│   │   ├── Recommendation/ # Book recommendations
│   │   ├── SearchResults/ # Search results display
│   │   ├── Settings/      # User settings
│   │   ├── UserProfile/   # User profile and reading lists
│   │   └── Spinner/       # Loading indicators
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
├── server/                # Backend Express.js server
│   ├── modules/          # Server modules
│   │   ├── mlRecommendations.js
│   │   ├── readingLists.js
│   │   └── userManagement.js
│   └── index.js          # Server entry point
└── package.json          # Dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
