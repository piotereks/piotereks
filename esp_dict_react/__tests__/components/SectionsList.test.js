// Tests for contentService.js

import '@testing-library/jest-dom';
import {
    fetchHtml,
    parseContent,
    fetchSpellSuggestions,
    fetchAndDisplayContent
} from '../../src/services/contentService';

import * as cacheService from '../../src/services/cacheService';

// Mock global fetch and DOMParser
global.fetch = jest.fn();
global.DOMParser = jest.fn().mockImplementation(() => ({
    parseFromString: jest.fn()
}));

const flushPromises = () => new Promise(setImmediate);

describe('fetchHtml', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches HTML successfully (no CORS proxy)', async () => {

        // Arrange
        const url = 'https://example.com/page';
        const text = jest.fn().mockResolvedValue('<html>ok</html>');
        global.fetch.mockResolvedValue({ok: true, text});

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(global.fetch).toHaveBeenCalledWith(url, {signal: null});
        expect(result).toBe('<html>ok</html>');
    });

    it('fetches HTML successfully (with CORS proxy)', async () => {

        // Arrange
        const url = 'https://dle.rae.es/word';
        const json = jest.fn().mockResolvedValue({contents: '<html>proxied</html>'});
        global.fetch.mockResolvedValue({ok: true, json});

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.allorigins.win/get?url=https%3A%2F%2Fdle.rae.es%2Fword',
            {signal: null}
        );
        expect(result).toBe('<html>proxied</html>');
    });

    it('retries on CORS proxy HTTP error and succeeds', async () => {

        // Arrange
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        });
        global.fetch
            .mockResolvedValueOnce({ok: false, status: 502})
            .mockResolvedValueOnce({ok: true, json: jest.fn().mockResolvedValue({contents: 'abc'})});

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenCalled();
        expect(result).toBe('abc');
        warnSpy.mockRestore();
    });

    it('returns null after max retries on CORS proxy HTTP error', async () => {

        // Arrange
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
        global.fetch
            .mockResolvedValue({ok: false, status: 502});

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        expect(result).toBeNull();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it('returns null on non-proxy HTTP error', async () => {

        // Arrange
        const url = 'https://example.com/page';
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
        global.fetch.mockResolvedValue({ok: false, status: 404});

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('retries on CORS proxy network error and succeeds', async () => {

        // Arrange
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        });
        global.fetch
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ok: true, json: jest.fn().mockResolvedValue({contents: 'abc'})});

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenCalled();
        expect(result).toBe('abc');
        warnSpy.mockRestore();
    });

    it('returns null after max retries on CORS proxy network error', async () => {

        // Arrange
        const url = 'https://dle.rae.es/word';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
        global.fetch.mockRejectedValue(new Error('Network error'));

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        expect(result).toBeNull();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it('throws on AbortError', async () => {

        // Arrange
        const url = 'https://example.com/page';
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        global.fetch.mockRejectedValue(abortError);

        // Act & Assert
        await expect(fetchHtml(url)).rejects.toThrow('Aborted');
    });

    it('returns null on non-proxy network error', async () => {

        // Arrange
        const url = 'https://example.com/page';
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
        global.fetch.mockRejectedValue(new Error('Network error'));

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('returns null if CORS proxy response has no contents', async () => {

        // Arrange
        const url = 'https://dle.rae.es/word';
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
        global.fetch.mockResolvedValue({ok: true, json: jest.fn().mockResolvedValue({})});

        // Act
        const result = await fetchHtml(url);

        // Assert
        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});

describe('parseContent', () => {
    let mockDoc, mockContent, mockBrowserInfo;

    beforeEach(() => {
        mockBrowserInfo = {remove: jest.fn()};
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

        // Arrange
        mockContent.querySelector.mockReturnValueOnce(mockBrowserInfo);

        // Act
        const result = parseContent('<html></html>', 'div');

        // Assert
        expect(result).toBe(mockContent);
        expect(mockContent.querySelector).toHaveBeenCalledWith('#browserInfo');
        expect(mockBrowserInfo.remove).toHaveBeenCalled();
    });

    it('parses content and does nothing if #browserInfo not present', () => {

        // Arrange
        mockContent.querySelector.mockReturnValueOnce(null);

        // Act
        const result = parseContent('<html></html>', 'div');

        // Assert
        expect(result).toBe(mockContent);
        expect(mockContent.querySelector).toHaveBeenCalledWith('#browserInfo');
    });

    it('returns null if selector not found', () => {

        // Arrange
        mockDoc.querySelector.mockReturnValueOnce(null);

        // Act
        const result = parseContent('<html></html>', 'div');

        // Assert
        expect(result).toBeNull();
    });
});

describe('fetchSpellSuggestions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns table with links updated and handlers attached', async () => {

        // Arrange
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
        global.fetch.mockResolvedValue({text: jest.fn().mockResolvedValue(html)});
        global.DOMParser.mockImplementation(() => ({
            parseFromString: jest.fn().mockReturnValue(doc)
        }));
        const onWordClick = jest.fn();

        // Act
        const result = await fetchSpellSuggestions('spellurl', onWordClick);

        // Assert
        expect(result).toBe(table);
        expect(table.querySelectorAll).toHaveBeenCalledWith('a');
        expect(table.querySelectorAll()[0].setAttribute).toHaveBeenCalledWith('href', '?word=word1');
        expect(typeof table.querySelectorAll()[0].onclick).toBe('function');
    });

    it('returns null if no table found', async () => {

        // Arrange
        const html = '<div>No table</div>';
        const doc = {
            querySelector: jest.fn().mockReturnValue(null)
        };
        global.fetch.mockResolvedValue({text: jest.fn().mockResolvedValue(html)});
        global.DOMParser.mockImplementation(() => ({
            parseFromString: jest.fn().mockReturnValue(doc)
        }));

        // Act
        const result = await fetchSpellSuggestions('spellurl', jest.fn());

        // Assert
        expect(result).toBeNull();
    });

    it('returns null and logs error on fetch error', async () => {

        // Arrange
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
        global.fetch.mockRejectedValue(new Error('fail'));

        // Act
        const result = await fetchSpellSuggestions('spellurl', jest.fn());

        // Assert
        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});


