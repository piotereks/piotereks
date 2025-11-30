import React from 'react';
import { SECTION_CONFIG } from '../config/sections';
import { buildUrl } from '../utils/urlUtils';

export const ExternalLinks = ({ word, onCollapseAll }) => {
  return (
    <div className="text-center mb-4" id="orgLinks">
      {SECTION_CONFIG.map(({ key, baseUrl, label }) => (
        <a
          key={key}
          id={`${key}Link`}
          href={buildUrl(baseUrl, word)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary mr-2"
        >
          {label}
        </a>
      ))}
      <button
        onClick={onCollapseAll}
        className="btn btn-info mr-2"
      >
        &#9650; All
      </button>
    </div>
  );
};