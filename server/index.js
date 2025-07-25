const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const cors = require('cors');

// Import backend modules
const { router: userManagement, userProfiles } = require('./modules/userManagement');
const readingLists = require('./modules/readingLists');
// const { router: mlRecommendations } = require('./modules/mlRecommendations');
const BasicMLRecommendationEngine = require('./modules/mlRecommendations');

const app = express()

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true
}));

let book = [];
let genre = "";
let recommendations = []
let searchHistory = []; // For future ML features
let userPreferences = {}; // For future ML features

// Initialize ML engine
const mlEngine = new BasicMLRecommendationEngine();

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Integrate backend modules
app.use('/api/users', userManagement);
app.use('/api/reading-lists', readingLists);
// app.use('/api/ml', mlRecommendations);

// Helper function to build Google Books API query
const buildGoogleBooksQuery = (searchData) => {
	const { type, query, filters } = searchData;
	
	switch (type) {
		case 'title':
			return `intitle:${query}`;
		case 'author':
			return `inauthor:${query}`;
		case 'isbn':
			return `isbn:${query}`;
		case 'genre':
			return `subject:${query}`;
		case 'advanced':
			let queryParts = [];
			if (filters.title) queryParts.push(`intitle:${filters.title}`);
			if (filters.author) queryParts.push(`inauthor:${filters.author}`);
			if (filters.genre) queryParts.push(`subject:${filters.genre}`);
			if (filters.publishedYear) queryParts.push(`publishedDate:${filters.publishedYear}`);
			return queryParts.join('+');
		default:
			return query;
	}
};

// Helper function to enhance book data
const enhanceBookData = (book, bookId = null) => {
	if (!book) return null;
	
	return {
		// Ensure we always have an ID
		id: bookId || book.id || `book_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
		...book,
		// Add computed fields for future ML features
		popularityScore: (book.ratingsCount || 0) * (book.averageRating || 0),
		ageCategory: categorizeByAge(book.publishedDate),
		wordCount: estimateWordCount(book.pageCount),
		complexityScore: calculateComplexityScore(book)
	};
};

const categorizeByAge = (publishedDate) => {
	if (!publishedDate) return 'unknown';
	const year = new Date(publishedDate).getFullYear();
	const currentYear = new Date().getFullYear();
	const age = currentYear - year;
	
	if (age <= 2) return 'new';
	if (age <= 10) return 'recent';
	if (age <= 25) return 'modern';
	if (age <= 50) return 'classic';
	return 'vintage';
};

const estimateWordCount = (pageCount) => {
	if (!pageCount) return 0;
	// Average 250-300 words per page
	return pageCount * 275;
};

const calculateComplexityScore = (book) => {
	let score = 0;
	
	// Page count factor (longer books generally more complex)
	if (book.pageCount) {
		if (book.pageCount > 500) score += 3;
		else if (book.pageCount > 300) score += 2;
		else if (book.pageCount > 150) score += 1;
	}
	
	// Genre complexity
	const complexGenres = ['philosophy', 'science', 'academic', 'technical'];
	if (book.categories) {
		const genres = book.categories.join(' ').toLowerCase();
		if (complexGenres.some(genre => genres.includes(genre))) {
			score += 2;
		}
	}
	
	// Rating factor (highly rated books might be more accessible)
	if (book.averageRating && book.averageRating > 4.0) {
		score += 1;
	}
	
	return Math.min(score, 5); // Cap at 5
};

// Store search for ML analysis (future feature)
const recordSearch = (searchData, results) => {
	searchHistory.push({
		timestamp: new Date(),
		searchData,
		resultCount: results.length,
		searchSuccess: results.length > 0
	});
	
	// Keep only last 1000 searches for memory management
	if (searchHistory.length > 1000) {
		searchHistory = searchHistory.slice(-1000);
	}
};

app.get("/api/getBook", (req, res) => {
	res.status(200)
	if (genre === "") {
		res.status(204)
	}
	res.send({ book, genre })
})

// Enhanced search endpoint
app.post("/api/searchBooks", (req, res) => {
	const searchData = req.body;
	const googleQuery = buildGoogleBooksQuery(searchData);
	
	if (!googleQuery) {
		return res.status(400).send({ error: "Invalid search parameters" });
	}
	
	const params = {
		q: googleQuery,
		maxResults: 20, // Increased for better search results
		orderBy: 'relevance'
	};
	
	// Add language filter for advanced search
	if (searchData.type === 'advanced' && searchData.filters.language) {
		params.langRestrict = searchData.filters.language;
	}
	
	axios
		.get('https://www.googleapis.com/books/v1/volumes', { params })
		.then(async (response) => {
			if (!response.data.items) {
				recordSearch(searchData, []);
				return res.status(404).send({ error: "No books found" });
			}
			
			// Get detailed information for each book
			const bookDetailsRequests = response.data.items.map((item) =>
				axios.get(`https://www.googleapis.com/books/v1/volumes/${item.id}`)
					.then(detailResponse => enhanceBookData(detailResponse.data.volumeInfo, item.id))
					.catch(error => {
						console.error(`Error fetching details for book ${item.id}:`, error);
						return enhanceBookData(item.volumeInfo, item.id);
					})
			);
			
			try {
				const results = await Promise.all(bookDetailsRequests);
				recordSearch(searchData, results);
				
				res.status(200).send({
					books: results,
					searchData,
					totalResults: response.data.totalItems || results.length
				});
			} catch (error) {
				console.error('Error processing book details:', error);
				res.status(500).send({ error: "Error processing search results" });
			}
		})
		.catch((error) => {
			console.error('Search error:', error);
			recordSearch(searchData, []);
			res.status(500).send({ error: "Search service unavailable" });
		});
});

