import '@testing-library/jest-dom';
import React from 'react';
import {render, screen, fireEvent, act} from '@testing-library/react';

// ---------------------------
//  APPLY MOCKS (must be before import)
// ---------------------------

// Mock SECTION_CONFIG
jest.mock('../../src/config/sections', () => ({
    SECTION_CONFIG: [
        {key: 'rae', baseUrl: 'https://rae.es/', label: 'RAE'},
        {key: 'wr', baseUrl: 'https://wordreference.com/', label: 'WR'},
    ],
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ExternalLink: ({...props}) => <svg data-testid="external-link-icon" {...props} />,
    ChevronUp: ({...props}) => <svg data-testid="chevron-up-icon" {...props} />,
    Trash2: ({...props}) => <svg data-testid="trash2-icon" {...props} />,
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
import {ExternalLinks} from '../../src/components/ExternalLinks';
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
        render(<ExternalLinks word="casa" onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

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
        render(<ExternalLinks word="casa" onCollapseAll={onCollapseAll} onSearch={onSearch}/>);
        fireEvent.click(screen.getByText('Collapse'));

        // Assert
        expect(onCollapseAll).toHaveBeenCalled();
    });

    it('renders only Clear 1d button and handles click (no word)', async () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(true);
        mockShowOnlyClearAll.mockReturnValue(false);
        mockShowClearDayButton.mockReturnValue(true);
        mockShowClearAllButton.mockReturnValue(false);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={undefined} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);
        const clearDayBtn = screen.getByText('Clear 1d');
        expect(clearDayBtn).toBeInTheDocument();

        // Assert
        await act(async () => {
            fireEvent.click(clearDayBtn);
        });
        expect(mockClearCacheOlderThanDay).toHaveBeenCalled();
        expect(onSearch).not.toHaveBeenCalled();
        expect(screen.getByText('Cleared')).toBeInTheDocument();
    });

    it('renders only Clear 1d button and handles click (with word)', async () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(true);
        mockShowOnlyClearAll.mockReturnValue(false);
        mockShowClearDayButton.mockReturnValue(true);
        mockShowClearAllButton.mockReturnValue(false);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word="perro" onCollapseAll={onCollapseAll} onSearch={onSearch}/>);
        const clearDayBtn = screen.getByText('Clear 1d');
        expect(clearDayBtn).toBeInTheDocument();

        // Assert
        await act(async () => {
            fireEvent.click(clearDayBtn);
        });
        expect(mockClearCacheOlderThanDay).toHaveBeenCalled();
        expect(onSearch).toHaveBeenCalledWith('perro');
        expect(screen.getByText('Cleared')).toBeInTheDocument();
    });

    it('renders only Clear All button and handles click (no word)', async () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(true);
        mockShowOnlyClearAll.mockReturnValue(false);
        mockShowClearDayButton.mockReturnValue(false);
        mockShowClearAllButton.mockReturnValue(true);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={undefined} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);
        const clearAllBtn = screen.getByText('Clear All');
        expect(clearAllBtn).toBeInTheDocument();

        // Assert
        await act(async () => {
            fireEvent.click(clearAllBtn);
        });
        expect(mockClearAllCache).toHaveBeenCalled();
        expect(onSearch).not.toHaveBeenCalled();
        expect(screen.getByText('Cleared')).toBeInTheDocument();
    });

    it('renders only Clear All button and handles click (with word)', async () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(true);
        mockShowOnlyClearAll.mockReturnValue(false);
        mockShowClearDayButton.mockReturnValue(false);
        mockShowClearAllButton.mockReturnValue(true);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word="gato" onCollapseAll={onCollapseAll} onSearch={onSearch}/>);
        const clearAllBtn = screen.getByText('Clear All');
        expect(clearAllBtn).toBeInTheDocument();

        // Assert
        await act(async () => {
            fireEvent.click(clearAllBtn);
        });
        expect(mockClearAllCache).toHaveBeenCalled();
        expect(onSearch).toHaveBeenCalledWith('gato');
        expect(screen.getByText('Cleared')).toBeInTheDocument();
    });

    it('renders only Clear All button when showOnlyClearAll is true', () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(true);
        mockShowOnlyClearAll.mockReturnValue(true);
        mockShowClearDayButton.mockReturnValue(true);
        mockShowClearAllButton.mockReturnValue(true);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word="zorro" onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert
        expect(screen.getByText('Clear All')).toBeInTheDocument();
        expect(screen.queryByText('Clear 1d')).not.toBeInTheDocument();
    });

    it('external links use buildUrl with correct args', () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(false);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word="lobo" onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert
        expect(mockBuildUrl).toHaveBeenCalledWith('https://rae.es/', 'lobo');
        expect(mockBuildUrl).toHaveBeenCalledWith('https://wordreference.com/', 'lobo');
    });

    it('external links use buildUrl with undefined word', () => {
        // Arrange
        mockShouldShowCacheClearButtons.mockReturnValue(false);
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={undefined} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert
        expect(mockBuildUrl).toHaveBeenCalledWith('https://rae.es/', undefined);
        expect(mockBuildUrl).toHaveBeenCalledWith('https://wordreference.com/', undefined);
    });
});

