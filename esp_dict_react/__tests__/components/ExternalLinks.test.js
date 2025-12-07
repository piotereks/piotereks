import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ---------------------------
//  APPLY MOCKS (must be before import)
// ---------------------------

// Mock SECTION_CONFIG
jest.mock('../../src/config/sections', () => ({
    SECTION_CONFIG: [
        { key: 'rae', baseUrl: 'https://rae.es/', label: 'RAE' },
        { key: 'wr', baseUrl: 'https://wordreference.com/', label: 'WR' },
    ],
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ExternalLink: ({ ...props }) => <svg data-testid="external-link-icon" {...props} />,
    ChevronUp: ({ ...props }) => <svg data-testid="chevron-up-icon" {...props} />,
    Trash2: ({ ...props }) => <svg data-testid="trash2-icon" {...props} />,
}));

// Mock buildUrl - use factory function
jest.mock('../../src/utils/urlUtils', () => ({
    buildUrl: jest.fn((baseUrl, word) => `${baseUrl}${word || ''}`),
}));

// Mock cacheManager - use factory function
jest.mock('../../src/services/cacheManager', () => ({
    clearCacheOlderThanDay: jest.fn().mockResolvedValue(),
    clearAllCache: jest.fn().mockResolvedValue(),
    shouldShowCacheClearButtons: jest.fn(),
    showOnlyClearAll: jest.fn(),
    showClearDayButton: jest.fn(),
    showClearAllButton: jest.fn(),
}));

// Import after all mocks
import { ExternalLinks } from '../../src/components/ExternalLinks';
import * as urlUtils from '../../src/utils/urlUtils';
import * as cacheManager from '../../src/services/cacheManager';

// Get references to mocks
const mockBuildUrl = urlUtils.buildUrl;
const mockClearCacheOlderThanDay = cacheManager.clearCacheOlderThanDay;
const mockClearAllCache = cacheManager.clearAllCache;
const mockShouldShowCacheClearButtons = cacheManager.shouldShowCacheClearButtons;
const mockShowOnlyClearAll = cacheManager.showOnlyClearAll;
const mockShowClearDayButton = cacheManager.showClearDayButton;
const mockShowClearAllButton = cacheManager.showClearAllButton;

// ---------------------------
// SETUP
// ---------------------------
beforeEach(() => {
    jest.clearAllMocks();
});

