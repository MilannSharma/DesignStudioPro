/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { PROJECT_PRESETS, ProjectPreset } from '../../utils/presets';
import { X, ArrowLeftRight, Settings2, LayoutGrid, Monitor, Smartphone, Printer, Image as ImageIcon, Share2, Layers } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface NewProjectModalProps {
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose }) => {
  const { setSettings, projectName: currentName, setCanvas, initializeProject } = useStore();
  
  const [activeTab, setActiveTab] = useState<ProjectPreset['category']>('social');
  const [name, setName] = useState('New Project');
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [unit, setUnit] = useState<'px' | 'mm' | 'cm' | 'inch'>('px');
  const [dpi, setDpi] = useState(72);
  const [background, setBackground] = useState('white');
  const [artboards, setArtboards] = useState(false);
  
  // Custom Margins
  const [margin, setMargin] = useState(20);
  const [marginLock, setMarginLock] = useState(true);

  const filteredPresets = PROJECT_PRESETS.filter(p => p.category === activeTab);

  const handleSelectPreset = (p: ProjectPreset) => {
    setWidth(p.width);
    setHeight(p.height);
    setUnit(p.unit);
    setDpi(p.dpi);
  };

  const handleSwap = () => {
    setWidth(height);
    setHeight(width);
  };

  const handleCreate = () => {
    initializeProject(name, {
      width,
      height,
      unit,
      dpi,
      bleed: 0,
      margin,
      orientation: width > height ? 'landscape' : 'portrait'
    }, 1);
    onClose();
  };

  const tabs = [
    { id: 'social', icon: Share2, label: 'Social' },
    { id: 'print', icon: Printer, label: 'Print' },
    { id: 'photo', icon: ImageIcon, label: 'Photo' },
    { id: 'screen', icon: Monitor, label: 'Screen' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
    { id: 'ads', icon: LayoutGrid, label: 'Ads' },
    { id: '2n', icon: Layers, label: '2ⁿ' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1e1e1e] border border-white/10 w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden text-white font-sans">
        
        {/* Left: Presets & Templates */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full" />
              New Project
            </h2>
            <div className="flex bg-[#2a2a2a] p-1 rounded-xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                    activeTab === tab.id ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <div className="grid grid-cols-3 gap-4">
              {filteredPresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={cn(
                    "group relative aspect-video rounded-xl border-2 transition-all p-4 text-left flex flex-col justify-between overflow-hidden",
                    width === p.width && height === p.height ? "border-blue-500 bg-blue-500/10" : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-500/10 to-transparent transition-opacity" />
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{p.name}</p>
                    <p className="text-[10px] text-gray-500">{p.width} × {p.height} {p.unit}</p>
                  </div>
                  <div className={cn(
                    "relative z-10 w-12 h-8 rounded border-2 self-center",
                    p.width > p.height ? "w-16 h-10" : "w-10 h-16",
                    width === p.width && height === p.height ? "border-blue-400 bg-blue-400/20" : "border-white/20 bg-white/5"
                  )} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Settings Sidebar */}
        <div className="w-[320px] bg-[#252525] border-l border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Settings</span>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={18}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project Name</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Dimensions */}
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Width</label>
                  <input 
                    type="number"
                    value={width} 
                    onChange={e => setWidth(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={handleSwap}
                  className="p-2 mb-0.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-all active:scale-95"
                  title="Swap Dimensions"
                >
                  <ArrowLeftRight size={16} />
                </button>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Height</label>
                  <input 
                    type="number"
                    value={height} 
                    onChange={e => setHeight(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unit</label>
                  <select 
                    value={unit} 
                    onChange={e => setUnit(e.target.value as any)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="px">Pixels</option>
                    <option value="mm">Mm</option>
                    <option value="cm">Cm</option>
                    <option value="inch">Inches</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">DPI</label>
                  <input 
                    type="number"
                    value={dpi} 
                    onChange={e => setDpi(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Custom Margins */}
            <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Margins</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{unit}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number"
                  placeholder="Top"
                  value={margin} 
                  onChange={e => setMargin(parseInt(e.target.value) || 0)}
                  className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                />
                <input 
                  type="number"
                  placeholder="Right"
                  value={margin} 
                  onChange={e => setMargin(parseInt(e.target.value) || 0)}
                  className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                />
                <input 
                  type="number"
                  placeholder="Bottom"
                  value={margin} 
                  onChange={e => setMargin(parseInt(e.target.value) || 0)}
                  className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                />
                <input 
                  type="number"
                  placeholder="Left"
                  value={margin} 
                  onChange={e => setMargin(parseInt(e.target.value) || 0)}
                  className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
               <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[11px] font-bold text-gray-300">Artboards</span>
                <button 
                  onClick={() => setArtboards(!artboards)}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    artboards ? "bg-blue-600" : "bg-gray-600"
                  )}
                >
                  <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", artboards ? "left-4.5" : "left-0.5")} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Background</label>
                <div className="grid grid-cols-4 gap-2">
                  {['white', 'black', 'transparent', 'custom'].map(bg => (
                    <button
                      key={bg}
                      onClick={() => setBackground(bg)}
                      className={cn(
                        "aspect-square rounded-lg border-2 transition-all flex items-center justify-center overflow-hidden",
                        background === bg ? "border-blue-500" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      {bg === 'white' && <div className="w-full h-full bg-white" />}
                      {bg === 'black' && <div className="w-full h-full bg-black" />}
                      {bg === 'transparent' && (
                        <div className="w-full h-full bg-[repeating-conic-gradient(#333_0%_25%,#444_0%_50%)] bg-[length:8px_8px]" />
                      )}
                      {bg === 'custom' && <div className="w-full h-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">HEX</div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5">
            <button 
              onClick={handleCreate}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
