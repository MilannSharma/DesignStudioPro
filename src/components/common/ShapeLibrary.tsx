import React from 'react';
import { Package } from 'lucide-react';

export const ShapeLibrary: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
          <Package size={14} className="text-gray-400"/> Shapes
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
          <Package size={32} className="text-gray-200 mb-2" />
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Shape library coming soon</p>
        </div>
      </div>
    </div>
  );
};
