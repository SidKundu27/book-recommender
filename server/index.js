const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const app = express()

let book = [];
let genre = "";
let recommendations = []
let searchHistory = []; // For future ML features
let userPreferences = {}; // For future ML features

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
const enhanceBookData = (book) => {
	return {
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
					.then(detailResponse => enhanceBookData(detailResponse.data.volumeInfo))
					.catch(error => {
						console.error(`Error fetching details for book ${item.id}:`, error);
						return enhanceBookData(item.volumeInfo);
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
			book = enhanceBookData(bookDetailsRequests.data.volumeInfo);
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

// Enhanced recommendations with better algorithm
app.get('/api/getBookRecommendation', (req, res) => {
	if (genre === "") {
		return res.status(404).send({ error: "No Genre Found" });
	}

	// Get recommendations based on genre and current book
	const searchQueries = [
		`subject:${genre}`,
		// Add author-based recommendations if available
		...(book.authors ? book.authors.map(author => `inauthor:"${author}"`) : []),
		// Add similar complexity books
		`subject:${genre}+pages:${book.pageCount || 200}`
	];

	// Execute multiple searches for diverse recommendations
	const searchPromises = searchQueries.slice(0, 3).map(query =>
		axios.get('https://www.googleapis.com/books/v1/volumes', {
			params: {
				q: query,
				maxResults: 8,
				orderBy: 'relevance'
			},
		}).catch(() => ({ data: { items: [] } })) // Graceful failure
	);

	Promise.all(searchPromises)
		.then(async (responses) => {
			// Combine and deduplicate results
			const allItems = responses.flatMap(response => response.data.items || []);
			const uniqueItems = allItems.filter((item, index, self) =>
				index === self.findIndex(t => t.id === item.id) && 
				item.id !== book.id // Exclude the current book
			);

			// Get detailed information for recommendations
			const bookDetailsRequests = uniqueItems.slice(0, 10).map((item) =>
				axios.get(`https://www.googleapis.com/books/v1/volumes/${item.id}`)
					.then(detailResponse => enhanceBookData(detailResponse.data.volumeInfo))
					.catch(() => enhanceBookData(item.volumeInfo))
			);

			try {
				const detailedRecommendations = await Promise.all(bookDetailsRequests);
				
				// Sort by popularity score for better recommendations
				recommendations = detailedRecommendations
					.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
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
			const enhancedBook = enhanceBookData(response.data.volumeInfo);
			res.status(200).send(enhancedBook);
		})
		.catch(error => {
			console.error('Book details error:', error);
			res.status(404).send({ error: "Book not found" });
		});
});

app.listen(5000, () => { 
	console.log("Server Started on port 5000")
	console.log("Enhanced search and ML preparation features enabled")
})