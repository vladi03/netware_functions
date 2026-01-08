import React, { useState } from 'react';

function ToolRunDisplay({ toolRuns }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!toolRuns || toolRuns.length === 0) {
    return null;
  }

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Tool Runs
      </div>
      {toolRuns.map((toolRun, index) => (
        <div
          key={index}
          className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden"
        >
          <button
            onClick={() => toggleExpand(index)}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  toolRun.isError ? 'bg-red-500' : 'bg-green-500'
                }`}
              ></span>
              <span className="text-sm font-medium text-gray-700">
                {toolRun.name}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                expandedIndex === index ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {expandedIndex === index && (
            <div className="px-3 py-2 border-t border-gray-200 bg-white">
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Arguments:
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(toolRun.arguments, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Output:
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(toolRun.output, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ToolRunDisplay;
