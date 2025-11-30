import React, { useEffect, useCallback } from 'react';
import { useWordRefStore } from './store/useWordRefStore';
import { getUrlParameter } from './utils/urlUtils';
import { SearchBar } from './components/SearchBar';
import { ExternalLinks } from './components/ExternalLinks';
import { SectionsList } from './components/SectionsList';
import { wordRefStyles } from './styles/wordRefStyles';

export default function WordRefSearch() {
  const { 
    word, 
    sections, 
    setWord, 
    toggleSection, 
    collapseAll, 
    handleSearch 
  } = useWordRefStore();

  // Memoize handleSearch to prevent unnecessary re-renders
  const memoizedHandleSearch = useCallback(handleSearch, []);

  useEffect(() => {
    const urlWord = getUrlParameter('word');
    if (urlWord) {
      setWord(urlWord.trim());
      memoizedHandleSearch(urlWord.trim());
    }
  }, []);

  // Handle browser back/forward navigation
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
    <div style={{ minHeight: '100vh', padding: '1rem' }}>
      <h1 className="text-center title">WordRef Search</h1>
      
      <SearchBar word={word} setWord={setWord} onSearch={(searchWord) => handleSearch(searchWord)} />
      <ExternalLinks word={word} onCollapseAll={collapseAll} />
      <SectionsList sections={sections} onToggle={toggleSection} />
      
      <style>{wordRefStyles}</style>
    </div>
  );
}