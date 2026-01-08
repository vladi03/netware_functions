import React, { useState } from 'react';
import { searchSpurgeon, generateDevotional } from '../services/spurgeonApi.js';
import DevotionalDisplay from '../components/DevotionalDisplay.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function DevotionalGeneratorPage() {
  const [question, setQuestion] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [devotional, setDevotional] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || isSearching) {
      return;
    }

    setError(null);
    setSearchResults(null);
    setDevotional(null);
    setIsSearching(true);

    try {
      const response = await searchSpurgeon(question.trim(), 5, 200);
      setSearchResults(response);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateDevotional = async () => {
    if (!searchResults || !searchResults.results || isGenerating) {
      return;
    }

    setError(null);
    setDevotional(null);
    setIsGenerating(true);

    try {
      // Format excerpts for the API
      const excerpts = searchResults.results.map((result) => ({
        title: result.title,
        url: result.url,
        excerpt: result.excerpt,
      }));

      const response = await generateDevotional(question, excerpts);
      setDevotional(response.devotional);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate devotional');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Devotional Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Generate a 500-word devotional based on Spurgeon's sermons
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex space-x-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question (e.g., How do I persevere in prayer?)"
              disabled={isSearching || isGenerating}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isSearching || isGenerating || !question.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="py-8">
            <LoadingSpinner message="Searching Spurgeon's sermons..." />
          </div>
        )}

        {/* Search Results */}
        {searchResults && searchResults.results && searchResults.results.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({searchResults.results.length})
              </h2>
              <button
                onClick={handleGenerateDevotional}
                disabled={isGenerating}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Generate Devotional
              </button>
            </div>
            
            <div className="space-y-4">
              {searchResults.results.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {result.title}
                    </a>
                    <span className="text-xs text-gray-500 ml-2">
                      Distance: {result.distance.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {result.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation Loading */}
        {isGenerating && (
          <div className="py-8">
            <LoadingSpinner message="Generating devotional..." />
          </div>
        )}
      </div>

      {/* Devotional Display */}
      {devotional && (
        <DevotionalDisplay devotional={devotional} />
      )}
    </div>
  );
}

export default DevotionalGeneratorPage;
