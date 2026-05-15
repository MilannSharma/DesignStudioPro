/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Search, Replace, X, CheckCircle2 } from 'lucide-react';

export const SearchReplaceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { pages, currentPageIndex, canvas, saveHistory } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [results, setResults] = useState<{ pageIndex: number; objectIndex: number; text: string }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const findResults = () => {
    if (!searchQuery) return;
    const newResults: any[] = [];
    
    pages.forEach((pageJson, pageIndex) => {
      if (!pageJson) return;
      const data = JSON.parse(pageJson);
      const objects = data.objects || [];
      
      objects.forEach((obj: any, objectIndex: number) => {
        if ((obj.type === 'textbox' || obj.type === 'i-text') && obj.text.includes(searchQuery)) {
          newResults.push({ pageIndex, objectIndex, text: obj.text });
        }
      });
    });
    
    setResults(newResults);
    if (newResults.length === 0) alert('No matches found.');
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    
    const newPages = [...pages];
    let totalReplaced = 0;

    newPages.forEach((pageJson, pageIndex) => {
      if (!pageJson) return;
      const data = JSON.parse(pageJson);
      const objects = data.objects || [];
      let pageChanged = false;

      objects.forEach((obj: any) => {
        if ((obj.type === 'textbox' || obj.type === 'i-text') && obj.text.includes(searchQuery)) {
          obj.text = obj.text.replaceAll(searchQuery, replaceValue);
          pageChanged = true;
          totalReplaced++;
        }
      });

      if (pageChanged) {
        newPages[pageIndex] = JSON.stringify(data);
      }
    });

    useStore.setState({ pages: newPages });
    
    // If the current page was changed, we need to reload the canvas
    if (newPages[currentPageIndex]) {
      canvas?.loadFromJSON(newPages[currentPageIndex]).then(() => {
        canvas.renderAll();
      });
    }

    setIsFinished(true);
    saveHistory('Search & Replace');
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#222] border border-[#333] w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-white font-display font-bold">
            <Search size={18} className="text-blue-500" />
            Search & Replace
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isFinished ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-white font-bold mb-2">Replacement Complete</p>
              <p className="text-gray-400 text-sm mb-6">Successfully updated text across all pages.</p>
              <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Find</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                  <input 
                    type="text"
                    placeholder="Search text..."
                    className="w-full bg-black/50 border border-[#333] rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:border-blue-500"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Replace With</label>
                <div className="relative">
                  <Replace className="absolute left-3 top-2.5 text-gray-500" size={14} />
                  <input 
                    type="text"
                    placeholder="New value..."
                    className="w-full bg-black/50 border border-[#333] rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:border-blue-500"
                    value={replaceValue}
                    onChange={e => setReplaceValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={findResults}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-lg font-bold text-sm transition-colors"
                >
                  Find Matches
                </button>
                <button 
                  onClick={handleReplaceAll}
                  disabled={!searchQuery}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                >
                  Replace All
                </button>
              </div>

              {results.length > 0 && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-900/30 rounded-lg text-blue-400 text-[10px]">
                  Found <span className="font-bold">{results.length}</span> matches across <span className="font-bold">{new Set(results.map(r => r.pageIndex)).size}</span> pages.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
