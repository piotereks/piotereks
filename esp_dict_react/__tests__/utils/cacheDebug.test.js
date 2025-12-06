// @jest-environment jsdom
import * as cacheDebug from '../../src/utils/cacheDebug';

describe('cacheDebug', () => {
  let origIndexedDB;
  let dbMock, txMock, storeMock, reqMock, deleteTxMock, deleteStoreMock, deleteReqMock;

  beforeEach(() => {
    // Arrange
    origIndexedDB = global.indexedDB;
    reqMock = {};
    storeMock = {
      getAll: jest.fn(),
      clear: jest.fn(),
      delete: jest.fn()
    };
    txMock = {
      objectStore: jest.fn(() => storeMock)
    };
    dbMock = {
      transaction: jest.fn(() => txMock)
    };
    global.indexedDB = {
      open: jest.fn()
    };
    // Silence console logs for clean test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Arrange
    global.indexedDB = origIndexedDB;
    jest.restoreAllMocks();
  });

  describe('readCache', () => {
    it('returns all items and logs info (happy path)', async () => {
      // Arrange
      const items = [
        { key: 'k1', value: 'abc', timestamp: Date.now() },
        { key: 'k2', value: 'defg', timestamp: Date.now() }
      ];
      reqMock = {};
      storeMock.getAll.mockReturnValue(reqMock);
      txMock.objectStore.mockReturnValue(storeMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      // Simulate openDB success
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.readCache();
      setTimeout(() => {
        reqMock.result = items;
        reqMock.onsuccess();
      }, 1);

      // Assert
      await expect(promise).resolves.toEqual(items);
    });

    it('handles getAll error', async () => {
      // Arrange
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.readCache();
      setTimeout(() => {
        reqMock.error = new Error('fail');
        reqMock.onerror();
      }, 1);

      // Assert
      await expect(promise).rejects.toThrow('fail');
    });

    it('handles openDB error', async () => {
      // Arrange
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        error: new Error('openfail'),
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onerror();
      }, 0);

      // Act & Assert
      await expect(cacheDebug.readCache()).resolves.toBeUndefined();
    });
  });

  describe('readCacheForWord', () => {
    it('returns filtered items for word (happy path)', async () => {
      // Arrange
      const items = [
        { key: 'foo-bar', value: 'abc', timestamp: Date.now() },
        { key: 'baz', value: 'def', timestamp: Date.now() }
      ];
      reqMock = {};
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.readCacheForWord('foo');
      setTimeout(() => {
        reqMock.result = items;
        reqMock.onsuccess();
      }, 1);

      // Assert
      await expect(promise).resolves.toEqual([items[0]]);
    });

    it('returns empty array and logs if no match', async () => {
      // Arrange
      const items = [
        { key: 'bar', value: 'abc', timestamp: Date.now() }
      ];
      reqMock = {};
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.readCacheForWord('foo');
      setTimeout(() => {
        reqMock.result = items;
        reqMock.onsuccess();
      }, 1);

      // Assert
      await expect(promise).resolves.toEqual([]);
    });

    it('handles getAll error', async () => {
      // Arrange
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.readCacheForWord('foo');
      setTimeout(() => {
        reqMock.error = new Error('fail');
        reqMock.onerror();
      }, 1);

      // Assert
      await expect(promise).rejects.toThrow('fail');
    });

    it('handles openDB error', async () => {
      // Arrange
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        error: new Error('openfail'),
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onerror();
      }, 0);

      // Act & Assert
      await expect(cacheDebug.readCacheForWord('foo')).resolves.toBeUndefined();
    });
  });

  describe('clearAllCache', () => {
    it('clears all cache (happy path)', async () => {
      // Arrange
      reqMock = {};
      storeMock.clear.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.clearAllCache();
      setTimeout(() => {
        reqMock.onsuccess();
      }, 1);

      // Assert
      await expect(promise).resolves.toBe(true);
    });

    it('handles clear error', async () => {
      // Arrange
      reqMock = {};
      storeMock.clear.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.clearAllCache();
      setTimeout(() => {
        reqMock.error = new Error('fail');
        reqMock.onerror();
      }, 1);

      // Assert
      await expect(promise).rejects.toThrow('fail');
    });

    it('handles openDB error', async () => {
      // Arrange
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        error: new Error('openfail'),
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onerror();
      }, 0);

      // Act & Assert
      await expect(cacheDebug.clearAllCache()).resolves.toBeUndefined();
    });
  });

  describe('clearOldCache', () => {
    it('clears only old items (happy path)', async () => {
      // Arrange
      const now = Date.now();
      const items = [
        { key: 'old', value: 'abc', timestamp: now - 2 * 24 * 60 * 60 * 1000 },
        { key: 'new', value: 'def', timestamp: now }
      ];
      reqMock = {};
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      // For delete
      deleteReqMock = { onsuccess: jest.fn() };
      deleteStoreMock = {
        delete: jest.fn(() => deleteReqMock)
      };
      deleteTxMock = {
        objectStore: jest.fn(() => deleteStoreMock),
        oncomplete: null,
        onerror: null
      };
      dbMock.transaction
        .mockReturnValueOnce(txMock) // for getAll
        .mockReturnValueOnce(deleteTxMock); // for delete

      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.clearOldCache(1);
      setTimeout(() => {
        reqMock.result = items;
        reqMock.onsuccess();
        // Simulate deleteTx complete
        setTimeout(() => {
          deleteTxMock.oncomplete();
        }, 1);
      }, 1);

      // Assert
      await expect(promise).resolves.toBe(1);
      expect(deleteStoreMock.delete).toHaveBeenCalledWith('old');
    });

    it('logs and resolves 0 if no old items', async () => {
      // Arrange
      const now = Date.now();
      const items = [
        { key: 'new', value: 'def', timestamp: now }
      ];
      reqMock = {};
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.clearOldCache(1);
      setTimeout(() => {
        reqMock.result = items;
        reqMock.onsuccess();
      }, 1);

      // Assert
      await expect(promise).resolves.toBe(0);
    });

    it('handles getAll error', async () => {
      // Arrange
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.clearOldCache(1);
      setTimeout(() => {
        reqMock.error = new Error('fail');
        reqMock.onerror();
      }, 1);

      // Assert
      await expect(promise).rejects.toThrow('fail');
    });

    it('handles deleteTx error', async () => {
      // Arrange
      const now = Date.now();
      const items = [
        { key: 'old', value: 'abc', timestamp: now - 2 * 24 * 60 * 60 * 1000 }
      ];
      reqMock = {};
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValueOnce(txMock).mockReturnValueOnce({
        objectStore: jest.fn(() => ({
          delete: jest.fn(() => ({ onsuccess: jest.fn() }))
        })),
        oncomplete: null,
        onerror: null,
        error: new Error('deletefail')
      });
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.clearOldCache(1);
      setTimeout(() => {
        reqMock.result = items;
        reqMock.onsuccess();
        setTimeout(() => {
          dbMock.transaction.mock.results[1].value.onerror();
        }, 1);
      }, 1);

      // Assert
      await expect(promise).rejects.toThrow('deletefail');
    });

    it('handles openDB error', async () => {
      // Arrange
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        error: new Error('openfail'),
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onerror();
      }, 0);

      // Act & Assert
      await expect(cacheDebug.clearOldCache(1)).resolves.toBeUndefined();
    });
  });

  describe('getCacheStats', () => {
    it('returns stats (happy path)', async () => {
      // Arrange
      const items = [
        { key: 'https://foo.com/abc/gato', value: 'abc', timestamp: Date.now() },
        { key: 'https://foo.com/abc/perro', value: 'defg', timestamp: Date.now() },
        { key: 'https://foo.com/abc/gato', value: 'xyz', timestamp: Date.now() }
      ];
      reqMock = {};
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.getCacheStats();
      setTimeout(() => {
        reqMock.result = items;
        reqMock.onsuccess();
      }, 1);

      // Assert
      await expect(promise).resolves.toEqual({
        totalItems: 3,
        totalSize: 3 + 4 + 3,
        wordMap: { gato: 2, perro: 1 }
      });
    });

    it('handles getAll error', async () => {
      // Arrange
      storeMock.getAll.mockReturnValue(reqMock);
      dbMock.transaction.mockReturnValue(txMock);
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: dbMock,
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onsuccess();
      }, 0);

      // Act
      const promise = cacheDebug.getCacheStats();
      setTimeout(() => {
        reqMock.error = new Error('fail');
        reqMock.onerror();
      }, 1);

      // Assert
      await expect(promise).rejects.toThrow('fail');
    });

    it('handles openDB error', async () => {
      // Arrange
      global.indexedDB.open.mockReturnValue({
        onsuccess: null,
        onerror: null,
        error: new Error('openfail'),
        addEventListener: jest.fn(),
      });
      setTimeout(() => {
        global.indexedDB.open.mock.results[0].value.onerror();
      }, 0);

      // Act & Assert
      await expect(cacheDebug.getCacheStats()).resolves.toBeUndefined();
    });
  });
});
