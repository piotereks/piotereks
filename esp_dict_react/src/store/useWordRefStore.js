import { create } from 'zustand';
import { SECTION_CONFIG } from '../config/sections';
import { buildUrl, buildSpellUrl, updateUrlWithWord } from '../utils/urlUtils';
import { fetchAndDisplayContent } from '../services/contentService';

export const useWordRefStore = create((set, get) => ({
  // State
  word: '',
  isSearching: false,
  abortController: null, // Track current fetch requests
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

  // Mark all sections as loading without changing their open/closed state
  markAllSectionsLoading: () => set((state) => {
    const updated = {};
    for (const [key, section] of Object.entries(state.sections)) {
      updated[key] = { ...section, loading: true, content: '' };
    }
    return { sections: updated };
  }),

  // Complex actions
  fetchContent: async (url, sectionKey, selector, spellUrl, abortSignal) => {
    const { setSectionContent, setWord, handleSearch } = get();
    
    try {
      const result = await fetchAndDisplayContent(
        url,
        selector,
        spellUrl,
        (newWord) => {
          setWord(newWord);
          handleSearch(newWord);
        },
        abortSignal
      );

      setSectionContent(sectionKey, result.html);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch was aborted for:', sectionKey);
        return;
      }
      console.error('Error fetching content:', error);
      setSectionContent(sectionKey, 'Error fetching content.');
    }
  },

  handleSearch: async (searchWord) => {
    const { isSearching, setIsSearching, markAllSectionsLoading, fetchContent, abortController } = get();
    
    console.log('handleSearch called with:', searchWord, 'isSearching:', isSearching);
    
    // Abort previous fetch requests
    if (abortController) {
      console.log('Aborting previous search');
      abortController.abort();
    }

    // Create new AbortController for this search
    const newAbortController = new AbortController();
    set({ abortController: newAbortController });
    
    // Prevent multiple simultaneous searches
    if (isSearching) {
      console.log('Search already in progress, returning');
      return;
    }
    
    if (!searchWord || !searchWord.trim()) {
      console.log('Empty search word, returning');
      return;
    }

    const trimmedWord = searchWord.trim();
    console.log('Starting search for:', trimmedWord);

    setIsSearching(true);
    updateUrlWithWord(trimmedWord);
    markAllSectionsLoading(); // Mark sections as loading, keep open/closed state

    try {
      const fetchPromises = SECTION_CONFIG.map(section => {
        const url = buildUrl(section.baseUrl, trimmedWord);
        const spellUrl = section.hasSpellCheck ? buildSpellUrl(trimmedWord) : undefined;
        return fetchContent(url, section.key, section.selector, spellUrl, newAbortController.signal);
      });

      await Promise.all(fetchPromises);
      console.log('Search complete for:', trimmedWord);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Search was cancelled');
      } else {
        console.error('Search error:', error);
      }
    } finally {
      setIsSearching(false);
    }
  }
}));