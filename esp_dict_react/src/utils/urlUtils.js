export const buildUrl = (baseUrl, word) => {
  return `${baseUrl}${encodeURIComponent(word)}`;
};

export const buildSpellUrl = (word) => {
  return `https://spell.wordreference.com/spell/spelljs.php?dict=eses&w=${encodeURIComponent(word)}`;
};

export const updateUrlWithWord = (word) => {
  const newUrl = `${window.location.pathname}?word=${encodeURIComponent(word)}`;
  window.history.pushState(null, '', newUrl);
};

export const getUrlParameter = (name) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
};