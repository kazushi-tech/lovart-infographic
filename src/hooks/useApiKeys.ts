import { useState, useEffect, useCallback } from 'react';

export interface ResolvedApiKeys {
  geminiApiKey: string;
  imageApiKey: string;
}

export interface UseApiKeysReturn {
  storedKeys: ResolvedApiKeys;
  setKeys: (next: ResolvedApiKeys) => void;
  clearKeys: () => void;
  resolvedGeminiKey: string;
  resolvedImageKey: string;
  hasResolvableKey: boolean;
  hasResolvableImageKey: boolean;
  hasServerGeminiKey: boolean;
  hasServerImageKey: boolean;
  isRuntimeConfigLoading: boolean;
}

const STORAGE_GEMINI_KEY = 'lovart_gemini_api_key';
const STORAGE_IMAGE_KEY = 'lovart_image_api_key';

interface RuntimeConfig {
  hasServerGeminiKey: boolean;
  hasServerImageKey: boolean;
  devMode: boolean;
}

function loadFromLocalStorage(): ResolvedApiKeys {
  const geminiKey = (localStorage.getItem(STORAGE_GEMINI_KEY) || '').trim();
  const imageKey = (localStorage.getItem(STORAGE_IMAGE_KEY) || '').trim();
  return { geminiApiKey: geminiKey, imageApiKey: imageKey };
}

function saveToLocalStorage(keys: ResolvedApiKeys): void {
  localStorage.setItem(STORAGE_GEMINI_KEY, keys.geminiApiKey.trim());
  localStorage.setItem(STORAGE_IMAGE_KEY, keys.imageApiKey.trim());
}

function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_GEMINI_KEY);
  localStorage.removeItem(STORAGE_IMAGE_KEY);
}

function resolveKeys(
  stored: ResolvedApiKeys,
  runtimeConfig: RuntimeConfig
): { geminiKey: string; imageKey: string } {
  const resolvedGeminiKey =
    stored.geminiApiKey || '';

  const resolvedImageKey =
    stored.imageApiKey ||
    resolvedGeminiKey ||
    '';

  return { geminiKey: resolvedGeminiKey, imageKey: resolvedImageKey };
}

export function useApiKeys(): UseApiKeysReturn {
  const [storedKeys, setStoredKeys] = useState<ResolvedApiKeys>(loadFromLocalStorage);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>({
    hasServerGeminiKey: false,
    hasServerImageKey: false,
    devMode: false,
  });
  const [isRuntimeConfigLoading, setIsRuntimeConfigLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchRuntimeConfig() {
      try {
        const response = await fetch('/api/runtime-config', {
          signal: abortController.signal
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config: RuntimeConfig = await response.json();
        setRuntimeConfig(config);
        setIsRuntimeConfigLoading(false);
      } catch (error) {
        console.warn('Failed to fetch runtime config, using empty fallbacks:', error);
        setIsRuntimeConfigLoading(false);
      }
    }

    fetchRuntimeConfig();

    return () => {
      abortController.abort();
    };
  }, []);

  const setKeys = useCallback((next: ResolvedApiKeys) => {
    const sanitized = {
      geminiApiKey: next.geminiApiKey.trim(),
      imageApiKey: next.imageApiKey.trim(),
    };
    saveToLocalStorage(sanitized);
    setStoredKeys(sanitized);
  }, []);

  const clearKeys = useCallback(() => {
    clearLocalStorage();
    setStoredKeys({ geminiApiKey: '', imageApiKey: '' });
  }, []);

  const { geminiKey: resolvedGeminiKey, imageKey: resolvedImageKey } =
    resolveKeys(storedKeys, runtimeConfig);

  const hasResolvableKey = Boolean(resolvedGeminiKey || runtimeConfig.hasServerGeminiKey);
  const hasResolvableImageKey = Boolean(
    resolvedImageKey || runtimeConfig.hasServerImageKey || runtimeConfig.hasServerGeminiKey
  );

  return {
    storedKeys,
    setKeys,
    clearKeys,
    resolvedGeminiKey,
    resolvedImageKey,
    hasResolvableKey,
    hasResolvableImageKey,
    hasServerGeminiKey: runtimeConfig.hasServerGeminiKey,
    hasServerImageKey: runtimeConfig.hasServerImageKey,
    isRuntimeConfigLoading
  };
}
