/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store/useStore';
import { Palette, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const DEFAULT_SWATCHES = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#fecaca', '#fed7aa', '#fef3c7', '#d1fae5', '#dbeafe', '#e0e7ff', '#ede9fe', '#fae8ff',
  '#7f1d1d', '#7c2d12', '#78350f', '#064e3b', '#1e3a8a', '#312e81', '#4c1d95', '#701a75',
];

export const SwatchesPanel: React.FC = () => {
  const { canvas, saveHistory } = useStore();

  const handleApplyColor = (color: string) => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    activeObjects.forEach(obj => {
      if ((obj as any).fill !== undefined) obj.set('fill', color);
    });
    canvas.renderAll();
    saveHistory('Change Color');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <Palette size={14} />
          Swatches
        </h3>
        <button className="p-1 hover:bg-gray-200 rounded text-gray-400 transition-colors">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="grid grid-cols-8 gap-1.5">
          {DEFAULT_SWATCHES.map((color, index) => (
            <button
              key={index}
              onClick={() => handleApplyColor(color)}
              className="aspect-square rounded-sm border border-gray-200 transition-transform hover:scale-110 hover:z-10 shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        
        <div className="mt-8 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Recent Colors</p>
          <div className="grid grid-cols-8 gap-1.5">
            {/* Mock recent colors for now */}
            {['#3b82f6', '#ef4444', '#10b981'].map((color, index) => (
              <button
                key={index}
                onClick={() => handleApplyColor(color)}
                className="aspect-square rounded-sm border border-gray-200 transition-transform hover:scale-110 shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