// Original findBook endpoint (for backward compatibility)
app.post("/api/findBook", (req, res) => {
	const bookTitle = req.body.bookTitle
	axios
		.get('https://www.googleapis.com/books/v1/volumes', {
			params: {
				q: `intitle:${bookTitle}`,
				maxResults: 1,
			},
		})
		.then(async (response) => {
			if (!response.data.items) {
				return res.status(404).send({ error: "Book not found" });
			}
			
			// Calls another api to get html tags (as google api does not give them without the id paramater)
			const bookDetailsRequests = await axios.get(`https://www.googleapis.com/books/v1/volumes/${response.data.items[0].id}`)
			book = enhanceBookData(bookDetailsRequests.data.volumeInfo, response.data.items[0].id);
			genre =
				book.categories && book.categories.length > 0
					? book.categories[0]
					: 'Unknown';
			res.status(200).send({
				book: book,
				genre: genre,
			});
		})
		.catch((error) => {
			console.error('Find book error:', error);
			res.status(404).send({ error: "Book not found" });
		});
})

// Enhanced recommendations with mode selection (Google vs ML)
app.get('/api/getBookRecommendation', async (req, res) => {
	const useML = req.query.useML === 'true';
	const userId = req.query.userId;
	
	console.log('🔍 Recommendation request:', { useML, userId, hasUser: !!userProfiles[userId] });
	
	if (useML && userId && userProfiles[userId]) {
		// Use ML-based recommendations
		try {
			console.log('🤖 Attempting ML recommendations...');
			const mlRecommendations = await mlEngine.getMLRecommendations(userId, null, 6);
			console.log('✅ ML recommendations generated:', mlRecommendations.length);
			res.status(200).send(mlRecommendations);
		} catch (error) {
			console.error('❌ ML recommendations error:', error);
			// Fallback to Google-based recommendations
			console.log('🔄 Falling back to Google recommendations');
			getGoogleBasedRecommendations(res);
		}
	} else {
		// Use Google-based recommendations (original logic)
		console.log('📚 Using Google-based recommendations');
		getGoogleBasedRecommendations(res);
	}
});

