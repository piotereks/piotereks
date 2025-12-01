/**
 * Cache debugging helpers for console
 * Usage in browser console:
 *   import('./utils/cacheDebug.js').then(m => window.cacheDebug = m)
 * Then: cacheDebug.readCache(), cacheDebug.readCacheForWord('gato'), etc.
 */

const DB_NAME = 'wordref_cache';
const STORE_NAME = 'content';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Read all cached items
 */
export const readCache = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        console.log(`\n=== CACHE CONTENTS (${items.length} items) ===\n`);
        
        items.forEach((item, index) => {
          const date = new Date(item.timestamp);
          const contentSize = (item.value.length / 1024).toFixed(2); // KB
          console.log(`${index + 1}. Key: ${item.key}`);
          console.log(`   Cached at: ${date.toLocaleString()}`);
          console.log(`   Size: ${contentSize} KB`);
          console.log('');
        });
        
        console.log(`Total: ${items.length} items`);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading cache:', error);
  }
};

/**
 * Read cache for a specific word
 * @param {string} word - Word to search for
 */
export const readCacheForWord = async (word) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        const wordItems = items.filter(item => item.key.includes(word));
        
        console.log(`\n=== CACHE FOR WORD: "${word}" (${wordItems.length} items) ===\n`);
        
        wordItems.forEach((item, index) => {
          const date = new Date(item.timestamp);
          const contentSize = (item.value.length / 1024).toFixed(2);
          console.log(`${index + 1}. Key: ${item.key}`);
          console.log(`   Cached at: ${date.toLocaleString()}`);
          console.log(`   Size: ${contentSize} KB`);
          console.log('');
        });
        
        if (wordItems.length === 0) {
          console.log(`No cache found for word: "${word}"`);
        } else {
          console.log(`Total for "${word}": ${wordItems.length} items`);
        }
        
        resolve(wordItems);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading cache for word:', error);
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('✅ All cache cleared!');
        resolve(true);
      };
      request.onerror = () => {
        console.error('❌ Error clearing cache');
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear cache older than specified days
 * @param {number} days - Number of days (default: 1)
 */
export const clearOldCache = async (days = 1) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const itemsToDelete = items.filter(item => item.timestamp < cutoffTime);
        
        if (itemsToDelete.length === 0) {
          console.log(`No cache items older than ${days} day(s)`);
          resolve(0);
          return;
        }
        
        console.log(`Clearing ${itemsToDelete.length} cache items older than ${days} day(s)...`);
        
        const deleteTx = db.transaction(STORE_NAME, 'readwrite');
        const deleteStore = deleteTx.objectStore(STORE_NAME);
        
        itemsToDelete.forEach(item => {
          const key = item.key;
          const deleteReq = deleteStore.delete(key);
          deleteReq.onsuccess = () => {
            console.log(`  ✓ Deleted: ${key}`);
          };
        });
        
        deleteTx.oncomplete = () => {
          console.log(`✅ Cleared ${itemsToDelete.length} items older than ${days} day(s)`);
          resolve(itemsToDelete.length);
        };
        
        deleteTx.onerror = () => reject(deleteTx.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        let totalSize = 0;
        const wordMap = {};
        
        items.forEach(item => {
          totalSize += item.value.length;
          const match = item.key.match(/https:\/\/[^/]+\/[^/]+\/([^/:]+)/);
          const word = match ? match[1] : 'unknown';
          wordMap[word] = (wordMap[word] || 0) + 1;
        });
        
        console.log('\n=== CACHE STATISTICS ===\n');
        console.log(`Total items: ${items.length}`);
        console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Words cached: ${Object.keys(wordMap).length}`);
        console.log('\nItems per word:');
        
        Object.entries(wordMap)
          .sort((a, b) => b[1] - a[1])
          .forEach(([word, count]) => {
            console.log(`  - ${word}: ${count} items`);
          });
        
        resolve({ totalItems: items.length, totalSize, wordMap });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
  }
};

// Make functions available globally if imported
console.log('Cache debug helpers loaded. Usage:');
console.log('  cacheDebug.readCache() - Show all cached items');
console.log('  cacheDebug.readCacheForWord("word") - Show cache for specific word');
console.log('  cacheDebug.clearAllCache() - Clear all cache');
console.log('  cacheDebug.clearOldCache(days) - Clear cache older than N days (default: 1)');
console.log('  cacheDebug.getCacheStats() - Show cache statistics');
