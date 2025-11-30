# WordRef Search - React + Vite + Zustand

A modular Spanish dictionary application using WordReference, RAE, and other dictionary sources.

## Project Structure

```
src/
├── config/
│   └── sections.js          # Section configuration
├── utils/
│   └── urlUtils.js          # URL utility functions
├── services/
│   └── contentService.js    # Content fetching & parsing
├── store/
│   └── useWordRefStore.js   # Zustand store (state management)
├── components/
│   ├── SearchBar.jsx        # Search input component
│   ├── ExternalLinks.jsx    # External dictionary links
│   ├── SectionItem.jsx      # Individual collapsible section
│   └── SectionsList.jsx     # List of all sections
├── styles/
│   └── wordRefStyles.js     # CSS styles
└── App.jsx                  # Main component
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Features

- ✅ **Zustand state management** - Clean, lightweight state
- ✅ **Modular architecture** - Each file has single responsibility
- ✅ **Multiple dictionary sources** - WordReference (ES-ES, ES-EN, synonyms, conjugation) + RAE
- ✅ **URL-based navigation** - Share searches via URL
- ✅ **Internal link handling** - Click words to search them
- ✅ **Spell checking fallback** - Suggests corrections for misspellings
- ✅ **Responsive design** - Works on mobile and desktop

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Usage

1. Enter a Spanish word in the search box
2. Click "Search" or press Enter
3. Browse definitions, synonyms, translations, and conjugations
4. Click on related words to search them
5. Use external links to open full dictionary pages

## Module Descriptions

### Config
- **sections.js** - Configuration for all dictionary sections (URLs, selectors, labels)

### Utils
- **urlUtils.js** - URL building, parameter extraction, and history management

### Services
- **contentService.js** - Fetches HTML, parses content, sets up internal links, handles spell suggestions

### Store
- **useWordRefStore.js** - Zustand store with all state and actions (search, toggle sections, fetch content)

### Components
- **SearchBar.jsx** - Search input with Enter key support
- **ExternalLinks.jsx** - Buttons to open external dictionary pages
- **SectionItem.jsx** - Collapsible section with loading state
- **SectionsList.jsx** - Renders all dictionary sections

### Styles
- **wordRefStyles.js** - CSS for dictionary content styling
