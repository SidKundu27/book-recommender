const express = require('express');
const router = express.Router();
const { authenticateUser, userProfiles } = require('./userManagement');

// Apply authentication to all routes
router.use(authenticateUser);

// Helper function to generate list ID
const generateListId = () => {
  return 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
};

// Get user's favorite books
router.get('/favorites', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  res.json(profile.favoriteBooks);
});

// Add book to favorites
router.post('/favorites', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { book } = req.body;
  
  // Check if already in favorites
  const existingIndex = profile.favoriteBooks.findIndex(fav => fav.id === book.id);
  if (existingIndex !== -1) {
    return res.status(409).json({ error: 'Book already in favorites' });
  }
  
  profile.favoriteBooks.push({
    ...book,
    addedAt: new Date()
  });
  
  res.json({ message: 'Book added to favorites', favorites: profile.favoriteBooks });
});

// Remove book from favorites  
router.delete('/favorites', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { bookId } = req.body;
  
  const initialLength = profile.favoriteBooks.length;
  profile.favoriteBooks = profile.favoriteBooks.filter(book => book.id !== bookId);
  
  if (profile.favoriteBooks.length === initialLength) {
    return res.status(404).json({ error: 'Book not found in favorites' });
  }
  
  res.json({ message: 'Book removed from favorites', favorites: profile.favoriteBooks });
});

// Get user's reading lists
router.get('/', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  res.json({ lists: profile.readingLists });
});

// Create new reading list
router.post('/', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { name, description, type } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'List name is required' });
  }
  
  // Check if list name already exists
  const existingList = profile.readingLists.find(list => list.name === name);
  if (existingList) {
    return res.status(409).json({ error: 'List with this name already exists' });
  }
  
  const newList = {
    id: generateListId(),
    name,
    description: description || '',
    type: type || 'custom',
    books: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  profile.readingLists.push(newList);
  
  res.status(201).json({ message: 'Reading list created', list: newList });
});

// Update reading list
router.patch('/:listId', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { listId } = req.params;
  const { name, description } = req.body;
  
  const list = profile.readingLists.find(l => l.id === listId);
  if (!list) {
    return res.status(404).json({ error: 'Reading list not found' });
  }
  
  if (name) list.name = name;
  if (description !== undefined) list.description = description;
  list.updatedAt = new Date();
  
  res.json({ message: 'Reading list updated', list });
});

// Delete reading list
router.delete('/:listId', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { listId } = req.params;
  
  // Don't allow deletion of default list
  if (listId === 'default') {
    return res.status(400).json({ error: 'Cannot delete default reading list' });
  }
  
  const initialLength = profile.readingLists.length;
  profile.readingLists = profile.readingLists.filter(list => list.id !== listId);
  
  if (profile.readingLists.length === initialLength) {
    return res.status(404).json({ error: 'Reading list not found' });
  }
  
  res.json({ message: 'Reading list deleted' });
});

// Add book to reading list
router.post('/:listId/books', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { listId } = req.params;
  const { book } = req.body;
  
  const list = profile.readingLists.find(l => l.id === listId);
  if (!list) {
    return res.status(404).json({ error: 'Reading list not found' });
  }
  
  // Check if book already in list
  const existingBook = list.books.find(b => b.id === book.id);
  if (existingBook) {
    return res.status(409).json({ error: 'Book already in this list' });
  }
  
  list.books.push({
    ...book,
    addedAt: new Date(),
    status: 'to-read' // to-read, reading, read
  });
  
  list.updatedAt = new Date();
  
  res.json({ message: 'Book added to reading list', list });
});

// Remove book from reading list
router.delete('/:listId/books/:bookId', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { listId, bookId } = req.params;
  
  const list = profile.readingLists.find(l => l.id === listId);
  if (!list) {
    return res.status(404).json({ error: 'Reading list not found' });
  }
  
  const initialLength = list.books.length;
  list.books = list.books.filter(book => book.id !== bookId);
  
  if (list.books.length === initialLength) {
    return res.status(404).json({ error: 'Book not found in reading list' });
  }
  
  list.updatedAt = new Date();
  
  res.json({ message: 'Book removed from reading list', list });
});

// Update book status in reading list
router.patch('/:listId/books/:bookId', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { listId, bookId } = req.params;
  const { status } = req.body;
  
  if (!['to-read', 'reading', 'read'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const list = profile.readingLists.find(l => l.id === listId);
  if (!list) {
    return res.status(404).json({ error: 'Reading list not found' });
  }
  
  const book = list.books.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found in reading list' });
  }
  
  book.status = status;
  if (status === 'read') {
    book.completedAt = new Date();
  }
  
  list.updatedAt = new Date();
  
  res.json({ message: 'Book status updated', book });
});

// Get reading statistics
router.get('/stats', (req, res) => {
  const profile = userProfiles[req.user.id];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const allBooks = profile.readingLists.flatMap(list => list.books);
  const booksRead = allBooks.filter(book => book.status === 'read').length;
  const booksReading = allBooks.filter(book => book.status === 'reading').length;
  const booksToRead = allBooks.filter(book => book.status === 'to-read').length;
  
  const genreStats = {};
  allBooks.forEach(book => {
    if (book.categories) {
      book.categories.forEach(genre => {
        genreStats[genre] = (genreStats[genre] || 0) + 1;
      });
    }
  });
  
  const topGenres = Object.entries(genreStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));
  
  res.json({
    totalBooks: allBooks.length,
    booksRead,
    booksReading,
    booksToRead,
    favorites: profile.favoriteBooks.length,
    lists: profile.readingLists.length,
    topGenres
  });
});

module.exports = router;
