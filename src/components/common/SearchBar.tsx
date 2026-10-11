import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher un match, une équipe, un championnat...',
}) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center w-full">
        {/* Search icon in electric blue */}
        <div className="absolute left-4 sm:left-5 text-[#0066ff] pointer-events-none flex items-center justify-center">
          <span style={{}}>
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#0066ff]" />
          </span>
        </div>

        {/* Pill Input */}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-10 bg-white border border-[#cde3fb] rounded-full shadow-[0_2px_10px_rgba(0,102,255,0.03)] text-xs sm:text-sm font-medium text-[#071838] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/25 focus:border-[#0066ff] transition-all"
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Effacer la recherche"
            className="absolute right-3.5 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            style={{ display: 'none' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
