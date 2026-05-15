import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  Copy, Trash2, ArrowUpToLine, ArrowDownToLine, Lock, Unlock,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  FlipHorizontal, FlipVertical, Palette, PenTool, Maximize, Crop
} from 'lucide-react';
import { ActiveSelection, FabricImage, Group } from 'fabric';
import { ALL_FONTS } from '../../utils/fonts';
import { FontSelector } from './FontSelector';


export const FloatingToolbar: React.FC = () => {
  const { canvas, selectedObjects, saveHistory } = useStore();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!canvas) return;
    const update = () => {
      const active = canvas.getActiveObject();
      if (!active || (active as any).isPageBackground) { setPos(null); return; }
      setPos({ x: 0, y: 0 }); // Just a dummy pos to trigger visibility
      forceUpdate(p => p + 1);
    };
    canvas.on('selection:created', update);
    canvas.on('selection:updated', update);
    canvas.on('selection:cleared', () => setPos(null));
    return () => {
      canvas.off('selection:created', update); canvas.off('selection:updated', update);
      canvas.off('selection:cleared');
    };
  }, [canvas]);

  if (!canvas || canvas.getActiveObjects().length === 0) return null;
  const selected = canvas?.getActiveObject();
  if (!selected) return null;

  const isText = selected.type === 'textbox' || selected.type === 'i-text';
  const isImage = selected.type === 'image';
  const isMulti = selectedObjects.length > 1;
  const isShape = ['rect', 'circle', 'polygon', 'line', 'path', 'ellipse'].includes(selected.type || '');

  const btn = "p-1.5 rounded-lg hover:bg-white/80 text-gray-600 hover:text-blue-600 transition-all active:scale-90";
  const btnActive = "p-1.5 rounded-lg bg-blue-600 text-white shadow-sm";
  const sep = <div className="w-px h-5 bg-gray-200/60 mx-0.5" />;

  const duplicate = () => {
    selected.clone().then((c: any) => {
      c.set({ left: c.left + 20, top: c.top + 20 });
      if (c.type === 'activeSelection') { c.canvas = canvas; c.forEachObject((o: any) => canvas?.add(o)); }
      else canvas?.add(c);
      canvas?.setActiveObject(c); canvas?.requestRenderAll(); saveHistory();
    });
  };

  const del = () => {
    canvas?.getActiveObjects().forEach(o => canvas.remove(o));
    canvas?.discardActiveObject(); canvas?.renderAll(); saveHistory();
  };

  const INDIC_SAMPLES: { [key: string]: string } = {
    'Noto Sans Devanagari': 'नमस्ते (Namaste)',
    'Noto Sans Telugu': 'నమస్కారం (Namaskaram)',
    'Noto Sans Tamil': 'வணக்கம் (Vanakkam)',
    'Noto Sans Gujarati': 'નમસ્તે (Namaste)',
    'Noto Sans Bengali': 'নমস্কার (Nomoshkar)',
    'Noto Sans Gurmukhi': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ (Sat Sri Akal)',
    'Noto Sans Kannada': 'ನಮಸ್ಕಾರ (Namaskara)',
    'Noto Sans Malayalam': 'നമസ്കാരം (Namaskaram)',
    'Noto Sans Oriya': 'ନମସ୍କାର (Namaskara)',
    'Noto Sans Arabic': 'مرحبا (Marhaba)'
  };

  const updateProp = (key: string, val: any) => {
    if (selectedObjects.length > 1) {
      (selected as ActiveSelection).forEachObject(o => {
        o.set(key as any, val);
        if (key === 'fontFamily' && INDIC_SAMPLES[val] && (o as any).text?.match(/edit|text|field/i)) {
          (o as any).set('text', INDIC_SAMPLES[val]);
        }
      });
    } else {
      selected.set(key as any, val);
      if (key === 'fontFamily' && INDIC_SAMPLES[val] && (selected as any).text?.match(/edit|text|field/i)) {
        (selected as any).set('text', INDIC_SAMPLES[val]);
      }
    }
    canvas?.renderAll(); 
    if (key === 'fontFamily') {
      setTimeout(() => canvas?.renderAll(), 50);
      setTimeout(() => canvas?.renderAll(), 150);
    }
    saveHistory();
  };

  const toggleArtisticMode = () => {
    if (!selected || !isText) return;
    const isArtistic = (selected as any).dynamicMinWidth !== undefined; // simplified check
    if (isArtistic) {
      // Back to normal wrapping
      selected.set({
        //@ts-ignore
        splitByGrapheme: true,
        lockScalingX: false,
        lockScalingY: false,
        dynamicMinWidth: undefined
      } as any);
    } else {
      // Artistic Mode: No wrapping, scale instead of width change
      selected.set({
        //@ts-ignore
        splitByGrapheme: false,
        fixedWidth: 0,
        dynamicMinWidth: 1,
        // In Fabric, we just lock the width and let scaling happen
      } as any);
    }
    canvas?.renderAll();
    saveHistory();
  };

  const applyCurvedPath = async () => {
    if (!selected || !isText || !canvas) return;
    const { Path } = await import('fabric');
    
    // Toggle curved path
    if ((selected as any).path) {
      selected.set('path', null);
    } else {
      const radius = 100;
      const pathData = `M 0 ${radius} A ${radius} ${radius} 0 1 1 ${radius * 2} ${radius}`;
      const path = new Path(pathData, { visible: false });
      selected.set('path', path);
    }
    canvas.renderAll();
    saveHistory();
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-auto p-2">
      <div className="bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-xl shadow-xl px-4 py-2 flex items-center justify-center gap-1 text-[11px] max-w-fit mx-auto animate-in slide-in-from-top-4 duration-300">
        
        {/* Text Selection: Font Family & Size */}
        {/* Multi-language Support */}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {isText && (
          <>
            <div className="relative group/font">
            <FontSelector
              value={(selected as any).fontFamily || 'Outfit'}
              onChange={(val) => updateProp('fontFamily', val)}
              className="min-w-[140px]"
            />
            </div>
            {sep}
            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 px-1">
              <button onClick={() => updateProp('fontSize', Math.max(1, ((selected as any).fontSize || 16) - 1))} className="p-1 hover:text-blue-600">－</button>
              <input type="number" value={Math.round((selected as any).fontSize || 16)}
                onChange={(e) => updateProp('fontSize', parseInt(e.target.value) || 16)}
                title="Font Size"
                aria-label="Font Size"
                className="w-8 text-center bg-transparent text-[10px] font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button onClick={() => updateProp('fontSize', ((selected as any).fontSize || 16) + 1)} className="p-1 hover:text-blue-600">＋</button>
            </div>
            {sep}
            <div className="flex items-center gap-0.5">
              <button onClick={() => updateProp('fontWeight', (selected as any).fontWeight === 'bold' ? 'normal' : 'bold')}
                className={(selected as any).fontWeight === 'bold' ? btnActive : btn} title="Bold"><Bold size={14} /></button>
              <button onClick={() => updateProp('fontStyle', (selected as any).fontStyle === 'italic' ? 'normal' : 'italic')}
                className={(selected as any).fontStyle === 'italic' ? btnActive : btn} title="Italic"><Italic size={14} /></button>
              <button onClick={() => updateProp('underline', !(selected as any).underline)}
                className={(selected as any).underline ? btnActive : btn} title="Underline"><Underline size={14} /></button>
            </div>
            {sep}
            <div className="flex items-center gap-0.5">
              <button onClick={() => updateProp('textAlign', 'left')} className={(selected as any).textAlign === 'left' ? btnActive : btn} title="Align Left"><AlignLeft size={14} /></button>
              <button onClick={() => updateProp('textAlign', 'center')} className={(selected as any).textAlign === 'center' ? btnActive : btn} title="Align Center"><AlignCenter size={14} /></button>
              <button onClick={() => updateProp('textAlign', 'right')} className={(selected as any).textAlign === 'right' ? btnActive : btn} title="Align Right"><AlignRight size={14} /></button>
            </div>
            {sep}
            <div className="relative group">
              <div className="w-6 h-6 rounded-md border border-gray-200 overflow-hidden shadow-sm" style={{ backgroundColor: (selected.fill as string) || '#000000' }}>
                <input type="color" value={(selected.fill as string) || '#000000'}
                  onChange={(e) => { updateProp('fill', e.target.value); useStore.getState().addRecentColor(e.target.value); }}
                  title="Text Color"
                  aria-label="Text Color"
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={toggleArtisticMode} className={(selected as any).dynamicMinWidth ? btnActive : btn} title="Artistic Text (No Wrap)"><Maximize size={14} /></button>
              <button onClick={applyCurvedPath} className={(selected as any).path ? btnActive : btn} title="Curved Text"><PenTool size={14} /></button>
            </div>
            {sep}
          </>
        )}

        {/* Global Controls */}
        <button onClick={duplicate} className={btn} title="Duplicate"><Copy size={14} /></button>
        <button onClick={del} className={btn + " hover:text-red-500"} title="Delete"><Trash2 size={14} /></button>
        {sep}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Op</span>
          <input type="range" min="0" max="1" step="0.05" value={selected.opacity || 1}
            onChange={(e) => updateProp('opacity', parseFloat(e.target.value))}
            title="Opacity"
            aria-label="Opacity"
            className="w-12 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600" />
        </div>

        {/* Shape Fill/Stroke */}
        {isShape && !isMulti && (
          <>
            {sep}
            <div className="w-6 h-6 rounded-md border border-gray-200 overflow-hidden shadow-sm" style={{ backgroundColor: (selected.fill as string) || '#000000' }}>
              <input type="color" value={(selected.fill as string) || '#000000'} title="Fill"
                onChange={(e) => { updateProp('fill', e.target.value); useStore.getState().addRecentColor(e.target.value); }}
                className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="w-6 h-6 rounded-md border-4 border-gray-100 overflow-hidden shadow-sm" style={{ borderColor: (selected.stroke as string) || '#000000' }}>
              <input type="color" value={(selected.stroke as string) || '#000000'} title="Stroke"
                onChange={(e) => updateProp('stroke', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </>
        )}

        {isImage && (
          <>
            {sep}
            <button onClick={() => useStore.getState().setActiveTool('crop')} className={btn} title="Crop Image"><Crop size={14} /></button>
          </>
        )}

        {/* Layering */}
        {sep}
        <button onClick={() => { canvas?.bringObjectToFront(selected); canvas?.renderAll(); saveHistory(); }} className={btn} title="Bring Front"><ArrowUpToLine size={14} /></button>
        <button onClick={() => { canvas?.sendObjectToBack(selected); canvas?.renderAll(); saveHistory(); }} className={btn} title="Send Back"><ArrowDownToLine size={14} /></button>
      </div>
    </div>
  );
};
