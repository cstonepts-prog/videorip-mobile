import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadSettings, saveSettings, resetSettings as resetSettingsService, DEFAULT_SETTINGS } from '../services/settingsService';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const writeChain = useRef(Promise.resolve());

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const loaded = await loadSettings();
        if (live) { setSettings(loaded); setHydrated(true); }
      } catch {
        if (live) { setSettings({ ...DEFAULT_SETTINGS }); setHydrated(true); }
      }
    })();
    return () => { live = false; };
  }, []);

  const updateSettings = useCallback((patch) => {
    if (!hydrated) return;
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeChain.current = writeChain.current.then(() => saveSettings(next).catch(() => {}));
      return next;
    });
  }, [hydrated]);

  const resetSettings = useCallback(async () => {
    const next = await resetSettingsService();
    setSettings(next);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, hydrated, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
