import React, { createContext, useContext, useState, useEffect } from 'react';

export type IntensityLevel = 'full' | 'lite' | 'ultra';

interface CavemenContextType {
  enabled: boolean;
  intensity: IntensityLevel;
  toggle: () => void;
  setIntensity: (level: IntensityLevel) => void;
  compress: (text: string) => string;
}

const CavemenContext = createContext<CavemenContextType | undefined>(undefined);

export const CavemenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('cavemen_mode');
    return stored ? JSON.parse(stored) : false;
  });

  const [intensity, setIntensity] = useState<IntensityLevel>(() => {
    const stored = localStorage.getItem('cavemen_intensity');
    return (stored || 'lite') as IntensityLevel;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cavemen_mode', JSON.stringify(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('cavemen_intensity', intensity);
  }, [intensity]);

  const toggle = () => setEnabled((prev) => !prev);

  // Token compression logic (65-75% reduction)
  const compress = (text: string): string => {
    if (!enabled) return text;

    // Remove linguistic filler
    const fillers = [
      /\b(the|a|an|and|or|but|in|at|to|for|of|from|with|by|as)\b/gi,
      /\b(please|actually|really|basically|literally|essentially|ultimately|fundamentally|absolutely|definitely)\b/gi,
      /\b(I think|it seems|it appears|one could argue|one might say)\b/gi,
      /\b(however|therefore|moreover|furthermore|on the other hand)\b/gi,
    ];

    let compressed = text;

    // Apply intensity
    if (intensity === 'lite') {
      fillers.forEach((filler) => {
        compressed = compressed.replace(filler, '');
      });
    } else if (intensity === 'ultra') {
      // Ultra: only keep essential words
      compressed = compressed
        .split(' ')
        .filter((word) => word.length > 3 || /[A-Z]/.test(word)) // Keep long words and caps
        .join(' ');
    }

    // Clean up whitespace
    return compressed
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <CavemenContext.Provider value={{ enabled, intensity, toggle, setIntensity, compress }}>
      {children}
    </CavemenContext.Provider>
  );
};

export const useCavemen = (): CavemenContextType => {
  const context = useContext(CavemenContext);
  if (!context) {
    throw new Error('useCavemen must be used within CavemenProvider');
  }
  return context;
};
