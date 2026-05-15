/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ActiveSelection, Group, util, Textbox } from 'fabric';

export const useKeyboardShortcuts = () => {
  const { 
    canvas, activeTool, setActiveTool, undo, redo, 
    saveHistory, saveTemplate, toggleGrid, 
    copiedObjectJson, setCopiedObjectJson,
    setShowSearchReplace, setIsAltPressed
  } = useStore();

  useEffect(() => {
    if (!canvas) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Track Alt key for spacing guides
      if (e.key === 'Alt') {
        setIsAltPressed(true);
        canvas.requestRenderAll();
      }

      // Ignore if typing in an input
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement as any).isContentEditable) return;

      const activeObj = canvas.getActiveObject();
      const isEditing = activeObj && (activeObj instanceof Textbox) && (activeObj as any).isEditing;
      
      // Enter key handling
      if (e.key === 'Enter') {
        if (isEditing) {
          (activeObj as any).exitEditing();
          canvas.renderAll();
          return;
        }
        // Custom events for tool finalization if needed
        window.dispatchEvent(new CustomEvent('canvas:enter'));
      }

      if (isEditing) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Tool Shortcuts
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('select'); break;
          case 't': setActiveTool('text'); break;
          case 'r': setActiveTool('rect'); break;
          case 'q': setActiveTool('qr'); break;
          case 'e': setActiveTool('ellipse'); break;
          case 'l': setActiveTool('line'); break;
          case 'h': setActiveTool('hand'); break;
          case 'p': setActiveTool('pen'); break;
          case 'b': setActiveTool('pencil'); break;
          case 'g': toggleGrid(); break;
          case 'escape': 
            canvas.discardActiveObject(); 
            canvas.renderAll(); 
            setActiveTool('select'); 
            break;
        }
      }

      // Actions
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (shift) redo(); else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveTemplate();
            break;
          case 'd':
            e.preventDefault();
            if (activeObj) {
              activeObj.clone().then((cloned: any) => {
                canvas.discardActiveObject();
                cloned.set({ left: (activeObj.left || 0) + 20, top: (activeObj.top || 0) + 20, evented: true });
                if (cloned.type === 'activeSelection') {
                  cloned.canvas = canvas;
                  cloned.forEachObject((obj: any) => canvas.add(obj));
                } else { canvas.add(cloned); }
                canvas.setActiveObject(cloned);
                canvas.requestRenderAll();
                saveHistory();
              });
            }
            break;
          case 'c':
            if (activeObj) {
              activeObj.clone().then((cloned: any) => {
                setCopiedObjectJson(JSON.stringify(cloned.toJSON(['__uid', 'name', 'selectable', 'evented', 'qrData'])));
              });
            }
            break;
          case 'v':
            if (copiedObjectJson) {
              try {
                const parsed = JSON.parse(copiedObjectJson);
                const enlivened = await util.enlivenObjects([parsed]);
                enlivened.forEach((obj: any) => {
                  obj.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
                  canvas.add(obj);
                  canvas.setActiveObject(obj);
                });
                canvas.requestRenderAll();
                saveHistory();
              } catch (err) { console.error('Paste failed:', err); }
            }
            break;
          case 'a':
            e.preventDefault();
            canvas.discardActiveObject();
            const objs = canvas.getObjects().filter(o => !(o as any).isPageBackground);
            if (objs.length) {
              const sel = new ActiveSelection(objs, { canvas });
              canvas.setActiveObject(sel);
              canvas.requestRenderAll();
            }
            break;
          case 'g':
            e.preventDefault();
            if (shift) {
              // Ungroup
              if (activeObj instanceof Group) {
                (activeObj as any).toActiveSelection();
                canvas.renderAll(); saveHistory();
              }
            } else {
              // Group
              const selected = canvas.getActiveObjects();
              if (selected.length > 1) {
                const group = new Group(selected);
                canvas.discardActiveObject();
                selected.forEach(o => canvas.remove(o));
                canvas.add(group);
                canvas.setActiveObject(group);
                canvas.renderAll(); saveHistory();
              }
            }
            break;
          case 'f':
            e.preventDefault();
            setShowSearchReplace(true);
            break;
        }
      }

      // Deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeTool === ('pen' as any)) return; // Handled in CanvasArea
        const selected = canvas.getActiveObjects();
        if (selected.length > 0) {
          selected.forEach(o => canvas.remove(o));
          canvas.discardActiveObject();
          canvas.renderAll();
          saveHistory();
        }
      }

      // Nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (activeObj) {
          e.preventDefault();
          const step = shift ? 10 : 1;
          switch (e.key) {
            case 'ArrowUp': activeObj.set('top', (activeObj.top || 0) - step); break;
            case 'ArrowDown': activeObj.set('top', (activeObj.top || 0) + step); break;
            case 'ArrowLeft': activeObj.set('left', (activeObj.left || 0) - step); break;
            case 'ArrowRight': activeObj.set('left', (activeObj.left || 0) + step); break;
          }
          activeObj.setCoords();
          canvas.renderAll();
        }
      }

      // Layering
      if (e.key === '[' && activeObj) { canvas.sendObjectBackwards(activeObj); canvas.renderAll(); saveHistory(); }
      if (e.key === ']' && activeObj) { canvas.bringObjectForward(activeObj); canvas.renderAll(); saveHistory(); }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false);
        canvas.requestRenderAll();
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        saveHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas, activeTool, copiedObjectJson]);
};
