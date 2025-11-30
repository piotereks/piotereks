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

export const setupInternalLinks = (content, onWordClick) => {
  if (!content) return;
  
  content.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    let wordParam = null;
    
    // Match patterns from original script.js
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
    const html = await fetchHtml(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let content = doc.querySelector(selector);
    
    // Remove browserInfo if it exists
    if (content) {
      const browserInfo = content.querySelector('#browserInfo');
      if (browserInfo) {
        browserInfo.remove();
      }
    }
    
    // Update internal links hrefs
    if (content) {
      content.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        let wordParam = null;
        
        // Match patterns from original script.js
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
    }
    
    // Check if content is empty and we have a spell URL
    if ((!content || content.innerHTML.trim() === '') && spellUrl) {
      const table = await fetchSpellSuggestions(spellUrl, onWordClick);
      
      if (table) {
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
    
    // Return content or error message
    const hasContent = content && content.innerText && content.innerText.trim();
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