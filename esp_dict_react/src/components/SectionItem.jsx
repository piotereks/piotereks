import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWordRefStore } from '../store/useWordRefStore';

export const SectionItem = ({ title, isOpen, loading, content, onToggle, sectionKey }) => {
  const { setWord, handleSearch } = useWordRefStore();

  useEffect(() => {
    if (!isOpen) return;

    const contentDiv = document.getElementById(`${sectionKey}FrameContent`);
    if (!contentDiv) return;

    const links = contentDiv.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes('?word=')) {
        const wordParam = new URL(`http://localhost${href}`).searchParams.get('word');
        
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (wordParam) {
            setWord(wordParam);
            handleSearch(wordParam);
          }
        });
      }
    });

    return () => {
      links.forEach(link => {
        link.removeEventListener('click', null);
      });
    };
  }, [isOpen, content, sectionKey, setWord, handleSearch]);

  return (
    <div className="mb-2">
      <button
        id={`${sectionKey}FrameBtn`}
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-semibold transition-all border-2 shadow-sm hover:shadow-md text-sm md:text-base ${
          isOpen 
            ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
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
        ) : (
          <div className="px-4 py-3 text-gray-800 leading-relaxed prose prose-sm max-w-none text-sm md:text-base" dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </div>
  );
};