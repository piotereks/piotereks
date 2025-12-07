// Tests for SearchBar.jsx

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------
//  APPLY MOCKS (must be before import)
// ---------------------------

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Search: (props) => <svg data-testid="search-icon" {...props} />,
}));

// Mock getUrlParameter
jest.mock('../../src/utils/urlUtils', () => ({
  getUrlParameter: jest.fn(),
}));

// Import after mocks
import { SearchBar } from '../../src/components/SearchBar';
import * as urlUtils from '../../src/utils/urlUtils';

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input, label, button, and icon', () => {

    // Arrange
    const onSearch = jest.fn();

    // Act
    render(<SearchBar onSearch={onSearch} />);

    // Assert
    expect(screen.getByLabelText('Find:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter word...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('sets input value from URL parameter on mount', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('foo');
    const onSearch = jest.fn();

    // Act
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');

    // Assert
    expect(input.value).toBe('foo');
  });

  it('does not set input value if URL parameter is empty', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('');
    const onSearch = jest.fn();

    // Act
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');

    // Assert
    expect(input.value).toBe('');
  });

  it('updates input value on popstate event', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValueOnce('').mockReturnValueOnce('bar');
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');

    // Act
    fireEvent.popState(window);

    // Assert
    expect(input.value).toBe('bar');
  });

  it('removes popstate event listener on unmount', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('');
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const onSearch = jest.fn();

    // Act
    const { unmount } = render(<SearchBar onSearch={onSearch} />);
    unmount();

    // Assert
    expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('calls onSearch with trimmed value when button is clicked', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('');
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');
    const button = screen.getByRole('button', { name: 'Search' });

    // Act
    fireEvent.change(input, { target: { value: '  hello  ' } });
    fireEvent.click(button);

    // Assert
    expect(onSearch).toHaveBeenCalledWith('hello');
  });

  it('does not call onSearch if input is empty or whitespace', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('');
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');
    const button = screen.getByRole('button', { name: 'Search' });

    // Act
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(button);

    // Assert
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('handles Enter keydown and triggers button click', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('');
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');
    const button = screen.getByRole('button', { name: 'Search' });

    // Spy on button click
    const clickSpy = jest.spyOn(button, 'click');

    // Act
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Assert
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('does not trigger button click on non-Enter keydown', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('');
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');
    const button = screen.getByRole('button', { name: 'Search' });

    // Spy on button click
    const clickSpy = jest.spyOn(button, 'click');

    // Act
    fireEvent.keyDown(input, { key: 'a', code: 'KeyA', charCode: 65 });

    // Assert
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('handles missing buttonRef gracefully on Enter', () => {

    // Arrange
    urlUtils.getUrlParameter.mockReturnValue('');
    const onSearch = jest.fn();

    // Patch React.useRef to simulate missing buttonRef.current
    const realUseRef = React.useRef;
    let inputRefObj;
    let buttonRefObj;

    jest.spyOn(React, 'useRef').mockImplementation((init) => {
      if (init === null && !inputRefObj) {
        inputRefObj = { current: null };
        return inputRefObj;
      }
      if (init === null && !buttonRefObj) {
        buttonRefObj = { current: null };
        return buttonRefObj;
      }
      return realUseRef(init);
    });

    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Enter word...');

    // Act
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Assert
    // No error should be thrown, nothing to check
    React.useRef.mockRestore();
  });
});