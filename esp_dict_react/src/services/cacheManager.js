const DB_NAME = 'wordref_cache';
const STORE_NAME = 'content';
const DB_VERSION = 1;
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {keyPath: 'key'});
            }
        };
    });
};

// Clear cache entries older than 24 hours
export const clearCacheOlderThanDay = async () => {
    try {
        const db = await initDB();
        const cutoffTime = Date.now() - ONE_DAY_MS;

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const allEntries = request.result;
                let deletedCount = 0;

                allEntries.forEach(entry => {
                    if (entry.timestamp < cutoffTime) {
                        store.delete(entry.key);
                        deletedCount++;
                    }
                });

                tx.oncomplete = () => {
                    console.log(`Deleted ${deletedCount} cache entries older than 24 hours`);
                    resolve(deletedCount);
                };
            };

            request.onerror = () => {
                console.error('Error reading cache:', request.error);
                reject(0);
            };

            tx.onerror = () => {
                console.error('Transaction error:', tx.error);
                reject(0);
            };
        });
    } catch (error) {
        console.error('Error clearing old cache:', error);
        return 0;
    }
};

// Clear all cache
export const clearAllCache = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('All cache cleared successfully');
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error clearing cache:', request.error);
                reject(false);
            };

            tx.onerror = () => {
                console.error('Transaction error:', tx.error);
                reject(false);
            };
        });
    } catch (error) {
        console.error('Error clearing all cache:', error);
        return false;
    }
};

// Get URL parameters
export const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        hasClearDay: params.has('clear_day'),
        hasClearAll: params.has('clear_all')
    };
};

// Show appropriate cache buttons
export const shouldShowCacheClearButtons = () => {
    const {hasClearDay, hasClearAll} = getUrlParams();
    return hasClearDay || hasClearAll;
};

export const showOnlyClearAll = () => {
    const {hasClearDay, hasClearAll} = getUrlParams();
    return hasClearDay && hasClearAll;
};

export const showClearDayButton = () => {
    const {hasClearDay, hasClearAll} = getUrlParams();
    return hasClearDay && !hasClearAll;
};

export const showClearAllButton = () => {
    const {hasClearAll} = getUrlParams();
    return hasClearAll;
};