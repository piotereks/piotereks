// @jest-environment jsdom
import { act } from 'react';
// import { useWordRefStore } from '../../src/store/useWordRefStore';
import { createWordRefStore } from '../../src/store/useWordRefStore';
import { SECTION_CONFIG } from '../../src/config/sections';
import * as urlUtils from '../../src/utils/urlUtils';
import * as contentService from '../../src/services/contentService';

jest.mock('../../src/utils/urlUtils');
jest.mock('../../src/services/contentService');

let useWordRefStore;

beforeEach(() => {
  useWordRefStore = createWordRefStore(); // fresh store for each test
});

describe('useWordRefStore', () => {
  beforeEach(() => {
    // Arrange
    jest.clearAllMocks();
    // Silence error logs for clean test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reset Zustand store state
    act(() => {
      useWordRefStore.setState(useWordRefStore.getInitialState(), true);
    });
  });

  describe('Basic actions', () => {
    it('setWord sets the word', () => {
      // Act
      act(() => {
        useWordRefStore.getState().setWord('testword');
      });

      // Assert
      expect(useWordRefStore.getState().word).toBe('testword');
    });

    it('setIsSearching sets isSearching', () => {
      // Act
      act(() => {
        useWordRefStore.getState().setIsSearching(true);
      });

      // Assert
      expect(useWordRefStore.getState().isSearching).toBe(true);
    });

    it('toggleSection toggles isOpen for a section', () => {
      // Arrange
      const initial = useWordRefStore.getState().sections.def.isOpen;

      // Act
      act(() => {
        useWordRefStore.getState().toggleSection('def');
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.isOpen).toBe(!initial);
    });

    it('collapseAll closes all sections', () => {
      // Arrange
      act(() => {
        useWordRefStore.getState().toggleSection('def');
        useWordRefStore.getState().toggleSection('sin');
      });

      // Act
      act(() => {
        useWordRefStore.getState().collapseAll();
      });

      // Assert
      Object.values(useWordRefStore.getState().sections).forEach(section => {
        expect(section.isOpen).toBe(false);
      });
    });

    it('openFirstIfAllCollapsed opens def if all collapsed', () => {
      // Arrange
      act(() => {
        useWordRefStore.getState().collapseAll();
      });

      // Act
      act(() => {
        useWordRefStore.getState().openFirstIfAllCollapsed();
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.isOpen).toBe(true);
    });

    it('openFirstIfAllCollapsed does nothing if any section is open', () => {
      // Arrange
      act(() => {
        useWordRefStore.getState().toggleSection('sin');
      });

      // Act
      act(() => {
        useWordRefStore.getState().openFirstIfAllCollapsed();
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.isOpen).toBe(false);
      expect(useWordRefStore.getState().sections.sin.isOpen).toBe(true);
    });

    it('openFirstSection always opens def', () => {
      // Arrange
      act(() => {
        useWordRefStore.getState().toggleSection('def'); // open
        useWordRefStore.getState().toggleSection('def'); // close
      });

      // Act
      act(() => {
        useWordRefStore.getState().openFirstSection();
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.isOpen).toBe(true);
    });

    it('setSectionLoading sets loading for a section', () => {
      // Act
      act(() => {
        useWordRefStore.getState().setSectionLoading('def', true);
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.loading).toBe(true);
    });

    it('setSectionContent sets content and loading=false for a section', () => {
      // Act
      act(() => {
        useWordRefStore.getState().setSectionContent('def', 'abc');
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.content).toBe('abc');
      expect(useWordRefStore.getState().sections.def.loading).toBe(false);
    });

    it('markAllSectionsLoading sets all sections to loading and clears content', () => {
      // Arrange
      act(() => {
        useWordRefStore.getState().setSectionContent('def', 'abc');
        useWordRefStore.getState().setSectionContent('sin', 'xyz');
      });

      // Act
      act(() => {
        useWordRefStore.getState().markAllSectionsLoading();
      });

      // Assert
      Object.values(useWordRefStore.getState().sections).forEach(section => {
        expect(section.loading).toBe(true);
        expect(section.content).toBe('');
      });
    });
  });

  describe('fetchContent', () => {
    it('fetches and sets content on success (happy path)', async () => {
      // Arrange
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });
      useWordRefStore.setState({ word: 'foo' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().fetchContent(
          'https://example.com?w=foo',
          'def',
          '.selector',
          undefined,
          undefined
        );
      });

      // Assert
      expect(contentService.fetchAndDisplayContent).toHaveBeenCalled();
      expect(useWordRefStore.getState().sections.def.content).toBe('result html');
      expect(useWordRefStore.getState().retryMetadata.def).toBeNull();
    });

    it('does not set content if url word does not match current word', async () => {
      // Arrange
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });
      useWordRefStore.setState({ word: 'bar' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().fetchContent(
          'https://example.com?w=foo',
          'def',
          '.selector',
          undefined,
          undefined
        );
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.content).toBe('');
    });

    it('handles fetch error and sets retryMetadata and error content', async () => {
      // Arrange
      contentService.fetchAndDisplayContent.mockRejectedValue(new Error('fail'));
      useWordRefStore.setState({ word: 'foo' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().fetchContent(
          'https://example.com?w=foo',
          'def',
          '.selector',
          undefined,
          undefined
        );
      });

      // Assert
      expect(useWordRefStore.getState().retryMetadata.def).toEqual({
        url: 'https://example.com?w=foo',
        selector: '.selector',
        spellUrl: undefined
      });
      expect(useWordRefStore.getState().sections.def.content).toBe('Error fetching content.');
    });

    it('does not set error content if url word does not match current word on error', async () => {
      // Arrange
      contentService.fetchAndDisplayContent.mockRejectedValue(new Error('fail'));
      useWordRefStore.setState({ word: 'bar' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().fetchContent(
          'https://example.com?w=foo',
          'def',
          '.selector',
          undefined,
          undefined
        );
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.content).toBe('');
    });

    it('handles AbortError and sets loading to false', async () => {
      // Arrange
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      contentService.fetchAndDisplayContent.mockRejectedValue(abortError);
      useWordRefStore.setState({ word: 'foo' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().setSectionLoading('def', true);
        await useWordRefStore.getState().fetchContent(
          'https://example.com?w=foo',
          'def',
          '.selector',
          undefined,
          undefined
        );
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.loading).toBe(false);
    });

    it('calls setWord and handleSearch if fetchAndDisplayContent calls the callback', async () => {
      // Arrange
      const handleSearchSpy = jest.spyOn(useWordRefStore.getState(), 'handleSearch').mockResolvedValue();
      contentService.fetchAndDisplayContent.mockImplementation(async (url, selector, spellUrl, onWord, abortSignal) => {
        onWord('newword');
        return { html: 'result html' };
      });
      useWordRefStore.setState({ word: 'foo' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().fetchContent(
          'https://example.com?w=foo',
          'def',
          '.selector',
          undefined,
          undefined
        );
      });

      // Assert
      expect(useWordRefStore.getState().word).toBe('newword');
      expect(handleSearchSpy).toHaveBeenCalledWith('newword');
    });
  });

  describe('retrySection', () => {
    it('does nothing if no retryMetadata', async () => {
      // Arrange
      const setSectionLoadingSpy = jest.spyOn(useWordRefStore.getState(), 'setSectionLoading');

      // Act
      await act(async () => {
        await useWordRefStore.getState().retrySection('def');
      });

      // Assert
      expect(setSectionLoadingSpy).not.toHaveBeenCalled();
    });

    it('retries fetchContent with retryMetadata', async () => {
      // Arrange
      const fetchContentSpy = jest.spyOn(useWordRefStore.getState(), 'fetchContent').mockResolvedValue();
      useWordRefStore.setState({
        retryMetadata: {
          def: {
            url: 'https://example.com?w=foo',
            selector: '.selector',
            spellUrl: undefined
          }
        }
      });

      // Act
      await act(async () => {
        await useWordRefStore.getState().retrySection('def');
      });

      // Assert
      expect(fetchContentSpy).toHaveBeenCalledWith(
        'https://example.com?w=foo',
        'def',
        '.selector',
        undefined,
        expect.any(AbortSignal)
      );
    });
  });

  describe('handleSearch', () => {
    beforeEach(() => {
      // Arrange
      urlUtils.buildUrl.mockImplementation((baseUrl, word) => `${baseUrl}?w=${word}`);
      urlUtils.buildSpellUrl.mockImplementation((word) => `spell/${word}`);
      urlUtils.updateUrlWithWord.mockImplementation(() => {});
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });
    });

    it('returns early if searchWord is empty', async () => {
      // Arrange
      const setIsSearchingSpy = jest.spyOn(useWordRefStore.getState(), 'setIsSearching');

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('');
      });

      // Assert
      expect(setIsSearchingSpy).not.toHaveBeenCalled();
    });

    it('retries RAE if word unchanged and RAE is empty', async () => {
      // Arrange
      act(() => {
        useWordRefStore.setState(state => ({
          ...state,
          previousWord: 'foo',
          word: 'foo',
          sections: {
            ...state.sections,
            rae: { ...state.sections.rae, content: '' }
          }
        }));
      });
      // Attach the spy AFTER resetting/setting state
      const fetchContentSpy = jest.spyOn(useWordRefStore.getState(), 'fetchContent').mockResolvedValue();

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('foo');
      });

      // Assert
      expect(fetchContentSpy).toHaveBeenCalled();
    });

    it('retries RAE if word unchanged and RAE has error', async () => {
      // Arrange
      useWordRefStore.setState({
        previousWord: 'foo',
        word: 'foo',
        sections: {
          ...useWordRefStore.getState().sections,
          rae: { ...useWordRefStore.getState().sections.rae, content: 'Error fetching content.' }
        }
      });
      const fetchContentSpy = jest.spyOn(useWordRefStore.getState(), 'fetchContent').mockResolvedValue();

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('foo');
      });

      // Assert
      expect(fetchContentSpy).toHaveBeenCalled();
    });

    it('does not retry RAE if word unchanged and RAE has content', async () => {
      // Arrange
      useWordRefStore.setState({
        previousWord: 'foo',
        word: 'foo',
        sections: {
          ...useWordRefStore.getState().sections,
          rae: { ...useWordRefStore.getState().sections.rae, content: 'Some content' }
        }
      });
      const fetchContentSpy = jest.spyOn(useWordRefStore.getState(), 'fetchContent');

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('foo');
      });

      // Assert
      expect(fetchContentSpy).not.toHaveBeenCalled();
    });

    it('aborts previous search if abortController exists', async () => {
      // Arrange
      const abortController = { abort: jest.fn() };
      useWordRefStore.setState({ abortController });
      urlUtils.buildUrl.mockReturnValue('url');
      urlUtils.buildSpellUrl.mockReturnValue('spell');
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
      });

      // Assert
      expect(abortController.abort).toHaveBeenCalled();
    });

    it('starts a new search and updates state (happy path)', async () => {
      // Arrange
      urlUtils.buildUrl.mockImplementation((baseUrl, word) => `${baseUrl}?w=${word}`);
      urlUtils.buildSpellUrl.mockImplementation((word) => `spell/${word}`);
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
      });

      // Assert
      expect(useWordRefStore.getState().isSearching).toBe(false);
      expect(useWordRefStore.getState().previousWord).toBe('newword');
      expect(useWordRefStore.getState().sections.def.loading).toBe(true); // markAllSectionsLoading
      expect(useWordRefStore.getState().retryMetadata).toEqual({});
    });

    it('opens first section if all closed after def fetch', async () => {
      // Arrange
      urlUtils.buildUrl.mockImplementation((baseUrl, word) => `${baseUrl}?w=${word}`);
      urlUtils.buildSpellUrl.mockImplementation((word) => `spell/${word}`);
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });
      act(() => {
        useWordRefStore.getState().collapseAll();
      });

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.isOpen).toBe(true);
    });

    it('does not open first section if any section is open after def fetch', async () => {
      // Arrange
      urlUtils.buildUrl.mockImplementation((baseUrl, word) => `${baseUrl}?w=${word}`);
      urlUtils.buildSpellUrl.mockImplementation((word) => `spell/${word}`);
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });
      act(() => {
        useWordRefStore.getState().toggleSection('sin');
      });

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
      });

      // Assert
      expect(useWordRefStore.getState().sections.def.isOpen).toBe(false);
      expect(useWordRefStore.getState().sections.sin.isOpen).toBe(true);
    });

    it('handles AbortError during search', async () => {
      // Arrange
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      contentService.fetchAndDisplayContent.mockRejectedValue(abortError);

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
      });

      // Assert
      expect(useWordRefStore.getState().isSearching).toBe(false);
    });

    it('handles other errors during search', async () => {
      // Arrange
      contentService.fetchAndDisplayContent.mockRejectedValue(new Error('fail'));

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
      });

      // Assert
      expect(useWordRefStore.getState().isSearching).toBe(false);
    });

    it('auto-retries RAE if retryMetadata exists after search', async () => {
      // Arrange
      jest.useFakeTimers();
      const retrySectionSpy = jest.spyOn(useWordRefStore.getState(), 'retrySection').mockResolvedValue();
      urlUtils.buildUrl.mockImplementation((baseUrl, word) => `${baseUrl}?w=${word}`);
      urlUtils.buildSpellUrl.mockImplementation((word) => `spell/${word}`);
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
        useWordRefStore.setState({
          retryMetadata: { rae: { url: 'url', selector: '.sel', spellUrl: undefined } }
        });
        jest.advanceTimersByTime(500);
      });

      // Assert
      expect(retrySectionSpy).toHaveBeenCalledWith('rae');
      jest.useRealTimers();
    });

    it('does not auto-retry RAE if retryMetadata does not exist', async () => {
      // Arrange
      jest.useFakeTimers();
      const retrySectionSpy = jest.spyOn(useWordRefStore.getState(), 'retrySection').mockResolvedValue();
      urlUtils.buildUrl.mockImplementation((baseUrl, word) => `${baseUrl}?w=${word}`);
      urlUtils.buildSpellUrl.mockImplementation((word) => `spell/${word}`);
      contentService.fetchAndDisplayContent.mockResolvedValue({ html: 'result html' });

      // Act
      await act(async () => {
        await useWordRefStore.getState().handleSearch('newword');
        useWordRefStore.setState({ retryMetadata: {} });
        jest.advanceTimersByTime(500);
      });

      // Assert
      expect(retrySectionSpy).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
