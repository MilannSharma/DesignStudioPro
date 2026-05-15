import React from 'react';
import { useStore } from '../../store/useStore';
import { Copy, Trash2, Lock, Unlock, ChevronUp, ChevronDown, Group, Ungroup, Clipboard, FlipHorizontal, FlipVertical, Scissors } from 'lucide-react';
import { Group as FabricGroup } from 'fabric';

interface ContextMenuProps { x: number; y: number; onClose: () => void; }

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const { canvas, saveHistory } = useStore();
  const active = canvas?.getActiveObject();
  if (!active) return null;

  const act = (fn: () => void) => { fn(); canvas?.renderAll(); saveHistory(); onClose(); };
  const isLocked = active.lockMovementX;

  return (
    <div className="fixed z-50 bg-white border border-gray-200 shadow-2xl rounded-xl p-1 min-w-[170px]" style={{ left: x, top: y }} onMouseLeave={onClose}>
      <div className="px-3 py-1 text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Actions</div>
      <MO icon={Copy} label="Duplicate" onClick={() => act(() => {
        active.clone().then((c: any) => { c.set({ left: c.left + 20, top: c.top + 20 }); canvas?.add(c); canvas?.setActiveObject(c); });
      })} />
      <MO icon={isLocked ? Unlock : Lock} label={isLocked ? "Unlock" : "Lock"} onClick={() => act(() => {
        const l = !isLocked;
        active.set({ lockMovementX: l, lockMovementY: l, lockScalingX: l, lockScalingY: l, lockRotation: l, hasControls: !l, editable: !l } as any);
      })} />
      <MO icon={Trash2} label="Delete" color="text-red-600" onClick={() => act(() => {
        canvas?.getActiveObjects().forEach(o => canvas.remove(o)); canvas?.discardActiveObject();
      })} />
      <div className="h-px bg-gray-50 my-1" />
      <MO icon={ChevronUp} label="Bring to Front" onClick={() => act(() => canvas?.bringObjectToFront(active))} />
      <MO icon={ChevronDown} label="Send to Back" onClick={() => act(() => canvas?.sendObjectToBack(active))} />
      <div className="h-px bg-gray-50 my-1" />
      <MO icon={FlipHorizontal} label="Flip H" onClick={() => act(() => active.set('flipX' as any, !(active as any).flipX))} />
      <MO icon={FlipVertical} label="Flip V" onClick={() => act(() => active.set('flipY' as any, !(active as any).flipY))} />
      <div className="h-px bg-gray-50 my-1" />
      {active instanceof FabricGroup ? (
        <MO icon={Ungroup} label="Ungroup" onClick={() => act(() => (active as any).toActiveSelection())} />
      ) : (
        <MO icon={Group} label="Group" onClick={() => {
          const objs = canvas?.getActiveObjects() || [];
          if (objs.length > 1) act(() => {
            const g = new FabricGroup(objs); objs.forEach(o => canvas?.remove(o));
            canvas?.add(g); canvas?.setActiveObject(g);
          });
        }} />
      )}
      <div className="h-px bg-gray-50 my-1" />
      {canvas?.getActiveObjects().length! > 1 && (
        <MO icon={Scissors} label="Mask Selection" onClick={() => act(() => {
          const objs = canvas?.getActiveObjects() || [];
          const mask = objs[objs.length - 1]; // Top-most
          const content = objs.slice(0, -1);
          
          const g = new FabricGroup(content);
          mask.absolutePositioned = true;
          g.clipPath = mask;
          
          content.forEach(o => canvas?.remove(o));
          canvas?.remove(mask);
          canvas?.add(g);
          canvas?.setActiveObject(g);
        })} />
      )}
      {(active as any).clipPath && (
        <MO icon={Scissors} label="Release Mask" onClick={() => act(() => {
          const g = active as any;
          const mask = g.clipPath;
          if (!mask) return;
          
          g.clipPath = null;
          canvas?.add(mask);
          if (g instanceof FabricGroup) {
            (g as any).toActiveSelection();
          }
        })} />
      )}
    </div>
  );
};

const MO = ({ icon: Icon, label, onClick, color = "text-gray-700" }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors ${color}`}>
    <Icon size={13} className="opacity-50" /><span className="text-[10px] font-bold">{label}</span>
  </button>
);
