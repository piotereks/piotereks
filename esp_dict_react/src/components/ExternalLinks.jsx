import React from 'react';
import { SECTION_CONFIG } from '../config/sections';
import { buildUrl } from '../utils/urlUtils';

export const ExternalLinks = ({ word, onCollapseAll }) => {
  return (
    <div className="flex justify-center gap-2 mb-6 flex-wrap">
      {SECTION_CONFIG.map(({ key, baseUrl, label }) => (
        <a
          key={key}
          href={buildUrl(baseUrl, word)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition"
        >
          {label}
        </a>
      ))}
      <button
        onClick={onCollapseAll}
        className="bg-blue-400 text-white px-3 py-2 rounded text-sm hover:bg-blue-500 transition"
      >
        ▲ All
      </button>
    </div>
  );
};