/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  MousePointer2, Square, Circle as CircleIcon, Type, Image as ImageIcon, Minus,
  Star, Hexagon, PenTool, Hand, QrCode, Layout, Database, User, Settings2,
  ArrowUpRight, Pencil, Grid, Pipette, MousePointerClick,
  Square as RoundedRectangle, MessageSquare, Sparkles,
  SquareDashed, Lasso, Wand2, PaintBucket, Crop
} from 'lucide-react';
import { IText, Rect, FabricImage, Group, Circle, Textbox } from 'fabric';
import { useStore } from '../../store/useStore';
import { Tool } from '../../types';
import { importImage } from '../../utils/canvasUtils';
import { createRoundedRect, createCallout, createSpiral } from '../../utils/shapeUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const tools: { id: Tool; icon: any; label: string; dividerAfter?: boolean }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'marquee', icon: SquareDashed, label: 'Marquee (M)' },
  { id: 'lasso', icon: Lasso, label: 'Lasso (L)' },
  { id: 'wand', icon: Wand2, label: 'Magic Wand (W)' },
  { id: 'shape' as any, icon: MousePointerClick, label: 'Shape Tool (S)' },
  { id: 'pen' as any, icon: PenTool, label: 'Pen Tool (P)' },
  { id: 'rect', icon: Square, label: 'Rectangle (R)' },
  { id: 'roundedRect' as any, icon: RoundedRectangle, label: 'Rounded Rect' },
  { id: 'ellipse', icon: CircleIcon, label: 'Ellipse (E)' },
  { id: 'line', icon: Minus, label: 'Line (L)' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'callout' as any, icon: MessageSquare, label: 'Callout' },
  { id: 'spiral' as any, icon: Sparkles, label: 'Spiral' },
  { id: 'polygon', icon: Hexagon, label: 'Polygon' },
  { id: 'star', icon: Star, label: 'Star', dividerAfter: true },
  { id: 'pencil', icon: Pencil, label: 'Brush/Freehand' },
  { id: 'text', icon: Type, label: 'Text (T)' },
  { id: 'frame' as any, icon: User, label: 'Photo Frame', dividerAfter: true },
  { id: 'qr', icon: QrCode, label: 'QR Code (Q)' },
  { id: 'hand', icon: Hand, label: 'Hand (H)' },
  { id: 'eyedropper' as any, icon: Pipette, label: 'Eyedropper (I)' },
  { id: 'bucket' as any, icon: PaintBucket, label: 'Fill Bucket (G)' },
  { id: 'crop' as any, icon: Crop, label: 'Crop (C)' },
];

