import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isLight, setIsLight] = useState(
        localStorage.getItem('parking_theme') === 'light'
    );

    useEffect(() => {
        if (isLight) {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('parking_theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('parking_theme', 'dark');
        }
    }, [isLight]);

    const toggleTheme = () => setIsLight(!isLight);

    return (
        <ThemeContext.Provider value={{ isLight, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
