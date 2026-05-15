/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Layout, Maximize2, Settings2, Sparkles, X } from 'lucide-react';
import { DocumentSettings } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const PRESETS = [
  { name: 'ID Card (CR80)', width: 86, height: 54, unit: 'mm' },
  { name: 'Business Card', width: 3.5, height: 2, unit: 'inch' },
  { name: 'A4 Document', width: 210, height: 297, unit: 'mm' },
  { name: 'A3 Poster', width: 297, height: 420, unit: 'mm' },
  { name: 'Social Post', width: 1080, height: 1080, unit: 'px' },
];

export const ProjectSetupModal: React.FC = () => {
  const initializeProject = useStore((state) => state.initializeProject);
  const assets = useStore((state) => state.assets);
  
  const [name, setName] = useState('Untitled Project');
  const [pages, setPages] = useState(1);
  const [width, setWidth] = useState(54);
  const [height, setHeight] = useState(86);
  const [unit, setUnit] = useState<'px' | 'mm' | 'cm' | 'inch'>('px');
  const [bleed, setBleed] = useState(0);
  const [margin, setMargin] = useState(0);

  const unitToPx = (val: number, currentUnit: string) => {
    const targetDpi = 300; // Standard for print production
    switch (currentUnit) {
      case 'mm': return val * (targetDpi / 25.4);
      case 'cm': return val * (targetDpi / 2.54);
      case 'inch': return val * targetDpi;
      default: return val;
    }
  };

  // Auto-detect orientation and type
  const getLayoutInfo = (w: number, h: number) => {
    if (!w || !h) return { shape: 'N/A', ratio: '1:1' };
    
    let shape = '';
    let ratio = '';
    
    if (w === h) {
      shape = 'SQUARE / CIRCLE';
      ratio = '1:1';
    } else if (w > h) {
      shape = 'HORIZONTAL';
      ratio = `${(w / h).toFixed(1)}:1`;
      if (Math.abs(w / h - 2) < 0.1) ratio = '2:1';
    } else {
      shape = 'VERTICAL';
      ratio = `1:${(h / w).toFixed(1)}`;
      if (Math.abs(h / w - 2) < 0.1) ratio = '1:2';
    }
    
    return { shape, ratio };
  };

  const { shape, ratio } = getLayoutInfo(width, height);

  const handleStart = () => {
    const settings: DocumentSettings = {
      width: unitToPx(width || 1050, unit),
      height: unitToPx(height || 600, unit),
      unit,
      dpi: 300,
      bleed: bleed || 0,
      margin: margin || 0,
      orientation: (width || 1050) >= (height || 600) ? 'landscape' : 'portrait',
    };

    initializeProject(name, settings, pages);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-500 max-h-[95vh] overflow-hidden">
        <div className="p-8 pb-4 bg-gradient-to-br from-white to-gray-50 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Project Genesis</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Configuration Engine v2.0</p>
            </div>
          </div>
        </div>

        <div className="p-8 pt-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Project Identifier</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-[13px] text-gray-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
              placeholder="Project Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Uploaded Assets</label>
              <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 min-h-[50px] flex items-center justify-center overflow-hidden">
                {assets.length === 0 ? (
                  <span className="text-[10px] text-gray-400 font-bold italic uppercase tracking-widest opacity-50">No uploads found</span>
                ) : (
                  <div className="flex -space-x-2">
                    {assets.slice(0, 5).map((a, i) => (
                      <img key={i} src={a} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" alt="asset" />
                    ))}
                    {assets.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                        +{assets.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Standard Presets</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-[100px] overflow-y-auto pr-2 scrollbar-hide">
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => { setWidth(p.width); setHeight(p.height); setUnit(p.unit as any); }}
                    className={cn("flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-left", 
                      width === p.width && height === p.height ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100")}>
                    <span className="text-[10px] font-black uppercase tracking-tight">{p.name}</span>
                    <span className={cn("text-[9px] font-bold opacity-60", width === p.width && height === p.height ? "text-white" : "text-gray-400")}>{p.width}x{p.height}{p.unit}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">Width</label>
              <input 
                type="number" 
                title="Width" aria-label="Width"
                value={isNaN(width) ? '' : width}
                onChange={(e) => setWidth(parseFloat(e.target.value))}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[13px] text-gray-900 font-bold outline-none focus:bg-white transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">Height</label>
              <input 
                type="number" 
                title="Height" aria-label="Height"
                value={isNaN(height) ? '' : height}
                onChange={(e) => setHeight(parseFloat(e.target.value))}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[13px] text-gray-900 font-bold outline-none focus:bg-white transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase block tracking-widest">Unit</label>
              <select 
                value={unit}
                title="Unit" aria-label="Unit"
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[13px] text-gray-900 font-bold outline-none appearance-none"
              >
                <option value="px">Pixels</option>
                <option value="mm">MM</option>
                <option value="inch">Inches</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform active:scale-95">
                <Layout className={width >= height ? 'rotate-90' : ''} size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Detected Layout Matrix</div>
                <div className="text-gray-900 text-sm font-black tracking-widest uppercase">{shape} / {ratio}</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[9px] px-3 py-1 bg-blue-600 text-white rounded-full font-black tracking-widest uppercase mb-1 shadow-lg shadow-blue-200">Optimal</span>
               <span className="text-[8px] text-blue-400 font-bold">Auto-Scale Active</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
          <button 
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 py-5 rounded-[24px] font-black uppercase tracking-widest text-[11px] transition-all shadow-sm active:scale-95"
            onClick={() => window.location.reload()}
          >
            Cancel
          </button>
          <button 
            onClick={handleStart}
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            Launch Production Studio <Sparkles size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
