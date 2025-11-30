const DB_NAME = 'wordref_cache';
const STORE_NAME = 'content';
const DB_VERSION = 1;
const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year in ms

// Initialize database
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

// Get cached content
export const getCachedContent = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < CACHE_DURATION) {
          resolve(result.value);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

// Cache content
export const cacheContent = async (key, value) => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({
        key,
        value,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('Cache put error:', error);
    return false;
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

// Generate cache key
export const generateCacheKey = (url, selector) => {
  return `${url}:${selector}`;
};