import {
  buildUrl,
  buildSpellUrl,
  updateUrlWithWord,
  getUrlParameter
} from '../../src/utils/urlUtils';

describe('urlUtils', () => {
  describe('buildUrl', () => {
    it('builds a URL with encoded word (happy path)', () => {
      // Act
      const result = buildUrl('https://foo.com/', 'gato perro');

      // Assert
      expect(result).toBe('https://foo.com/gato%20perro');
    });

    it('encodes special characters in word', () => {
      // Act
      const result = buildUrl('https://foo.com/', 'áéí/!');


      // Assert
      expect(result).toBe('https://foo.com/%C3%A1%C3%A9%C3%AD%2F!');
    });

    it('works with empty baseUrl', () => {
      // Act
      const result = buildUrl('', 'word');

      // Assert
      expect(result).toBe('word');
    });

    it('works with empty word', () => {
      // Act
      const result = buildUrl('https://foo.com/', '');

      // Assert
      expect(result).toBe('https://foo.com/');
    });
  });

  describe('buildSpellUrl', () => {
    it('builds spell URL with encoded word (happy path)', () => {
      // Act
      const result = buildSpellUrl('gato perro');

      // Assert
      expect(result).toBe('https://spell.wordreference.com/spell/spelljs.php?dict=eses&w=gato%20perro');
    });

    it('encodes special characters in word', () => {
      // Act
      const result = buildSpellUrl('áéí/!');

      // Assert
      expect(result).toBe('https://spell.wordreference.com/spell/spelljs.php?dict=eses&w=%C3%A1%C3%A9%C3%AD%2F!');
    });

    it('works with empty word', () => {
      // Act
      const result = buildSpellUrl('');

      // Assert
      expect(result).toBe('https://spell.wordreference.com/spell/spelljs.php?dict=eses&w=');
    });
  });

  describe('updateUrlWithWord', () => {
    let originalLocation;
    let originalPushState;

    beforeEach(() => {
      // Arrange
      originalLocation = window.location;
      originalPushState = window.history.pushState;
      // Instead of redefining window.location, override just the needed properties
      // window.location.pathname = '/foo';
      window.history.pushState({}, "", "/foo");
      window.location.search = '';
      window.history.pushState = jest.fn();
    });

    afterEach(() => {
      // Arrange
      window.location = originalLocation;
      window.history.pushState = originalPushState;
    });

    it('updates the URL with encoded word (happy path)', () => {
      // Act
      updateUrlWithWord('gato perro');
      console.log = window.history.pushState
      // Assert
      expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/foo?word=gato%20perro');
    });

    it('encodes special characters in word', () => {
      // Act
      updateUrlWithWord('áéí/!');

      // Assert
      expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/foo?word=%C3%A1%C3%A9%C3%AD%2F!');
    });

    it('works with empty word', () => {
      // Act
      updateUrlWithWord('');

      // Assert
      expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/foo?word=');
    });
  });

  describe('getUrlParameter', () => {
    let originalLocation;

    beforeEach(() => {
      // Arrange
      originalLocation = window.location;
      delete window.location;
      window.location = { search: '' };
    });

    afterEach(() => {
      // Arrange
      window.location = originalLocation;
    });

    it('returns the value of a parameter (happy path)', () => {
      // Arrange
      // window.location.search = "http://localhost/?word=gato";
      window.history.pushState({}, "", "http://localhost/?word=gato");

      // Act
      const result = getUrlParameter('word');

      // Assert
      expect(result).toBe('gato');
    });

    it('returns null if parameter does not exist', () => {
      // Arrange
      window.history.pushState({}, "", "http://localhost/?foo=bar");
      // window.location.search = '?foo=bar';

      // Act
      const result = getUrlParameter('word');

      // Assert
      expect(result).toBeNull();
    });

    it('returns empty string if parameter is present but empty', () => {
      // Arrange
      // window.location.search = '?word=';
       window.history.pushState({}, "", "http://localhost/?word=");
      // Act
      const result = getUrlParameter('word');

      // Assert
      expect(result).toBe('');
    });

    it('returns first value if parameter appears multiple times', () => {
      // Arrange
      // window.location.search = '?word=uno&word=dos';
      window.history.pushState({}, "", "http://localhost/?word=uno&word=dos");
      // Act
      const result = getUrlParameter('word');

      // Assert
      expect(result).toBe('uno');
    });

    it('decodes encoded values', () => {
      // Arrange
      // window.location.search = '?word=gato%20perro';
      window.history.pushState({}, "", "http://localhost/?word=gato%20perro");
      
      // Act
      const result = getUrlParameter('word');

      // Assert
      expect(result).toBe('gato perro');
    });
  });
});
