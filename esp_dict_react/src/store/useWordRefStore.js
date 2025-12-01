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

  setSectionLoading: (sectionKey, loading) => set((state) => {
    console.log(`[STORE] setSectionLoading: ${sectionKey} = ${loading}`);
    return {
      sections: {
        ...state.sections,
        [sectionKey]: { ...state.sections[sectionKey], loading }
      }
    };
  }),

  setSectionContent: (sectionKey, content) => set((state) => {
    console.log(`[STORE] setSectionContent: ${sectionKey}, content length: ${content ? content.length : 0}, loading: false`);
    return {
      sections: {
        ...state.sections,
        [sectionKey]: { ...state.sections[sectionKey], content, loading: false }
      }
    };
  }),

  // Mark all sections as loading without changing their open/closed state
  markAllSectionsLoading: () => set((state) => {
    console.log('[STORE] markAllSectionsLoading - setting all sections to loading');
    const updated = {};
    for (const [key, section] of Object.entries(state.sections)) {
      updated[key] = { ...section, loading: true, content: '' };
    }
    return { sections: updated };
  }),

  // Store retry metadata
  retryMetadata: {},

  // Complex actions
  fetchContent: async (url, sectionKey, selector, spellUrl, abortSignal) => {
    const { setSectionContent, setSectionLoading, setWord, handleSearch } = get();
    
    console.log(`[FETCH] Starting fetch for ${sectionKey}: ${url}`);
    
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

      console.log(`[FETCH] Successful fetch for ${sectionKey}, result length: ${result.html ? result.html.length : 0}`);
      setSectionContent(sectionKey, result.html);
      // Clear retry metadata on success
      set((state) => ({
        retryMetadata: {
          ...state.retryMetadata,
          [sectionKey]: null
        }
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`[FETCH] Fetch was aborted for: ${sectionKey}`);
        // Use setSectionLoading to explicitly stop loading
        setSectionLoading(sectionKey, false);
        return;
      }
      console.error(`[FETCH] Error fetching content for: ${sectionKey}`, error.message);
      // Store retry metadata for failed fetch using proper state update
      set((state) => ({
        retryMetadata: {
          ...state.retryMetadata,
          [sectionKey]: { url, selector, spellUrl }
        }
      }));
      console.log(`[FETCH] Stored retry metadata for ${sectionKey}`);
      // Set error message AND stop loading
      setSectionContent(sectionKey, 'Error fetching content.');
    }
  },

  // Retry failed section fetch
  retrySection: async (sectionKey) => {
    const { retryMetadata, word, fetchContent } = get();
    const metadata = retryMetadata[sectionKey];
    
    if (!metadata) {
      console.log(`[RETRY] No retry metadata for ${sectionKey}`);
      return;
    }
    
    console.log(`[RETRY] Retrying ${sectionKey} with word: ${word}`);
    const { setSectionLoading } = get();
    setSectionLoading(sectionKey, true);
    
    // Create a fresh AbortController for this retry (don't use the old one)
    const retryAbortController = new AbortController();
    
    await fetchContent(
      metadata.url,
      sectionKey,
      metadata.selector,
      metadata.spellUrl,
      retryAbortController.signal
    );
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
    
    // Clear previous retry metadata for this search
    set({ retryMetadata: {} });

    try {
      const fetchPromises = SECTION_CONFIG.map(section => {
        const url = buildUrl(section.baseUrl, trimmedWord);
        const spellUrl = section.hasSpellCheck ? buildSpellUrl(trimmedWord) : undefined;
        return fetchContent(url, section.key, section.selector, spellUrl, newAbortController.signal);
      });

      // Use allSettled to handle individual fetch failures gracefully
      const results = await Promise.allSettled(fetchPromises);
      console.log('Search complete for:', trimmedWord);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Search was cancelled');
      } else {
        console.error('Search error:', error);
      }
    } finally {
      setIsSearching(false);
      
      // After search completes, check if RAE failed and auto-retry
      setTimeout(() => {
        const currentState = get();
        const raeFailed = currentState.retryMetadata['rae'];
        console.log('[CHECK-RETRY] RAE retry metadata:', raeFailed);
        if (raeFailed) {
          console.log('[AUTO-RETRY] RAE fetch failed, triggering retry');
          const { retrySection } = get();
          retrySection('rae');
        }
      }, 500);
    }
  }
}));