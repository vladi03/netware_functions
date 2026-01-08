import React, { useState, useRef, useEffect } from 'react';
import { chat } from '../services/spurgeonApi.js';
import ChatMessage from '../components/ChatMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ToolRunDisplay from '../components/ToolRunDisplay.jsx';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) {
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsLoading(true);

    try {
      // Build history from messages
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call chat API
      const response = await chat(userMessage, history);

      // Add assistant response to chat
      const assistantMessage = {
        role: 'assistant',
        content: response.reply,
        toolRuns: response.tool_runs,
        usage: response.usage,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to send message');
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
      // Restore input
      setInputMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Chat with Spurgeon</h1>
          <p className="text-blue-100 text-sm mt-1">
            Ask questions and receive wisdom in Spurgeon's voice
          </p>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg mb-2">Welcome! Ask a question to begin.</p>
              <p className="text-sm">
                Example: "How do I persevere in prayer?"
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index}>
              <ChatMessage message={msg.content} role={msg.role} />
              {msg.toolRuns && <ToolRunDisplay toolRuns={msg.toolRuns} />}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <LoadingSpinner message="Spurgeon is thinking..." />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                disabled={isLoading}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