export const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool, canvas, saveHistory, setSelectedObjects, showGrid, toggleGrid } = useStore();
  const [showTextMenu, setShowTextMenu] = React.useState(false);
  const [showFileMenu, setShowFileMenu] = React.useState(false);
  const [showFieldMenu, setShowFieldMenu] = React.useState(false);
  const [fieldName, setFieldName] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const colorPickerRef = React.useRef<HTMLInputElement>(null);

  const addImageFrame = () => {
    const { settings, canvas, saveHistory, setActiveTool } = useStore.getState();
    if (!canvas) return;
    const scale = 800 / Math.max(settings.width, settings.height);
    const posX = (settings.width * scale) / 2;
    const posY = (settings.height * scale) / 2;
    const rect = new Rect({ width: 150, height: 180, fill: '#f3f4f6', stroke: '#3b82f6', strokeWidth: 2, strokeDashArray: [5, 5], originX: 'center', originY: 'center' });
    const label = new IText('PHOTO', { fontSize: 10, fontFamily: 'Inter', fill: '#3b82f6', fontWeight: 'bold', originX: 'center', originY: 'center', top: 60 });
    const head = new Circle({ radius: 25, fill: '#e5e7eb', originX: 'center', originY: 'center', top: -20 });
    const body = new Rect({ width: 80, height: 40, fill: '#e5e7eb', rx: 20, ry: 20, originX: 'center', originY: 'center', top: 30 });
    const group = new Group([rect, head, body, label], { left: posX, top: posY, originX: 'center', originY: 'center', name: 'photo-placeholder' } as any);
    canvas.add(group); canvas.setActiveObject(group); canvas.renderAll(); saveHistory(); setActiveTool('select');
  };

  const addTextImmediate = async (type: 'horizontal' | 'field', fieldInput?: string) => {
    const { settings, saveHistory, setActiveTool, defaultFontFamily } = useStore.getState();
    const c = useStore.getState().canvas;
    if (!c) return;

    // Check if the current font is an Indic font to set RTL/direction
    const { LANGUAGES } = await import('../../lib/transliteration/languageConfig');
    const langConfig = LANGUAGES.find(l => l.fontFamily === defaultFontFamily);
    const isRtl = langConfig?.rtl || false;

    const scale = 800 / Math.max(settings.width, settings.height);
    const posX = (settings.width * scale) / 2;
    const posY = (settings.height * scale) / 2;
    const minDim = Math.min(settings.width, settings.height);
    const defaultFontSize = Math.max(minDim / 10, 14) * scale * 0.35;
    const defaultWidth = Math.max(settings.width * 0.8, 100) * scale;
    
    let content = 'Double click to edit';
    let options: any = { 
      left: posX, top: posY, width: defaultWidth, 
      originX: 'center', originY: 'center', fontSize: defaultFontSize, 
      fontFamily: defaultFontFamily, fill: '#000000', 
      textAlign: isRtl ? 'right' : 'center',
      direction: isRtl ? 'rtl' : 'ltr',
      splitByGrapheme: true,
      objectCaching: false
    };
    if (type === 'field') {
      const input = fieldInput || 'field';
      const fn = input.toLowerCase().replace(/ /g, '_');
      content = `{{${fn}}}`;
      options.fill = '#2563eb'; options.fontWeight = 'bold';
      const { testData, setTestData } = useStore.getState();
      if (!testData[fn]) setTestData({ ...testData, [fn]: `[${fn}]` });
    }
    try {
      const text = new Textbox(content, options);
      c.add(text); c.setActiveObject(text); text.setCoords(); c.requestRenderAll();
      if (type === 'horizontal') setTimeout(() => { text.enterEditing(); text.selectAll(); c.requestRenderAll(); }, 100);
      saveHistory(); setActiveTool('select'); setShowTextMenu(false);
    } catch (err) { console.error('Failed to add text:', err); }
  };

  const handleImageImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*,.svg';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file && canvas) {
        importImage(canvas, file);
      }
    };
    input.click();
  };

  return (
    <div className="w-12 border-r border-gray-200 bg-white flex flex-col items-center py-3 gap-1 z-10 transition-colors shadow-sm overflow-y-auto">
      {/* Text Choice Modal (Compulsory) */}
      {showTextMenu && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
              <Type size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Add Text Element</h3>
              <p className="text-sm text-gray-500">Choose the type of text you want to add to your design.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full">
              <button 
                onClick={() => addTextImmediate('horizontal')}
                className="flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Type size={20} className="text-gray-400 group-hover:text-blue-500" />
                  <span className="font-bold text-gray-700 group-hover:text-blue-600">Custom Text</span>
                </div>
                <span className="text-[10px] text-gray-400 uppercase font-black">Static</span>
              </button>
              <button 
                onClick={() => { setShowTextMenu(false); setShowFieldMenu(true); }}
                className="flex items-center justify-between px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200"
              >
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-blue-100" />
                  <span className="font-bold text-white">Data Field</span>
                </div>
                <span className="text-[10px] text-blue-200 uppercase font-black tracking-widest">Dynamic</span>
              </button>
            </div>
            <button 
              onClick={() => { setShowTextMenu(false); setActiveTool('select'); }}
              className="text-gray-400 hover:text-gray-600 text-[11px] font-bold uppercase tracking-widest mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Field Name Modal */}
      {showFieldMenu && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
              <Database size={32} />
            </div>
            <div className="text-center w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Add Data Field</h3>
              <p className="text-sm text-gray-500 mb-4">Enter the field name (e.g. name, roll_no)</p>
              <input
                type="text"
                autoFocus
                placeholder="Field name"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-blue-500"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fieldName) {
                    setShowFieldMenu(false);
                    addTextImmediate('field', fieldName);
                    setFieldName('');
                  } else if (e.key === 'Escape') {
                    setShowFieldMenu(false);
                    setActiveTool('select');
                    setFieldName('');
                  }
                }}
              />
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setShowFieldMenu(false); setActiveTool('select'); setFieldName(''); }}
                  className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowFieldMenu(false);
                    addTextImmediate('field', fieldName || 'field');
                    setFieldName('');
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-200"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File menu */}
      <div className="relative group mb-1 pb-2 border-b border-gray-100 w-full flex justify-center">
        <button onClick={() => setShowFileMenu(!showFileMenu)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-all" title="File Menu">
          <Layout size={18} />
        </button>
        {showFileMenu && (
          <div className="absolute left-full ml-2 top-0 bg-white border border-gray-200 rounded-lg shadow-2xl p-1 flex flex-col gap-0.5 z-[100] min-w-[150px]">
            <button onClick={handleImageImport} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-[11px] text-gray-700">
              <ImageIcon size={14} className="text-gray-400" /> Import Image
            </button>
            <button onClick={() => { useStore.getState().setShowDataMerge(true); setShowFileMenu(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-[11px] text-gray-700">
              <Database size={14} className="text-gray-400" /> Data Merge
            </button>
          </div>
        )}
      </div>

      {/* Tool buttons */}
      {tools.map((tool) => (
        <React.Fragment key={tool.id}>
          <div className="relative">
            <button
              onClick={() => {
                if (tool.id === 'text') { setShowTextMenu(!showTextMenu); setActiveTool('text'); }
                else if (tool.id === ('frame' as any)) { addImageFrame(); }
                else if (tool.id === ('roundedRect' as any)) {
                  const { settings } = useStore.getState();
                  const scale = 800 / Math.max(settings.width, settings.height);
                  const w = settings.width * scale * 0.3;
                  const h = settings.height * scale * 0.2;
                  const left = (settings.width * scale) / 2 - w / 2;
                  const top = (settings.height * scale) / 2 - h / 2;
                  const rr = createRoundedRect(left, top, w, h);
                  canvas?.add(rr); canvas?.setActiveObject(rr); canvas?.requestRenderAll();
                  saveHistory(); setActiveTool('select');
                }
                else if (tool.id === ('callout' as any)) {
                  const { settings } = useStore.getState();
                  const scale = 800 / Math.max(settings.width, settings.height);
                  const w = settings.width * scale * 0.3;
                  const h = settings.height * scale * 0.2;
                  const left = (settings.width * scale) / 2 - w / 2;
                  const top = (settings.height * scale) / 2 - h / 2;
                  const co = createCallout(left, top, w, h, 'right');
                  canvas?.add(co); canvas?.setActiveObject(co); canvas?.requestRenderAll();
                  saveHistory(); setActiveTool('select');
                }
                else if (tool.id === ('spiral' as any)) {
                  const { settings } = useStore.getState();
                  const scale = 800 / Math.max(settings.width, settings.height);
                  const cx = (settings.width * scale) / 2;
                  const cy = (settings.height * scale) / 2;
                  const sp = createSpiral(cx, cy, 3, 8);
                  canvas?.add(sp); canvas?.setActiveObject(sp); canvas?.requestRenderAll();
                  saveHistory(); setActiveTool('select');
                }
                else { setActiveTool(tool.id); setShowTextMenu(false); }
                setShowFileMenu(false);
              }}
              onDoubleClick={() => {
                if (tool.id === ('bucket' as any)) {
                  colorPickerRef.current?.click();
                }
              }}
              className={cn(
                "p-1.5 rounded transition-all duration-200 group relative",
                activeTool === tool.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 z-10"
                  : "text-gray-500 hover:text-blue-600 hover:bg-gray-100"
              )}
              title={tool.label}
            >
              <tool.icon size={18} strokeWidth={activeTool === tool.id ? 2.5 : 1.8} />
              <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-[10px] text-white rounded hidden group-hover:block whitespace-nowrap z-50 shadow-xl">
                {tool.label}
              </div>
            </button>
          </div>
          {tool.dividerAfter && <div className="w-6 h-px bg-gray-100 my-1" />}
        </React.Fragment>
      ))}

      <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col items-center gap-1">
        <button onClick={toggleGrid}
          className={cn(
            "p-1.5 rounded transition-all duration-200",
            showGrid ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-400 hover:text-blue-600 hover:bg-gray-50"
          )}
          title="Toggle Grid (G)"
        >
          <Grid size={18} />
        </button>
        <button onClick={() => { canvas?.discardActiveObject(); canvas?.renderAll(); setSelectedObjects([]); }}
          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Deselect">
          <Settings2 size={18} />
        </button>
      </div>
      
      {/* Hidden inputs */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e=>{
        const f=e.target.files?.[0]; if(f){const r=new FileReader();r.onload=ev=>{importImage(ev.target?.result as string,canvas!,saveHistory,setActiveTool);};r.readAsDataURL(f);}
      }}/>
      <input type="color" ref={colorPickerRef} className="hidden" onChange={e => {
        const color = e.target.value;
        useStore.getState().addRecentColor(color);
        // If an object is selected, fill it immediately too
        if (canvas?.getActiveObject()) {
          canvas.getActiveObject()?.set('fill', color);
          canvas.renderAll();
          saveHistory(`Set Color to ${color}`);
        }
      }} />
    </div>
  );
};
