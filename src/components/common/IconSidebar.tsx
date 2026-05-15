/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store/useStore';
import { SidebarPanel } from '../../types';
import { 
  Info, 
  Sliders, 
  Brush, 
  Type, 
  AlignLeft, 
  Code, 
  Layers, 
  History as HistoryIcon, 
  Palette, 
  Package,
  Shapes,
  Languages
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const IconSidebar: React.FC = () => {
  const { activeSidebarPanel, setActiveSidebarPanel } = useStore();

  const panels: { id: SidebarPanel; icon: any; label: string }[] = [
    { id: 'info', icon: Info, label: 'Info' },
    { id: 'props', icon: Sliders, label: 'Properties' },
    { id: 'brush', icon: Brush, label: 'Brush' },
    { id: 'text', icon: Type, label: 'Character' },
    { id: 'para', icon: AlignLeft, label: 'Paragraph' },
    { id: 'css', icon: Code, label: 'CSS' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'history', icon: HistoryIcon, label: 'History' },
    { id: 'swatches', icon: Palette, label: 'Swatches' },
    { id: 'symbols', icon: Package, label: 'Symbols' },
    { id: 'shapes', icon: Shapes, label: 'Shapes' },
    { id: 'translator', icon: Languages, label: 'Translator' },
  ];

  return (
    <div className="w-10 bg-[#2a2a2a] border-l border-white/5 flex flex-col items-center py-4 gap-2 z-30 shadow-xl">
      {panels.map((panel) => {
        const Icon = panel.icon;
        const isActive = activeSidebarPanel === panel.id;
        
        return (
          <button
            key={panel.id}
            onClick={() => setActiveSidebarPanel(panel.id)}
            title={panel.label}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all group relative",
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            
            {!isActive && (
              <div className="absolute right-full mr-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {panel.label}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
