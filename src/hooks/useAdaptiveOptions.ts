import { useState, useCallback, useRef } from 'react';
import type { AdaptiveBriefContext, AdaptiveFieldId, StepOption } from '../interview/schema';
import { fetchAdaptiveOptions, prefetchAllAdaptiveOptions, clearAdaptiveCache } from '../services/adaptiveInterviewService';

interface AdaptiveOptionsEntry {
  options: StepOption[];
  isLoading: boolean;
  isCached: boolean;
  error: string | null;
}

export interface AdaptiveOptionsState {
  [stateKey: string]: AdaptiveOptionsEntry | undefined;
}

const ADAPTIVE_FIELDS: AdaptiveFieldId[] = ['targetAudience', 'keyMessage', 'tone', 'supplementary'];

function getContextKey(context: AdaptiveBriefContext): string {
  return [context.theme.trim(), context.styleId?.trim() ?? '', context.slideCount?.trim() ?? ''].join('::');
}

function getStateKey(fieldId: AdaptiveFieldId, context: AdaptiveBriefContext): string {
  return `${fieldId}::${getContextKey(context)}`;
}

export function useAdaptiveOptions() {
  const [optionsState, setOptionsState] = useState<AdaptiveOptionsState>({});
  const currentContextKeyRef = useRef('');
  const requestIdRef = useRef(0);
  const stateRequestIdsRef = useRef<Record<string, number>>({});

  const readState = useCallback((fieldId: AdaptiveFieldId, context?: AdaptiveBriefContext | null) => {
    if (!context) return undefined;
    return optionsState[getStateKey(fieldId, context)];
  }, [optionsState]);

  /**
   * Get options for a specific field.
   */
  const getOptions = useCallback((fieldId: AdaptiveFieldId, context?: AdaptiveBriefContext | null): StepOption[] => {
    return readState(fieldId, context)?.options || [];
  }, [readState]);

  /**
   * Check if options are loading for a field.
   */
  const isLoading = useCallback((fieldId: AdaptiveFieldId, context?: AdaptiveBriefContext | null): boolean => {
    return readState(fieldId, context)?.isLoading || false;
  }, [readState]);

  /**
   * Check if options are cached for a field.
   */
  const isCached = useCallback((fieldId: AdaptiveFieldId, context?: AdaptiveBriefContext | null): boolean => {
    return readState(fieldId, context)?.isCached || false;
  }, [readState]);

  /**
   * Get error message for a field.
   */
  const getError = useCallback((fieldId: AdaptiveFieldId, context?: AdaptiveBriefContext | null): string | null => {
    return readState(fieldId, context)?.error || null;
  }, [readState]);

  /**
   * Fetch options for a single field.
   */
  const fetchFieldOptions = useCallback(async (fieldId: AdaptiveFieldId, context: AdaptiveBriefContext) => {
    const contextKey = getContextKey(context);
    const stateKey = getStateKey(fieldId, context);
    const requestId = ++requestIdRef.current;

    currentContextKeyRef.current = contextKey;
    stateRequestIdsRef.current[stateKey] = requestId;
    setOptionsState(prev => ({
      ...prev,
      [stateKey]: {
        options: prev[stateKey]?.options || [],
        isLoading: true,
        isCached: prev[stateKey]?.isCached || false,
        error: null,
      },
    }));

    try {
      const result = await fetchAdaptiveOptions(fieldId, context);
      if (currentContextKeyRef.current !== contextKey || stateRequestIdsRef.current[stateKey] !== requestId) {
        return;
      }
      setOptionsState(prev => ({
        ...prev,
        [stateKey]: { options: result.options, isLoading: false, isCached: result.isCached, error: null },
      }));
    } catch {
      if (currentContextKeyRef.current !== contextKey || stateRequestIdsRef.current[stateKey] !== requestId) {
        return;
      }
      setOptionsState(prev => ({
        ...prev,
        [stateKey]: {
          options: prev[stateKey]?.options || [],
          isLoading: false,
          isCached: false,
          error: 'オプションの取得に失敗しました',
        },
      }));
    }
  }, []);

  /**
   * Prefetch options for all adaptive fields after slideCount is answered.
   */
  const prefetchAll = useCallback(async (context: AdaptiveBriefContext) => {
    const contextKey = getContextKey(context);
    const requestId = ++requestIdRef.current;

    currentContextKeyRef.current = contextKey;
    for (const fieldId of ADAPTIVE_FIELDS) {
      stateRequestIdsRef.current[getStateKey(fieldId, context)] = requestId;
    }

    setOptionsState(prev => {
      const nextState = { ...prev };
      for (const fieldId of ADAPTIVE_FIELDS) {
        const stateKey = getStateKey(fieldId, context);
        nextState[stateKey] = {
          options: prev[stateKey]?.options || [],
          isLoading: true,
          isCached: prev[stateKey]?.isCached || false,
          error: null,
        };
      }
      return nextState;
    });

    try {
      const results = await prefetchAllAdaptiveOptions(context);
      if (currentContextKeyRef.current !== contextKey) {
        return;
      }

      setOptionsState(prev => {
        const newState = { ...prev };
        for (const fieldId of ADAPTIVE_FIELDS) {
          const stateKey = getStateKey(fieldId, context);
          if (stateRequestIdsRef.current[stateKey] !== requestId) {
            continue;
          }
          const result = results[fieldId];
          if (result) {
            newState[stateKey] = {
              options: result.options,
              isLoading: false,
              isCached: result.isCached,
              error: null,
            };
          } else {
            newState[stateKey] = {
              options: prev[stateKey]?.options || [],
              isLoading: false,
              isCached: false,
              error: 'オプションの取得に失敗しました',
            };
          }
        }
        return newState;
      });
    } catch (error) {
      if (currentContextKeyRef.current !== contextKey) {
        return;
      }
      setOptionsState(prev => {
        const nextState = { ...prev };
        for (const fieldId of ADAPTIVE_FIELDS) {
          const stateKey = getStateKey(fieldId, context);
          if (stateRequestIdsRef.current[stateKey] !== requestId) {
            continue;
          }
          nextState[stateKey] = {
            options: prev[stateKey]?.options || [],
            isLoading: false,
            isCached: false,
            error: 'オプションの取得に失敗しました',
          };
        }
        return nextState;
      });
      console.warn('Prefetch failed:', error);
    }
  }, []);

  /**
   * Clear all cached options.
   */
  const clearCache = useCallback(() => {
    clearAdaptiveCache();
    currentContextKeyRef.current = '';
    requestIdRef.current = 0;
    stateRequestIdsRef.current = {};
    setOptionsState({});
  }, []);

  return {
    getOptions,
    isLoading,
    isCached,
    getError,
    fetchFieldOptions,
    prefetchAll,
    clearCache,
  };
}
