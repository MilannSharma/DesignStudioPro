/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store/useStore';
import { History as HistoryIcon, RotateCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const HistoryPanel: React.FC = () => {
  const { history, historyIndex, jumpToHistory } = useStore();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <HistoryIcon size={14} />
          History
        </h3>
        <span className="text-[9px] font-bold text-gray-400">{history.length} steps</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300 gap-2">
            <RotateCcw size={24} className="opacity-20" />
            <p className="text-[9px] font-bold uppercase tracking-widest">No history yet</p>
          </div>
        ) : (
          history.map((step, index) => (
            <button
              key={index}
              onClick={() => jumpToHistory(index)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between group",
                index === historyIndex 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : index > historyIndex 
                    ? "text-gray-300 grayscale" 
                    : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  index === historyIndex ? "bg-blue-600" : "bg-gray-300"
                )} />
                <span className="text-[11px] font-bold">{step.label}</span>
              </div>
              {index === historyIndex && (
                <span className="text-[8px] font-black uppercase tracking-tighter text-blue-400">Current</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
