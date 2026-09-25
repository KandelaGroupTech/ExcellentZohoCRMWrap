'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import SwipeableCard from './SwipeableCard';

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchPlaceholder?: string;
  searchKey?: string | string[]; // Can be a single key or array of keys
  searchFn?: (row: any, query: string) => boolean; // Optional custom search logic
  onRowClick?: (row: any) => void;
  // For mobile view:
  mobileCardRenderer?: (row: any) => React.ReactNode;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

export default function DataTable({ data, columns, searchPlaceholder = "Search...", searchKey, searchFn, onRowClick, mobileCardRenderer, onEdit, onDelete }: DataTableProps) {
  const [query, setQuery] = useState('');

  const filteredData = data.filter((row) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();

    // Use custom search function if provided
    if (searchFn) return searchFn(row, lowerQuery);
    
    // Otherwise use searchKey(s)
    const keys = Array.isArray(searchKey) ? searchKey : [searchKey];
    
    // Combine the values of all search keys into one string (separated by space)
    // This allows searching "First Last" against ['First_Name', 'Last_Name']
    const combinedVal = keys.map(k => {
      if (!k) return '';
      const val = row[k as string];
      if (!val) return '';
      return typeof val === 'object' && val.name ? val.name : String(val);
    }).join(' ');

    return combinedVal.toLowerCase().includes(lowerQuery);
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-red focus:border-brand-red sm:text-sm"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {/* Desktop Table */}
        <div className="hidden sm:block min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr 
                    key={row.id || idx} 
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {col.render ? col.render(row) : (
                          typeof row[col.key] === 'object' && row[col.key] !== null 
                            ? row[col.key].name 
                            : row[col.key]
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block sm:hidden">
          {filteredData.length > 0 ? (
            filteredData.map((row, idx) => (
              <SwipeableCard
                key={row.id || idx}
                onEdit={onEdit ? () => onEdit(row) : undefined}
                onDelete={onDelete ? () => onDelete(row) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {mobileCardRenderer ? (
                  mobileCardRenderer(row)
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-brand-red">
                        {columns[0]?.render ? columns[0].render(row) : row[columns[0]?.key]}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {columns.slice(1, 3).map(col => {
                        if (col.key === 'actions') return null;
                        return (
                          <div key={col.key} className="text-sm text-gray-500 flex justify-between">
                            <span>{col.label}:</span>
                            <span className="text-gray-900 font-medium">
                              {col.render ? col.render(row) : (
                                typeof row[col.key] === 'object' && row[col.key] !== null ? row[col.key].name : row[col.key]
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </SwipeableCard>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


