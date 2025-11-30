import React, { useEffect } from 'react';
import { useWordRefStore } from '../store/useWordRefStore';

export const SectionItem = ({ title, isOpen, loading, content, onToggle, sectionKey }) => {
  const { setWord, handleSearch } = useWordRefStore();

  useEffect(() => {
    if (!isOpen) return;

    // Attach click handlers to links after content is rendered
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
      // Cleanup: remove event listeners
      links.forEach(link => {
        link.removeEventListener('click', null);
      });
    };
  }, [isOpen, content, sectionKey, setWord, handleSearch]);

  return (
    <div>
      <button
        id={`${sectionKey}FrameBtn`}
        onClick={onToggle}
        className={`collapsible btn btn-light btn-sm ${isOpen ? 'active' : ''}`}
      >
        {title}
      </button>
      <div 
        id={`${sectionKey}FrameContent`}
        className={`content ${isOpen ? 'show' : ''}`}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </div>
  );
};