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
  }
  
  return table;
};