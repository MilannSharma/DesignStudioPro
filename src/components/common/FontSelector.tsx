/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ALL_FONTS } from '../../utils/fonts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
  className?: string;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredFonts = ALL_FONTS.filter(f => 
    f.display.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-load fonts when the dropdown opens so they show up in their correct style
  useEffect(() => {
    if (isOpen) {
      const gFonts = ALL_FONTS.filter(f => !f.name.includes('Noto Sans') && !f.name.includes('Noto Nastaliq'));
      
      // Google Fonts limits families per request, so we chunk them
      const chunkSize = 20;
      for (let i = 0; i < gFonts.length; i += chunkSize) {
        const chunk = gFonts.slice(i, i + chunkSize);
        const families = chunk.map(f => `${f.name.replace(/ /g, '+')}:wght@400;700`).join('&family=');
        const url = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
        
        if (!document.querySelector(`link[href="${url}"]`)) {
          const link = document.createElement('link');
          link.href = url;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      }
    }
  }, [isOpen]);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between hover:border-blue-500 transition-all active:scale-[0.98] shadow-sm group"
      >
        <span className="text-[12px] font-semibold truncate text-gray-700" style={{ fontFamily: value }}>
          {ALL_FONTS.find(f => f.name === value)?.display || value}
        </span>
        <ChevronDown size={14} className={cn("text-gray-400 transition-transform group-hover:text-blue-500", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[1000] overflow-hidden flex flex-col max-h-[400px] animate-in fade-in slide-in-from-top-1 duration-200 min-w-[220px]">
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                autoFocus
                type="text"
                placeholder="Try 'Poppins' or 'Inter'..."
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-[12px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1 custom-scrollbar scroll-smooth">
            {filteredFonts.length === 0 ? (
              <div className="px-4 py-10 text-center text-gray-400">
                <Search size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No fonts found</p>
              </div>
            ) : (
              filteredFonts.map(font => (
                <button
                  key={font.name}
                  onClick={() => {
                    onChange(font.name);
                    useStore.getState().setDefaultFontFamily(font.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "w-full px-4 py-3.5 flex items-center justify-between hover:bg-blue-50/80 transition-all group border-b border-gray-50/50 last:border-0",
                    value === font.name && "bg-blue-50/50"
                  )}
                >
                  <span 
                    className={cn(
                      "text-base text-gray-800 truncate transition-transform group-hover:translate-x-1",
                      value === font.name && "text-blue-600 font-bold"
                    )}
                    style={{ fontFamily: font.name }}
                  >
                    {font.display}
                  </span>
                  {value === font.name && (
                    <div className="bg-blue-600 rounded-full p-0.5 text-white shadow-lg shadow-blue-500/20">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {filteredFonts.length} Fonts
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