// Separate function for Google-based recommendations
const getGoogleBasedRecommendations = (res) => {
	// If no genre is set, use popular genres for general recommendations
	let currentGenre = genre;
	if (!currentGenre || currentGenre === "") {
		const popularGenres = ['Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Biography'];
		currentGenre = popularGenres[Math.floor(Math.random() * popularGenres.length)];
		console.log(`No genre set, using fallback genre: ${currentGenre}`);
	}

	// Enhanced search queries for better recommendations
	const searchQueries = [
		// Genre-based recommendations
		`subject:${currentGenre}`,
		`subject:"${currentGenre}"`,
		// Author-based recommendations if available
		...(book.authors ? book.authors.slice(0, 2).map(author => `inauthor:"${author}"`).filter(Boolean) : []),
		// Similar page count for complexity matching (if book is available)
		...(book.pageCount ? [`subject:${currentGenre}+pages:${Math.max(100, book.pageCount - 100)}-${book.pageCount + 100}`] : []),
		// Popular books in genre
		`subject:${currentGenre}+orderBy=relevance`,
		// Recent books in genre (if we have publication date)
		...(book.publishedDate ? [`subject:${currentGenre}+publishedDate:${book.publishedDate.split('-')[0]}-${new Date().getFullYear()}`] : []),
		// Highly rated books in genre
		`subject:${currentGenre}+filter=paid-ebooks`,
		// General popular books if no specific book context
		'bestseller+fiction',
		'award+winner+books'
	];

	// Execute multiple searches for diverse recommendations
	const searchPromises = searchQueries.slice(0, 5).map((query, index) =>
		axios.get('https://www.googleapis.com/books/v1/volumes', {
			params: {
				q: query,
				maxResults: index === 0 ? 15 : 10, // More results from primary genre search
				orderBy: index < 2 ? 'relevance' : 'newest',
				printType: 'books',
				langRestrict: 'en' // Focus on English books for better quality
			},
		}).catch(error => {
			console.log(`Search query failed: ${query}`, error.message);
			return { data: { items: [] } };
		})
	);

	Promise.all(searchPromises)
		.then(async (responses) => {
			// Combine and deduplicate results
			const allItems = responses.flatMap(response => response.data.items || []);
			
			// Enhanced deduplication and filtering
			const uniqueItems = allItems.filter((item, index, self) => {
				if (!item || !item.id || !item.volumeInfo) return false;
				
				// Exclude the current book (if available) and ensure unique IDs
				const isUnique = index === self.findIndex(t => t.id === item.id);
				const isNotCurrentBook = !book || !book.id || item.id !== book.id;
				const hasTitle = item.volumeInfo.title;
				const hasValidImage = item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail;
				
				return isUnique && isNotCurrentBook && hasTitle && hasValidImage;
			});

			// Prioritize books with better metadata
			const scoredBooks = uniqueItems.map(item => {
				let score = 0;
				const volumeInfo = item.volumeInfo;
				
				// Scoring based on available metadata
				if (volumeInfo.description) score += 3;
				if (volumeInfo.averageRating) score += 2;
				if (volumeInfo.ratingsCount && volumeInfo.ratingsCount > 10) score += 2;
				if (volumeInfo.publishedDate) score += 1;
				if (volumeInfo.pageCount && volumeInfo.pageCount > 50) score += 1;
				if (volumeInfo.authors && volumeInfo.authors.length > 0) score += 2;
				if (volumeInfo.categories && volumeInfo.categories.length > 0) score += 1;
				if (volumeInfo.imageLinks?.thumbnail) score += 1;
				
				return { ...item, qualityScore: score };
			});

			// Sort by quality score and take the best ones
			const bestBooks = scoredBooks
				.sort((a, b) => b.qualityScore - a.qualityScore)
				.slice(0, 12);

			// Get detailed information for recommendations
			const bookDetailsRequests = bestBooks.map((item) =>
				axios.get(`https://www.googleapis.com/books/v1/volumes/${item.id}`)
					.then(detailResponse => enhanceBookData(detailResponse.data.volumeInfo, item.id))
					.catch(() => enhanceBookData(item.volumeInfo, item.id))
			);

			try {
				const detailedRecommendations = await Promise.all(bookDetailsRequests);
				
				// Final filtering and sorting
				recommendations = detailedRecommendations
					.filter(book => book && book.title) // Ensure valid books
					.sort((a, b) => {
						// Prioritize books with ratings, then by publication date
						const aRating = a.averageRating || 0;
						const bRating = b.averageRating || 0;
						const aYear = a.publishedDate ? new Date(a.publishedDate).getFullYear() : 0;
						const bYear = b.publishedDate ? new Date(b.publishedDate).getFullYear() : 0;
						
						if (aRating !== bRating) return bRating - aRating;
						return bYear - aYear;
					})
					.slice(0, 6);

				res.status(200).send(recommendations);
			} catch (error) {
				console.error('Error processing recommendations:', error);
				res.status(500).send({ error: "Error generating recommendations" });
			}
		})
		.catch((error) => {
			console.error('Recommendations error:', error);
			res.status(500).send({ error: "Recommendation service unavailable" });
		});
};

