import { useState, useCallback, useRef, useEffect } from 'react';
import type { AdaptiveBriefContext, AdaptiveFieldId, AdaptiveOptionsResult, StepOption } from '../interview/schema';
import { fetchAdaptiveOptions, prefetchAllAdaptiveOptions, clearAdaptiveCache } from '../services/adaptiveInterviewService';

export interface AdaptiveOptionsState {
  [fieldId: string]: {
    options: StepOption[];
    isLoading: boolean;
    isCached: boolean;
    error: string | null;
  } | undefined;
}

export function useAdaptiveOptions() {
  const [optionsState, setOptionsState] = useState<AdaptiveOptionsState>({});
  const isPrefetchingRef = useRef(false);

  /**
   * Get options for a specific field.
   */
  const getOptions = useCallback((fieldId: AdaptiveFieldId): StepOption[] => {
    const state = optionsState[fieldId];
    return state?.options || [];
  }, [optionsState]);

  /**
   * Check if options are loading for a field.
   */
  const isLoading = useCallback((fieldId: AdaptiveFieldId): boolean => {
    return optionsState[fieldId]?.isLoading || false;
  }, [optionsState]);

  /**
   * Check if options are cached for a field.
   */
  const isCached = useCallback((fieldId: AdaptiveFieldId): boolean => {
    return optionsState[fieldId]?.isCached || false;
  }, [optionsState]);

  /**
   * Get error message for a field.
   */
  const getError = useCallback((fieldId: AdaptiveFieldId): string | null => {
    return optionsState[fieldId]?.error || null;
  }, [optionsState]);

  /**
   * Fetch options for a single field.
   */
  const fetchFieldOptions = useCallback(async (fieldId: AdaptiveFieldId, context: AdaptiveBriefContext) => {
    // Check if already loading or recently fetched
    const existing = optionsState[fieldId];
    if (existing?.isLoading) return;

    // Set loading state
    setOptionsState(prev => ({
      ...prev,
      [fieldId]: { options: prev[fieldId]?.options || [], isLoading: true, isCached: false, error: null },
    }));

    try {
      const result = await fetchAdaptiveOptions(fieldId, context);
      setOptionsState(prev => ({
        ...prev,
        [fieldId]: { options: result.options, isLoading: false, isCached: result.isCached, error: null },
      }));
    } catch (error) {
      setOptionsState(prev => ({
        ...prev,
        [fieldId]: { options: [], isLoading: false, isCached: false, error: 'オプションの取得に失敗しました' },
      }));
    }
  }, [optionsState]);

  /**
   * Prefetch options for all adaptive fields after slideCount is answered.
   */
  const prefetchAll = useCallback(async (context: AdaptiveBriefContext) => {
    if (isPrefetchingRef.current) return;
    isPrefetchingRef.current = true;

    try {
      const results = await prefetchAllAdaptiveOptions(context);

      // Update state with all fetched results
      setOptionsState(prev => {
        const newState = { ...prev };
        for (const [fieldId, result] of Object.entries(results)) {
          if (result) {
            newState[fieldId] = {
              options: result.options,
              isLoading: false,
              isCached: result.isCached,
              error: null,
            };
          }
        }
        return newState;
      });
    } catch (error) {
      console.warn('Prefetch failed:', error);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, []);

  /**
   * Clear all cached options.
   */
  const clearCache = useCallback(() => {
    clearAdaptiveCache();
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
