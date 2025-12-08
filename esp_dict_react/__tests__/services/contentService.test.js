import { act } from 'react';
// Tests for contentService.js

import {
    fetchHtml,
    parseContent,
    fetchSpellSuggestions,
    fetchAndDisplayContent,
    setupLinksOnContent
} from '../../src/services/contentService';

import * as cacheService from '../../src/services/cacheService';
import * as contentService from '../../src/services/contentService';

// Mock global fetch and DOMParser
global.fetch = jest.fn();
global.DOMParser = jest.fn().mockImplementation(() => ({
    parseFromString: jest.fn()
}));

// Mock setupLinksOnContent function
jest.mock('../../src/services/contentService', () => {
    const actual = jest.requireActual('../../src/services/contentService');
    return {
        ...actual,
        setupLinksOnContent: jest.fn()
    };
});

const flushPromises = () => new Promise(setImmediate);

describe('fetchHtml', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches HTML successfully (no CORS proxy)', async () => {
        const url = 'https://example.com/page';
        const text = jest.fn().mockResolvedValue('<html>ok</html>');
        global.fetch.mockResolvedValue({ ok: true, text });

        const result = await fetchHtml(url);

        expect(global.fetch).toHaveBeenCalledWith(url, { signal: null });
        expect(result).toBe('<html>ok</html>');
    });

    it('fetches HTML successfully (with CORS proxy)', async () => {
        const url = 'https://dle.rae.es/word';
        const json = jest.fn().mockResolvedValue({ contents: '<html>proxied</html>' });
        global.fetch.mockResolvedValue({ ok: true, json });

        const result = await fetchHtml(url);

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.allorigins.win/get?url=https%3A%2F%2Fdle.rae.es%2Fword',
            { signal: null }
        );
        expect(result).toBe('<html>proxied</html>');
    });

    it('retries on CORS proxy HTTP error and succeeds', async () => {
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        global.fetch
            .mockResolvedValueOnce({ ok: false, status: 502 })
            .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ contents: 'abc' }) });

        const result = await fetchHtml(url);

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenCalled();
        expect(result).toBe('abc');
        warnSpy.mockRestore();
    });

    it('returns null after max retries on CORS proxy HTTP error', async () => {
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({ ok: false, status: 502 });

        const result = await fetchHtml(url);

        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        expect(result).toBeNull();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it('returns null on non-proxy HTTP error', async () => {
        const url = 'https://example.com/page';
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({ ok: false, status: 404 });

        const result = await fetchHtml(url);

        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('retries on CORS proxy network error and succeeds', async () => {
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        global.fetch
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ contents: 'abc' }) });

        const result = await fetchHtml(url);

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenCalled();
        expect(result).toBe('abc');
        warnSpy.mockRestore();
    });

    it('returns null after max retries on CORS proxy network error', async () => {
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValue(new Error('Network error'));

        const result = await fetchHtml(url);

        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        expect(result).toBeNull();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it('throws on AbortError', async () => {
        const url = 'https://example.com/page';
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        global.fetch.mockRejectedValue(abortError);

        await expect(fetchHtml(url)).rejects.toThrow('Aborted');
    });

    it('returns null on non-proxy network error', async () => {
        const url = 'https://example.com/page';
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValue(new Error('Network error'));

        const result = await fetchHtml(url);

        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('returns null if CORS proxy response has no contents', async () => {
        const url = 'https://dle.rae.es/word';
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

        const result = await fetchHtml(url);

        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});

describe('parseContent', () => {
    let mockDoc, mockContent, mockBrowserInfo;

    beforeEach(() => {
        mockBrowserInfo = { remove: jest.fn() };
        mockContent = {
            querySelector: jest.fn().mockReturnValue(null),
            innerHTML: '<div>content</div>'
        };
        mockDoc = {
            querySelector: jest.fn().mockReturnValue(mockContent)
        };
        global.DOMParser.mockImplementation(() => ({
            parseFromString: jest.fn().mockReturnValue(mockDoc)
        }));
    });

    it('parses content and removes #browserInfo if present', () => {
        mockContent.querySelector.mockReturnValueOnce(mockBrowserInfo);

        const result = parseContent('<html></html>', 'div');

        expect(result).toBe(mockContent);
        expect(mockContent.querySelector).toHaveBeenCalledWith('#browserInfo');
        expect(mockBrowserInfo.remove).toHaveBeenCalled();
    });

    it('parses content and does nothing if #browserInfo not present', () => {
        mockContent.querySelector.mockReturnValueOnce(null);

        const result = parseContent('<html></html>', 'div');

        expect(result).toBe(mockContent);
        expect(mockContent.querySelector).toHaveBeenCalledWith('#browserInfo');
    });

    it('returns null if selector not found', () => {
        mockDoc.querySelector.mockReturnValueOnce(null);

        const result = parseContent('<html></html>', 'div');

        expect(result).toBeNull();
    });
});

describe('fetchSpellSuggestions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns table with links updated and handlers attached', async () => {
        const html = '<table><tr><td><a href="word1">w1</a></td></tr></table>';
        const table = {
            querySelectorAll: jest.fn().mockReturnValue([
                {
                    getAttribute: jest.fn().mockReturnValue('word1'),
                    setAttribute: jest.fn(),
                    onclick: null
                }
            ]),
            outerHTML: '<table>...</table>'
        };
        const doc = {
            querySelector: jest.fn().mockReturnValue(table)
        };
        global.fetch.mockResolvedValue({ text: jest.fn().mockResolvedValue(html) });
        global.DOMParser.mockImplementation(() => ({
            parseFromString: jest.fn().mockReturnValue(doc)
        }));
        const onWordClick = jest.fn();

        const result = await fetchSpellSuggestions('spellurl', onWordClick);

        expect(result).toBe(table);
        expect(table.querySelectorAll).toHaveBeenCalledWith('a');
        expect(table.querySelectorAll()[0].setAttribute).toHaveBeenCalledWith('href', '?word=word1');
        expect(typeof table.querySelectorAll()[0].onclick).toBe('function');
    });

    it('returns null if no table found', async () => {
        const html = '<div>No table</div>';
        const doc = {
            querySelector: jest.fn().mockReturnValue(null)
        };
        global.fetch.mockResolvedValue({ text: jest.fn().mockResolvedValue(html) });
        global.DOMParser.mockImplementation(() => ({
            parseFromString: jest.fn().mockReturnValue(doc)
        }));

        const result = await fetchSpellSuggestions('spellurl', jest.fn());

        expect(result).toBeNull();
    });

    it('returns null and logs error on fetch error', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValue(new Error('fail'));

        const result = await fetchSpellSuggestions('spellurl', jest.fn());

        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});

describe('fetchAndDisplayContent', () => {
    let parserMock, docMock, contentMock, browserInfoMock, onWordClick;

    beforeEach(() => {
        jest.clearAllMocks();
        onWordClick = jest.fn();
        browserInfoMock = { remove: jest.fn() };
        contentMock = {
            querySelector: jest.fn().mockReturnValue(null),
            innerText: 'Some content',
            innerHTML: '<div>Some content</div>'
        };
        docMock = {
            querySelector: jest.fn().mockReturnValue(contentMock)
        };
        parserMock = {
            parseFromString: jest.fn().mockReturnValue(docMock)
        };
        global.DOMParser.mockImplementation(() => parserMock);
        jest.spyOn(cacheService, 'generateCacheKey').mockImplementation((url, sel) => `key:${url}:${sel}`);
        jest.spyOn(cacheService, 'getCachedContent').mockResolvedValue(null);
        jest.spyOn(cacheService, 'cacheContent').mockResolvedValue();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        // Spy on setupLinksOnContent if it's exported, otherwise it will just do nothing
        try {
            jest.spyOn(require('../../src/services/contentService'), 'setupLinksOnContent').mockImplementation(() => {});
        } catch (e) {
            // setupLinksOnContent might not be exported, that's okay
        }
    });

    it('returns cached content if available', async () => {
        // const cachedHtml = '<div id="main">Cached</div>';
        // cacheService.getCachedContent.mockResolvedValueOnce(cachedHtml);

        const mockCachedContent = document.createElement('div');
        mockCachedContent.id = 'main';
        mockCachedContent.innerHTML = 'Cached';
        // Outer wrapper
        const outerDiv = document.createElement('div');
        outerDiv.appendChild(mockCachedContent); // now #main is inside outerDiv

        // Mock the cache to return outerDiv
        cacheService.getCachedContent.mockResolvedValueOnce(outerDiv);


        const mockDoc = {
            querySelector: jest.fn().mockReturnValue(outerDiv)
        };

        parserMock.parseFromString.mockReturnValueOnce(mockDoc);

        const result = await fetchAndDisplayContent('url', '#main', null, onWordClick);

        expect(result).toEqual({
            html: '<div id="main">Cached</div>',
            hasContent: true
        });
        expect(cacheService.getCachedContent).toHaveBeenCalledWith('key:url:#main');
    });

it('fetches from network and caches if content found', async () => {
  // No cached content
  cacheService.getCachedContent.mockResolvedValueOnce(null);

  // Mock fetch to return HTML
  jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    text: jest.fn().mockResolvedValue('<div id="main">Network</div>')
  });

  // Create the actual DOM element as returned by parser
  const mockNetworkContent = document.createElement('div');
  mockNetworkContent.id = 'main';
  mockNetworkContent.innerHTML = 'Network';

  // Optional outer wrapper (like cached test)
  const outerDiv = document.createElement('div');
  outerDiv.appendChild(mockNetworkContent);

  // Mock the parser to return a document-like object
  parserMock.parseFromString.mockReturnValueOnce({
    querySelector: jest.fn().mockImplementation((selector) => {
      if (selector === '#main') return outerDiv;
      return null;
    })
  });

  const result = await fetchAndDisplayContent('url', '#main', null, onWordClick);

  expect(result).toEqual({
    html: '<div id="main">Network</div>',
    hasContent: true
  });

  // Ensure the result was cached
  expect(cacheService.cacheContent).toHaveBeenCalledWith(
    'key:url:#main',
    expect.any(String) // the HTML string that was fetched
  );
});


    it('does not cache if no content found and no spellUrl', async () => {
        // No cached content
        cacheService.getCachedContent.mockResolvedValueOnce(null);

        // Mock fetch to return empty HTML
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue('<div id="main"></div>')
        });

        // Create actual DOM element with no content
        const mockEmptyContent = document.createElement('div');
        mockEmptyContent.id = 'main';
        mockEmptyContent.innerHTML = ''; // empty inner content

        // Optional outer wrapper
        const outerDiv = document.createElement('div');
        outerDiv.appendChild(mockEmptyContent);

        // Mock the parser to return a document-like object
        parserMock.parseFromString.mockReturnValueOnce({
            querySelector: jest.fn().mockImplementation((selector) => {
                if (selector === '#main') return mockEmptyContent; // return inner element
                return null;
            })
        });

        const result = await fetchAndDisplayContent('url', '#main', null, onWordClick);

        expect(result).toEqual({
            html: 'No content found.',
            hasContent: false
        });

        // Ensure nothing is cached
        expect(cacheService.cacheContent).not.toHaveBeenCalled();
    });


    it('tries spell suggestions if fetchHtml returns null', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue('<table>spell</table>')
        });

        // No cached content
        cacheService.getCachedContent.mockResolvedValueOnce(null);

        // Mock fetch to fail for the main request
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        // Create a real table element to simulate spell suggestion
        const spellTable = document.createElement('table');
        spellTable.innerHTML = 'spell';

        // Optional outer wrapper
        const outerDiv = document.createElement('div');
        outerDiv.appendChild(spellTable);

        // Mock parser to return correct elements
        parserMock.parseFromString.mockReturnValueOnce({
            querySelector: jest.fn().mockImplementation((selector) => {
                if (selector === '#main') return outerDiv;
                if (selector === 'table') return spellTable;
                return null;
            })
        });

        const onWordClick = jest.fn();
        const result = await fetchAndDisplayContent('url', '#main', 'spellurl', onWordClick);

        expect(result).toEqual({
            html: outerDiv.innerHTML,
            hasContent: true
        });
    });

    it('returns error if fetchHtml and spell suggestions both fail', async () => {
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });
        parserMock.parseFromString.mockReturnValueOnce({ querySelector: jest.fn().mockReturnValue(null) });

        const result = await fetchAndDisplayContent('url', '#main', 'spellurl', onWordClick);

        expect(result).toEqual({ html: 'Error fetching content.', hasContent: false });
    });

    it('tries spell suggestions if no content found after fetch', async () => {
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue('<div id="main"></div>')
        });
        const emptyContent = {
            querySelector: jest.fn().mockReturnValue(null),
            innerText: '',
            innerHTML: '<div id="main"></div>'
        };
        docMock.querySelector.mockImplementation((selector) => {
            if (selector === '#main') return emptyContent;
            return null;
        });
        const table = { outerHTML: '<table>spell</table>', querySelectorAll: jest.fn().mockReturnValue([]) };
        parserMock.parseFromString.mockReturnValueOnce(docMock);
        parserMock.parseFromString.mockReturnValueOnce({ querySelector: jest.fn().mockReturnValue(table) });

        const result = await fetchAndDisplayContent('url', '#main', 'spellurl', onWordClick);

        expect(result).toEqual({ html: '<table>spell</table>', hasContent: true });
        expect(cacheService.cacheContent).toHaveBeenCalled();
    });

    it('returns no content found if no content and no spell suggestions', async () => {
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValue('<div id="main"></div>')
        });
        const emptyContent = {
            querySelector: jest.fn().mockReturnValue(null),
            innerText: '',
            innerHTML: '<div id="main"></div>'
        };
        docMock.querySelector.mockReturnValueOnce(emptyContent);
        parserMock.parseFromString.mockReturnValueOnce(docMock);
        parserMock.parseFromString.mockReturnValueOnce({ querySelector: jest.fn().mockReturnValue(null) });

        const result = await fetchAndDisplayContent('url', '#main', 'spellurl', onWordClick);

        expect(result).toEqual({ html: 'No content found.', hasContent: false });
        expect(cacheService.cacheContent).not.toHaveBeenCalled();
    });

    it('throws on AbortError', async () => {
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        jest.spyOn(global, 'fetch').mockRejectedValueOnce(abortError);

        await expect(fetchAndDisplayContent('url', '#main', null, onWordClick)).rejects.toThrow('Aborted');
    });

    it('returns error on unexpected error', async () => {
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('fail'));

        const result = await fetchAndDisplayContent('url', '#main', null, onWordClick);

        expect(result).toEqual({ html: 'Error fetching content.', hasContent: false });
    });
});


