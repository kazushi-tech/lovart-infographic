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
  isRuntimeConfigLoading: boolean;
}

const STORAGE_GEMINI_KEY = 'lovart_gemini_api_key';
const STORAGE_IMAGE_KEY = 'lovart_image_api_key';

interface RuntimeConfig {
  devFallbackGeminiKey: string;
  devFallbackImageKey: string;
}

function loadFromLocalStorage(): ResolvedApiKeys {
  const geminiKey = localStorage.getItem(STORAGE_GEMINI_KEY) || '';
  const imageKey = localStorage.getItem(STORAGE_IMAGE_KEY) || '';
  return { geminiApiKey: geminiKey, imageApiKey: imageKey };
}

function saveToLocalStorage(keys: ResolvedApiKeys): void {
  localStorage.setItem(STORAGE_GEMINI_KEY, keys.geminiApiKey);
  localStorage.setItem(STORAGE_IMAGE_KEY, keys.imageApiKey);
}

function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_GEMINI_KEY);
  localStorage.removeItem(STORAGE_IMAGE_KEY);
}

function resolveKeys(
  stored: ResolvedApiKeys,
  runtimeConfig: RuntimeConfig
): { geminiKey: string; imageKey: string } {
  const { devFallbackGeminiKey, devFallbackImageKey } = runtimeConfig;

  const resolvedGeminiKey =
    stored.geminiApiKey ||
    devFallbackGeminiKey ||
    devFallbackImageKey ||
    '';

  const resolvedImageKey =
    stored.imageApiKey ||
    devFallbackImageKey ||
    resolvedGeminiKey ||
    '';

  return { geminiKey: resolvedGeminiKey, imageKey: resolvedImageKey };
}

export function useApiKeys(): UseApiKeysReturn {
  const [storedKeys, setStoredKeys] = useState<ResolvedApiKeys>(loadFromLocalStorage);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>({
    devFallbackGeminiKey: '',
    devFallbackImageKey: ''
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
    saveToLocalStorage(next);
    setStoredKeys(next);
  }, []);

  const clearKeys = useCallback(() => {
    clearLocalStorage();
    setStoredKeys({ geminiApiKey: '', imageApiKey: '' });
  }, []);

  const { geminiKey: resolvedGeminiKey, imageKey: resolvedImageKey } =
    resolveKeys(storedKeys, runtimeConfig);

  const hasResolvableKey = Boolean(resolvedGeminiKey);

  return {
    storedKeys,
    setKeys,
    clearKeys,
    resolvedGeminiKey,
    resolvedImageKey,
    hasResolvableKey,
    isRuntimeConfigLoading
  };
}
