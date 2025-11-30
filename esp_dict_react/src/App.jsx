import React, { useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { useWordRefStore } from './store/useWordRefStore';
import { getUrlParameter } from './utils/urlUtils';
import { SearchBar } from './components/SearchBar';
import { ExternalLinks } from './components/ExternalLinks';
import { SectionsList } from './components/SectionsList';

export default function WordRefSearch() {
  const { 
    word, 
    sections, 
    setWord, 
    toggleSection, 
    collapseAll, 
    handleSearch 
  } = useWordRefStore();

  const memoizedHandleSearch = useCallback(handleSearch, []);

  useEffect(() => {
    const urlWord = getUrlParameter('word');
    if (urlWord) {
      setWord(urlWord.trim());
      memoizedHandleSearch(urlWord.trim());
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const urlWord = getUrlParameter('word');
      if (urlWord) {
        setWord(urlWord.trim());
        memoizedHandleSearch(urlWord.trim());
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [memoizedHandleSearch, setWord]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-2xl md:text-3xl font-bold">WordRef Search</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <SearchBar word={word} setWord={setWord} onSearch={(searchWord) => handleSearch(searchWord)} />
        <ExternalLinks word={word} onCollapseAll={collapseAll} />
        <SectionsList sections={sections} onToggle={toggleSection} />
      </div>
    </div>
  );
}