// Updated __tests__/services/contentService.test.js - Add these new tests

describe('fetchAndDisplayContent - 404 handling and "No content found" messages', () => {
    let parserMock, docMock, contentMock, onWordClick;

    beforeEach(() => {
        jest.clearAllMocks();
        onWordClick = jest.fn();
        contentMock = {
            querySelector: jest.fn().mockReturnValue(null),
            innerText: '',
            innerHTML: ''
        };
        docMock = {
            querySelector: jest.fn().mockReturnValue(contentMock)
        };
        parserMock = {
            parseFromString: jest.fn().mockReturnValue(docMock)
        };
        global.DOMParser.mockImplementation(() => parserMock);
        jest.spyOn(cacheService, 'generateCacheKey').mockImplementation((url, sel) => `key:${url}:${sel}`);
        jest.spyOn(cacheService, 'getCachedContent').mockResolvedValue(null);
        jest.spyOn(cacheService, 'cacheContent').mockResolvedValue();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('returns "No content found for \\"word\\"" for sin section on 404', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        // Act
        const result = await fetchAndDisplayContent(
            'https://example.com/sinonimos/gato',
            '#main',
            null,
            onWordClick,
            'sin',
            null,
            'gato'
        );

        // Assert
        expect(result).toEqual({
            html: 'No content found for "gato"',
            hasContent: false
        });
    });

    it('returns "No content found for \\"word\\"" for con section on 404', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        // Act
        const result = await fetchAndDisplayContent(
            'https://example.com/conj/esverbs.aspx?v=perro',
            '#main',
            null,
            onWordClick,
            'con',
            null,
            'perro'
        );

        // Assert
        expect(result).toEqual({
            html: 'No content found for "perro"',
            hasContent: false
        });
    });

    it('returns "No content found for \\"word\\"" for spen section on 404', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        // Act
        const result = await fetchAndDisplayContent(
            'https://example.com/es/en/translation.asp?spen=casa',
            '#main',
            null,
            onWordClick,
            'spen',
            null,
            'casa'
        );

        // Assert
        expect(result).toEqual({
            html: 'No content found for "casa"',
            hasContent: false
        });
    });

    it('extracts word from URL if not provided for sin', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        // Act
        const result = await fetchAndDisplayContent(
            'https://example.com/sinonimos/libro',
            '#main',
            null,
            onWordClick,
            'sin',
            null
            // word not provided - should be extracted from URL
        );

        // Assert
        expect(result).toEqual({
            html: 'No content found for "libro"',
            hasContent: false
        });
    });

    it('extracts word from URL with ?v= parameter', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        // Act
        const result = await fetchAndDisplayContent(
            'https://example.com/conj/esverbs.aspx?v=hablar',
            '#main',
            null,
            onWordClick,
            'con',
            null
            // word not provided
        );

        // Assert
        expect(result).toEqual({
            html: 'No content found for "hablar"',
            hasContent: false
        });
    });

    it('throws error with isDefinitionNotFound flag when def 404 and spell suggestions fail', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });
        const spellUrl = 'spell/url';
        global.fetch.mockResolvedValueOnce({
            text: jest.fn().mockResolvedValue('<div>no table</div>')
        });
        parserMock.parseFromString.mockReturnValueOnce({ querySelector: jest.fn().mockReturnValue(null) });

        // Act & Assert
        await expect(
            fetchAndDisplayContent(
                'https://example.com/definicion/inexistente',
                '#main',
                spellUrl,
                onWordClick,
                'def',
                null,
                'inexistente'
            )
        ).rejects.toThrow();
    });

    it('returns spell suggestions when def 404 but spell suggestions succeed', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        const spellTable = document.createElement('table');
        spellTable.innerHTML = '<tr><td><a href="correcto">correcto</a></td></tr>';

        global.fetch.mockResolvedValueOnce({
            text: jest.fn().mockResolvedValue('<table><tr><td><a href="correcto">correcto</a></td></tr></table>')
        });
        parserMock.parseFromString.mockReturnValueOnce({
            querySelector: jest.fn().mockReturnValue(spellTable)
        });

        // Act
        const result = await fetchAndDisplayContent(
            'https://example.com/definicion/incorrecta',
            '#main',
            'spell/url',
            onWordClick,
            'def',
            null,
            'incorrecta'
        );

        // Assert
        expect(result.hasContent).toBe(true);
        expect(result.html).toContain('correcto');
    });

    it('returns "No content found for \\"word\\"" for sin section when fetch fails', async () => {
        // Arrange
        cacheService.getCachedContent.mockResolvedValueOnce(null);
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        // Act
        const result = await fetchAndDisplayContent(
            'https://example.com/sinonimos/xyz',
            '#main',
            null,
            onWordClick,
            'sin',
            null,
            'xyz'
        );

        // Assert
        expect(result).toEqual({
            html: 'No content found for "xyz"',
            hasContent: false
        });
    });
});

