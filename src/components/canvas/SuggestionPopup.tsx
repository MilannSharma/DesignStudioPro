import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface SuggestionPopupProps {
  suggestions: string[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (index: number) => void;
}

export const SuggestionPopup: React.FC<SuggestionPopupProps> = ({
  suggestions,
  selectedIndex,
  position,
  onSelect
}) => {
  if (suggestions.length === 0) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed z-[1000] bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden min-w-[120px] animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateY(-110%)'
      }}
    >
      <div className="flex flex-col">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`px-4 py-2 text-left text-sm transition-colors ${
              i === selectedIndex ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="font-medium">{s}</span>
            <span className="ml-2 text-[10px] opacity-50 font-mono">{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="bg-gray-50 px-2 py-1 text-[9px] text-gray-400 border-t border-gray-100 flex justify-between uppercase font-bold tracking-tighter">
        <span>↑↓ Navigate</span>
        <span>↵ Pick</span>
      </div>
    </div>,
    document.body
  );
};
