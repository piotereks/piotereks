import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWordRefStore } from '../store/useWordRefStore';

export const SectionItem = ({ title, isOpen, loading, content, onToggle, sectionKey }) => {
  const { setWord, handleSearch, retrySection } = useWordRefStore();
  const linkHandlersRef = useRef(new Map());

  useEffect(() => {
    if (!isOpen) return;

    const contentDiv = document.getElementById(`${sectionKey}FrameContent`);
    if (!contentDiv) return;

    const links = contentDiv.querySelectorAll('a');
    
    // Clear old handlers for this section
    if (linkHandlersRef.current.has(sectionKey)) {
      const oldHandlers = linkHandlersRef.current.get(sectionKey);
      oldHandlers.forEach(({ link, handler }) => {
        link.removeEventListener('click', handler);
      });
    }

    const handlers = [];
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes('?word=')) {
        const wordParam = new URL(`http://localhost${href}`).searchParams.get('word');
        
        const handler = (e) => {
          e.preventDefault();
          if (wordParam) {
            setWord(wordParam);
            handleSearch(wordParam);
          }
        };

        link.addEventListener('click', handler);
        handlers.push({ link, handler });
      }
    });

    linkHandlersRef.current.set(sectionKey, handlers);

    return () => {
      handlers.forEach(({ link, handler }) => {
        link.removeEventListener('click', handler);
      });
    };
  }, [isOpen, content, sectionKey, setWord, handleSearch]);

    const isErrorContent = typeof content === 'string' && content.includes('Error fetching');

    // Remove initial <br> or <br/> from content
  const cleanedContent = typeof content === 'string'
    ? content.replace(/^\s*<br\s*\/?>/i, '')
    : content;

  return (
    <div className="mb-2">
      <button
        id={`${sectionKey}FrameBtn`}
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-semibold transition-all border-2 shadow-sm hover:shadow-md text-sm md:text-base ${
          isOpen 
            ? 'bg-gray-400 text-white border-gray-500 shadow-md' 
            : 'bg-gray-200 text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-250'
        }`}
      >
        <span className="capitalize">{title}</span>
        <ChevronDown 
          className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div 
        id={`${sectionKey}FrameContent`}
        className={`overflow-hidden bg-white border-2 border-t-0 border-gray-200 rounded-b-lg transition-all ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : isErrorContent ? (
          <div className="px-4 py-3 text-red-600 flex items-center justify-between">
            <span>{content}</span>
            <button
              onClick={() => retrySection(sectionKey)}
              className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        ) : (
          <div
            className={
              sectionKey === 'rae'
                ? 'rae-content px-4 py-3 text-gray-800 leading-relaxed prose prose-sm max-w-none text-sm md:text-base'
                : 'px-4 py-3 text-gray-800 leading-relaxed prose prose-sm max-w-none text-sm md:text-base'
            }
            dangerouslySetInnerHTML={{ __html: cleanedContent }}
          />
        )}
      </div>
    </div>
  );
};