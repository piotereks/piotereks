import React, { useEffect } from 'react';
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

  useEffect(() => {
    const urlWord = getUrlParameter('word');
    if (urlWord) {
      setWord(urlWord.trim());
      handleSearch(urlWord.trim());
    }
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlWord = getUrlParameter('word');
      if (urlWord) {
        setWord(urlWord.trim());
        handleSearch(urlWord.trim());
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleSearch, setWord]);

  return (
    <div style={{ minHeight: '100vh', padding: '1rem' }}>
      <h1 className="text-center title">WordRef Search</h1>
      
      <SearchBar word={word} setWord={setWord} onSearch={handleSearch} />
      <ExternalLinks word={word} onCollapseAll={collapseAll} />
      <SectionsList sections={sections} onToggle={toggleSection} />
      
      <style>{wordRefStyles}</style>
    </div>
  );
}