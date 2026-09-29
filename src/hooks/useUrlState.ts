import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useUrlState(key: string, initialValue: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [value, setValue] = useState(() => searchParams?.get(key) || initialValue);

  useEffect(() => {
    const current = searchParams?.get(key);
    if (current !== value) {
      if (value === initialValue && current === null) return;
      
      const params = new URLSearchParams((searchParams?.toString() || ''));
      if (value === initialValue || !value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      
      const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [value, key, pathname, searchParams, initialValue]);

  useEffect(() => {
    const current = searchParams?.get(key) || initialValue;
    if (current !== value) {
      setValue(current);
    }
  }, [searchParams, key, initialValue]);

  return [value, setValue] as const;
}

export function useUrlStateArray(key: string, initialValue: string[]) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [value, setValue] = useState<string[]>(() => {
    const param = searchParams?.get(key);
    return param ? param.split(',') : initialValue;
  });

  useEffect(() => {
    const current = searchParams?.get(key);
    const valueStr = value.join(',');
    const initialStr = initialValue.join(',');
    
    if (current !== valueStr) {
      if (valueStr === initialStr && current === null) return;
      
      const params = new URLSearchParams((searchParams?.toString() || ''));
      if (valueStr === initialStr || !valueStr) {
        params.delete(key);
      } else {
        params.set(key, valueStr);
      }
      
      const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [value, key, pathname, searchParams, initialValue]);

  useEffect(() => {
    const current = searchParams?.get(key);
    const initialStr = initialValue.join(',');
    const valueStr = value.join(',');
    
    const nextStr = current || initialStr;
    if (nextStr !== valueStr) {
      setValue(nextStr ? nextStr.split(',') : []);
    }
  }, [searchParams, key, initialValue]);

  return [value, setValue] as const;
}
