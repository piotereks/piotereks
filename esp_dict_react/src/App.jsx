import React, { useEffect } from 'react';
import { useWordRefStore } from './store/useWordRefStore';
import { getUrlParameter } from './utils/urlUtils';
import { SearchBar } from './components/SearchBar';
import { ExternalLinks } from './components/ExternalLinks';
import { SectionsList } from './components/SectionsList';

export default function WordRefSearch() {
  const { 
    sections, 
    toggleSection, 
    collapseAll, 
    handleSearch, 
    retrySection,
    openFirstIfAllCollapsed
  } = useWordRefStore();

  useEffect(() => {
    const urlWord = getUrlParameter('word');
    if (urlWord) {
      const trimmed = urlWord.trim();
      handleSearch(trimmed);
    }
  }, []);

  useEffect(() => {
    if (
      sections.rae &&
      !sections.rae.loading &&
      (!sections.rae.content || sections.rae.content === '')
    ) {
      console.log('[AUTO-RETRY] RAE is empty after reload, triggering retry');
      retrySection('rae');
    }
  }, [sections.rae?.content, sections.rae?.loading, retrySection]);

  useEffect(() => {
    if (!Object.values(sections).some(section => section.loading)) {
      openFirstIfAllCollapsed();
    }
  }, [sections, openFirstIfAllCollapsed]);

  useEffect(() => {
    const handlePopState = () => {
      const urlWord = getUrlParameter('word');
      if (urlWord) {
        handleSearch(urlWord.trim());
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            <img src="icon.svg" alt="WordRef" className="w-5 h-5 md:w-6 md:h-6" />
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">WordRef Search</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <SearchBar onSearch={handleSearch} />
        <ExternalLinks onCollapseAll={collapseAll} onSearch={handleSearch} />
        <SectionsList sections={sections} onToggle={toggleSection} />
      </div>
    </div>
  );
}