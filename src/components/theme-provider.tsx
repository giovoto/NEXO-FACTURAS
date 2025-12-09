'use client';
import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // On mount, check local storage for custom colors and apply them
    const colorVars = [
        '--primary',
        '--background',
        '--card',
        '--accent'
    ];
    
    colorVars.forEach(varName => {
        const savedColor = localStorage.getItem(`theme_color_${varName}`);
        if (savedColor) {
            document.documentElement.style.setProperty(varName, savedColor);
        }
    });
  }, []);

  return <>{children}</>;
}