describe('ExternalLinks - URL generation for links', () => {
    beforeEach(() => {
        mockShouldShowCacheClearButtons.mockReturnValue(false);
    });
    it('generates correct URLs when word prop is provided', () => {
        // Arrange
        const word = 'gato';
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={word} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert - buildUrl should be called with correct parameters
        expect(mockBuildUrl).toHaveBeenCalledWith('https://rae.es/', 'gato');
        expect(mockBuildUrl).toHaveBeenCalledWith('https://wordreference.com/', 'gato');
    });

    it('generates correct URLs when word prop is empty string', () => {
        // Arrange
        const word = '';
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={word} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert - buildUrl should be called with empty string
        expect(mockBuildUrl).toHaveBeenCalledWith('https://rae.es/', '');
        expect(mockBuildUrl).toHaveBeenCalledWith('https://wordreference.com/', '');
    });

    it('link href attributes contain the built URLs', () => {
        // Arrange
        const word = 'perro';
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={word} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert - verify actual href attributes
        const raeLink = screen.getByText('RAE').closest('a');
        const wrLink = screen.getByText('WR').closest('a');

        expect(raeLink).toHaveAttribute('href', 'https://rae.es/perro');
        expect(wrLink).toHaveAttribute('href', 'https://wordreference.com/perro');
    });

    it('link href attributes work with special characters in word', () => {
        // Arrange
        const word = 'café';
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Mock buildUrl to encode special characters
        mockBuildUrl.mockImplementation((baseUrl, word) =>
            `${baseUrl}${word ? encodeURIComponent(word) : ''}`
        );

        // Act
        render(<ExternalLinks word={word} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert
        const raeLink = screen.getByText('RAE').closest('a');
        expect(raeLink).toHaveAttribute('href', 'https://rae.es/caf%C3%A9');
    });

    it('link href attributes work with multi-word phrases', () => {
        // Arrange
        const word = 'buenas noches';
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Mock buildUrl to encode spaces
        mockBuildUrl.mockImplementation((baseUrl, word) =>
            `${baseUrl}${word ? encodeURIComponent(word) : ''}`
        );

        // Act
        render(<ExternalLinks word={word} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert
        const raeLink = screen.getByText('RAE').closest('a');
        expect(raeLink).toHaveAttribute('href', 'https://rae.es/buenas%20noches');
    });

    it('all external links have target="_blank" and rel="noopener noreferrer"', () => {
        // Arrange
        const word = 'casa';
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={word} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert
        const links = screen.getAllByRole('link');

        links.forEach(link => {
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
    });

    it('updates URLs when word prop changes', () => {
        // Arrange
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act - initial render
        const {rerender} = render(
            <ExternalLinks word="gato" onCollapseAll={onCollapseAll} onSearch={onSearch}/>
        );

        // Assert - initial word
        expect(mockBuildUrl).toHaveBeenCalledWith('https://rae.es/', 'gato');

        // Act - update word
        jest.clearAllMocks();
        rerender(
            <ExternalLinks word="perro" onCollapseAll={onCollapseAll} onSearch={onSearch}/>
        );

        // Assert - new word
        expect(mockBuildUrl).toHaveBeenCalledWith('https://rae.es/', 'perro');
        expect(mockBuildUrl).toHaveBeenCalledWith('https://wordreference.com/', 'perro');
    });

    it('number of external link buttons matches SECTION_CONFIG length', () => {
        // Arrange
        const word = 'test';
        const onCollapseAll = jest.fn();
        const onSearch = jest.fn();

        // Act
        render(<ExternalLinks word={word} onCollapseAll={onCollapseAll} onSearch={onSearch}/>);

        // Assert - should have 2 external links (RAE, WR) based on mocked SECTION_CONFIG
        const externalLinks = screen.getAllByRole('link');
        expect(externalLinks).toHaveLength(2);
    });
});