// New endpoint to get/set user recommendation preferences
app.get('/api/recommendation-settings/:userId', (req, res) => {
	const userId = req.params.userId;
	const profile = userProfiles[userId];
	
	if (!profile) {
		return res.status(404).send({ error: "User not found" });
	}
	
	res.status(200).send({
		useML: profile.recommendations?.useML || false,
		favoriteGenres: profile.favoriteGenres || [],
		readingPreferences: profile.readingPreferences || {}
	});
});

app.post('/api/recommendation-settings/:userId', (req, res) => {
	const userId = req.params.userId;
	const { useML } = req.body;
	const profile = userProfiles[userId];
	
	if (!profile) {
		return res.status(404).send({ error: "User not found" });
	}
	
	if (!profile.recommendations) {
		profile.recommendations = {};
	}
	
	profile.recommendations.useML = useML;
	profile.recommendations.lastUpdated = new Date();
	
	res.status(200).send({ message: "Settings updated", useML });
});

// New endpoint for ML preparation - get search analytics
app.get('/api/analytics/search-history', (req, res) => {
	const analytics = {
		totalSearches: searchHistory.length,
		successRate: searchHistory.filter(s => s.searchSuccess).length / searchHistory.length,
		popularSearchTypes: getPopularSearchTypes(),
		searchTrends: getSearchTrends(),
		lastUpdated: new Date()
	};
	
	res.status(200).send(analytics);
});

const getPopularSearchTypes = () => {
	const typeCounts = {};
	searchHistory.forEach(search => {
		const type = search.searchData.type;
		typeCounts[type] = (typeCounts[type] || 0) + 1;
	});
	return Object.entries(typeCounts)
		.sort(([,a], [,b]) => b - a)
		.slice(0, 5)
		.map(([type, count]) => ({ type, count }));
};

const getSearchTrends = () => {
	// Group searches by day for trend analysis
	const trends = {};
	searchHistory.forEach(search => {
		const date = search.timestamp.toDateString();
		trends[date] = (trends[date] || 0) + 1;
	});
	return Object.entries(trends)
		.sort(([a], [b]) => new Date(a) - new Date(b))
		.slice(-30) // Last 30 days
		.map(([date, count]) => ({ date, count }));
};

