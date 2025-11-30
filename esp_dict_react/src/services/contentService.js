import { getCachedContent, cacheContent, generateCacheKey } from './cacheService';

export const fetchHtml = async (url) => {
  const useCorsProxy = url.includes('dle.rae.es');
  const fetchUrl = useCorsProxy
    ? `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    : url;

  const response = await fetch(fetchUrl);
  
  if (useCorsProxy) {
    const data = await response.json();
    return data.contents;
  }
  
  return response.text();
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
    
    if (href.includes('conj/esVerbs.aspx?v=') || 
        href.includes('conj/esverbs.aspx?v=') || 
        href.includes('?v=')) {
      wordParam = href.split('=')[1];
    } else if (href.includes('sinonimos/')) {
      wordParam = href.split('/')[2];
    }
    
    if (wordParam) {
      link.setAttribute('href', `?word=${wordParam}`);
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

export const fetchAndDisplayContent = async (url, selector, spellUrl, onWordClick) => {
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
    const html = await fetchHtml(url);
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
        // Cache the spell suggestions HTML
        await cacheContent(cacheKey, html);
        setupLinksOnContent(table, onWordClick);
        
        return {
          html: table.outerHTML,
          hasContent: true
        };
      }
      
      return {
        html: 'No content found.',
        hasContent: false
      };
    }
    
    if (content) {
      setupLinksOnContent(content, onWordClick);
      // Cache the original HTML string, not the parsed content
      await cacheContent(cacheKey, html);
    }
    
    return {
      html: hasContent ? content.innerHTML : 'No content found.',
      hasContent: !!hasContent
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    return {
      html: 'Error fetching content.',
      hasContent: false
    };
  }
};