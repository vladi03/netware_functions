import React from 'react';

function ChatMessage({ message, role }) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 shadow-sm border border-gray-200'
        }`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-sm font-medium">
                U
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                S
              </div>
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium mb-1">
              {isUser ? 'You' : 'Spurgeon'}
            </p>
            <div className="text-sm whitespace-pre-wrap break-words">
              {message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
