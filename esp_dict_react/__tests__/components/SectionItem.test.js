// Tests for SectionItem.jsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionItem } from '../../src/components/SectionItem';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ChevronDown: (props) => <svg data-testid="chevron-down" {...props} />
}));

// Mock useWordRefStore
const setWord = jest.fn();
const handleSearch = jest.fn();
const retrySection = jest.fn();
jest.mock('../store/useWordRefStore', () => ({
  useWordRefStore: () => ({
    setWord,
    handleSearch,
    retrySection
  })
}));

describe('SectionItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with open state and normal content (happy path)', () => {

    // Arrange
    const props = {
      title: 'My Section',
      isOpen: true,
      loading: false,
      content: 'Hello <b>World</b>',
      onToggle: jest.fn(),
      sectionKey: 'test'
    };

    // Act
    render(<SectionItem {...props} />);

    // Assert
    expect(screen.getByText('My Section')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-gray-400');
    expect(screen.getByText('Hello World', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('renders with closed state', () => {

    // Arrange
    const props = {
      title: 'Closed Section',
      isOpen: false,
      loading: false,
      content: 'Closed content',
      onToggle: jest.fn(),
      sectionKey: 'closed'
    };

    // Act
    render(<SectionItem {...props} />);

    // Assert
    expect(screen.getByText('Closed Section')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
    // Content should be hidden (div with class 'hidden')
    const contentDiv = screen.getByText('Closed content').closest('div');
    expect(contentDiv).toHaveClass('hidden');
  });

  it('calls onToggle when header button is clicked', () => {

    // Arrange
    const onToggle = jest.fn();
    const props = {
      title: 'Toggle Section',
      isOpen: true,
      loading: false,
      content: 'Toggle content',
      onToggle,
      sectionKey: 'toggle'
    };

    // Act
    render(<SectionItem {...props} />);
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows loading spinner when loading is true', () => {

    // Arrange
    const props = {
      title: 'Loading Section',
      isOpen: true,
      loading: true,
      content: 'Loading content',
      onToggle: jest.fn(),
      sectionKey: 'loading'
    };

    // Act
    render(<SectionItem {...props} />);

    // Assert
    expect(screen.getByText((content, node) => node.className?.includes('animate-bounce'))).toBeInTheDocument();
  });

  it('shows error content and retry button, calls retrySection on click', () => {

    // Arrange
    const props = {
      title: 'Error Section',
      isOpen: true,
      loading: false,
      content: 'Error fetching content',
      onToggle: jest.fn(),
      sectionKey: 'error'
    };

    // Act
    render(<SectionItem {...props} />);
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);

    // Assert
    expect(screen.getByText('Error fetching content')).toBeInTheDocument();
    expect(retrySection).toHaveBeenCalledWith('error');
  });

  it('removes initial <br> from content', () => {

    // Arrange
    const props = {
      title: 'BR Section',
      isOpen: true,
      loading: false,
      content: '<br>First line',
      onToggle: jest.fn(),
      sectionKey: 'br'
    };

    // Act
    render(<SectionItem {...props} />);

    // Assert
    // The <br> should be removed from the rendered HTML
    const contentDiv = screen.getByText('First line').closest('div');
    expect(contentDiv.innerHTML).toContain('First line');
    expect(contentDiv.innerHTML).not.toContain('<br>');
  });

  it('removes initial <br/> from content', () => {

    // Arrange
    const props = {
      title: 'BR2 Section',
      isOpen: true,
      loading: false,
      content: '   <br/>Second line',
      onToggle: jest.fn(),
      sectionKey: 'br2'
    };

    // Act
    render(<SectionItem {...props} />);

    // Assert
    const contentDiv = screen.getByText('Second line').closest('div');
    expect(contentDiv.innerHTML).toContain('Second line');
    expect(contentDiv.innerHTML).not.toContain('<br');
  });

  it('renders with sectionKey "rae" and applies rae-content class', () => {

    // Arrange
    const props = {
      title: 'RAE Section',
      isOpen: true,
      loading: false,
      content: 'RAE content',
      onToggle: jest.fn(),
      sectionKey: 'rae'
    };

    // Act
    render(<SectionItem {...props} />);

    // Assert
    const contentDiv = screen.getByText('RAE content').closest('div');
    expect(contentDiv.className).toContain('rae-content');
  });

  it('handles content as non-string (edge case)', () => {

    // Arrange
    const props = {
      title: 'Obj Section',
      isOpen: true,
      loading: false,
      content: 12345,
      onToggle: jest.fn(),
      sectionKey: 'obj'
    };

    // Act
    render(<SectionItem {...props} />);

    // Assert
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('effect attaches and detaches link handlers (happy path)', () => {

    // Arrange
    const props = {
      title: 'Links Section',
      isOpen: true,
      loading: false,
      content: 'Links content',
      onToggle: jest.fn(),
      sectionKey: 'links'
    };

    // Mock DOM for effect
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const getAttribute = jest.fn().mockReturnValue('?word=testword');
    const link = { getAttribute, addEventListener, removeEventListener };
    const querySelectorAll = jest.fn().mockReturnValue([link]);
    const contentDiv = { querySelectorAll };
    document.getElementById = jest.fn().mockImplementation((id) =>
      id === 'linksFrameContent' ? contentDiv : null
    );

    // Act
    const { unmount } = render(<SectionItem {...props} />);

    // Assert
    expect(document.getElementById).toHaveBeenCalledWith('linksFrameContent');
    expect(querySelectorAll).toHaveBeenCalledWith('a');
    expect(addEventListener).toHaveBeenCalledWith('click', expect.any(Function));

    // Unmount to trigger cleanup
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('effect does nothing if isOpen is false', () => {

    // Arrange
    const props = {
      title: 'Closed',
      isOpen: false,
      loading: false,
      content: 'Closed',
      onToggle: jest.fn(),
      sectionKey: 'closed'
    };
    document.getElementById = jest.fn();

    // Act
    render(<SectionItem {...props} />);

    // Assert
    expect(document.getElementById).not.toHaveBeenCalled();
  });

  it('effect does nothing if contentDiv is not found', () => {

    // Arrange
    const props = {
      title: 'NoDiv',
      isOpen: true,
      loading: false,
      content: 'NoDiv',
      onToggle: jest.fn(),
      sectionKey: 'nodiv'
    };
    document.getElementById = jest.fn().mockReturnValue(null);

    // Act
    render(<SectionItem {...props} />);

    // Assert
    expect(document.getElementById).toHaveBeenCalledWith('nodivFrameContent');
  });

  it('effect clears old handlers if present', () => {

    // Arrange
    const props = {
      title: 'OldHandler',
      isOpen: true,
      loading: false,
      content: 'OldHandler',
      onToggle: jest.fn(),
      sectionKey: 'old'
    };
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const getAttribute = jest.fn().mockReturnValue('?word=oldword');
    const link = { getAttribute, addEventListener, removeEventListener };
    const querySelectorAll = jest.fn().mockReturnValue([link]);
    const contentDiv = { querySelectorAll };
    document.getElementById = jest.fn().mockReturnValue(contentDiv);

    // Simulate old handlers
    const oldHandler = { link, handler: jest.fn() };
    const map = new Map();
    map.set('old', [oldHandler]);
    React.useRef = jest.fn(() => ({ current: map }));

    // Act
    const { unmount } = render(<SectionItem {...props} />);

    // Assert
    expect(removeEventListener).toHaveBeenCalledWith('click', oldHandler.handler);

    // Unmount to trigger cleanup
    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});
