import { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'navy');
  const [layout, setLayout] = useState(localStorage.getItem('layout') || 'full');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('layout', layout);
  }, [layout]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, layout, setLayout }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
