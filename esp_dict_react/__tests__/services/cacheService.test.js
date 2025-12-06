// Tests for cacheService.js

import * as cacheService from '../../src/services/cacheService';

describe('cacheService', () => {
  let origIndexedDB;
  let dbMock, txMock, storeMock, requestMock;

  beforeEach(() => {
    // Save original indexedDB
    origIndexedDB = global.indexedDB;

    // Reset cacheService module-level state
    if (cacheService.__resetDbInstanceForTest) {
      cacheService.__resetDbInstanceForTest();
    }


    // Mocks for IndexedDB
    requestMock = {};
    storeMock = {
      get: jest.fn(),
      put: jest.fn(),
      clear: jest.fn()
    };
    txMock = {
      objectStore: jest.fn(() => storeMock)
    };
    dbMock = {
      transaction: jest.fn(() => txMock),
      objectStoreNames: ['content']
    };

    // Mock indexedDB.open
    global.indexedDB = {
      open: jest.fn()
    };
  });

  afterEach(() => {
    global.indexedDB = origIndexedDB;
    jest.clearAllMocks();
  });

  describe('initDB', () => {
    it('resolves with dbInstance if already initialized', async () => {

      // Arrange
      cacheService.__setDbInstanceForTest(dbMock);

      // Act
      const db = await cacheService.initDB();

      // Assert
      expect(db).toBe(dbMock);
    });

    it('opens IndexedDB and resolves on onsuccess', async () => {

    
      // Arrange
      // cacheService.__setDbInstanceForTest(dbMock);
      // Arrange
      const onsuccessHandlers = {};
      const onupgradeneededHandlers = {};
      const onerrorHandlers = {};
      global.indexedDB.open.mockReturnValue({
        set onsuccess(fn) { onsuccessHandlers.onsuccess = fn; },
        set onerror(fn) { onerrorHandlers.onerror = fn; },
        set onupgradeneeded(fn) { onupgradeneededHandlers.onupgradeneeded = fn; },
        get onsuccess() { return onsuccessHandlers.onsuccess; },
        get onerror() { return onerrorHandlers.onerror; },
        get onupgradeneeded() { return onupgradeneededHandlers.onupgradeneeded; },
        addEventListener: (event, fn) => {
          if (event === 'success') onsuccessHandlers.onsuccess = fn;
          if (event === 'error') onerrorHandlers.onerror = fn;
          if (event === 'upgradeneeded') onupgradeneededHandlers.onupgradeneeded = fn;
        },
        result: dbMock,
        error: null
      });

      // Act
      const promise = cacheService.initDB();
      // Wait for the event loop to allow onsuccess to be set
      await Promise.resolve();
      onsuccessHandlers.onsuccess();
      const db = await promise;

      // Assert
      expect(db).toBe(dbMock);
    });

    it('calls onupgradeneeded and creates object store if missing', async () => {
      // Arrange
      // cacheService.__setDbInstanceForTest(dbMock);

      // Act
      // const db = await cacheService.initDB();

      // Assert
      // expect(db).toBe(dbMock);


      // Arrange
      const objectStoreNames = { contains: jest.fn().mockReturnValue(false) };
      const dbUpgradeMock = {
        objectStoreNames,
        createObjectStore: jest.fn()
      };
      const handlers = {};
      global.indexedDB.open.mockReturnValue({
        set onsuccess(fn) { handlers.onsuccess = fn; },
        set onerror(fn) { handlers.onerror = fn; },
        set onupgradeneeded(fn) { handlers.onupgradeneeded = fn; },
        get onsuccess() { return handlers.onsuccess; },
        get onerror() { return handlers.onerror; },
        get onupgradeneeded() { return handlers.onupgradeneeded; },
        addEventListener: (event, fn) => {
          if (event === 'success') handlers.onsuccess = fn;
          if (event === 'error') handlers.onerror = fn;
          if (event === 'upgradeneeded') handlers.onupgradeneeded = fn;
        },
        result: dbUpgradeMock,
        error: null
      });

      // Act
      const promise = cacheService.initDB();
      // Wait for the event loop to allow onupgradeneeded to be set
      await Promise.resolve();
      // Defensive: check if handler is set
      expect(typeof handlers.onupgradeneeded).toBe('function');
      handlers.onupgradeneeded({ target: { result: dbUpgradeMock } });
      // Simulate onsuccess to resolve the promise
      handlers.onsuccess();
      const db = await promise;

      // Assert
      expect(objectStoreNames.contains).toHaveBeenCalledWith('content');
      expect(dbUpgradeMock.createObjectStore).toHaveBeenCalledWith('content', { keyPath: 'key' });
    });

    it('rejects on error', async () => {

      // Arrange
      const onerrorHandlers = {};
      global.indexedDB.open.mockReturnValue({
        set onsuccess(fn) {},
        set onerror(fn) { onerrorHandlers.onerror = fn; },
        set onupgradeneeded(fn) {},
        get onsuccess() {},
        get onerror() {},
        get onupgradeneeded() {},
        result: null,
        error: new Error('fail')
      });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const promise = cacheService.initDB();
      await Promise.resolve();
      onerrorHandlers.onerror();

      // Assert
      await expect(promise).rejects.toBeInstanceOf(Error);
      errorSpy.mockRestore();
    });
  });

  describe('getCachedContent', () => {
    it('returns value if cache hit and not expired', async () => {

      // Arrange
      const now = Date.now();
      const value = 'abc';
      const resultObj = { value, timestamp: now };
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.get.mockReturnValue(requestMock);

      // Act
      const promise = cacheService.getCachedContent('key1');
      requestMock.result = resultObj;
      requestMock.onsuccess();

      // Assert
      await expect(promise).resolves.toBe(value);
    });

    it('returns null if cache expired', async () => {

      // Arrange
      const old = Date.now() - (366 * 24 * 60 * 60 * 1000);
      const resultObj = { value: 'abc', timestamp: old };
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.get.mockReturnValue(requestMock);

      // Act
      const promise = cacheService.getCachedContent('key2');
      requestMock.result = resultObj;
      requestMock.onsuccess();

      // Assert
      await expect(promise).resolves.toBeNull();
    });

    it('returns null if no result', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.get.mockReturnValue(requestMock);

      // Act
      const promise = cacheService.getCachedContent('key3');
      requestMock.result = null;
      requestMock.onsuccess();

      // Assert
      await expect(promise).resolves.toBeNull();
    });

    it('returns null on request error', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.get.mockReturnValue(requestMock);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const promise = cacheService.getCachedContent('key4');
      requestMock.error = new Error('fail');
      requestMock.onerror();

      // Assert
      await expect(promise).resolves.toBeNull();
      errorSpy.mockRestore();
    });

    it('returns null on initDB error', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockRejectedValue(new Error('fail')));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await cacheService.getCachedContent('key5');

      // Assert
      expect(result).toBeNull();
      errorSpy.mockRestore();
    });
  });

  describe('cacheContent', () => {
    it('caches content and resolves true on success', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.put.mockReturnValue(requestMock);

      // Act
      const promise = cacheService.cacheContent('key', 'val');
      requestMock.onsuccess();

      // Assert
      await expect(promise).resolves.toBe(true);
    });

    it('resolves false on put error', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.put.mockReturnValue(requestMock);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const promise = cacheService.cacheContent('key', 'val');
      requestMock.error = new Error('fail');
      requestMock.onerror();

      // Assert
      await expect(promise).resolves.toBe(false);
      errorSpy.mockRestore();
    });

    it('resolves false on initDB error', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockRejectedValue(new Error('fail')));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await cacheService.cacheContent('key', 'val');

      // Assert
      expect(result).toBe(false);
      errorSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('clears cache and resolves true on success', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.clear.mockReturnValue(requestMock);

      // Act
      const promise = cacheService.clearCache();
      requestMock.onsuccess();

      // Assert
      await expect(promise).resolves.toBe(true);
    });

    it('resolves false on clear error', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockResolvedValue(dbMock));
      storeMock.clear.mockReturnValue(requestMock);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const promise = cacheService.clearCache();
      requestMock.error = new Error('fail');
      requestMock.onerror();

      // Assert
      await expect(promise).resolves.toBe(false);
      errorSpy.mockRestore();
    });

    it('resolves false on initDB error', async () => {

      // Arrange
      cacheService.__Rewire__('initDB', jest.fn().mockRejectedValue(new Error('fail')));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await cacheService.clearCache();

      // Assert
      expect(result).toBe(false);
      errorSpy.mockRestore();
    });
  });

  describe('generateCacheKey', () => {
    it('generates cache key from url and selector', () => {

      // Act
      const key = cacheService.generateCacheKey('http://foo', '#main');

      // Assert
      expect(key).toBe('http://foo:#main');
    });

    it('handles empty url and selector', () => {

      // Act
      const key = cacheService.generateCacheKey('', '');

      // Assert
      expect(key).toBe(':');
    });

    it('handles undefined url and selector', () => {

      // Act
      const key = cacheService.generateCacheKey(undefined, undefined);

      // Assert
      expect(key).toBe('undefined:undefined');
    });
  });
});
