import React from 'react'
import {createRoot} from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import './styles/wordreference.css'

// Load cache debug helpers in development
if (import.meta.env.DEV) {
    import('./utils/cacheDebug.js').then(m => {
        window.cacheDebug = m;
        console.log('Cache debug helpers available at window.cacheDebug');
    }).catch(e => console.error('Failed to load cache debug helpers:', e));
}

const root = document.getElementById('root')
if (root) {
    createRoot(root).render(
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    )
}