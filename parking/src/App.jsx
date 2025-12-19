import React, { useState } from 'react';
import { ThemeProvider } from './ThemeContext';
import Dashboard from './Dashboard';
import Statistics from './Statistics';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'stats'

  return (
    <ThemeProvider>
      {view === 'dashboard' ? (
        <Dashboard setView={setView} />
      ) : (
        <Statistics setView={setView} />
      )}
    </ThemeProvider>
  );
}

export default App;
