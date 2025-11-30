import React, { useState } from 'react';
import { ExternalLink, ChevronUp, Trash2 } from 'lucide-react';
import { SECTION_CONFIG } from '../config/sections';
import { buildUrl } from '../utils/urlUtils';
import { 
  clearCacheOlderThanDay, 
  clearAllCache, 
  shouldShowCacheClearButtons,
  showOnlyClearAll,
  showClearDayButton,
  showClearAllButton
} from '../services/cacheManager';

export const ExternalLinks = ({ word, onCollapseAll, onSearch }) => {
  const [cacheCleared, setCacheCleared] = useState(false);
  const showCacheButtons = shouldShowCacheClearButtons();
  const showBothButtons = showOnlyClearAll();
  const showDay = showClearDayButton();
  const showAll = showClearAllButton();

  const handleClearDay = async () => {
    await clearCacheOlderThanDay();
    setCacheCleared(true);
    if (word) {
      // Force reload by removing and re-adding cache entry
      await onSearch(word);
    }
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const handleClearAll = async () => {
    await clearAllCache();
    setCacheCleared(true);
    if (word) {
      // Force reload by removing and re-adding cache entry
      await onSearch(word);
    }
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div 
      className="mb-4 px-3 py-3 bg-white rounded-lg shadow-md border border-gray-200 flex flex-wrap justify-center gap-1.5"
      id="orgLinks"
    >
      {SECTION_CONFIG.map(({ key, baseUrl, label }) => (
        <a
          key={key}
          id={`${key}Link`}
          href={buildUrl(baseUrl, word)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs md:text-sm font-medium rounded hover:bg-gray-200 transition-all border border-gray-300 hover:shadow-sm"
        >
          {label}
          <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
        </a>
      ))}
      <button
        onClick={onCollapseAll}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500 text-white text-xs md:text-sm font-semibold rounded hover:bg-cyan-600 transition-all border border-cyan-600 hover:shadow-sm"
      >
        <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
        <span className="hidden md:inline">Collapse</span>
      </button>

      {showCacheButtons && (
        <>
          {showDay && !showBothButtons && (
            <button
              onClick={handleClearDay}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs md:text-sm font-semibold rounded transition-all border hover:shadow-sm ${
                cacheCleared 
                  ? 'bg-green-500 border-green-600' 
                  : 'bg-red-500 hover:bg-red-600 border-red-600'
              }`}
            >
              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">{cacheCleared ? 'Cleared' : 'Clear 1d'}</span>
            </button>
          )}

          {showAll && (
            <button
              onClick={handleClearAll}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs md:text-sm font-semibold rounded transition-all border hover:shadow-sm ${
                cacheCleared 
                  ? 'bg-green-500 border-green-600' 
                  : 'bg-red-600 hover:bg-red-700 border-red-700'
              }`}
            >
              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">{cacheCleared ? 'Cleared' : 'Clear All'}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};