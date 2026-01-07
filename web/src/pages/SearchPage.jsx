import React, { useState } from 'react';
import { searchSpurgeon } from '../services/spurgeonApi.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function SearchPage() {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(5);
  const [contextChars, setContextChars] = useState(200);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading) {
      return;
    }

    setError(null);
    setResults(null);
    setIsLoading(true);

    try {
      const response = await searchSpurgeon(
        question.trim(),
        topK,
        contextChars
      );
      setResults(response);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to search');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Search Spurgeon's Sermons
        </h1>
        <p className="text-gray-600 mb-6">
          Search through Spurgeon's sermon collection using semantic search
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="How do I persevere in prayer?"
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="topK" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Results (topK)
              </label>
              <input
                id="topK"
                type="number"
                min="1"
                max="20"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="contextChars" className="block text-sm font-medium text-gray-700 mb-2">
                Context Characters
              </label>
              <input
                id="contextChars"
                type="number"
                min="50"
                max="1000"
                step="50"
                value={contextChars}
                onChange={(e) => setContextChars(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-8">
            <LoadingSpinner message="Searching..." />
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Results ({results.results?.length || 0})
              </h2>
              {results.usage && (
                <div className="text-sm text-gray-500">
                  Tokens: {results.usage.total_tokens}
                </div>
              )}
            </div>

            {results.results && results.results.length > 0 ? (
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {result.title}
                        </a>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>Sermon ID: {result.sermon_id}</span>
                          <span>Distance: {result.distance.toFixed(4)}</span>
                          <span>
                            Position: {result.offset_start} - {result.offset_end}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed border-l-4 border-blue-500 pl-4">
                      {result.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No results found. Try a different question.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
