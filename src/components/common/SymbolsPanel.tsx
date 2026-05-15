/** @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store/useStore';
import { util, Group } from 'fabric';
import { Plus, Trash2, Package } from 'lucide-react';

export const SymbolsPanel: React.FC = () => {
  const { canvas, symbols, addSymbol, removeSymbol } = useStore();

  const handleAddSymbol = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) {
      alert('Please select an object or group to save as a symbol.');
      return;
    }
    const json = JSON.stringify(active.toObject(['__uid', 'name', 'selectable', 'evented', 'qrData']));
    addSymbol(json);
  };

  const handleUseSymbol = (json: string) => {
    if (!canvas) return;
    util.enlivenObjects([JSON.parse(json)]).then((objects: any[]) => {
      const obj = objects[0];
      obj.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center'
      });
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      useStore.getState().saveHistory('Insert Symbol');
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
          <Package size={14} className="text-gray-400"/> Symbols
        </h2>
        <button 
          onClick={handleAddSymbol}
          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg active:scale-90"
          title="Add Selection as Symbol"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {symbols.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
            <Package size={32} className="text-gray-200 mb-2" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No symbols saved yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {symbols.map((s, i) => (
              <div key={i} className="group relative aspect-square bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer overflow-hidden flex items-center justify-center">
                <div className="text-[8px] text-gray-300 font-mono text-center px-2">Symbol {i+1}</div>
                <div 
                  onClick={() => handleUseSymbol(s)}
                  className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSymbol(i); }}
                  className="absolute top-1 right-1 p-1 bg-white/80 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
