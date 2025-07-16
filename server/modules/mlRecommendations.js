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

  // Calculate diversity bonus to encourage exploration
  calculateDiversityBonus(book, profile) {
    let diversityBonus = 0;
    
    // Bonus for exploring new genres
    const userGenres = new Set();
    profile.favoriteBooks.forEach(book => {
      if (book.categories) {
        book.categories.forEach(genre => userGenres.add(genre));
      }
    });
    
    if (book.categories) {
      const newGenres = book.categories.filter(genre => !userGenres.has(genre));
      diversityBonus += newGenres.length * 0.1;
    }
    
    // Bonus for exploring new authors
    const userAuthors = new Set();
    profile.favoriteBooks.forEach(book => {
      if (book.authors) {
        book.authors.forEach(author => userAuthors.add(author));
      }
    });
    
    if (book.authors) {
      const newAuthors = book.authors.filter(author => !userAuthors.has(author));
      diversityBonus += newAuthors.length * 0.05;
    }
    
    return Math.min(diversityBonus, 0.3); // Cap diversity bonus
  }

  // Calculate popularity bonus
  calculatePopularityBonus(book) {
    const ratingsCount = book.ratingsCount || 0;
    const averageRating = book.averageRating || 0;
    const popularityScore = Math.log(1 + ratingsCount) * averageRating;
    return Math.min(popularityScore / 100, 0.2); // Normalize and cap
  }

  // Update recommendation history for learning
  updateRecommendationHistory(userId, recommendations) {
    const profile = userProfiles[userId];
    if (!profile.recommendationHistory) {
      profile.recommendationHistory = [];
    }
    
    const historyEntry = {
      timestamp: new Date(),
      recommendations: recommendations.map(book => ({
        id: book.id,
        title: book.title,
        score: book.recommendationScore,
        reason: book.recommendationReason
      }))
    };
    
    profile.recommendationHistory.push(historyEntry);
    
    // Keep only last 10 recommendation sessions
    if (profile.recommendationHistory.length > 10) {
      profile.recommendationHistory = profile.recommendationHistory.slice(-10);
    }
  }

  // Get enhanced personalized recommendations
  async getEnhancedRecommendations(userId, options = {}) {
    const {
      count = 10,
      genre = null,
      excludeRead = true,
      diversify = true,
      includePopular = true,
      sourceBook = null // For "more like this" recommendations
    } = options;

    try {
      const profile = userProfiles[userId];
      const userSettings = profile.recommendations || {};
      
      // Check if ML is enabled for this user
      if (!userSettings.useML) {
        return await this.getFallbackRecommendations(count, genre);
      }

      let userVector = this.createUserVector(userId);
      
      // If we have a source book, bias the vector towards it
      if (sourceBook) {
        userVector = this.createBiasedUserVector(userId, sourceBook);
      }

      if (!userVector) {
        return await this.getFallbackRecommendations(count, genre);
      }

      // Get more candidates for better filtering
      const candidates = await this.getCandidateBooks(userVector, genre, count * 4);
      
      // Score each candidate book with enhanced metrics
      const scoredBooks = candidates.map(book => {
        const bookVector = this.createBookVector(book);
        const similarity = this.calculateSimilarity(userVector, bookVector);
        const diversityBonus = diversify ? this.calculateDiversityBonus(book, profile) : 0;
        const popularityBonus = includePopular ? this.calculatePopularityBonus(book) : 0;
        const recencyBonus = this.calculateRecencyBonus(book, profile);
        
        const totalScore = similarity + diversityBonus + popularityBonus + recencyBonus;
        
        return {
          book,
          score: totalScore,
          similarity,
          explanation: this.generateDetailedExplanation(userVector, bookVector, {
            similarity,
            diversityBonus,
            popularityBonus,
            recencyBonus
          })
        };
      });

      // Filter out already read books
      let filteredBooks = scoredBooks;
      if (excludeRead) {
        const readBookIds = new Set();
        profile.favoriteBooks.forEach(book => readBookIds.add(book.id));
        profile.readingLists.forEach(list => {
          list.books.forEach(book => readBookIds.add(book.id));
        });
        
        filteredBooks = scoredBooks.filter(item => !readBookIds.has(item.book.id));
      }

      // Sort by score and return top recommendations
      const recommendations = filteredBooks
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(item => ({
          ...item.book,
          recommendationScore: item.score,
          recommendationReason: item.explanation,
          mlGenerated: true
        }));

      // Update user's recommendation history for learning
      this.updateRecommendationHistory(userId, recommendations);
      
      // Update user preferences based on this interaction
      this.updateUserPreferences(userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating enhanced recommendations:', error);
      return await this.getFallbackRecommendations(count, genre);
    }
  }

  // Enhanced book data processing
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
  }

  // Calculate recency bonus based on user preferences
  calculateRecencyBonus(book, profile) {
    if (!book.publishedDate) return 0;
    
    const bookYear = new Date(book.publishedDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - bookYear;
    
    // Check user's reading history for recency preference
    const userBooks = profile.favoriteBooks || [];
    if (userBooks.length === 0) return 0;
    
    const avgUserBookAge = userBooks.reduce((sum, userBook) => {
      if (userBook.publishedDate) {
        const userBookYear = new Date(userBook.publishedDate).getFullYear();
        return sum + (currentYear - userBookYear);
      }
      return sum;
    }, 0) / userBooks.length;
    
    // Bonus for books that match user's typical recency preference
    const ageDiff = Math.abs(age - avgUserBookAge);
    return Math.max(0, 0.1 - (ageDiff / 100));
  }

  // Create biased user vector for "more like this" recommendations
  createBiasedUserVector(userId, sourceBook) {
    const baseVector = this.createUserVector(userId);
    const bookVector = this.createBookVector(sourceBook);
    
    // Blend user preferences with source book characteristics
    const biasedVector = { ...baseVector };
    
    // Increase weight for source book's genres
    if (bookVector.genres) {
      Object.keys(bookVector.genres).forEach(genre => {
        biasedVector.genres[genre] = (biasedVector.genres[genre] || 0) + 0.3;
      });
    }
    
    // Increase weight for source book's authors
    if (bookVector.authors) {
      Object.keys(bookVector.authors).forEach(author => {
        biasedVector.authors[author] = (biasedVector.authors[author] || 0) + 0.5;
      });
    }
    
    // Bias towards similar complexity and length
    biasedVector.complexity = (biasedVector.complexity + bookVector.complexity * 2) / 3;
    biasedVector.pageLength = (biasedVector.pageLength + bookVector.pageLength * 2) / 3;
    
    return biasedVector;
  }

  // Generate detailed explanation with multiple factors
  generateDetailedExplanation(userVector, bookVector, scores) {
    const explanations = [];
    
    // Genre matches
    const matchingGenres = Object.keys(userVector.genres).filter(genre => 
      bookVector.genres[genre] && userVector.genres[genre] > 0.1
    );
    if (matchingGenres.length > 0) {
      explanations.push(`Matches your interest in ${matchingGenres.slice(0, 2).join(' and ')}`);
    }
    
    // Author matches
    const matchingAuthors = Object.keys(userVector.authors).filter(author => 
      bookVector.authors[author] && userVector.authors[author] > 0.1
    );
    if (matchingAuthors.length > 0) {
      explanations.push(`By ${matchingAuthors[0]}, an author you've enjoyed`);
    }
    
    // Rating
    if (bookVector.rating >= 4.0) {
      explanations.push(`Highly rated (${bookVector.rating.toFixed(1)}/5)`);
    }
    
    // Complexity match
    const complexityDiff = Math.abs(userVector.complexity - bookVector.complexity);
    if (complexityDiff < 0.5) {
      explanations.push('Matches your preferred reading level');
    }
    
    // Length preference
    const lengthDiff = Math.abs(userVector.pageLength - bookVector.pageLength);
    if (lengthDiff < 100) {
      explanations.push('Good length for your preferences');
    }
    
    // Diversity bonus explanation
    if (scores.diversityBonus > 0.1) {
      explanations.push('Explores new genres you might enjoy');
    }
    
    // Popularity bonus explanation
    if (scores.popularityBonus > 0.1) {
      explanations.push('Popular among readers with similar tastes');
    }
    
    return explanations.length > 0 ? explanations.join('. ') : 'Recommended based on your reading history';
  }

  // Update user preferences based on interactions
  updateUserPreferences(userId, book, interactionType) {
    const profile = userProfiles[userId];
    if (!profile.mlLearning) {
      profile.mlLearning = {
        interactions: [],
        lastUpdated: new Date()
      };
    }
    
    // Record interaction
    profile.mlLearning.interactions.push({
      bookId: book.id,
      type: interactionType, // 'view', 'favorite', 'add_to_list', 'rate'
      timestamp: new Date(),
      genres: book.categories || [],
      authors: book.authors || [],
      complexity: book.complexityScore || 2.5,
      pageCount: book.pageCount || 300
    });
    
    // Keep only recent interactions for performance
    if (profile.mlLearning.interactions.length > 50) {
      profile.mlLearning.interactions = profile.mlLearning.interactions.slice(-50);
    }
    
    profile.mlLearning.lastUpdated = new Date();
    
    // Update user vector based on this interaction
    this.updateUserVectorFromInteraction(userId, book, interactionType);
  }
}

module.exports = BasicMLRecommendationEngine;
