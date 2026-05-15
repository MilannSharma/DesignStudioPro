import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { FabricImage, ActiveSelection, IText, Textbox, Group } from 'fabric';
import { importImage } from '../../utils/canvasUtils';
import { Move,Palette,Layers,Settings2,ChevronDown,AlignLeft,AlignCenter,AlignRight,AlignStartVertical,AlignCenterVertical,AlignEndVertical,LayoutGrid,QrCode,Type,Lock,Unlock,Eye,EyeOff,ChevronUp,Trash2,FlipHorizontal,FlipVertical,Maximize,Minimize,AlignHorizontalDistributeCenter,AlignVerticalDistributeCenter,Sparkles } from 'lucide-react';
import { ALL_FONTS } from '../../utils/fonts';
import { FontSelector } from './FontSelector';
import QRCode from 'qrcode';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GradientPanel } from './GradientPanel';
import { ColorPicker } from './ColorPicker';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }


const PI = ({label,value,onChange,type='number'}:{label:string;value:any;onChange:(v:string)=>void;type?:string}) => (
  <div className="space-y-1"><label className="text-[9px] text-gray-400 font-black tracking-widest block">{label}</label>
  <input type={type} value={value===null||value===undefined||(type==='number'&&isNaN(value))?'':value} onChange={e=>onChange(e.target.value)}
    title={label} aria-label={label}
    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-[11px] text-gray-900 focus:border-blue-500 outline-none font-bold shadow-inner"/></div>
);
const AB = ({children,onClick,className}:{children:React.ReactNode;onClick:()=>void;className?:string}) => (
  <button onClick={onClick} title={typeof children === 'string' ? children : 'Action'} aria-label={typeof children === 'string' ? children : 'Action'} className={cn("px-2 py-1.5 bg-gray-50 hover:bg-white hover:border-blue-400 hover:text-blue-600 text-[9px] text-gray-500 rounded-lg border border-gray-100 transition-all font-black uppercase tracking-widest",className)}>{children}</button>
);
const GT = ({label,active,color,onToggle}:{label:string;active:boolean;color:string;onToggle:()=>void}) => (
  <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:color}}/><span className="text-[9px] text-gray-500">{label}</span></div>
    <button onClick={onToggle} title={label} aria-label={label} className={`w-7 h-3.5 rounded-full relative transition-colors ${active?'bg-blue-600':'bg-gray-300'}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${active?'left-3.5':'left-0.5'}`}/></button>
  </div>
);

