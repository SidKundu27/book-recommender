# Book Recommendation App
The Book Recommendation App is a comprehensive web application that helps users discover, organize, and track their reading journey. It provides personalized book recommendations, reading list management, and detailed book information powered by the Google Books API.

## Getting Started
To run this project, you'll need to have Node.js and npm installed on your computer. Follow the steps below to get started:

### Prerequisites
- Node.js (version 22 or higher required)
- npm (version 10 or higher recommended)

> **Important**: This project uses React 19 and Vite 7, which require Node.js v22+. Please ensure you have the latest Node.js version installed.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd book-recommender
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

### Running the Application

**Quick Start (Single command):**
```bash
npm run dev:all
```

**Manual Setup (Separate terminals):**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run server
```

**Accessing the Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

> **Note**: The frontend automatically proxies API calls to the backend server, so you don't need to worry about CORS issues during development.

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
- **Vite**: Fast build tool and development server with HMR (Hot Module Replacement)
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
- **Vite**: Ultra-fast development server with instant HMR
- **npm**: Package management and script running
- **Nodemon**: Backend development server with auto-restart functionality
- **ESBuild**: Fast JavaScript/JSX bundler integrated with Vite

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
├── public/                 # Static assets (favicon, manifest, etc.)
├── src/
│   ├── components/        # React components
│   │   ├── AdvancedSearch/
│   │   ├── Auth/          # Authentication components
│   │   ├── BookDetails/   # Book information display
│   │   ├── BookForm/      # Book search form
│   │   ├── Home/          # Dashboard/home page
│   │   ├── LandingPage/   # Welcome page
│   │   ├── MenuBar/       # Menu bar component
│   │   ├── Navigation/    # Navigation bar
│   │   ├── Recommendation/ # Book recommendations
│   │   ├── SearchResults/ # Search results display
│   │   ├── Settings/      # User settings
│   │   ├── UserProfile/   # User profile and reading lists
│   │   └── Spinner/       # Loading indicators
│   ├── App.jsx            # Main application component
│   ├── App.css            # Global application styles
│   ├── main.jsx           # Application entry point (Vite)
│   └── index.css          # Base CSS styles
├── server/                # Backend Express.js server
│   ├── modules/          # Server modules
│   │   ├── mlRecommendations.js
│   │   ├── readingLists.js
│   │   └── userManagement.js
│   ├── index.js          # Server entry point
│   └── package.json      # Backend dependencies
├── build/                # Production build output (Vite)
├── vite.config.js        # Vite configuration
├── package.json          # Frontend dependencies and scripts
└── README.md             # Project documentation
```

### Key Configuration Files

- **`vite.config.js`**: Vite configuration with React plugin, proxy setup, and build options
- **`package.json`**: Frontend dependencies, scripts, and proxy configuration
- **`server/package.json`**: Backend dependencies and server scripts

### Development Architecture

- **Dual-server setup**: Frontend (Vite) on port 3000, Backend (Express) on port 5000
- **Proxy configuration**: Vite proxy redirects `/api/*` requests to backend server
- **Hot Module Replacement**: Instant updates during development with Vite HMR
- **No routing library**: Navigation handled via state management in `App.jsx`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Build & Deployment

### Production Build
```bash
# Build the frontend for production
npm run build

# The build files will be generated in the 'build' directory
# You can preview the production build locally:
npm run preview
```

### Available Scripts

**Frontend Scripts:**
- `npm run dev` - Start Vite development server
- `npm start` - Alias for `npm run dev`
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run dev:all` - Start both frontend and backend servers concurrently
- `npm run server` - Start only the backend server
- `npm run install:all` - Install dependencies for both frontend and backend

**Backend Scripts:**
- `cd server && npm run dev` - Start development server with auto-restart
- `cd server && npm start` - Start production server

## Troubleshooting

### Common Issues

**Node.js version compatibility:**
```bash
# Check your Node.js version
node --version

# Should be v22.0.0 or higher
# If not, download and install the latest LTS version from nodejs.org
```

**Port already in use:**
```bash
# If port 3000 or 5000 is occupied, you can:
# 1. Kill the process using the port
# 2. Or modify the port in vite.config.js (frontend) or server/index.js (backend)
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Do the same for the server directory
cd server
rm -rf node_modules package-lock.json
npm install
```

**API calls failing:**
- Ensure both frontend and backend servers are running
- Check that the proxy configuration in `vite.config.js` is correct
- Verify the backend server is running on port 5000

**Vite configuration issues:**
- Check `vite.config.js` for correct plugin configuration
- Ensure JSX files have the correct extensions (.jsx)
- Clear Vite cache: `rm -rf node_modules/.vite`

## License

This project is open source and available under the [MIT License](LICENSE).
