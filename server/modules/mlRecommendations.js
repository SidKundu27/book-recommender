const axios = require('axios');
const { userProfiles } = require('./userManagement');

class BasicMLRecommendationEngine {
  constructor() {
    this.userVectors = new Map(); // User preference vectors
    this.bookVectors = new Map(); // Book feature vectors
    this.similarityThreshold = 0.3;
  }

  // Create user preference vector based on reading history and favorites
  createUserVector(userId) {
    const profile = userProfiles[userId];
    if (!profile) return null;

    const userVector = {
      genres: {},
      authors: {},
      complexity: 0,
      pageLength: 0,
      recency: 0,
      rating: 0,
      totalBooks: 0
    };

    // Combine favorites and read books
    const allBooks = [
      ...profile.favoriteBooks,
      ...profile.readingLists.flatMap(list => 
        list.books.filter(book => book.status === 'read')
      )
    ];

    if (allBooks.length === 0) {
      return this.createDefaultUserVector(profile);
    }

    // Process each book to build user preferences
    allBooks.forEach(book => {
      userVector.totalBooks++;

      // Genre preferences
      if (book.categories) {
        book.categories.forEach(genre => {
          userVector.genres[genre] = (userVector.genres[genre] || 0) + 1;
        });
      }

      // Author preferences
      if (book.authors) {
        book.authors.forEach(author => {
          userVector.authors[author] = (userVector.authors[author] || 0) + 1;
        });
      }

      // Complexity preference
      if (book.complexityScore) {
        userVector.complexity += book.complexityScore;
      }

      // Page length preference
      if (book.pageCount) {
        userVector.pageLength += book.pageCount;
      }

      // Recency preference (newer books = higher score)
      if (book.publishedDate) {
        const year = new Date(book.publishedDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const recencyScore = Math.max(0, 5 - (currentYear - year) / 10);
        userVector.recency += recencyScore;
      }

      // Rating preference
      if (book.averageRating) {
        userVector.rating += book.averageRating;
      }
    });

    // Normalize values
    if (userVector.totalBooks > 0) {
      userVector.complexity /= userVector.totalBooks;
      userVector.pageLength /= userVector.totalBooks;
      userVector.recency /= userVector.totalBooks;
      userVector.rating /= userVector.totalBooks;
    }

    // Convert genre counts to preferences (normalize)
    const totalGenreCount = Object.values(userVector.genres).reduce((sum, count) => sum + count, 0);
    Object.keys(userVector.genres).forEach(genre => {
      userVector.genres[genre] = userVector.genres[genre] / totalGenreCount;
    });

    // Convert author counts to preferences
    const totalAuthorCount = Object.values(userVector.authors).reduce((sum, count) => sum + count, 0);
    Object.keys(userVector.authors).forEach(author => {
      userVector.authors[author] = userVector.authors[author] / totalAuthorCount;
    });

    this.userVectors.set(userId, userVector);
    return userVector;
  }

  // Create default vector for new users
  createDefaultUserVector(profile) {
    const defaultVector = {
      genres: {},
      authors: {},
      complexity: 2.5, // Medium complexity
      pageLength: 300, // Medium length
      recency: 2.5, // Neutral on recency
      rating: 4.0, // Prefer highly rated books
      totalBooks: 0
    };

    // Use favorite genres from profile if available
    if (profile.favoriteGenres && profile.favoriteGenres.length > 0) {
      profile.favoriteGenres.forEach(genre => {
        defaultVector.genres[genre] = 1.0 / profile.favoriteGenres.length;
      });
    }

    // Use reading preferences
    if (profile.readingPreferences) {
      const prefs = profile.readingPreferences;
      
      if (prefs.complexityLevel === 'easy') defaultVector.complexity = 1.5;
      else if (prefs.complexityLevel === 'hard') defaultVector.complexity = 4.0;
      
      if (prefs.preferredLength === 'short') defaultVector.pageLength = 200;
      else if (prefs.preferredLength === 'long') defaultVector.pageLength = 500;
    }

    this.userVectors.set(userId, defaultVector);
    return defaultVector;
  }

  // Create book feature vector
  createBookVector(book) {
    const bookVector = {
      genres: {},
      authors: {},
      complexity: book.complexityScore || 2.5,
      pageLength: book.pageCount || 300,
      recency: 0,
      rating: book.averageRating || 3.0,
      popularity: book.popularityScore || 0
    };

    // Genre features
    if (book.categories) {
      book.categories.forEach(genre => {
        bookVector.genres[genre] = 1.0 / book.categories.length;
      });
    }

    // Author features
    if (book.authors) {
      book.authors.forEach(author => {
        bookVector.authors[author] = 1.0 / book.authors.length;
      });
    }

    // Recency score
    if (book.publishedDate) {
      const year = new Date(book.publishedDate).getFullYear();
      const currentYear = new Date().getFullYear();
      bookVector.recency = Math.max(0, 5 - (currentYear - year) / 10);
    }

    return bookVector;
  }

  // Calculate similarity between user and book vectors
  calculateSimilarity(userVector, bookVector) {
    let similarity = 0;
    let factors = 0;

    // Genre similarity
    let genreSimilarity = 0;
    const userGenres = Object.keys(userVector.genres);
    const bookGenres = Object.keys(bookVector.genres);
    
    if (userGenres.length > 0 && bookGenres.length > 0) {
      userGenres.forEach(genre => {
        if (bookVector.genres[genre]) {
          genreSimilarity += userVector.genres[genre] * bookVector.genres[genre];
        }
      });
      similarity += genreSimilarity * 0.4; // 40% weight for genre
      factors += 0.4;
    }

    // Author similarity
    let authorSimilarity = 0;
    const userAuthors = Object.keys(userVector.authors);
    const bookAuthors = Object.keys(bookVector.authors);
    
    if (userAuthors.length > 0 && bookAuthors.length > 0) {
      userAuthors.forEach(author => {
        if (bookVector.authors[author]) {
          authorSimilarity += userVector.authors[author] * bookVector.authors[author];
        }
      });
      similarity += authorSimilarity * 0.3; // 30% weight for author
      factors += 0.3;
    }

    // Complexity similarity (closer = better)
    const complexityDiff = Math.abs(userVector.complexity - bookVector.complexity);
    const complexitySimilarity = Math.max(0, 1 - complexityDiff / 5);
    similarity += complexitySimilarity * 0.1; // 10% weight
    factors += 0.1;

    // Page length similarity
    const lengthDiff = Math.abs(userVector.pageLength - bookVector.pageLength);
    const lengthSimilarity = Math.max(0, 1 - lengthDiff / 500);
    similarity += lengthSimilarity * 0.05; // 5% weight
    factors += 0.05;

    // Rating factor (higher rated books get bonus)
    const ratingBonus = (bookVector.rating - 3.0) / 2.0; // Normalize to -1 to 1
    similarity += Math.max(0, ratingBonus) * 0.1; // 10% weight
    factors += 0.1;

    // Popularity factor (slight bonus for popular books)
    const popularityBonus = Math.min(bookVector.popularity / 100, 1) * 0.05; // 5% weight
    similarity += popularityBonus;
    factors += 0.05;

    return factors > 0 ? similarity / factors : 0;
  }

  // Get ML-based recommendations for a user
  async getMLRecommendations(userId, currentBookId = null, limit = 10) {
    try {
      const userVector = this.createUserVector(userId);
      if (!userVector) {
        throw new Error('User profile not found');
      }

      // Get candidate books based on user preferences
      const candidateBooks = await this.getCandidateBooks(userVector, currentBookId);
      
      // Score and rank books
      const scoredBooks = candidateBooks.map(book => {
        const bookVector = this.createBookVector(book);
        const similarity = this.calculateSimilarity(userVector, bookVector);
        
        return {
          book,
          score: similarity,
          reasons: this.generateReasoningFactors(userVector, bookVector)
        };
      });

      // Sort by score and return top recommendations
      return scoredBooks
        .filter(item => item.score > this.similarityThreshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          ...item.book,
          mlScore: item.score,
          recommendationReasons: item.reasons
        }));

    } catch (error) {
      console.error('ML Recommendation error:', error);
      return [];
    }
  }

  // Get candidate books for recommendation
  async getCandidateBooks(userVector, excludeBookId = null) {
    const candidateBooks = [];
    
    // Get books from favorite genres
    const topGenres = Object.entries(userVector.genres)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    for (const genre of topGenres) {
      try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
          params: {
            q: `subject:${genre}`,
            maxResults: 15,
            orderBy: 'relevance'
          }
        });

        if (response.data.items) {
          for (const item of response.data.items) {
            if (item.id !== excludeBookId) {
              try {
                const detailResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes/${item.id}`);
                const enhancedBook = this.enhanceBookData(detailResponse.data.volumeInfo);
                candidateBooks.push(enhancedBook);
              } catch (error) {
                // Continue if individual book fetch fails
                const enhancedBook = this.enhanceBookData(item.volumeInfo);
                candidateBooks.push(enhancedBook);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching books for genre ${genre}:`, error);
      }
    }

    // Get books from favorite authors
    const topAuthors = Object.entries(userVector.authors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([author]) => author);

    for (const author of topAuthors) {
      try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
          params: {
            q: `inauthor:"${author}"`,
            maxResults: 10,
            orderBy: 'relevance'
          }
        });

        if (response.data.items) {
          for (const item of response.data.items) {
            if (item.id !== excludeBookId) {
              try {
                const detailResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes/${item.id}`);
                const enhancedBook = this.enhanceBookData(detailResponse.data.volumeInfo);
                candidateBooks.push(enhancedBook);
              } catch (error) {
                const enhancedBook = this.enhanceBookData(item.volumeInfo);
                candidateBooks.push(enhancedBook);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching books for author ${author}:`, error);
      }
    }

    // Remove duplicates
    const uniqueBooks = candidateBooks.filter((book, index, self) =>
      index === self.findIndex(b => b.id === book.id)
    );

    return uniqueBooks;
  }

  // Generate reasoning for recommendations
  generateReasoningFactors(userVector, bookVector) {
    const reasons = [];

    // Check genre matches
    const matchingGenres = Object.keys(userVector.genres).filter(genre => 
      bookVector.genres[genre]
    );
    if (matchingGenres.length > 0) {
      reasons.push(`Matches your favorite genres: ${matchingGenres.join(', ')}`);
    }

    // Check author matches
    const matchingAuthors = Object.keys(userVector.authors).filter(author => 
      bookVector.authors[author]
    );
    if (matchingAuthors.length > 0) {
      reasons.push(`By authors you've enjoyed: ${matchingAuthors.join(', ')}`);
    }

    // Check complexity match
    const complexityDiff = Math.abs(userVector.complexity - bookVector.complexity);
    if (complexityDiff < 1) {
      reasons.push('Matches your preferred reading complexity');
    }

    // Check rating
    if (bookVector.rating > 4.0) {
      reasons.push('Highly rated by other readers');
    }

    // Check popularity
    if (bookVector.popularity > 50) {
      reasons.push('Popular among readers');
    }

    return reasons;
  }

  // Enhanced book data (same as in main server)
  enhanceBookData(book) {
    return {
      ...book,
      popularityScore: (book.ratingsCount || 0) * (book.averageRating || 0),
      ageCategory: this.categorizeByAge(book.publishedDate),
      wordCount: this.estimateWordCount(book.pageCount),
      complexityScore: this.calculateComplexityScore(book)
    };
  }

  categorizeByAge(publishedDate) {
    if (!publishedDate) return 'unknown';
    const year = new Date(publishedDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    if (age <= 2) return 'new';
    if (age <= 10) return 'recent';
    if (age <= 25) return 'modern';
    if (age <= 50) return 'classic';
    return 'vintage';
  }

  estimateWordCount(pageCount) {
    if (!pageCount) return 0;
    return pageCount * 275;
  }

  calculateComplexityScore(book) {
    let score = 0;
    
    if (book.pageCount) {
      if (book.pageCount > 500) score += 3;
      else if (book.pageCount > 300) score += 2;
      else if (book.pageCount > 150) score += 1;
    }
    
    const complexGenres = ['philosophy', 'science', 'academic', 'technical'];
    if (book.categories) {
      const genres = book.categories.join(' ').toLowerCase();
      if (complexGenres.some(genre => genres.includes(genre))) {
        score += 2;
      }
    }
    
    if (book.averageRating && book.averageRating > 4.0) {
      score += 1;
    }
    
    return Math.min(score, 5);
  }

  // Update user vector when they interact with books
  updateUserPreferences(userId, book, interactionType) {
    const userVector = this.userVectors.get(userId) || this.createUserVector(userId);
    
    // Weight the update based on interaction type
    let weight = 1;
    switch (interactionType) {
      case 'favorite': weight = 2; break;
      case 'read': weight = 1.5; break;
      case 'added_to_list': weight = 1; break;
      case 'search': weight = 0.5; break;
    }

    // Update genre preferences
    if (book.categories) {
      book.categories.forEach(genre => {
        userVector.genres[genre] = (userVector.genres[genre] || 0) + (0.1 * weight);
      });
    }

    // Update author preferences
    if (book.authors) {
      book.authors.forEach(author => {
        userVector.authors[author] = (userVector.authors[author] || 0) + (0.1 * weight);
      });
    }

    this.userVectors.set(userId, userVector);
  }
}

module.exports = BasicMLRecommendationEngine;
