import { create } from 'zustand';
import { SECTION_CONFIG } from '../config/sections';
import { buildUrl, buildSpellUrl, updateUrlWithWord } from '../utils/urlUtils';
import { fetchAndDisplayContent } from '../services/contentService';

export const useWordRefStore = create((set, get) => ({
  // State
  word: '',
  isSearching: false,
  sections: {
    def: { content: '', isOpen: true, loading: false },
    sin: { content: '', isOpen: false, loading: false },
    spen: { content: '', isOpen: false, loading: false },
    rae: { content: '', isOpen: false, loading: false },
    con: { content: '', isOpen: false, loading: false }
  },

  // Basic actions
  setWord: (word) => set({ word }),

  setIsSearching: (isSearching) => set({ isSearching }),

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
    for (const [key, section] of Object.entries(state.sections)) {
      updated[key] = { ...section, isOpen: false };
    }
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

  openAllSections: () => set((state) => {
    const updated = {};
    for (const [key, section] of Object.entries(state.sections)) {
      updated[key] = { ...section, loading: true };
    }
    return { sections: updated };
  }),

  // Complex actions
  fetchContent: async (url, sectionKey, selector, spellUrl) => {
    const { setSectionLoading, setSectionContent, setWord, handleSearch } = get();
    
    setSectionLoading(sectionKey, true);

    try {
      const result = await fetchAndDisplayContent(
        url,
        selector,
        spellUrl,
        (newWord) => {
          setWord(newWord);
          handleSearch(newWord);
        }
      );

      setSectionContent(sectionKey, result.html);
    } catch (error) {
      console.error('Error fetching content:', error);
      setSectionContent(sectionKey, 'Error fetching content.');
    }
  },

  handleSearch: async (searchWord) => {
    const { isSearching, setIsSearching, openAllSections, fetchContent } = get();
    
    // Prevent multiple simultaneous searches
    if (isSearching) return;
    
    if (!searchWord || !searchWord.trim()) return;

    const trimmedWord = searchWord.trim();

    setIsSearching(true);
    updateUrlWithWord(trimmedWord);
    openAllSections(); // Start loading all sections in background

    const fetchPromises = SECTION_CONFIG.map(section => {
      const url = buildUrl(section.baseUrl, trimmedWord);
      const spellUrl = section.hasSpellCheck ? buildSpellUrl(trimmedWord) : undefined;
      return fetchContent(url, section.key, section.selector, spellUrl);
    });

    await Promise.all(fetchPromises);
    setIsSearching(false);
  }
}));