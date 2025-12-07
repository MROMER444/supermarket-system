import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
};

export const DarkModeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage first, then system preference
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('darkMode');
            if (stored !== null) {
                const isDark = stored === 'true';
                // Sync with DOM immediately
                const root = document.documentElement;
                if (isDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
                return isDark;
            }
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            // Sync with DOM immediately
            const root = document.documentElement;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            return prefersDark;
        }
        return false;
    });

    useEffect(() => {
        // Update localStorage and document class when darkMode changes
        if (typeof window !== 'undefined') {
            // Save to localStorage
            localStorage.setItem('darkMode', darkMode.toString());
            
            // Update document class
            const root = document.documentElement;
            if (darkMode) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    return (
        <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};