describe('ExternalLinks', () => {
    it('renders all external links and collapse button', () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(false);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word="casa" onCollapseAll={onCollapseAll} onSearch={onSearch} />);

        // Assert
        expect(screen.getByText('RAE')).toBeInTheDocument();
        expect(screen.getByText('WR')).toBeInTheDocument();
        expect(screen.getAllByTestId('external-link-icon')).toHaveLength(2);
        expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
        expect(screen.getByText('Collapse')).toBeInTheDocument();
        expect(screen.queryByTestId('trash2-icon')).not.toBeInTheDocument();
    });

    it('calls onCollapseAll when collapse button is clicked', () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(false);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word="casa" onCollapseAll={onCollapseAll} onSearch={onSearch} />);
        fireEvent.click(screen.getByText('Collapse'));

        // Assert
        expect(onCollapseAll).toHaveBeenCalled();
    });

  it('renders only Clear 1d button and handles click (no word)', async () => {

    // Arrange
    shouldShowCacheClearButtons.mockReturnValue(true);
    showOnlyClearAll.mockReturnValue(false);
    showClearDayButton.mockReturnValue(true);
    showClearAllButton.mockReturnValue(false);
    const onCollapseAll = jest.fn();
    const onSearch = jest.fn();

    // Act
    render(<ExternalLinks word={undefined} onCollapseAll={onCollapseAll} onSearch={onSearch} />);
    const clearDayBtn = screen.getByText('Clear 1d');
    expect(clearDayBtn).toBeInTheDocument();

    // Assert
    await act(async () => {
      fireEvent.click(clearDayBtn);
    });
    expect(clearCacheOlderThanDay).toHaveBeenCalled();
    expect(onSearch).not.toHaveBeenCalled();
    // After click, button should show "Cleared" for a moment
    expect(screen.getByText('Cleared')).toBeInTheDocument();
  });

  it('renders only Clear 1d button and handles click (with word)', async () => {

    // Arrange
    shouldShowCacheClearButtons.mockReturnValue(true);
    showOnlyClearAll.mockReturnValue(false);
    showClearDayButton.mockReturnValue(true);
    showClearAllButton.mockReturnValue(false);
    const onCollapseAll = jest.fn();
    const onSearch = jest.fn();

    // Act
    render(<ExternalLinks word="perro" onCollapseAll={onCollapseAll} onSearch={onSearch} />);
    const clearDayBtn = screen.getByText('Clear 1d');
    expect(clearDayBtn).toBeInTheDocument();

    // Assert
    await act(async () => {
      fireEvent.click(clearDayBtn);
    });
    expect(clearCacheOlderThanDay).toHaveBeenCalled();
    expect(onSearch).toHaveBeenCalledWith('perro');
    expect(screen.getByText('Cleared')).toBeInTheDocument();
  });

  it('renders only Clear All button and handles click (no word)', async () => {

    // Arrange
    shouldShowCacheClearButtons.mockReturnValue(true);
    showOnlyClearAll.mockReturnValue(false);
    showClearDayButton.mockReturnValue(false);
    showClearAllButton.mockReturnValue(true);
    const onCollapseAll = jest.fn();
    const onSearch = jest.fn();

    // Act
    render(<ExternalLinks word={undefined} onCollapseAll={onCollapseAll} onSearch={onSearch} />);
    const clearAllBtn = screen.getByText('Clear All');
    expect(clearAllBtn).toBeInTheDocument();

    // Assert
    await act(async () => {
      fireEvent.click(clearAllBtn);
    });
    expect(clearAllCache).toHaveBeenCalled();
    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByText('Cleared')).toBeInTheDocument();
  });

  it('renders only Clear All button and handles click (with word)', async () => {

    // Arrange
    shouldShowCacheClearButtons.mockReturnValue(true);
    showOnlyClearAll.mockReturnValue(false);
    showClearDayButton.mockReturnValue(false);
    showClearAllButton.mockReturnValue(true);
    const onCollapseAll = jest.fn();
    const onSearch = jest.fn();

    // Act
    render(<ExternalLinks word="gato" onCollapseAll={onCollapseAll} onSearch={onSearch} />);
    const clearAllBtn = screen.getByText('Clear All');
    expect(clearAllBtn).toBeInTheDocument();

    // Assert
    await act(async () => {
      fireEvent.click(clearAllBtn);
    });
    expect(clearAllCache).toHaveBeenCalled();
    expect(onSearch).toHaveBeenCalledWith('gato');
    expect(screen.getByText('Cleared')).toBeInTheDocument();
  });

  it('renders both Clear 1d and Clear All buttons if showBothButtons is true', () => {

    // Arrange
    shouldShowCacheClearButtons.mockReturnValue(true);
    showOnlyClearAll.mockReturnValue(true);
    showClearDayButton.mockReturnValue(true);
    showClearAllButton.mockReturnValue(true);
    const onCollapseAll = jest.fn();
    const onSearch = jest.fn();

    // Act
    render(<ExternalLinks word="zorro" onCollapseAll={onCollapseAll} onSearch={onSearch} />);

    // Assert
    // Only Clear All should be visible, not Clear 1d
    expect(screen.getByText('Clear All')).toBeInTheDocument();
    expect(screen.queryByText('Clear 1d')).not.toBeInTheDocument();
  });

  it('external links use buildUrl with correct args', () => {

    // Arrange
    shouldShowCacheClearButtons.mockReturnValue(false);
    const onCollapseAll = jest.fn();
    const onSearch = jest.fn();

    // Act
    render(<ExternalLinks word="lobo" onCollapseAll={onCollapseAll} onSearch={onSearch} />);

    // Assert
    expect(buildUrlMock).toHaveBeenCalledWith('https://rae.es/', 'lobo');
    expect(buildUrlMock).toHaveBeenCalledWith('https://wordreference.com/', 'lobo');
  });

  it('external links use buildUrl with undefined word', () => {

    // Arrange
    shouldShowCacheClearButtons.mockReturnValue(false);
    const onCollapseAll = jest.fn();
    const onSearch = jest.fn();

    // Act
    render(<ExternalLinks word={undefined} onCollapseAll={onCollapseAll} onSearch={onSearch} />);

    // Assert
    expect(buildUrlMock).toHaveBeenCalledWith('https://rae.es/', undefined);
    expect(buildUrlMock).toHaveBeenCalledWith('https://wordreference.com/', undefined);
  });
});
