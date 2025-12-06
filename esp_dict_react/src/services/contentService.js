import { getCachedContent, cacheContent, generateCacheKey } from './cacheService';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const FETCH_TIMEOUT = 15000; // 15 seconds

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Wrap fetch with timeout
const fetchWithTimeout = (url, options = {}, timeoutMs = FETCH_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Fetch timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const fetchHtml = async (url, retries = 0, abortSignal = null) => {
  try {
    const useCorsProxy = url.includes('dle.rae.es');
    const fetchUrl = useCorsProxy
      ? `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      : url;

    const response = await fetchWithTimeout(fetchUrl, { signal: abortSignal });
    
    if (!response.ok) {
      // Only retry on CORS proxy failures
      if (useCorsProxy && retries < MAX_RETRIES) {
        console.warn(`CORS proxy failed (${response.status}), retrying (${retries + 1}/${MAX_RETRIES}):`, url);
        await delay(RETRY_DELAY * (retries + 1));
        return fetchHtml(url, retries + 1, abortSignal);
      }
      console.error(`HTTP ${response.status}:`, url);
      return null;
    }
    
    if (useCorsProxy) {
      const data = await response.json();
      if (!data.contents) {
        console.error('No contents in proxy response:', url);
        return null;
      }
      return data.contents;
    }
    
    return response.text();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted:', url);
      throw error;
    }
    // Only retry on CORS proxy errors
    const useCorsProxy = url.includes('dle.rae.es');
    if (useCorsProxy && retries < MAX_RETRIES) {
      console.warn(`CORS proxy error, retrying (${retries + 1}/${MAX_RETRIES}):`, url, error.message);
      await delay(RETRY_DELAY * (retries + 1));
      return fetchHtml(url, retries + 1, abortSignal);
    }
    console.error(`Fetch failed:`, url, error.message);
    return null;
  }
};

export const parseContent = (html, selector) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const content = doc.querySelector(selector);
  
  if (content) {
    const browserInfo = content.querySelector('#browserInfo');
    if (browserInfo) {
      browserInfo.remove();
    }
  }
  
  return content;
};

const setupLinksOnContent = (content, onWordClick) => {
  if (!content) return;
  
  content.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    let wordParam = null;
    
    // Check for different link patterns
    if (href.includes('conj/esVerbs.aspx?v=') || 
        href.includes('conj/esverbs.aspx?v=') || 
        href.includes('?v=')) {
      // Conjugation links
      wordParam = href.split('=')[1];
    } else if (href.includes('sinonimos/')) {
      // Synonym links
      wordParam = href.split('/').pop();
    } else if (href.includes('/definicion/')) {
      // Definition links
      wordParam = href.split('/').pop();
    } else if (href.startsWith('/')) {
      // Any internal WordReference link - try to extract word from path
      const parts = href.split('/').filter(p => p);
      if (parts.length > 0) {
        wordParam = parts[parts.length - 1];
      }
    }
    
    if (wordParam) {
      link.setAttribute('href', `?word=${encodeURIComponent(wordParam)}`);
      link.onclick = (e) => {
        e.preventDefault();
        onWordClick(wordParam);
      };
    }
  });
};

export const fetchSpellSuggestions = async (spellUrl, onWordClick) => {
  try {
    const html = await fetch(spellUrl).then(r => r.text());
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    
    if (table) {
      table.querySelectorAll('a').forEach(link => {
        const originalHref = link.getAttribute('href');
        link.setAttribute('href', `?word=${originalHref}`);
        link.onclick = (e) => {
          e.preventDefault();
          onWordClick(originalHref);
        };
      });
      return table;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching spell suggestions:', error);
    return null;
  }
};

export const fetchAndDisplayContent = async (url, selector, spellUrl, onWordClick, abortSignal = null) => {
  try {
    const cacheKey = generateCacheKey(url, selector);
    
    // Check cache first
    const cachedContent = await getCachedContent(cacheKey);
    
    if (cachedContent) {
      console.log('Using cached content for:', cacheKey);
      const parser = new DOMParser();
      const doc = parser.parseFromString(cachedContent, 'text/html');
      const content = doc.querySelector(selector);
      
      if (content) {
        setupLinksOnContent(content, onWordClick);
        const hasContent = content.innerText && content.innerText.trim();
        return {
          html: content.innerHTML,
          hasContent: !!hasContent
        };
      }
    }
    
    // Fetch from network if not cached
    console.log('Fetching from network:', url);
    const html = await fetchHtml(url, 0, abortSignal);
    
    // If fetch failed, try spell check if available
    if (!html) {
      console.error('Fetch returned null, trying spell suggestions');
      if (spellUrl) {
        const table = await fetchSpellSuggestions(spellUrl, onWordClick);
        if (table) {
          setupLinksOnContent(table, onWordClick);
          return {
            html: table.outerHTML,
            hasContent: true
          };
        }
      }
      // No spell check or spell check failed
      return {
        html: 'Error fetching content.',
        hasContent: false
      };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let content = doc.querySelector(selector);
    
    if (content) {
      const browserInfo = content.querySelector('#browserInfo');
      if (browserInfo) {
        browserInfo.remove();
      }
    }
    
    // Check if we got content
    const hasContent = content && content.innerText && content.innerText.trim();
    
    if (!hasContent && spellUrl) {
      console.log('No content found, trying spell suggestions');
      const table = await fetchSpellSuggestions(spellUrl, onWordClick);
      
      if (table) {
        // Only cache successful spell suggestions
        await cacheContent(cacheKey, html);
        setupLinksOnContent(table, onWordClick);
        
        return {
          html: table.outerHTML,
          hasContent: true
        };
      }
      
      // No spell suggestions found - don't cache empty result
      console.log('No content and no spell suggestions - not caching');
      return {
        html: 'No content found.',
        hasContent: false
      };
    }
    
    if (content) {
      setupLinksOnContent(content, onWordClick);
      // ONLY cache if we have actual content - don't cache empty results
      if (hasContent) {
        console.log('Content found and caching for:', cacheKey);
        await cacheContent(cacheKey, html);
      } else {
        console.log('No actual content - NOT caching for:', cacheKey);
      }
    }
    
    return {
      html: hasContent ? content.innerHTML : 'No content found.',
      hasContent: !!hasContent
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Fetch was aborted');
      throw error;
    }
    console.error('Error fetching content:', error);
    return {
      html: 'Error fetching content.',
      hasContent: false
    };
  }
};