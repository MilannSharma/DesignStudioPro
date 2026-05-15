/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store/useStore';
import { Pipette, Plus, Hash } from 'lucide-react';

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export const ColorPicker: React.FC<{ color: string, onChange: (color: string) => void }> = ({ color, onChange }) => {
  const { recentColors, addRecentColor } = useStore();

  const handleColorSelect = (c: string) => {
    onChange(c);
    addRecentColor(c);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 w-[220px] space-y-4">
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded-lg border border-gray-200 shadow-inner shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 relative">
          <Hash size={12} className="absolute left-2 top-2.5 text-gray-400" />
          <input 
            type="text" 
            value={color.toUpperCase()} 
            onChange={(e) => handleColorSelect(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 pl-6 pr-2 text-[10px] font-mono font-bold outline-none focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Presets</p>
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map(c => (
            <button 
              key={c}
              onClick={() => handleColorSelect(c)}
              className={`w-6 h-6 rounded-md border border-black/5 hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="w-6 h-6 rounded-md border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <Plus size={10} className="text-gray-400" />
            <input 
              type="color" 
              value={color} 
              onChange={(e) => handleColorSelect(e.target.value)}
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {recentColors.length > 0 && (
        <div className="space-y-2">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Recent</p>
          <div className="flex flex-wrap gap-1.5">
            {recentColors.slice(0, 12).map((c, i) => (
              <button 
                key={i}
                onClick={() => handleColorSelect(c)}
                className={`w-6 h-6 rounded-md border border-black/5 hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
