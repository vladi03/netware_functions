import React from 'react';

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="text-gray-600">{message}</span>
    </div>
  );
}

export default LoadingSpinner;
