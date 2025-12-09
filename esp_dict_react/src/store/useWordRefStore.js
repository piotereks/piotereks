import {create} from 'zustand';
import {SECTION_CONFIG} from '../config/sections';
import {buildUrl, buildSpellUrl, updateUrlWithWord} from '../utils/urlUtils';
import {fetchAndDisplayContent} from '../services/contentService';

// Factory function to create a fresh store instance
export const createWordRefStore = () => create((set, get) => ({
    // State
    word: '',
    previousWord: '', // Track last searched word to avoid unnecessary reloads
    isSearching: false,
    abortController: null, // Track RAE fetch requests only
    sections: {
        def: {content: '', isOpen: false, loading: false},
        sin: {content: '', isOpen: false, loading: false},
        spen: {content: '', isOpen: false, loading: false},
        rae: {content: '', isOpen: false, loading: false},
        con: {content: '', isOpen: false, loading: false}
    },

    // Basic actions
    setWord: (word) => set({word}),

    setIsSearching: (isSearching) => set({isSearching}),

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
            updated[key] = {...section, isOpen: false};
        }
        return {sections: updated};
    }),

    // Open first section if all are collapsed (only on initial load or after search)
    openFirstIfAllCollapsed: () => set((state) => {
        const allCollapsed = Object.values(state.sections).every(section => !section.isOpen);
        if (allCollapsed) {
            console.log('[STORE] All sections collapsed, opening first section (def)');
            return {
                sections: {
                    ...state.sections,
                    def: {...state.sections.def, isOpen: true}
                }
            };
        }
        return state;
    }),

    // Force open first section (used after search)
    openFirstSection: () => set((state) => {
        console.log('[STORE] Force opening first section (def)');
        return {
            sections: {
                ...state.sections,
                def: {...state.sections.def, isOpen: true}
            }
        };
    }),

    setSectionLoading: (sectionKey, loading) => set((state) => {
        console.log(`[STORE] setSectionLoading: ${sectionKey} = ${loading}`);
        return {
            sections: {
                ...state.sections,
                [sectionKey]: {...state.sections[sectionKey], loading}
            }
        };
    }),

    setSectionContent: (sectionKey, content) => set((state) => {
        console.log(`[STORE] setSectionContent: ${sectionKey}, content length: ${content ? content.length : 0}, loading: false`);
        return {
            sections: {
                ...state.sections,
                [sectionKey]: {...state.sections[sectionKey], content, loading: false}
            }
        };
    }),

    // Mark all sections as loading without changing their open/closed state
    markAllSectionsLoading: () => set((state) => {
        console.log('[STORE] markAllSectionsLoading - setting all sections to loading');
        const updated = {};
        for (const [key, section] of Object.entries(state.sections)) {
            updated[key] = {...section, loading: true, content: ''};
        }
        return {sections: updated};
    }),

    // Store retry metadata
    retryMetadata: {},

    // Complex actions
    fetchContent: async (url, sectionKey, selector, spellUrl, abortSignal) => {
        const {setSectionContent, setSectionLoading, word: currentWord, abortController} = get();

        console.log(`[FETCH] Starting fetch for ${sectionKey}: ${url}`);

        // Extract the word being fetched from the URL
        const urlWordMatch = url.match(/[?&]w=([^&]+)/) || url.match(/[?&]word=([^&]+)/);
        const urlWord = urlWordMatch ? decodeURIComponent(urlWordMatch[1]) : null;

        try {
            const result = await fetchAndDisplayContent(
                url,
                selector,
                spellUrl,
                (newWord) => {
                    get().setWord(newWord);
                    get().handleSearch(newWord);
                },
                sectionKey,
                abortSignal,
                currentWord
            );

            // Only update section if word matches current store word
            if (!urlWord || urlWord === currentWord) {
                console.log(`[FETCH] Successful fetch for ${sectionKey}, result length: ${result.html ? result.html.length : 0}`);
                setSectionContent(sectionKey, result.html);
                // Clear retry metadata on success
                set((state) => ({
                    retryMetadata: {
                        ...state.retryMetadata,
                        [sectionKey]: null
                    }
                }));
            } else {
                console.log(`[FETCH] Ignored fetch for ${sectionKey} (word mismatch: ${urlWord} !== ${currentWord})`);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`[FETCH] Fetch was aborted for: ${sectionKey}`);
                // Use setSectionLoading to explicitly stop loading
                setSectionLoading(sectionKey, false);
                return;
            }
            if (error.isDefinitionNotFound) {
                console.log(`[FETCH] Definition not found for: ${sectionKey}, aborting RAE`);
                if (abortController) {
                    abortController.abort();
                }
                setSectionContent(sectionKey, 'No content found.');
                return;
            }
            console.error(`[FETCH] Error fetching content for: ${sectionKey}`, error.message);
            // Store retry metadata for failed fetch using proper state update
            set((state) => ({
                retryMetadata: {
                    ...state.retryMetadata,
                    [sectionKey]: {url, selector, spellUrl}
                }
            }));
            console.log(`[FETCH] Stored retry metadata for ${sectionKey}`);
            // Only set error if word matches current
            if (!urlWord || urlWord === currentWord) {
                setSectionContent(sectionKey, 'Error fetching content.');
            } else {
                console.log(`[FETCH] Ignored error for ${sectionKey} (word mismatch: ${urlWord} !== ${currentWord})`);
            }
        }
    },

    // Retry failed section fetch
    retrySection: async (sectionKey) => {
        const {retryMetadata, word, fetchContent} = get();
        const metadata = retryMetadata[sectionKey];

        if (!metadata) {
            console.log(`[RETRY] No retry metadata for ${sectionKey}`);
            return;
        }

        console.log(`[RETRY] Retrying ${sectionKey} with word: ${word}`);
        const {setSectionLoading} = get();
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
        const {
            isSearching,
            setIsSearching,
            markAllSectionsLoading,
            fetchContent,
            abortController,
            previousWord,
            sections,
            openFirstIfAllCollapsed
        } = get();

        console.log('handleSearch called with:', searchWord, 'previousWord:', previousWord);

        // Abort previous RAE fetch request only
        if (abortController) {
            console.log('Aborting previous RAE search');
            abortController.abort();
        }

        // Create new AbortController for RAE fetch only
        const newAbortController = new AbortController();
        set({abortController: newAbortController});

        if (!searchWord || !searchWord.trim()) {
            console.log('Empty search word, returning');
            return;
        }

        const trimmedWord = searchWord.trim();

        // Check if word has changed
        if (trimmedWord === previousWord) {
            console.log(`[SKIP] Word unchanged (${trimmedWord}), only retrying RAE if needed`);
            openFirstIfAllCollapsed();
            // Only retry RAE if it's empty or failed
            if (!sections.rae.content || sections.rae.content.includes('Error')) {
                console.log('[RETRY] RAE is empty/failed, retrying');
                setIsSearching(true);
                const raeUrl = buildUrl(SECTION_CONFIG.find(s => s.key === 'rae').baseUrl, trimmedWord);
                const raeSelector = SECTION_CONFIG.find(s => s.key === 'rae').selector;
                await fetchContent(raeUrl, 'rae', raeSelector, undefined, newAbortController.signal);
                setIsSearching(false);

            }
            return;
        }

        console.log('Starting search for:', trimmedWord);

        setIsSearching(true);
        updateUrlWithWord(trimmedWord);

        // Store current word as previous before starting new search
        set({word: trimmedWord, previousWord: trimmedWord});
        markAllSectionsLoading(); // Mark sections as loading, keep open/closed state
        //
        // // Clear previous retry metadata for this search
        set({retryMetadata: {}});

        try {
            const fetchPromises = SECTION_CONFIG.map(section => {
                const url = buildUrl(section.baseUrl, trimmedWord);
                const spellUrl = section.hasSpellCheck ? buildSpellUrl(trimmedWord) : undefined;

                // Only pass abortSignal for RAE section
                const signal = section.key === 'rae' ? newAbortController.signal : null;

                return fetchContent(url, section.key, section.selector, spellUrl, signal);
            });

            // Get the definition fetch promise (first section)
            const defFetchPromise = fetchPromises[0];

            // Wait for definition to complete, then open first section ONLY if all are currently closed
            defFetchPromise.then(() => {
                console.log('[SEARCH] Definition fetch complete, checking if should open first section');
                const currentState = get();
                const allClosed = Object.values(currentState.sections).every(section => !section.isOpen);
                if (allClosed) {
                    console.log('[SEARCH] All sections closed, opening first section');
                    get().openFirstSection();
                } else {
                    console.log('[SEARCH] Some sections already open, not forcing first section open');
                }
            });

            // Continue with all fetches in parallel
            await Promise.allSettled(fetchPromises);
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
                    const {retrySection} = get();
                    retrySection('rae');
                }
            }, 500);
        }
    }
}));

// Default singleton store for app usage
export const useWordRefStore = createWordRefStore();
