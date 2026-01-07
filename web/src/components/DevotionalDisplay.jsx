import React from 'react';

function DevotionalDisplay({ devotional }) {
  if (!devotional) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Title */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-3xl font-bold text-gray-900">
          {devotional.title}
        </h2>
      </div>

      {/* Introduction */}
      {devotional.intro && (
        <div className="text-lg text-gray-700 italic border-l-4 border-blue-500 pl-4">
          {devotional.intro}
        </div>
      )}

      {/* Paragraphs */}
      <div className="space-y-4">
        {devotional.paragraphs && devotional.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-gray-800 leading-relaxed text-justify">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Sermon References */}
      {devotional.references && devotional.references.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Sermon References
          </h3>
          <ul className="space-y-2">
            {devotional.references.map((reference, index) => (
              <li key={index}>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {reference.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DevotionalDisplay;
