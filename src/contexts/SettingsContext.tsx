import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  assemblyAIKey: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isConfigured: () => boolean;
}

const defaultSettings: Settings = {
  assemblyAIKey: '',
};

// Add static method to get settings without hooks
export const getSettings = (): Settings => {
  const savedSettings = localStorage.getItem('clearstudy-settings');
  return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
};

// Add static method to check if configured
export const isConfigured = (): boolean => {
  const settings = getSettings();
  return !!settings.assemblyAIKey;
};

// Add static method to get masked API key
export const getMaskedAPIKey = (): string => {
  const settings = getSettings();
  if (!settings.assemblyAIKey) return '';
  return settings.assemblyAIKey.substring(0, 4) + '...' + settings.assemblyAIKey.substring(settings.assemblyAIKey.length - 4);
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('clearstudy-settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    // Save settings to localStorage whenever they change
    localStorage.setItem('clearstudy-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const isConfigured = () => {
    return !!settings.assemblyAIKey;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isConfigured }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext; 