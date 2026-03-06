import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { darkTheme } from './darkTheme';
import { lightTheme } from './lightTheme';

export interface Theme {
    name: 'dark' | 'light';
    colors: {
        bgPrimary: string; bgSecondary: string; bgTertiary: string;
        bgPanel: string; bgCard: string; bgHover: string; bgActive: string;
        border: string; borderSubtle: string;
        textPrimary: string; textSecondary: string; textMuted: string; textOnAccent: string;
        accent: string; accentHover: string; accentMuted: string;
        success: string; warning: string; error: string; info: string;
        nodeResource: string; nodeLiteral: string; nodeClass: string; nodeSelected: string;
        edgeAsserted: string; edgeInferred: string;
        editorBg: string; editorBorder: string;
    };
    shadows: { sm: string; md: string; lg: string; glow: string };
}

interface ThemeContextValue {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (name: 'dark' | 'light') => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => { },
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

function applyThemeToCss(theme: Theme): void {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(
            `--kg-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
            value as string
        );
    });
    Object.entries(theme.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--kg-shadow-${key}`, value as string);
    });
    document.body.setAttribute('data-theme', theme.name);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
        try {
            // ✅ Light theme by default as per documentation
            return localStorage.getItem('kg-theme') === 'dark' ? darkTheme : lightTheme;
        } catch {
            return lightTheme;
        }
    });

    useEffect(() => {
        applyThemeToCss(currentTheme);
    }, [currentTheme]);

    const toggleTheme = useCallback(() => {
        setCurrentTheme(prev => {
            const next = prev.name === 'dark' ? lightTheme : darkTheme;
            try { localStorage.setItem('kg-theme', next.name); } catch { }
            return next;
        });
    }, []);

    const setTheme = useCallback((name: 'dark' | 'light') => {
        const next = name === 'dark' ? darkTheme : lightTheme;
        try { localStorage.setItem('kg-theme', name); } catch { }
        setCurrentTheme(next);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme: currentTheme,
                isDark: currentTheme.name === 'dark',
                toggleTheme,
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};