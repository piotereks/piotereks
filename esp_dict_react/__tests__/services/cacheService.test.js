import '@testing-library/jest-dom';
import {
    initDB,
    getCachedContent,
    cacheContent,
    clearCache,
    generateCacheKey,
    __setDbInstanceForTest,
    __resetDbInstanceForTest,
} from '../../src/services/cacheService';

describe('cacheService', () => {
    let mockRequest;
    let mockStore;
    let mockTransaction;
    let mockDB;

    beforeEach(() => {
        jest.clearAllMocks();
        __resetDbInstanceForTest();

        // Mock the store
        mockStore = {
            get: jest.fn(),
            put: jest.fn(),
            clear: jest.fn(),
        };

        // Mock the transaction
        mockTransaction = {
            objectStore: jest.fn(() => mockStore),
        };

        // Mock the database
        mockDB = {
            transaction: jest.fn(() => mockTransaction),
            objectStoreNames: {
                contains: jest.fn(() => true),
            },
        };

        // Mock the request
        mockRequest = {
            result: null,
            error: null,
            onerror: null,
            onsuccess: null,
            onupgradeneeded: null,
        };

        // Mock indexedDB.open
        global.indexedDB = {
            open: jest.fn((dbName, version) => {
                // Simulate successful open
                setTimeout(() => {
                    mockRequest.result = mockDB;
                    mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            }),
        };
    });

    afterEach(() => {
        __resetDbInstanceForTest();
    });

    describe('initDB', () => {
        it('opens IndexedDB and returns database instance', async () => {
            // Act
            const db = await initDB();

            // Assert
            expect(global.indexedDB.open).toHaveBeenCalledWith('wordref_cache', 1);
            expect(db).toBe(mockDB);
        });

        it('returns cached instance on second call', async () => {
            // Act
            const db1 = await initDB();
            const db2 = await initDB();

            // Assert
            expect(global.indexedDB.open).toHaveBeenCalledTimes(1);
            expect(db1).toBe(db2);
        });

        it('handles IndexedDB open error', async () => {
            // Arrange
            global.indexedDB.open = jest.fn((dbName, version) => {
                setTimeout(() => {
                    mockRequest.error = new Error('Open failed');
                    mockRequest.onerror?.();
                }, 0);
                return mockRequest;
            });

            // Act & Assert
            await expect(initDB()).rejects.toThrow('Open failed');
        });
    });

    describe('getCachedContent', () => {
        it('returns cached value if not expired', async () => {
            // Arrange
            const cacheKey = 'test:key';
            const cachedValue = 'cached data';
            const now = Date.now();

            mockStore.get.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.result = {
                        key: cacheKey,
                        value: cachedValue,
                        timestamp: now,
                    };
                    mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await getCachedContent(cacheKey);

            // Assert
            expect(mockStore.get).toHaveBeenCalledWith(cacheKey);
            expect(result).toBe(cachedValue);
        });

        it('returns null if cache is expired', async () => {
            // Arrange
            const cacheKey = 'expired:key';
            const expiredTime = Date.now() - 365 * 24 * 60 * 60 * 1000 - 1000; // 1 year + 1 second ago

            mockStore.get.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.result = {
                        key: cacheKey,
                        value: 'old data',
                        timestamp: expiredTime,
                    };
                    mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await getCachedContent(cacheKey);

            // Assert
            expect(result).toBeNull();
        });

        it('returns null if key not found', async () => {
            // Arrange
            const cacheKey = 'missing:key';

            mockStore.get.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.result = undefined;
                    mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await getCachedContent(cacheKey);

            // Assert
            expect(result).toBeNull();
        });

        it('returns null on store error', async () => {
            // Arrange
            const cacheKey = 'error:key';

            mockStore.get.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.error = new Error('Store error');
                    mockRequest.onerror?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await getCachedContent(cacheKey);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('cacheContent', () => {
        it('caches content successfully', async () => {
            // Arrange
            const cacheKey = 'test:cache';
            const value = 'test data';

            mockStore.put.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await cacheContent(cacheKey, value);

            // Assert
            expect(mockStore.put).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: cacheKey,
                    value,
                })
            );
            expect(result).toBe(true);
        });

        it('returns false on cache error', async () => {
            // Arrange
            const cacheKey = 'error:cache';

            mockStore.put.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.error = new Error('Put error');
                    mockRequest.onerror?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await cacheContent(cacheKey, 'data');

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('clearCache', () => {
        it('clears all cache successfully', async () => {
            // Arrange
            mockStore.clear.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.onsuccess?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await clearCache();

            // Assert
            expect(mockStore.clear).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('returns false on clear error', async () => {
            // Arrange
            mockStore.clear.mockImplementation(() => {
                setTimeout(() => {
                    mockRequest.error = new Error('Clear error');
                    mockRequest.onerror?.();
                }, 0);
                return mockRequest;
            });

            await initDB();

            // Act
            const result = await clearCache();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('generateCacheKey', () => {
        it('generates cache key from url and selector', () => {
            // Arrange
            const url = 'https://example.com';
            const selector = '.content';

            // Act
            const key = generateCacheKey(url, selector);

            // Assert
            expect(key).toBe('https://example.com:.content');
        });

        it('handles empty selector', () => {
            // Arrange
            const url = 'https://example.com';
            const selector = '';

            // Act
            const key = generateCacheKey(url, selector);

            // Assert
            expect(key).toBe('https://example.com:');
        });
    });
});