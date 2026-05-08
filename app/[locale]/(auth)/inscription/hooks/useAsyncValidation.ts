import { useState, useCallback, useRef, useEffect } from "react";

interface ValidationCache {
  [key: string]: {
    isValid: boolean;
    timestamp: number;
    error?: string;
    value: string;
  };
}

const CACHE_DURATION = 60000; // 1 minute
const DEBOUNCE_DELAY = 500;

export function useAsyncValidation() {
  const [cache, setCache] = useState<ValidationCache>({});
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Nettoyage du cache périodique
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          if (now - newCache[key].timestamp > CACHE_DURATION) {
            delete newCache[key];
          }
        });
        return newCache;
      });
    }, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, []);

  // Annule la requête précédente pour une clé
  const cancelPreviousRequest = useCallback((key: string) => {
    const controller = abortControllers.current.get(key);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(key);
    }
    
    const timer = debounceTimers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.current.delete(key);
    }
  }, []);

  const validateAsync = useCallback((
    key: string,
    value: string,
    validator: (val: string, signal?: AbortSignal) => Promise<{ isValid: boolean; error?: string }>
  ): Promise<{ isValid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // Vérifie le cache d'abord
      const cached = cache[key];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.value === value) {
        resolve({ isValid: cached.isValid, error: cached.error });
        return;
      }

      // Annule la requête précédente
      cancelPreviousRequest(key);

      // Debounce
      const timer = setTimeout(async () => {
        const controller = new AbortController();
        abortControllers.current.set(key, controller);
        
        try {
          const result = await validator(value, controller.signal);
          
          // Met à jour le cache
          setCache(prev => ({
            ...prev,
            [key]: {
              isValid: result.isValid,
              timestamp: Date.now(),
              error: result.error,
              value
            }
          }));
          
          resolve(result);
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            resolve({ isValid: false, error: error.message });
          }
        } finally {
          abortControllers.current.delete(key);
        }
      }, DEBOUNCE_DELAY);
      
      debounceTimers.current.set(key, timer);
    });
  }, [cache, cancelPreviousRequest]);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  return {
    validateAsync,
    clearCache,
    cancelPreviousRequest
  };
}