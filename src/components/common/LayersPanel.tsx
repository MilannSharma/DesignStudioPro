import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Layers, Eye, EyeOff, Lock, Unlock, Type, Square, Image, Circle, Hexagon, PenTool } from 'lucide-react';

const typeIcon = (t: string) => {
  if (t === 'textbox' || t === 'i-text') return <Type size={10} />;
  if (t === 'rect') return <Square size={10} />;
  if (t === 'image') return <Image size={10} />;
  if (t === 'circle' || t === 'ellipse') return <Circle size={10} />;
  if (t === 'polygon') return <Hexagon size={10} />;
  if (t === 'path') return <PenTool size={10} />;
  return <Layers size={10} />;
};

export const LayersPanel: React.FC = () => {
  const { canvas, selectedObjects } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggedUid, setDraggedUid] = useState<string | null>(null);
  const [, forceUpdate] = useState({});

  React.useEffect(() => {
    if (!canvas) return;
    const update = () => forceUpdate({});
    canvas.on('object:added', update);
    canvas.on('object:removed', update);
    canvas.on('object:modified', update);
    return () => {
      canvas.off('object:added', update);
      canvas.off('object:removed', update);
      canvas.off('object:modified', update);
    };
  }, [canvas]);

  const objects = (canvas?.getObjects() || []).filter(obj => !(obj as any).isPageBackground);

  const toggleVis = (obj: any) => { obj.set('visible', !obj.visible); canvas?.renderAll(); useStore.getState().saveHistory(); };
  const toggleLock = (obj: any) => {
    const l = !obj.lockMovementX;
    obj.set({ lockMovementX: l, lockMovementY: l, lockScalingX: l, lockScalingY: l, lockRotation: l, editable: !l, hasControls: !l });
    canvas?.renderAll(); useStore.getState().saveHistory();
  };

  const handleDragStart = (uid: string) => setDraggedUid(uid);
  const handleDrop = (targetUid: string) => {
    if (!canvas || !draggedUid || draggedUid === targetUid) return;
    const objs = canvas.getObjects();
    const fromIdx = objs.findIndex(o => (o as any).__uid === draggedUid);
    const toIdx = objs.findIndex(o => (o as any).__uid === targetUid);
    if (fromIdx === -1 || toIdx === -1) return;
    
    const obj = objs[fromIdx];
    canvas.moveTo(obj, toIdx);
    canvas.renderAll();
    useStore.getState().saveHistory();
    setDraggedUid(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white border-t border-gray-100 min-h-0">
      <div className="p-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Layers size={14} className="text-gray-400" /> Layers
          </h2>
          <span className="text-[9px] text-gray-400 font-black tracking-widest">{objects.length}</span>
        </div>
        
        {/* Layer Controls (Opacity / Blend) */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Kind</label>
            <select className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px] font-bold outline-none">
              <option>Normal</option>
              <option>Dissolve</option>
              <option>Multiply</option>
              <option>Screen</option>
              <option>Overlay</option>
            </select>
          </div>
          <div className="w-24 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Opacity</label>
              <span className="text-[8px] font-bold text-blue-600">100%</span>
            </div>
            <input 
              type="range" min="0" max="100" defaultValue="100"
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              onChange={(e) => {
                const val = parseInt(e.target.value) / 100;
                canvas?.getActiveObjects().forEach(o => o.set('opacity', val));
                canvas?.renderAll();
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {objects.slice().reverse().map((obj: any) => {
          const uid = obj.__uid || '?';
          const isSelected = selectedObjects.includes(obj);
          const isGroup = obj.type === 'group';
          
          return (
            <div key={uid}
              draggable
              onDragStart={() => handleDragStart(uid)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(uid)}
              className={`flex items-center gap-2 px-3 py-2 border-b border-gray-50 hover:bg-gray-50/50 transition-all group cursor-pointer ${isSelected ? 'bg-blue-50/50 border-l-4 border-l-blue-600 pl-2' : 'pl-3'} ${draggedUid === uid ? 'opacity-30' : ''}`}
              onClick={() => { canvas?.setActiveObject(obj); canvas?.renderAll(); }}>
              <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-400">
                {obj.type === 'image' ? (
                  <img src={obj._element?.src} className="w-full h-full object-cover rounded-md opacity-60" alt="" />
                ) : typeIcon(obj.type)}
              </div>
              <div className="flex-1 min-w-0">
                {editingId === uid ? (
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    autoFocus
                    title="Rename layer"
                    aria-label="Rename layer"
                    onBlur={() => { obj.name = editName; setEditingId(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { obj.name = editName; setEditingId(null); } }}
                    className="text-[10px] font-bold w-full bg-white border border-blue-400 rounded px-1 py-0.5 outline-none" />
                ) : (
                  <p className={`text-[10px] truncate font-bold uppercase tracking-tight ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}
                    onDoubleClick={() => { setEditingId(uid); setEditName(obj.name || `${obj.type}`); }}>
                    {obj.name || `${obj.type} ${uid}`}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[8px] text-gray-400 font-bold opacity-60">
                  <span>{uid}</span>
                  {isGroup && <span>• {obj._objects?.length} children</span>}
                  {obj.opacity !== undefined && obj.opacity < 1 && <span>• {Math.round(obj.opacity * 100)}%</span>}
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={e => { e.stopPropagation(); toggleVis(obj); }} className="p-1 text-gray-400 hover:text-blue-600 rounded-full transition-all">
                  {obj.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-red-500" />}
                </button>
                <button onClick={e => { e.stopPropagation(); toggleLock(obj); }} className="p-1 text-gray-400 hover:text-blue-600 rounded-full transition-all">
                  {obj.lockMovementX ? <Lock size={12} className="text-orange-500" /> : <Unlock size={12} />}
                </button>
              </div>
            </div>
          );
        })}
        {objects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-200">
            <Layers size={32} className="mb-2 opacity-20" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};
