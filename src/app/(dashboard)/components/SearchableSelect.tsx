import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  allowCreate = false,
  searchPlaceholder = "Search..."
}: {
  options: string[],
  value: string,
  onChange: (val: string) => void,
  placeholder: string,
  allowCreate?: boolean,
  searchPlaceholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = options.some(opt => opt.toLowerCase() === search.trim().toLowerCase());
  const showCreate = allowCreate && search.trim().length > 0 && !exactMatch;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-brand-red focus:ring-brand-red sm:text-sm p-2 border cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-8 pr-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red border"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-auto flex-1 p-1">
            <div 
              className={`px-3 py-2 text-sm cursor-pointer rounded-md ${!value ? 'bg-brand-red/10 text-brand-red' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              (Blank)
            </div>
            {filtered.map(opt => (
              <div 
                key={opt}
                className={`px-3 py-2 text-sm cursor-pointer rounded-md ${value === opt ? 'bg-brand-red/10 text-brand-red' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                {opt}
              </div>
            ))}
            {showCreate && (
              <div 
                className="px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-gray-100 text-brand-red font-medium"
                onClick={() => { onChange(search.trim()); setIsOpen(false); }}
              >
                Create "{search.trim()}"
              </div>
            )}
            {!showCreate && filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
