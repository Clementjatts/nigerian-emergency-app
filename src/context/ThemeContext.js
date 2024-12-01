import React, { createContext, useContext } from 'react';
import ThemeService, { lightTheme, darkTheme } from '../services/themeService';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { theme, setTheme, currentTheme } = ThemeService.useTheme();

  const value = {
    theme,
    setTheme,
    currentTheme,
    toggleTheme: () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      ThemeService.setTheme(newTheme);
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
