import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export function useUrlState(key: string, initialValue: string) {
  const searchParams = useSearchParams();
  
  // Initialize from Next.js searchParams
  const [value, setValue] = useState(() => {
    const param = searchParams?.get(key);
    return param !== null ? param : initialValue;
  });

  const isMounted = useRef(false);

  // 1. Sync React state -> URL
  // Only depend on [value], NOT searchParams! This prevents Next.js router updates from triggering infinite loops.
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    
    if (value === initialValue || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    const newUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
    
    window.history.replaceState(null, '', newUrl);
  }, [value, key, initialValue]);

  // 2. Sync URL -> React state
  // This catches Next.js router navigations (like clicking a sidebar link to clear filters)
  useEffect(() => {
    const param = searchParams?.get(key);
    const expectedValue = param !== null ? param : initialValue;
    if (value !== expectedValue) {
      setValue(expectedValue);
    }
  }, [searchParams, key, initialValue]);

  return [value, setValue] as const;
}

export function useUrlStateArray(key: string, initialValue: string[]) {
  const searchParams = useSearchParams();
  
  const [value, setValue] = useState<string[]>(() => {
    const param = searchParams?.get(key);
    return param ? param.split(',') : initialValue;
  });

  const isMounted = useRef(false);
  const initialValueRef = useRef(initialValue);

  // 1. Sync React state -> URL
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const valueStr = value.join(',');
    const initialStr = initialValueRef.current.join(',');
    
    if (valueStr === initialStr || !valueStr) {
      params.delete(key);
    } else {
      params.set(key, valueStr);
    }
    
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    const newUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
    
    window.history.replaceState(null, '', newUrl);
  }, [value, key]); 

  // 2. Sync URL -> React state
  useEffect(() => {
    const param = searchParams?.get(key);
    const expectedValue = param ? param.split(',') : initialValueRef.current;
    
    const valueStr = value.join(',');
    const expectedStr = expectedValue.join(',');
    
    if (valueStr !== expectedStr) {
      setValue(expectedValue);
    }
  }, [searchParams, key]);

  return [value, setValue] as const;
}
