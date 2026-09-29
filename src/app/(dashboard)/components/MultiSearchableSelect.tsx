import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function MultiSearchableSelect({
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

  const selectedList = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    const isSelected = selectedList.includes(opt);
    let newList;
    if (isSelected) {
      newList = selectedList.filter(s => s !== opt);
    } else {
      newList = [...selectedList, opt];
    }
    onChange(newList.join(', '));
  };

  const removeOption = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    const newList = selectedList.filter(s => s !== opt);
    onChange(newList.join(', '));
  };

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = options.some(opt => opt.toLowerCase() === search.trim().toLowerCase());
  const showCreate = allowCreate && search.trim().length > 0 && !exactMatch;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="mt-1 min-h-[38px] w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red sm:text-sm p-1.5 border cursor-pointer flex items-center justify-between gap-2 flex-wrap"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedList.length === 0 ? (
            <span className="text-gray-400 ml-1 py-0.5">{placeholder}</span>
          ) : (
            selectedList.map(opt => (
              <span key={opt} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-red/10 text-brand-red">
                {opt}
                <X className="h-3 w-3 hover:text-red-900 cursor-pointer shrink-0" onClick={(e) => removeOption(e, opt)} />
              </span>
            ))
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mr-1" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-8 pr-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red border bg-white text-gray-900"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-auto flex-1 p-1">
            {filtered.map(opt => (
              <div 
                key={opt}
                className={`flex items-center px-3 py-2 text-sm cursor-pointer rounded-md ${selectedList.includes(opt) ? 'bg-brand-red/10 text-brand-red' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={(e) => { e.stopPropagation(); toggleOption(opt); }}
              >
                <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${selectedList.includes(opt) ? 'border-brand-red bg-brand-red text-white' : 'border-gray-300'}`}>
                  {selectedList.includes(opt) && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                {opt}
              </div>
            ))}
            {showCreate && (
              <div 
                className="px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-gray-100 text-brand-red font-medium"
                onClick={(e) => { e.stopPropagation(); toggleOption(search.trim()); setSearch(''); }}
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