export const PropertiesPanel: React.FC = () => {
  const {selectedObjects,canvas,settings,setSettings,showGuides,toggleGuide,guideSettings,assets,addAsset,saveHistory,fitProjectToScreen} = useStore();
  const [activePicker, setActivePicker] = useState<'fill' | 'stroke' | 'shadow' | null>(null);
  const [,forceUpdate] = React.useState(0);
  const selected = selectedObjects[0];

  const pxToUnit = (px: number) => {
    const dpi = settings.dpi || 300;
    if (settings.unit === 'mm') return px / (dpi / 25.4);
    if (settings.unit === 'cm') return px / (dpi / 2.54);
    if (settings.unit === 'inch') return px / dpi;
    return px;
  };

  const unitToPx = (val: number) => {
    const dpi = settings.dpi || 300;
    if (settings.unit === 'mm') return val * (dpi / 25.4);
    if (settings.unit === 'cm') return val * (dpi / 2.54);
    if (settings.unit === 'inch') return val * dpi;
    return val;
  };

  React.useEffect(() => {
    if (!canvas) return;
    const h = () => forceUpdate(p=>p+1);
    canvas.on('object:moving',h); canvas.on('object:scaling',h); canvas.on('object:rotating',h); canvas.on('object:modified',h);
    return () => { canvas.off('object:moving',h); canvas.off('object:scaling',h); canvas.off('object:rotating',h); canvas.off('object:modified',h); };
  }, [canvas]);

  // Shared Alignment Logic
  const getRenderDims = () => {
    const s = useStore.getState().settings;
    const scale = 800 / Math.max(s.width, s.height);
    return { width: s.width * scale, height: s.height * scale };
  };

  const handleAlignment = (type: string) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    if (active.type === 'activeSelection') {
      const as = active as ActiveSelection;
      const w = as.width || 0, h = as.height || 0;
      as.forEachObject(o => {
        const br = o.getBoundingRect();
        const offsetX = o.left - br.left;
        const offsetY = o.top - br.top;

        switch(type) {
          case 'left': o.set('left', -w/2 + offsetX); break;
          case 'right': o.set('left', w/2 - br.width + offsetX); break;
          case 'center-h': o.set('left', -br.width/2 + offsetX); break;
          case 'top': o.set('top', -h/2 + offsetY); break;
          case 'bottom': o.set('top', h/2 - br.height + offsetY); break;
          case 'center-v': o.set('top', -br.height/2 + offsetY); break;
        }
      });
    } else {
      const dims = getRenderDims();
      const br = active.getBoundingRect();
      const offsetX = active.left - br.left;
      const offsetY = active.top - br.top;

      switch(type) {
        case 'left': active.set('left', 0 + offsetX); break;
        case 'right': active.set('left', dims.width - br.width + offsetX); break;
        case 'center-h': active.set('left', (dims.width - br.width) / 2 + offsetX); break;
        case 'top': active.set('top', 0 + offsetY); break;
        case 'bottom': active.set('top', dims.height - br.height + offsetY); break;
        case 'center-v': active.set('top', (dims.height - br.height) / 2 + offsetY); break;
      }
    }
    active.setCoords();
    canvas.renderAll();
    saveHistory(`Align ${type.charAt(0).toUpperCase() + type.slice(1)}`);
  };

  const handleDistribute = (dir: 'h' | 'v') => {
    if (!canvas) return;
    const active = canvas.getActiveObject() as ActiveSelection;
    if (!active || active.type !== 'activeSelection') return;
    const objs = active.getObjects();
    if (objs.length < 2) return;

    if (dir === 'h') {
      const sorted = [...objs].sort((a, b) => a.left - b.left);
      const first = sorted[0], last = sorted[sorted.length - 1];
      const totalDist = last.left - first.left;
      const step = totalDist / (objs.length - 1);
      sorted.forEach((o, i) => o.set('left', first.left + i * step));
    } else {
      const sorted = [...objs].sort((a, b) => a.top - b.top);
      const first = sorted[0], last = sorted[sorted.length - 1];
      const totalDist = last.top - first.top;
      const step = totalDist / (objs.length - 1);
      sorted.forEach((o, i) => o.set('top', first.top + i * step));
    }
    active.setCoords();
    canvas.renderAll();
    saveHistory(`Distribute ${dir === 'h' ? 'Horizontally' : 'Vertically'}`);
  };

  // Multi-select panel
  if (selectedObjects.length > 1) {
    return (
      <div className="flex-1 bg-white flex flex-col h-full overflow-y-auto">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <LayoutGrid size={14}/> Selection ({selectedObjects.length})
          </h2>
        </div>
        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Alignment</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'left', icon: AlignLeft, label: 'Align Left' },
                { id: 'center-h', icon: AlignCenter, label: 'Align Horizontal Center' },
                { id: 'right', icon: AlignRight, label: 'Align Right' },
                { id: 'top', icon: AlignStartVertical, label: 'Align Top' },
                { id: 'center-v', icon: AlignCenterVertical, label: 'Align Vertical Center' },
                { id: 'bottom', icon: AlignEndVertical, label: 'Align Bottom' },
              ].map(btn => (
                <button key={btn.id} onClick={() => handleAlignment(btn.id)} className="p-2 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex justify-center text-gray-500 transition-all border border-transparent hover:border-blue-100" title={btn.label}>
                  <btn.icon size={16}/>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Organization</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => {
                if (!canvas) return;
                const active = canvas.getActiveObject();
                if (!active || active.type !== 'activeSelection') return;
                
                const selection = active as ActiveSelection;
                const objects = selection.getObjects();
                selection.forEachObject((obj: any) => canvas.remove(obj));
                canvas.discardActiveObject();
                
                const group = new Group(objects, {
                  left: selection.left,
                  top: selection.top,
                });
                
                canvas.add(group);
                canvas.setActiveObject(group);
                canvas.requestRenderAll();
                saveHistory();
              }} className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                <Layers size={14}/>
                <span className="text-[9px] font-black uppercase tracking-tighter">Group</span>
              </button>
              <button onClick={() => {
                if (!canvas) return;
                const active = canvas.getActiveObject();
                if (!active || active.type !== 'group') return;
                
                const group = active as Group;
                const objects = group.getObjects();
                group.forEachObject((obj: any) => {
                  canvas.add(obj);
                });
                canvas.remove(group);
                canvas.discardActiveObject();
                canvas.requestRenderAll();
                saveHistory();
              }} className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                <LayoutGrid size={14}/>
                <span className="text-[9px] font-black uppercase tracking-tighter">Ungroup</span>
              </button>
              <button onClick={() => {
                selectedObjects.forEach(o => {
                  o.set({ lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true });
                });
                canvas?.renderAll();
                saveHistory();
              }} className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100">
                <Lock size={14}/>
                <span className="text-[9px] font-black uppercase tracking-tighter">Lock All</span>
              </button>
              <button onClick={() => {
                selectedObjects.forEach(o => {
                  o.set({ lockMovementX: false, lockMovementY: false, lockScalingX: false, lockScalingY: false, lockRotation: false });
                });
                canvas?.renderAll();
                saveHistory();
              }} className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all border border-transparent hover:border-green-100">
                <Unlock size={14}/>
                <span className="text-[9px] font-black uppercase tracking-tighter">Unlock All</span>
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Distribute</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleDistribute('h')} className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                <AlignHorizontalDistributeCenter size={14}/>
                <span className="text-[9px] font-black uppercase tracking-tighter">Horizontal</span>
              </button>
              <button onClick={() => handleDistribute('v')} className="flex items-center justify-center gap-2 py-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                <AlignVerticalDistributeCenter size={14}/>
                <span className="text-[9px] font-black uppercase tracking-tighter">Vertical</span>
              </button>
            </div>
          </section>

          <section>
            <AB onClick={() => {
              canvas?.remove(...selectedObjects);
              canvas?.discardActiveObject();
              canvas?.renderAll();
              saveHistory();
            }} className="w-full text-red-500 bg-red-50 border-red-100 hover:bg-red-100 py-2.5">
              <Trash2 size={12} className="inline mr-2"/> Delete All
            </AB>
          </section>
        </div>
      </div>
    );
  }

  // No selection — canvas properties
  if (!selected) {
    return (
      <div className="flex-1 bg-white flex flex-col h-full overflow-y-auto">
        <div className="p-3 border-b border-gray-100 bg-gray-50/50"><h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2"><Settings2 size={14} className="text-gray-400"/>Canvas</h2></div>
        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Uploads</h3>
            <div className="grid grid-cols-3 gap-2">
              {assets.map((url, i) => (
                <div key={i} className="aspect-square bg-gray-50 rounded-lg border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group relative" 
                  onClick={async () => {
                    if (!canvas) return;
                    try {
                      // Create image via HTML element first for reliable dimensions
                      const imgEl = new Image();
                      imgEl.crossOrigin = 'anonymous';
                      await new Promise<void>((resolve, reject) => {
                        imgEl.onload = () => resolve();
                        imgEl.onerror = () => reject(new Error('Image load failed'));
                        imgEl.src = url;
                      });

                      const img = new FabricImage(imgEl);
                      const s = useStore.getState().settings;
                      const scaleBase = 800 / Math.max(s.width, s.height);
                      const renderW = s.width * scaleBase;
                      const renderH = s.height * scaleBase;

                      const imgW = img.width || imgEl.naturalWidth || 100;
                      const imgH = img.height || imgEl.naturalHeight || 100;

                      const fitScale = Math.min(
                        (renderW * 0.7) / imgW,
                        (renderH * 0.7) / imgH
                      );
                      const safeScale = isFinite(fitScale) && fitScale > 0 ? fitScale : 0.5;

                      img.set({
                        left: renderW / 2,
                        top: renderH / 2,
                        originX: 'center',
                        originY: 'center',
                        scaleX: safeScale,
                        scaleY: safeScale,
                        cornerColor: '#de1fe9',
                        cornerStrokeColor: '#ffffff',
                        cornerSize: 10,
                        transparentCorners: false,
                        borderColor: '#de1fe9'
                      });

                      canvas.add(img);
                      canvas.setActiveObject(img);
                      canvas.requestRenderAll();
                      saveHistory();
                    } catch (e) {
                      console.error("Failed to add asset image:", e);
                    }
                  }}>
                  <img src={url} className="w-full h-full object-cover" alt="Asset" />
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-blue-600 text-[10px] font-black px-2 py-1 rounded shadow-lg">ADD</span>
                  </div>
                </div>
              ))}
              <label className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-all cursor-pointer">
                <span className="text-lg font-bold">+</span>
                <input type="file" className="hidden" accept="image/*" onChange={e=>{const file=e.target.files?.[0]; if (file && canvas) { importImage(canvas, file); }}}/>
              </label>
            </div>
          </section>
          <section>
            <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3">Dimensions ({settings.unit.toUpperCase()})</h3>
            <div className="grid grid-cols-2 gap-3">
              <PI label="WIDTH" value={Math.round(pxToUnit(settings.width) * 100) / 100} onChange={v=>setSettings({width:unitToPx(parseFloat(v))})}/>
              <PI label="HEIGHT" value={Math.round(pxToUnit(settings.height) * 100) / 100} onChange={v=>setSettings({height:unitToPx(parseFloat(v))})}/>
            </div>
          </section>
        </div>
      </div>
    );
  }

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

  const up = (key:string,val:any, customLabel?: string) => { 
    if(typeof val==='number'&&isNaN(val))return; 
    selected.set(key as any,val);
    if (key === 'fontFamily' && INDIC_SAMPLES[val] && (selected as any).text?.match(/edit|text|field/i)) {
      (selected as any).set('text', INDIC_SAMPLES[val]);
    }
    canvas?.renderAll(); 
    saveHistory(customLabel || `Update ${key.charAt(0).toUpperCase() + key.slice(1)}`); 
  };
  const isText = selected.type==='i-text'||selected.type==='textbox';
  const isImage = selected.type==='image';
  const s = selected as any;

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest">Properties</h2>
        <span className="text-[9px] bg-blue-50 px-2 py-0.5 rounded-full text-blue-600 font-black">{selected.type?.toUpperCase()}</span>
      </div>

      {/* Transform */}
      <section className="p-4 border-b border-gray-100">
        <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3 flex items-center gap-1"><Move size={10}/>Position & Alignment</h3>
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {[
            { id: 'left', icon: AlignLeft, label: 'Page Left' },
            { id: 'center-h', icon: AlignCenter, label: 'Page Center' },
            { id: 'right', icon: AlignRight, label: 'Page Right' },
            { id: 'top', icon: AlignStartVertical, label: 'Page Top' },
            { id: 'center-v', icon: AlignCenterVertical, label: 'Page Middle' },
            { id: 'bottom', icon: AlignEndVertical, label: 'Page Bottom' },
          ].map(btn => (
            <button key={btn.id} onClick={() => handleAlignment(btn.id)} className="p-2 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex justify-center text-gray-500 transition-all border border-transparent hover:border-blue-100" title={btn.label}>
              <btn.icon size={16}/>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PI label={`X (${settings.unit})`} value={Math.round(pxToUnit(selected.left||0) * 100) / 100} onChange={v=>up('left',unitToPx(parseFloat(v)))}/>
          <PI label={`Y (${settings.unit})`} value={Math.round(pxToUnit(selected.top||0) * 100) / 100} onChange={v=>up('top',unitToPx(parseFloat(v)))}/>
          <PI label={`W (${settings.unit})`} value={Math.round(pxToUnit((selected.width||0)*(selected.scaleX||1)) * 100) / 100} onChange={v=>{const nw=unitToPx(parseFloat(v));selected.set({scaleX:nw/(selected.width||1)});canvas?.renderAll();saveHistory('Update Width');}}/>
          <PI label={`H (${settings.unit})`} value={Math.round(pxToUnit((selected.height||0)*(selected.scaleY||1)) * 100) / 100} onChange={v=>{const nh=unitToPx(parseFloat(v));selected.set({scaleY:nh/(selected.height||1)});canvas?.renderAll();saveHistory('Update Height');}}/>
          <PI label="ROTATION" value={Math.round(selected.angle||0)} onChange={v=>up('angle',parseInt(v))}/>
          <PI label="SKEW X" value={Math.round(selected.skewX||0)} onChange={v=>up('skewX',parseInt(v))}/>
          <PI label="SKEW Y" value={Math.round(selected.skewY||0)} onChange={v=>up('skewY',parseInt(v))}/>
        </div>
      </section>

      {/* QR */}
      {s.qrData !== undefined && (
        <section className="p-4 border-b border-gray-100">
          <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3 flex items-center gap-1"><QrCode size={10}/>QR</h3>
          <textarea value={s.qrData||''} onChange={async e=>{s.qrData=e.target.value;try{const d=await QRCode.toDataURL(e.target.value||' ',{margin:2,width:512});const img=new Image();img.onload=()=>{(selected as FabricImage).setElement(img);canvas?.renderAll();};img.src=d;}catch{}}}
            title="QR Data" aria-label="QR Data"
            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-[11px] focus:border-blue-500 outline-none h-20 resize-none" placeholder="URL/Text..."/>
        </section>
      )}

      {isText && (
        <section className="p-4 border-b border-gray-100">
          <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3 flex items-center gap-1"><Type size={10}/>Typography</h3>
          <div className="space-y-4">
            <div><label className="text-[9px] text-gray-400 font-black block mb-1 uppercase tracking-tighter">Font Family</label>
              <FontSelector 
                value={s.fontFamily || 'Inter'} 
                onChange={val => up('fontFamily', val)} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <PI label="SIZE" value={s.fontSize||20} onChange={v=>up('fontSize',parseInt(v))}/>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] text-gray-400 font-black"><span>LINE HEIGHT</span><span>{s.lineHeight?.toFixed(2)||1.16}</span></div>
                <input type="range" title="Line Height" aria-label="Line Height" min="0.5" max="3" step="0.05" value={s.lineHeight||1.16} onChange={e=>up('lineHeight',parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"/>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[8px] text-gray-400 font-black"><span>LETTER SPACING</span><span>{s.charSpacing||0}</span></div>
              <input type="range" title="Letter Spacing" aria-label="Letter Spacing" min="-100" max="1000" step="10" value={s.charSpacing||0} onChange={e=>up('charSpacing',parseInt(e.target.value))} className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"/>
            </div>

            <div className="flex gap-1 justify-between">
              <div className="flex gap-1">
                <button onClick={()=>up('fontWeight',s.fontWeight==='bold'?'normal':'bold')} title="Bold" className={cn("w-8 h-8 rounded border flex items-center justify-center font-black text-[11px]",s.fontWeight==='bold'?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-400 border-gray-100")}>B</button>
                <button onClick={()=>up('fontStyle',s.fontStyle==='italic'?'normal':'italic')} title="Italic" className={cn("w-8 h-8 rounded border flex items-center justify-center font-black italic text-[11px]",s.fontStyle==='italic'?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-400 border-gray-100")}>I</button>
                <button onClick={()=>up('underline',!s.underline)} title="Underline" className={cn("w-8 h-8 rounded border flex items-center justify-center font-black underline text-[11px]",s.underline?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-400 border-gray-100")}>U</button>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>up('textAlign','left')} title="Align Left" className={cn("w-8 h-8 rounded border flex items-center justify-center",s.textAlign==='left'?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-400 border-gray-100")}><AlignLeft size={14}/></button>
                <button onClick={()=>up('textAlign','center')} title="Align Center" className={cn("w-8 h-8 rounded border flex items-center justify-center",s.textAlign==='center'?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-400 border-gray-100")}><AlignCenter size={14}/></button>
                <button onClick={()=>up('textAlign','right')} title="Align Right" className={cn("w-8 h-8 rounded border flex items-center justify-center",s.textAlign==='right'?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-400 border-gray-100")}><AlignRight size={14}/></button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Styling (Fill, Stroke, Gradient, Opacity) */}
      <section className="p-4 border-b border-gray-100 space-y-4">
        <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1"><Palette size={10}/>Styling</h3>
        
        {(isText || (!isImage && s.qrData === undefined)) && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1 relative">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Color</label>
                <div 
                  onClick={() => setActivePicker(activePicker === 'fill' ? null : 'fill')}
                  className="h-9 bg-gray-50 rounded-lg border border-gray-100 flex items-center px-3 group hover:border-blue-200 transition-all cursor-pointer overflow-hidden">
                  <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm mr-2" style={{ backgroundColor: typeof s.fill === 'string' ? s.fill : '#000000' }} />
                  <span className="text-[11px] font-mono font-bold text-gray-600 truncate">{typeof s.fill === 'string' ? s.fill.toUpperCase() : 'GRADIENT'}</span>
                </div>
                {activePicker === 'fill' && (
                  <div className="absolute top-full left-0 z-50 mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <ColorPicker color={typeof s.fill === 'string' ? s.fill : '#000000'} onChange={(c) => up('fill', c)} />
                  </div>
                )}
              </div>
              {!isText && (
                <div className="flex-1 space-y-1 relative">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Stroke</label>
                  <div 
                    onClick={() => setActivePicker(activePicker === 'stroke' ? null : 'stroke')}
                    className="h-9 bg-gray-50 rounded-lg border border-gray-100 flex items-center px-3 group hover:border-blue-200 transition-all cursor-pointer overflow-hidden">
                    <div className="w-4 h-4 rounded-md border-2 border-gray-200 shadow-sm mr-2" style={{ borderColor: s.stroke || '#000000' }} />
                    <span className="text-[11px] font-mono font-bold text-gray-600 truncate">{s.stroke?.toUpperCase() || '#000000'}</span>
                  </div>
                  {activePicker === 'stroke' && (
                    <div className="absolute top-full right-0 z-50 mt-2 animate-in fade-in zoom-in-95 duration-200">
                      <ColorPicker color={s.stroke || '#000000'} onChange={(c) => up('stroke', c)} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <GradientPanel />

            {!isText && <PI label="STROKE WIDTH" value={s.strokeWidth||0} onChange={v=>up('strokeWidth',parseInt(v))}/>}
          </>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-[8px] text-gray-400 font-black">
            <span>OPACITY</span>
            <span className="text-blue-600">{Math.round((s.opacity || 1) * 100)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={s.opacity || 1} onChange={e=>up('opacity',parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"/>
        </div>

        {selected.type === 'rect' && (
          <PI label="CORNER RADIUS" value={Math.round(s.rx || 0)} onChange={v => { up('rx', parseInt(v)); up('ry', parseInt(v)); }} />
        )}
      </section>

      {/* Image Filters */}
      {isImage && (
        <section className="p-4 border-b border-gray-100">
          <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-3 flex items-center gap-1"><Maximize size={10}/>Image Enhancement</h3>
          <div className="space-y-4">
            <button onClick={() => {
              // Mock AI background removal
              const timer = setTimeout(() => {
                alert('AI Analysis Complete: Background removed successfully.');
                saveHistory('Remove Background');
              }, 2000);
            }} 
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 border border-blue-500 active:scale-95">
              <Sparkles size={14} className="text-blue-200 animate-pulse"/> Remove Background
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  const filter = new (filters as any).Grayscale();
                  const existingIdx = (selected as any).filters.findIndex((i: any) => i.type === 'Grayscale');
                  if (existingIdx >= 0) (selected as any).filters.splice(existingIdx, 1);
                  else (selected as any).filters.push(filter);
                  (selected as FabricImage).applyFilters();
                  canvas?.renderAll();
                  saveHistory();
                }}
                className={cn(
                  "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                  (selected as any).filters.some((i: any) => i.type === 'Grayscale') 
                    ? "bg-gray-900 text-white border-gray-900" 
                    : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                )}>
                Grayscale
              </button>
              <button 
                onClick={() => {
                  const filter = new (filters as any).Invert();
                  const existingIdx = (selected as any).filters.findIndex((i: any) => i.type === 'Invert');
                  if (existingIdx >= 0) (selected as any).filters.splice(existingIdx, 1);
                  else (selected as any).filters.push(filter);
                  (selected as FabricImage).applyFilters();
                  canvas?.renderAll();
                  saveHistory();
                }}
                className={cn(
                  "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                  (selected as any).filters.some((i: any) => i.type === 'Invert') 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                )}>
                Invert
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { label: 'BRIGHTNESS', name: 'Brightness', min: -0.5, max: 0.5, step: 0.01, prop: 'brightness' },
                { label: 'CONTRAST', name: 'Contrast', min: -0.5, max: 0.5, step: 0.01, prop: 'contrast' },
                { label: 'SATURATION', name: 'Saturation', min: -1, max: 1, step: 0.01, prop: 'saturation' },
                { label: 'BLUR', name: 'Blur', min: 0, max: 1, step: 0.01, prop: 'blur' },
              ].map(f => {
                const currentFilter = (selected as any).filters?.find((i: any) => i.type === f.name);
                const val = currentFilter ? (currentFilter[f.prop as any] || currentFilter.value || 0) : 0;
                
                return (
                  <div key={f.name} className="space-y-1">
                    <div className="flex justify-between text-[8px] text-gray-400 font-black">
                      <span>{f.label}</span>
                      <span className="text-blue-600 font-bold">{Math.round(val * 100)}%</span>
                    </div>
                    <input type="range" min={f.min} max={f.max} step={f.step} 
                      value={val}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        const FilterClass = (filters as any)[f.name];
                        let existing = (selected as any).filters.find((i: any) => i.type === f.name);
                        
                        if (existing) {
                          if (f.name === 'Blur') existing.blur = v;
                          else existing[f.prop as any] = v;
                        } else {
                          const options: any = {};
                          if (f.name === 'Blur') options.blur = v;
                          else options[f.prop as any] = v;
                          (selected as any).filters.push(new FilterClass(options));
                        }
                        
                        (selected as FabricImage).applyFilters();
                        canvas?.renderAll();
                        // Debounced save history or just save on change end
                      }}
                      onMouseUp={() => saveHistory(`${f.label} Adjustment`)}
                      className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"/>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Shadow */}
      <section className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[9px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">Shadow & Glow</h3>
          <div className="relative w-6 h-6 rounded border border-gray-200 overflow-hidden shadow-sm" style={{ backgroundColor: s.shadow?.color || 'rgba(0,0,0,0.3)' }}>
            <input type="color" value={s.shadow?.color?.startsWith('#') ? s.shadow.color : '#000000'} 
              onChange={e=>up('shadow',{...s.shadow||{}, color: e.target.value, offsetX: s.shadow?.offsetX||0, offsetY: s.shadow?.offsetY||0, blur: s.shadow?.blur||4})}
              className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <PI label="X" value={s.shadow?.offsetX||0} onChange={v=>up('shadow',{...s.shadow||{},color:s.shadow?.color||'rgba(0,0,0,0.3)',offsetX:parseInt(v),offsetY:s.shadow?.offsetY||0,blur:s.shadow?.blur||4})}/>
          <PI label="Y" value={s.shadow?.offsetY||0} onChange={v=>up('shadow',{...s.shadow||{},color:s.shadow?.color||'rgba(0,0,0,0.3)',offsetX:s.shadow?.offsetX||0,offsetY:parseInt(v),blur:s.shadow?.blur||4})}/>
          <PI label="BLUR" value={s.shadow?.blur||0} onChange={v=>up('shadow',{...s.shadow||{},color:s.shadow?.color||'rgba(0,0,0,0.3)',offsetX:s.shadow?.offsetX||0,offsetY:s.shadow?.offsetY||0,blur:parseInt(v)})}/>
        </div>
      </section>

      {/* Arrangement */}
      <section className="p-4 border-b border-gray-100">
        <h3 className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1"><Layers size={10}/>Arrangement</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <AB onClick={()=>{canvas?.bringObjectToFront(selected);canvas?.renderAll();saveHistory('Bring to Front');}}><ChevronUp size={10} className="inline mr-1"/>Front</AB>
          <AB onClick={()=>{canvas?.sendObjectToBack(selected);canvas?.renderAll();saveHistory('Send to Back');}}><ChevronDown size={10} className="inline mr-1"/>Back</AB>
          <AB onClick={()=>{canvas?.bringObjectForward(selected);canvas?.renderAll();saveHistory('Bring Forward');}}>Forward</AB>
          <AB onClick={()=>{canvas?.sendObjectBackwards(selected);canvas?.renderAll();saveHistory('Send Backward');}}>Backward</AB>
        </div>
      </section>

      {/* Operations */}
      <section className="p-4">
        <h3 className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-3">Operations</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <AB onClick={()=>{s.set('flipX',!s.flipX);canvas?.renderAll();saveHistory('Flip Horizontal');}}><FlipHorizontal size={10} className="inline mr-1"/>Flip H</AB>
          <AB onClick={()=>{s.set('flipY',!s.flipY);canvas?.renderAll();saveHistory('Flip Vertical');}}><FlipVertical size={10} className="inline mr-1"/>Flip V</AB>
        </div>
      </section>
    </div>
  );
};
