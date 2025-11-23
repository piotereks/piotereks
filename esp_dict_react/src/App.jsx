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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-center mb-6">WordRef Search</h1>
      
      <SearchBar word={word} setWord={setWord} onSearch={handleSearch} />
      <ExternalLinks word={word} onCollapseAll={collapseAll} />
      <SectionsList sections={sections} onToggle={toggleSection} />
      
      <style>{wordRefStyles}</style>
    </div>
  );
}