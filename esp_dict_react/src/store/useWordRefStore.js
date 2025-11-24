import { create } from 'zustand';
import { SECTION_CONFIG } from '../config/sections';
import { buildUrl, buildSpellUrl, updateUrlWithWord } from '../utils/urlUtils';
import { 
  fetchHtml, 
  parseContent, 
  setupInternalLinks, 
  fetchSpellSuggestions 
} from '../services/contentService';

export const useWordRefStore = create((set, get) => ({
  // State
  word: '',
  sections: {
    def: { content: '', isOpen: true, loading: false },
    sin: { content: '', isOpen: false, loading: false },
    spen: { content: '', isOpen: false, loading: false },
    rae: { content: '', isOpen: false, loading: false },
    con: { content: '', isOpen: false, loading: false }
  },

  // Basic actions
  setWord: (word) => set({ word }),

  toggleSection: (sectionKey) => set((state) => ({
    sections: {
      ...state.sections,
      [sectionKey]: {
        ...state.sections[sectionKey],
        isOpen: !state.sections[sectionKey].isOpen
      }
    }
  })),

  collapseAll: () => set((state) => {
    const updated = {};
    Object.keys(state.sections).forEach(key => {
      updated[key] = { ...state.sections[key], isOpen: false };
    });
    return { sections: updated };
  }),

  setSectionLoading: (sectionKey, loading) => set((state) => ({
    sections: {
      ...state.sections,
      [sectionKey]: { ...state.sections[sectionKey], loading }
    }
  })),

  setSectionContent: (sectionKey, content) => set((state) => ({
    sections: {
      ...state.sections,
      [sectionKey]: { ...state.sections[sectionKey], content, loading: false }
    }
  })),

  openFirstSection: () => set((state) => ({
    sections: {
      ...state.sections,
      def: { ...state.sections.def, isOpen: true, loading: true }
    }
  })),

  // Complex actions
  fetchContent: async (url, sectionKey, selector, spellUrl) => {
    const { setSectionLoading, setSectionContent, setWord, handleSearch } = get();
    
    setSectionLoading(sectionKey, true);

    try {
      const html = await fetchHtml(url);
      let content = parseContent(html, selector);
      
      setupInternalLinks(content, (newWord) => {
        setWord(newWord);
        handleSearch(newWord);
      });

      if ((!content || content.innerHTML.trim() === '') && spellUrl) {
        content = await fetchSpellSuggestions(spellUrl, (newWord) => {
          setWord(newWord);
          handleSearch(newWord);
        });
      }

      setSectionContent(
        sectionKey,
        content && content.innerHTML.trim() ? content.innerHTML : 'No content found.'
      );
    } catch (error) {
      console.error('Error fetching content:', error);
      setSectionContent(sectionKey, 'Error fetching content.');
    }
  },

  handleSearch: async (searchWord) => {
    const { word, openFirstSection, fetchContent } = get();
    const wordToSearch = searchWord || word;
    
    if (!wordToSearch.trim()) return;

    const trimmedWord = wordToSearch.trim();
    updateUrlWithWord(trimmedWord);
    openFirstSection();

    const fetchPromises = SECTION_CONFIG.map(section => {
      const url = buildUrl(section.baseUrl, trimmedWord);
      const spellUrl = section.hasSpellCheck ? buildSpellUrl(trimmedWord) : undefined;
      return fetchContent(url, section.key, section.selector, spellUrl);
    });

    await Promise.all(fetchPromises);
  }
}));