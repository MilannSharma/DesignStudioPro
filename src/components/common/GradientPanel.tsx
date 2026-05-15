/** @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Gradient } from 'fabric';

export const GradientPanel: React.FC = () => {
  const { canvas, saveHistory } = useStore();
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [color1, setColor1] = useState('#3b82f6');
  const [color2, setColor2] = useState('#1e293b');
  const [angle, setAngle] = useState(0);

  const applyGradient = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    const coords = gradientType === 'linear' 
      ? { x1: 0, y1: 0, x2: active.width, y2: 0 }
      : { x1: active.width / 2, y1: active.height / 2, r1: 0, x2: active.width / 2, y2: active.height / 2, r2: active.width / 2 };

    const grad = new Gradient({
      type: gradientType,
      coords,
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 }
      ]
    });

    active.set('fill', grad);
    canvas.renderAll();
    saveHistory();
  };

  return (
    <div className="space-y-4 p-2 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gradient</span>
        <select 
          value={gradientType} 
          onChange={(e) => setGradientType(e.target.value as any)}
          className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 outline-none"
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="color" 
          value={color1} 
          onChange={(e) => setColor1(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200"
        />
        <input 
          type="color" 
          value={color2} 
          onChange={(e) => setColor2(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200"
        />
        <button 
          onClick={applyGradient}
          className="flex-1 bg-blue-600 text-white text-[10px] font-black uppercase py-1.5 rounded hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>
      </div>

      {gradientType === 'linear' && (
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-400 font-bold">ANGLE</span>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={angle} 
            onChange={(e) => setAngle(parseInt(e.target.value))}
            className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-[9px] text-gray-600 w-6 text-right font-mono">{angle}°</span>
        </div>
      )}
    </div>
  );
};
