import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// import styles copied from docs/html/esp_res/styles.css so app matches original layout
import './styles/esp_res_styles.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
