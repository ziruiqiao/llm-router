import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

const ColorSchemeContext = createContext<{
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
} | null>(null);

export const ColorSchemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = _useColorScheme() as 'light' | 'dark';
  const [overrideScheme, setOverrideScheme] = useState<'light' | 'dark' | null>(null);

  const value = useMemo(() => ({
    colorScheme: overrideScheme || systemScheme || 'light',
    setColorScheme: setOverrideScheme,
  }), [overrideScheme, systemScheme]);

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
};

export const useColorScheme = () => {
  const context = useContext(ColorSchemeContext);
  if (!context) throw new Error("useColorScheme must be used inside a ColorSchemeProvider");
  return context;
};

export const useThemeColors = () => {
  const { colorScheme } = useColorScheme();
  return { colorScheme, colors: Colors[colorScheme] };
};