// New endpoint for book details by ID
app.get('/api/book/:id', (req, res) => {
	const bookId = req.params.id;
	
	axios.get(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
		.then(response => {
			const enhancedBook = enhanceBookData(response.data.volumeInfo, bookId);
			res.status(200).send(enhancedBook);
		})
		.catch(error => {
			console.error('Book details error:', error);
			res.status(404).send({ error: "Book not found" });
		});
});

// Enhanced ML recommendation endpoints
app.get('/api/ml/recommendations/:userId', async (req, res) => {
	const userId = req.params.userId;
	const count = parseInt(req.query.count) || 6;
	const genre = req.query.genre;
	
	try {
		const recommendations = await mlEngine.getEnhancedRecommendations(userId, count, genre);
		res.status(200).send(recommendations);
	} catch (error) {
		console.error('Enhanced ML recommendations error:', error);
		res.status(500).send({ error: "ML recommendation service error" });
	}
});

// "More like this" recommendations
app.post('/api/ml/similar/:userId', async (req, res) => {
	const userId = req.params.userId;
	const { sourceBook } = req.body;
	const count = parseInt(req.query.count) || 6;
	
	try {
		const recommendations = await mlEngine.getSimilarBooks(userId, sourceBook, count);
		res.status(200).send(recommendations);
	} catch (error) {
		console.error('Similar books error:', error);
		res.status(500).send({ error: "Similar books recommendation error" });
	}
});

// Record user interaction for ML learning
app.post('/api/ml/interaction/:userId', (req, res) => {
	const userId = req.params.userId;
	const { book, interactionType } = req.body;
	
	try {
		mlEngine.updateUserPreferences(userId, book, interactionType);
		res.status(200).send({ message: "Interaction recorded" });
	} catch (error) {
		console.error('Interaction recording error:', error);
		res.status(500).send({ error: "Failed to record interaction" });
	}
});

// Get user's ML profile and insights
app.get('/api/ml/profile/:userId', (req, res) => {
	const userId = req.params.userId;
	
	try {
		const userVector = mlEngine.createUserVector(userId);
		const profile = userProfiles[userId];
		
		const mlProfile = {
			preferences: {
				topGenres: Object.entries(userVector.genres)
					.sort(([,a], [,b]) => b - a)
					.slice(0, 5)
					.map(([genre, score]) => ({ genre, score })),
				topAuthors: Object.entries(userVector.authors)
					.sort(([,a], [,b]) => b - a)
					.slice(0, 3)
					.map(([author, score]) => ({ author, score })),
				averageComplexity: userVector.complexity,
				preferredPageLength: userVector.pageLength
			},
			stats: {
				totalBooks: profile.favoriteBooks?.length || 0,
				totalInteractions: profile.mlLearning?.interactions?.length || 0,
				profileLastUpdated: profile.mlLearning?.lastUpdated || null
			}
		};
		
		res.status(200).send(mlProfile);
	} catch (error) {
		console.error('ML profile error:', error);
		res.status(500).send({ error: "Failed to generate ML profile" });
	}
});

// Debug endpoint to check user authentication
app.get('/api/debug/user/:userId', (req, res) => {
	const userId = req.params.userId;
	const profile = userProfiles[userId];
	
	if (!profile) {
		return res.status(404).json({ error: 'User profile not found' });
	}
	
	res.json({
		userId: userId,
		username: profile.username,
		favoriteBooks: profile.favoriteBooks.length,
		readingLists: profile.readingLists.length,
		lastLogin: profile.lastLogin,
		mlEnabled: profile.recommendations?.useML || false
	});
});

// Test endpoint to enable ML for a user
app.post('/api/debug/enable-ml/:userId', (req, res) => {
	const userId = req.params.userId;
	const profile = userProfiles[userId];
	
	if (!profile) {
		return res.status(404).json({ error: 'User profile not found' });
	}
	
	if (!profile.recommendations) {
		profile.recommendations = {};
	}
	
	profile.recommendations.useML = true;
	profile.recommendations.lastUpdated = new Date();
	
	res.json({
		message: 'ML enabled for user',
		userId: userId,
		mlEnabled: true
	});
});

app.listen(5000, () => { 
	console.log("Server Started on port 5000")
	console.log("Enhanced search and ML preparation features enabled")
})