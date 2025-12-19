import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Dashboard from './Dashboard';
import Statistics from './Statistics';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stats" element={<Statistics />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
