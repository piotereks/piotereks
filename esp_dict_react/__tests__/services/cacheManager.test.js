// Tests for _day constant in cacheManager.js

import * as cacheManager from '../../src/services/cacheManager';

describe('ONE_DAY_MS', () => {
    it('should be defined and equal to 24*60*60*1000 (milliseconds in a day)', () => {

        // Act
        const value = cacheManager.ONE_DAY_MS;

        // Assert
        expect(value).toBe(24 * 60 * 60 * 1000);
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
    });

    it('should not be zero or negative', () => {

        // Act
        const value = cacheManager.ONE_DAY_MS;

        // Assert
        expect(value).not.toBe(0);
        expect(value).toBeGreaterThan(0);
    });
});
