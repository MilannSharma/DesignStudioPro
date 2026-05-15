import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Line, Path, Polygon, Point, Textbox, PencilBrush, FabricImage, Group, ActiveSelection, Shadow, util } from 'fabric';
import { useStore } from '../../store/useStore';
import { ContextMenu } from '../common/ContextMenu';
import { FloatingToolbar } from '../common/FloatingToolbar';
import { useIndicInput } from '../../hooks/useIndicInput';
import { SuggestionPopup } from './SuggestionPopup';

import { createRoundedRect, createCallout, createSpiral } from '../../utils/shapeUtils';

interface SmartGuide { type: 'h' | 'v'; pos: number; }

export const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, settings, activeTool, setZoom, setSelectedObjects, showRulers, showGrid } = useStore();
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const drawingObjectRef = useRef<any>(null);
  const drawStartPosRef = useRef<{ x: number, y: number } | null>(null);
  const smartGuidesRef = useRef<SmartGuide[]>([]);
  const { guideLines, addGuideLine, removeGuideLine } = useStore();
  const [draggingGuide, setDraggingGuide] = useState<{ type: 'h' | 'v', pos: number, existingId?: string } | null>(null);
  const [rulerHover, setRulerHover] = useState<{ type: 'h' | 'v', pos: number } | null>(null);
  // Track container-relative mouse position for accurate guide placement
  const containerMouseRef = useRef({ x: 0, y: 0 });
  const [containerMouse, setContainerMouse] = useState({ x: 0, y: 0 });
  
  const [canvasPrompt, setCanvasPrompt] = useState<{
    type: 'callout' | 'polygon' | 'star' | 'text' | 'qr';
    pointer: { x: number; y: number };
  } | null>(null);
  const [promptInputs, setPromptInputs] = useState<Record<string, string>>({});

  // Pen tool state
  const penNodesRef = useRef<{ x: number, y: number, cp1?: {x:number,y:number}, cp2?: {x:number,y:number} }[]>([]);
  const penPreviewRef = useRef<any>(null);
  const penCursorRef = useRef<Circle | null>(null);
  const penUIObjectsRef = useRef<any[]>([]); // Anchors, handles, lines
  const isDraggingPenNodeRef = useRef(false);
  const penDragStartRef = useRef<{x:number,y:number} | null>(null);
  const renderPendingRef = useRef(false);
  const cropOverlayRef = useRef<Rect | null>(null);
  const cropImageRef = useRef<FabricImage | null>(null);
  const inertiaRef = useRef<{ velX: number, velY: number, lastTime: number, animId: number | null }>({ velX: 0, velY: 0, lastTime: 0, animId: null });

  const safeRender = (ci: FabricCanvas) => {
    if (renderPendingRef.current) return;
    renderPendingRef.current = true;
    requestAnimationFrame(() => {
      ci.requestRenderAll();
      renderPendingRef.current = false;
    });
  };

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.requestRenderAll();
    }
  }, [showGrid]);

  useEffect(() => {
    if (!fabricRef.current) return;
    window.addEventListener('keydown', (e) => {
      const tool = useStore.getState().activeTool;
      if (tool === ('pen' as any)) {
        if (e.key === 'Escape') { e.preventDefault(); cancelPenDrawing(); }
        if (e.key === 'Enter') { e.preventDefault(); finalizePenPath(); }
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (penNodesRef.current.length > 0) {
            penNodesRef.current.pop();
            if (penNodesRef.current.length === 0) cancelPenDrawing();
            else { updatePenUI(); updatePenPreview(mousePosRef.current); }
          }
        }
      } else if (tool === ('crop' as any)) {
        if (e.key === 'Escape') { e.preventDefault(); cancelCrop(); }
        if (e.key === 'Enter') { e.preventDefault(); applyCrop(); }
      }
    });

    const ci = fabricRef.current;
    if (activeTool === 'select' || activeTool === 'marquee') {
      ci.selection = activeTool === 'select';
      ci.defaultCursor = activeTool === 'marquee' ? 'crosshair' : 'default';
      ci.hoverCursor = 'move';
    } else if (activeTool === 'pencil' || activeTool === 'eraser') {
      ci.isDrawingMode = true;
      ci.selection = false;
      const brush = new PencilBrush(ci);
      brush.width = activeTool === 'eraser' ? 20 : 2;
      brush.color = activeTool === 'eraser' ? '#ffffff' : '#000000'; // Fallback for eraser if destination-out not supported easily
      // In Fabric v6, Eraser is often a separate class, but we can simulate with background color or composite
      if (activeTool === 'eraser') {
        // Simple eraser: draw with white (standard canvas background)
        brush.color = '#ffffff'; 
        brush.width = 30;
      }
      ci.freeDrawingBrush = brush;
      ci.selection = false;
      ci.defaultCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0\' fill=\'none\' stroke=\'black\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m12 2 10 10-10 10-10-10z\'/%3E%3Cpath d=\'m12 2-4 4\'/%3E%3C/svg%3E"), crosshair';
    } else if (activeTool === 'eyedropper' || activeTool === 'bucket' || activeTool === 'crop') {
      ci.defaultCursor = activeTool === 'bucket' ? 'cell' : (activeTool === 'crop' ? 'nwse-resize' : 'crosshair');
      ci.selection = false;
      if (activeTool === 'crop') startCrop();
    } else {
      ci.isDrawingMode = false;
      ci.selection = false;
    }

    // High quality rendering
    ci.imageSmoothingEnabled = true;
    ci.enableRetinaScaling = true;
  }, [activeTool]);

  const BASE_RENDER_SIZE = 800;
  const SNAP_GRID = 10;
  const RULER_SIZE = 24;

  const getDisplayScale = (width: number, height: number) => {
    const largest = Math.max(width, height);
    return BASE_RENDER_SIZE / largest;
  };

  const getRenderDimensions = () => {
    const s = useStore.getState().settings;
    const scale = getDisplayScale(s.width, s.height);
    return {
      scale,
      width: s.width * scale,
      height: s.height * scale
    };
  };

  const getScaledSnapGrid = () => {
    const s = useStore.getState().settings;
    return SNAP_GRID * getDisplayScale(s.width, s.height);
  };

  const { suggestions, selectedIndex, popupPos, handleSelect } = useIndicInput();

  const updatePageBackground = (canvas: FabricCanvas) => {
    if (!canvas) return;
    const s = useStore.getState().settings;
    canvas.getObjects().forEach(obj => {
      if ((obj as any).isPageBackground) {
        canvas.remove(obj);
      }
    });

    const dims = getRenderDimensions();

    const page = new Rect({
      left: 0,
      top: 0,
      width: dims.width,
      height: dims.height,
      fill: '#ffffff',
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
      //@ts-ignore
      isPageBackground: true,
      name: 'page-background',
      excludeFromExport: true,
      shadow: {
        color: 'rgba(0,0,0,0.08)',
        blur: 12,
        offsetX: 0,
        offsetY: 0
      } as any
    });

    canvas.add(page);
    canvas.sendObjectToBack(page);
    canvas.requestRenderAll();
  };

  const centerPage = (ci = fabricRef.current) => {
    if (!ci || !containerRef.current) return;
    const dims = getRenderDimensions();
    const zoom = ci.getZoom();
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const vpt = [...ci.viewportTransform!];
    vpt[4] = (cw - dims.width * zoom) / 2;
    vpt[5] = (ch - dims.height * zoom) / 2;
    ci.setViewportTransform(vpt);
    ci.requestRenderAll();
  };

  const fitToScreen = (ci = fabricRef.current) => {
    if (!ci || !containerRef.current) return;
    const dims = getRenderDimensions();
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    if (!containerWidth || !containerHeight) return;

    const padding = 100;
    let zoom = Math.min(
      (containerWidth - padding) / dims.width,
      (containerHeight - padding) / dims.height
    );
    zoom = Math.min(Math.max(zoom, 0.05), 20);

    ci.setZoom(zoom);
    const vpt = [...ci.viewportTransform!];
    vpt[4] = (containerWidth - dims.width * zoom) / 2;
    vpt[5] = (containerHeight - dims.height * zoom) / 2;
    ci.setViewportTransform(vpt);

    ci.requestRenderAll();
    setZoom(zoom);
  };

  const computeSmartGuides = (target: any, canvas: FabricCanvas) => {
    const guides: SmartGuide[] = [];
    if (!target) return guides;
    const dims = getRenderDimensions();
    const tb = target.getBoundingRect();
    const tcx = tb.left + tb.width / 2, tcy = tb.top + tb.height / 2;
    const s = useStore.getState().settings;
    const scale = getDisplayScale(s.width, s.height);
    const THRESH = 6 * scale;

    // Canvas edges and center
    if (Math.abs(tb.left) < THRESH) guides.push({ type: 'v', pos: 0 });
    if (Math.abs(tb.left + tb.width - dims.width) < THRESH) guides.push({ type: 'v', pos: dims.width });
    if (Math.abs(tcx - dims.width / 2) < THRESH) guides.push({ type: 'v', pos: dims.width / 2 });
    
    if (Math.abs(tb.top) < THRESH) guides.push({ type: 'h', pos: 0 });
    if (Math.abs(tb.top + tb.height - dims.height) < THRESH) guides.push({ type: 'h', pos: dims.height });
    if (Math.abs(tcy - dims.height / 2) < THRESH) guides.push({ type: 'h', pos: dims.height / 2 });

    canvas.getObjects().forEach(obj => {
      if (obj === target || (obj as any).isPageBackground) return;
      const ob = obj.getBoundingRect();
      const ocx = ob.left + ob.width / 2, ocy = ob.top + ob.height / 2;
      
      // Left, Right, Center X
      if (Math.abs(tb.left - ob.left) < THRESH) guides.push({ type: 'v', pos: ob.left });
      if (Math.abs(tb.left + tb.width - ob.left - ob.width) < THRESH) guides.push({ type: 'v', pos: ob.left + ob.width });
      if (Math.abs(tcx - ocx) < THRESH) guides.push({ type: 'v', pos: ocx });
      
      // Top, Bottom, Center Y
      if (Math.abs(tb.top - ob.top) < THRESH) guides.push({ type: 'h', pos: ob.top });
      if (Math.abs(tb.top + tb.height - ob.top - ob.height) < THRESH) guides.push({ type: 'h', pos: ob.top + ob.height });
      if (Math.abs(tcy - ocy) < THRESH) guides.push({ type: 'h', pos: ocy });
    });

    // Deduplicate and limit
    const unique: Record<string, SmartGuide> = {};
    guides.forEach(g => { unique[`${g.type}-${Math.round(g.pos)}`] = g; });
    return Object.values(unique).slice(0, 4); // Don't show too many lines
  };

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    if (activeTool === 'pencil' || activeTool === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = activeTool === 'eraser' ? 20 : 2;
      canvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : '#000000';
      if (activeTool === 'eraser') {
        // @ts-ignore
        canvas.freeDrawingBrush.globalCompositeOperation = 'destination-out';
      }
      canvas.defaultCursor = 'crosshair';
      canvas.selection = false;
      return;
    }
    canvas.isDrawingMode = false;
    switch (activeTool) {
      case 'hand': canvas.defaultCursor = 'grab'; canvas.selection = false; break;
      case 'select': canvas.defaultCursor = 'default'; canvas.selection = true; break;
      case 'shape' as any: canvas.defaultCursor = 'default'; canvas.selection = true; break;
      case 'pen' as any: canvas.defaultCursor = 'crosshair'; canvas.selection = false; break;
      case 'text': case 'v-text': case 'field': canvas.defaultCursor = 'text'; canvas.selection = false; break;
      default: canvas.defaultCursor = 'crosshair'; canvas.selection = false;
    }
  }, [activeTool]);

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const initW = containerRef.current?.offsetWidth || 800;
    const initH = containerRef.current?.offsetHeight || 600;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: initW,
      height: initH,
      backgroundColor: '#e5e7eb',
      preserveObjectStacking: true, 
      stopContextMenu: true, 
      fireRightClick: true, 
      selection: true,
      selectionColor: 'rgba(59, 130, 246, 0.1)',
      selectionBorderColor: '#3b82f6',
      selectionLineWidth: 1.5,
      selectionDashArray: [5, 5]
    });
    fabricRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    useStore.getState().setUpdatePageBackgroundFn(() => updatePageBackground(fabricCanvas));

    useStore.setState({
      fitProjectToScreen: () => fitToScreen(fabricCanvas),
      centerProject: () => centerPage(fabricCanvas),
      zoomTo100: () => {
        fabricCanvas.setZoom(1);
        setZoom(1);
        centerPage(fabricCanvas);
      }
    });

    fabricCanvas.on('mouse:move', (opt) => {
      const p = fabricCanvas.getScenePoint(opt.e);
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      mousePosRef.current = { x, y };
      
      // Direct DOM update to avoid re-rendering the whole CanvasArea component
      const xEl = document.getElementById('mouse-pos-x');
      const yEl = document.getElementById('mouse-pos-y');
      if (xEl) xEl.innerText = `${x}px`;
      if (yEl) yEl.innerText = `${y}px`;
    });

    const enforceBoundaries = (target: any) => {
      if (!target || (target as any).isPageBackground) return;
      const dims = getRenderDimensions();
      const br = target.getBoundingRect();
      let changed = false;

      if (br.left < 0) {
        target.set('left', target.left - br.left);
        changed = true;
      }
      if (br.top < 0) {
        target.set('top', target.top - br.top);
        changed = true;
      }
      if (br.left + br.width > dims.width) {
        target.set('left', target.left - (br.left + br.width - dims.width));
        changed = true;
      }
      if (br.top + br.height > dims.height) {
        target.set('top', target.top - (br.top + br.height - dims.height));
        changed = true;
      }
      if (changed) {
        target.setCoords();
      }
      return changed;
    };

    fabricCanvas.on('object:moving', (options) => {
      const target = options.target;
      if (target && !(target as any).isPageBackground) {
        const objRect = target.getBoundingRect();

        const guides = computeSmartGuides(target, fabricCanvas);
        smartGuidesRef.current = guides;

        if (!options.e?.altKey) {
          const s = useStore.getState();
          const grid = getScaledSnapGrid();
          const scale = getDisplayScale(s.settings.width, s.settings.height);
          const SNAP_THRESH = 4 * scale; // More subtle, "floating" snap

          target.set('objectCaching', false); 

          let bestX = { dist: Infinity, pos: 0 };
          let bestY = { dist: Infinity, pos: 0 };

          guides.forEach(g => {
            if (g.type === 'v') {
              // Check left, center, right
              const d1 = Math.abs(target.left - g.pos);
              const d2 = Math.abs((target.left + objRect.width / 2) - g.pos);
              const d3 = Math.abs((target.left + objRect.width) - g.pos);
              const minD = Math.min(d1, d2, d3);
              if (minD < SNAP_THRESH && minD < bestX.dist) {
                bestX = { dist: minD, pos: d1 === minD ? g.pos : (d2 === minD ? g.pos - objRect.width/2 : g.pos - objRect.width) };
              }
            } else {
              // Check top, center, bottom
              const d1 = Math.abs(target.top - g.pos);
              const d2 = Math.abs((target.top + objRect.height / 2) - g.pos);
              const d3 = Math.abs((target.top + objRect.height) - g.pos);
              const minD = Math.min(d1, d2, d3);
              if (minD < SNAP_THRESH && minD < bestY.dist) {
                bestY = { dist: minD, pos: d1 === minD ? g.pos : (d2 === minD ? g.pos - objRect.height/2 : g.pos - objRect.height) };
              }
            }
          });

          let snappedX = false, snappedY = false;
          if (bestX.dist < Infinity) { target.set('left', bestX.pos); snappedX = true; }
          if (bestY.dist < Infinity) { target.set('top', bestY.pos); snappedY = true; }

          // Only snap to grid if grid is ON and we didn't snap to a smart guide
          if (s.showGrid) {
            if (!snappedX) {
              const gridSnapX = Math.round(target.left / grid) * grid;
              if (Math.abs(target.left - gridSnapX) < SNAP_THRESH) target.set('left', gridSnapX);
            }
            if (!snappedY) {
              const gridSnapY = Math.round(target.top / grid) * grid;
              if (Math.abs(target.top - gridSnapY) < SNAP_THRESH) target.set('top', gridSnapY);
            }
          }
        }
        target.setCoords();
      }
    });

    fabricCanvas.on('object:scaling', (options) => {
      const target = options.target;
      if (target && !(target as any).isPageBackground) {
        const guides = computeSmartGuides(target, fabricCanvas);
        smartGuidesRef.current = guides;
        fabricCanvas.requestRenderAll();
      }
    });

    fabricCanvas.on('object:modified', (e) => { 
      smartGuidesRef.current = []; 
      if (e.target) {
        enforceBoundaries(e.target);
        e.target.set('objectCaching', true);
      }
      fabricCanvas.requestRenderAll();
      const action = e.transform?.action || 'Modify';
      useStore.getState().saveHistory(`${action.charAt(0).toUpperCase() + action.slice(1)} ${e.target?.type || 'Object'}`);
    });

    fabricCanvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj && !(obj as any).isPageBackground && !(obj as any).__uid) {
        (obj as any).__uid = Math.random().toString(36).substr(2, 6).toUpperCase();
      }
    });

    fabricCanvas.on('path:created', (e) => {
      const { setActiveTool, activeTool } = useStore.getState();
      fabricCanvas.isDrawingMode = false;
      setActiveTool('select');
      const label = activeTool === 'eraser' ? 'Eraser Stroke' : 'Brush Stroke';
      useStore.getState().saveHistory(label);
    });

    fabricCanvas.on('selection:created', (e) => {
      const objs = e.selected || [];
      const active = objs[0];
      if (useStore.getState().activeTool === ('shape' as any) && active instanceof Path) {
        showPathAnchors(active);
      }
      objs.forEach(obj => {
        obj.set({
          borderColor: '#de1fe9',
          cornerColor: '#ffffff',
          cornerStrokeColor: '#de1fe9',
          cornerSize: 10,
          cornerStyle: 'circle',
          transparentCorners: false,
          padding: 5
        });
      });
      setSelectedObjects(objs);
    });
    fabricCanvas.on('selection:updated', (e) => {
      const objs = e.selected || [];
      const active = objs[0];
      if (useStore.getState().activeTool === ('shape' as any) && active instanceof Path) {
        showPathAnchors(active);
      } else {
        removePathAnchors();
      }
      objs.forEach(obj => {
        obj.set({
          borderColor: '#de1fe9',
          cornerColor: '#ffffff',
          cornerStrokeColor: '#de1fe9',
          cornerSize: 10,
          cornerStyle: 'circle',
          transparentCorners: false,
          padding: 5
        });
      });
      setSelectedObjects(objs);
    });
    fabricCanvas.on('selection:cleared', () => { 
      removePathAnchors();
      setSelectedObjects([]); 
      smartGuidesRef.current = []; 
    });

    const showPathAnchors = (pathObj: Path) => {
      removePathAnchors();
      const path = pathObj.path;
      const anchors: Circle[] = [];
      
      path.forEach((segment: any, index: number) => {
        const type = segment[0];
        let x = 0, y = 0;
        if (type === 'M' || type === 'L') {
          x = segment[1]; y = segment[2];
        } else if (type === 'Q') {
          x = segment[3]; y = segment[4];
        } else if (type === 'C') {
          x = segment[5]; y = segment[6];
        } else {
          return;
        }

        const anchor = new Circle({
          left: pathObj.left + (x - pathObj.pathOffset.x) * pathObj.scaleX,
          top: pathObj.top + (y - pathObj.pathOffset.y) * pathObj.scaleY,
          radius: 4,
          fill: '#ffffff',
          stroke: '#3b82f6',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
          hasControls: false,
          hasBorders: false,
          selectable: true,
          //@ts-ignore
          isAnchor: true,
          excludeFromExport: true,
          name: 'pen-anchor',
          segmentIndex: index,
          targetPath: pathObj
        });

        anchor.on('moving', () => {
          const newX = (anchor.left - pathObj.left) / pathObj.scaleX + pathObj.pathOffset.x;
          const newY = (anchor.top - pathObj.top) / pathObj.scaleY + pathObj.pathOffset.y;
          
          if (type === 'M' || type === 'L') {
            segment[1] = newX; segment[2] = newY;
          } else if (type === 'Q') {
            segment[3] = newX; segment[4] = newY;
          } else if (type === 'C') {
            segment[5] = newX; segment[6] = newY;
          }
          
          pathObj.set('path', [...pathObj.path]);
          pathObj.setCoords();
          fabricCanvas.requestRenderAll();
        });

        anchor.on('modified', () => useStore.getState().saveHistory());

        fabricCanvas.add(anchor);
        anchors.push(anchor);
      });
      pathAnchorsRef.current = anchors;
    };

    const removePathAnchors = () => {
      if (pathAnchorsRef.current.length > 0) {
        fabricCanvas.remove(...pathAnchorsRef.current);
        pathAnchorsRef.current = [];
      }
    };

    fabricCanvas.selectionKey = 'ctrlKey' as any;
    fabricCanvas.selectionColor = 'rgba(222, 31, 233, 0.1)';
    fabricCanvas.selectionBorderColor = '#de1fe9';
    fabricCanvas.selectionLineWidth = 1;

    fabricCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      // Normalize zoom speed
      zoom *= delta > 0 ? 0.95 : 1.05;
      zoom = Math.min(Math.max(zoom, 0.01), 50);
      
      // Zoom to cursor
      const rect = fabricCanvas.getElement().getBoundingClientRect();
      const point = new Point(opt.e.clientX - rect.left, opt.e.clientY - rect.top);
      fabricCanvas.zoomToPoint(point, zoom);
      
      setZoom(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    fabricCanvas.on('mouse:down', async (opt: any) => {
      const pointer = fabricCanvas.getScenePoint(opt.e);
      const e = opt.e;
      const { activeTool } = useStore.getState();

      if (activeTool === 'pencil') return;

      if (e.altKey || opt.button === 2 || activeTool === 'hand') {
        if (opt.button === 2) {
          const active = fabricCanvas.getActiveObject();
          // Suppress context menu during text editing
          if (active && (active as any).isEditing) return;
          setContextMenu({ x: e.clientX, y: e.clientY });
        }
        (fabricCanvas as any).isDragging = true;
        fabricCanvas.selection = false;
        (fabricCanvas as any).lastPosX = e.clientX || 0;
        (fabricCanvas as any).lastPosY = e.clientY || 0;
        if (activeTool === 'hand') fabricCanvas.defaultCursor = 'grabbing';
        (fabricCanvas as any).isDragging = true;
        (fabricCanvas as any).lastPosX = (opt.e as MouseEvent).clientX;
        (fabricCanvas as any).lastPosY = (opt.e as MouseEvent).clientY;
        if (inertiaRef.current.animId) cancelAnimationFrame(inertiaRef.current.animId);
        inertiaRef.current = { ...inertiaRef.current, velX: 0, velY: 0, lastTime: Date.now(), animId: null };
        return;
      }

      if (activeTool === ('eyedropper' as any)) {
        const canvasEl = fabricCanvas.getElement();
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          const rect = canvasEl.getBoundingClientRect();
          const x = (opt.e as MouseEvent).clientX - rect.left;
          const y = (opt.e as MouseEvent).clientY - rect.top;
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
          useStore.getState().addRecentColor(hex);
          const active = fabricCanvas.getActiveObject();
          if (active) {
            active.set('fill', hex);
            fabricCanvas.requestRenderAll();
            useStore.getState().saveHistory();
          }
          useStore.getState().setActiveTool('select');
        }
        return;
      }

      // Existing shape handling
        if (['rect', 'roundedRect', 'ellipse', 'line', 'arrow', 'callout', 'spiral'].includes(activeTool)) {
        fabricCanvas.selection = false;
        drawStartPosRef.current = { x: pointer.x, y: pointer.y };
        let newObj: any;
        if (activeTool === 'rect') {
          newObj = new Rect({ left: pointer.x, top: pointer.y, width: 0, height: 0, fill: '#3b82f633', stroke: '#3b82f6', strokeWidth: 2, originX: 'left', originY: 'top' });
        } else if (activeTool === ('roundedRect' as any)) {
          newObj = createRoundedRect(pointer.x, pointer.y, 0, 0);
        } else if (activeTool === 'marquee' || activeTool === 'lasso') {
          newObj = new Rect({ 
            left: pointer.x, top: pointer.y, width: 0, height: 0, 
            fill: activeTool === 'marquee' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
            stroke: '#3b82f6', strokeWidth: 1, 
            strokeDashArray: activeTool === 'marquee' ? [5, 5] : [2, 2], 
            selectable: false, evented: false,
            //@ts-ignore
            isMarquee: activeTool === 'marquee',
            isLasso: activeTool === 'lasso'
          });
          if (activeTool === 'lasso') {
            // For lasso, we'll actually use a Path/Pencil logic
            fabricCanvas.isDrawingMode = true;
            const brush = new PencilBrush(fabricCanvas);
            brush.color = '#3b82f6';
            brush.width = 1;
            brush.strokeDashArray = [2, 2];
            fabricCanvas.freeDrawingBrush = brush;
            return;
          }
        } else if (activeTool === 'wand') {
          // Magic Wand: Select object under cursor or similar colored objects
          const target = fabricCanvas.findTarget(opt.e, false);
          if (target) {
            fabricCanvas.setActiveObject(target);
          }
          setActiveTool('select');
          return;
        } else if (activeTool === 'ellipse') {
          newObj = new Circle({ left: pointer.x, top: pointer.y, radius: 0, fill: '#ef444433', stroke: '#ef4444', strokeWidth: 2 });
        } else if (activeTool === 'line' || activeTool === 'arrow') {
          newObj = new Line([pointer.x, pointer.y, pointer.x, pointer.y], { stroke: activeTool === 'arrow' ? '#1e293b' : '#10b981', strokeWidth: 2 });
        } else if (activeTool === 'callout') {
          setCanvasPrompt({ type: 'callout', pointer });
          return;
        } else if (activeTool === 'spiral') {
          newObj = createSpiral(pointer.x, pointer.y, 3, 10);
        }

        if (newObj) {
          (newObj as any).isDrawingPreview = true;
          drawingObjectRef.current = newObj;
          fabricCanvas.add(newObj);
          fabricCanvas.requestRenderAll();
        }
      }

      if (activeTool === 'polygon') {
        setCanvasPrompt({ type: 'polygon', pointer });
        return;
      }

      if (activeTool === 'star') {
        setCanvasPrompt({ type: 'star', pointer });
        return;
      }

      if (activeTool === ('pen' as any)) {
        const x = pointer.x, y = pointer.y;
        
        // Check if clicking on the first anchor to close the path
        if (penNodesRef.current.length > 2) {
          const first = penNodesRef.current[0];
          const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
          if (dist < 10) {
            finalizePenPath(true);
            return;
          }
        }

        // Add new node
        const newNode = { x, y };
        penNodesRef.current.push(newNode);
        isDraggingPenNodeRef.current = true;
        penDragStartRef.current = { x, y };
        
        if (!penPreviewRef.current) {
          const { Path, Shadow } = await import('fabric');
          const preview = new Path(`M ${x} ${y}`, {
            fill: 'transparent', 
            stroke: '#3b82f6', 
            strokeWidth: 2, 
            selectable: false, 
            evented: false, 
            strokeLineCap: 'round', 
            strokeLineJoin: 'round',
            opacity: 0.8, 
            strokeDashArray: [6, 4],
            excludeFromExport: true,
            objectCaching: false,
            absolutePositioned: true,
            shadow: new Shadow({
              color: '#3b82f6',
              blur: 8,
              opacity: 0.4
            })
          } as any);
          penPreviewRef.current = preview;
          fabricCanvas.add(preview);
        }

        if (!penCursorRef.current) {
          const ghost = new Circle({
            radius: 3, fill: '#3b82f6', selectable: false, evented: false, excludeFromExport: true, originX: 'center', originY: 'center'
          });
          penCursorRef.current = ghost;
          fabricCanvas.add(ghost);
        }
        
        updatePenUI({ x, y });
        updatePenPreview({ x, y });
      }
    });

    const updatePenUI = (cursorPos?: {x:number,y:number}) => {
      const fabricCanvas = fabricRef.current;
      if (!fabricCanvas) return;
      
      const CLOSE_DISTANCE = 12;
      let canClose = false;
      if (cursorPos && penNodesRef.current.length > 2) {
        const first = penNodesRef.current[0];
        const dist = Math.hypot(cursorPos.x - first.x, cursorPos.y - first.y);
        canClose = dist < CLOSE_DISTANCE;
      }

      // Clear old UI
      penUIObjectsRef.current.forEach(obj => fabricCanvas.remove(obj));
      penUIObjectsRef.current = [];

      penNodesRef.current.forEach((node, i) => {
        const isFirst = i === 0;
        const isLast = i === penNodesRef.current.length - 1;
        
        // Anchor point
        const anchor = new Circle({
          left: node.x, top: node.y, 
          radius: (isFirst && canClose) ? 7 : (isLast ? 6 : 4), 
          fill: (isFirst && canClose) ? '#ef4444' : (isLast ? '#3b82f6' : '#ffffff'), 
          stroke: '#3b82f6', 
          strokeWidth: 2,
          originX: 'center', originY: 'center', 
          selectable: false, evented: false, 
          excludeFromExport: true
        });
        fabricCanvas.add(anchor);
        penUIObjectsRef.current.push(anchor);

        // Professional Handle Visualization
        if (node.cp1) {
          const l1 = new Line([node.x, node.y, node.cp1.x, node.cp1.y], { stroke: '#3b82f6', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true, opacity: 0.6 });
          const p1 = new Circle({ left: node.cp1.x, top: node.cp1.y, radius: 3.5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 1, originX: 'center', originY: 'center', selectable: false, evented: false, excludeFromExport: true });
          fabricCanvas.add(l1, p1);
          penUIObjectsRef.current.push(l1, p1);
        }
        if (node.cp2) {
          const l2 = new Line([node.x, node.y, node.cp2.x, node.cp2.y], { stroke: '#3b82f6', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true, opacity: 0.6 });
          const p2 = new Circle({ left: node.cp2.x, top: node.cp2.y, radius: 3.5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 1, originX: 'center', originY: 'center', selectable: false, evented: false, excludeFromExport: true });
          fabricCanvas.add(l2, p2);
          penUIObjectsRef.current.push(l2, p2);
        }
      });

      // Ghost cursor and potential anchor
      if (cursorPos) {
        if (penCursorRef.current) {
          penCursorRef.current.set({ left: cursorPos.x, top: cursorPos.y });
          penCursorRef.current.bringToFront();
        }
        
        const potential = new Circle({
          left: cursorPos.x, top: cursorPos.y, radius: 4, fill: 'transparent', stroke: canClose ? '#ef4444' : '#3b82f6', strokeWidth: 1.5,
          originX: 'center', originY: 'center', selectable: false, evented: false, excludeFromExport: true, opacity: 0.6
        });
        fabricCanvas.add(potential);
        penUIObjectsRef.current.push(potential);
      }

      safeRender(fabricCanvas);
    };

    const updatePenPreview = (currentPointer: { x: number; y: number }) => {
      if (!penPreviewRef.current || penNodesRef.current.length === 0) return;
      
      let pathData = '';
      penNodesRef.current.forEach((node, i) => {
        if (i === 0) {
          pathData += `M ${node.x} ${node.y}`;
        } else {
          const prev = penNodesRef.current[i - 1];
          if (prev.cp2 && node.cp1) {
            pathData += ` C ${prev.cp2.x} ${prev.cp2.y}, ${node.cp1.x} ${node.cp1.y}, ${node.x} ${node.y}`;
          } else if (prev.cp2) {
            pathData += ` Q ${prev.cp2.x} ${prev.cp2.y}, ${node.x} ${node.y}`;
          } else if (node.cp1) {
            pathData += ` Q ${node.cp1.x} ${node.cp1.y}, ${node.x} ${node.y}`;
          } else {
            pathData += ` L ${node.x} ${node.y}`;
          }
        }
      });

      // Smart Ghost segment to cursor
      const last = penNodesRef.current[penNodesRef.current.length - 1];
      if (last.cp2) {
        pathData += ` Q ${last.cp2.x} ${last.cp2.y}, ${currentPointer.x} ${currentPointer.y}`;
      } else {
        pathData += ` L ${currentPointer.x} ${currentPointer.y}`;
      }
      
      // Professional Path Updating
      penPreviewRef.current.path = util.parsePath(pathData);
      penPreviewRef.current.setCoords();
      
      penPreviewRef.current.bringToFront();
      penUIObjectsRef.current.forEach(obj => obj.bringToFront());
      if (penCursorRef.current) penCursorRef.current.bringToFront();
      
      safeRender(fabricCanvas);
    };

    const finalizePenPath = async (closed = false) => {
      if (penNodesRef.current.length < 2) {
        cancelPenDrawing();
        return;
      }
      
      let pathData = '';
      penNodesRef.current.forEach((node, i) => {
        if (i === 0) {
          pathData += `M ${node.x} ${node.y}`;
        } else {
          const prev = penNodesRef.current[i - 1];
          if (prev.cp2 && node.cp1) {
            pathData += ` C ${prev.cp2.x} ${prev.cp2.y}, ${node.cp1.x} ${node.cp1.y}, ${node.x} ${node.y}`;
          } else if (prev.cp2) {
            pathData += ` Q ${prev.cp2.x} ${prev.cp2.y}, ${node.x} ${node.y}`;
          } else if (node.cp1) {
            pathData += ` Q ${node.cp1.x} ${node.cp1.y}, ${node.x} ${node.y}`;
          } else {
            pathData += ` L ${node.x} ${node.y}`;
          }
        }
      });

      if (closed) {
        const first = penNodesRef.current[0];
        const last = penNodesRef.current[penNodesRef.current.length - 1];
        if (last.cp2 && first.cp1) {
          pathData += ` C ${last.cp2.x} ${last.cp2.y}, ${first.cp1.x} ${first.cp1.y}, ${first.x} ${first.y}`;
        } else if (last.cp2) {
          pathData += ` Q ${last.cp2.x} ${last.cp2.y}, ${first.x} ${first.y}`;
        } else if (first.cp1) {
          pathData += ` Q ${first.cp1.x} ${first.cp1.y}, ${first.x} ${first.y}`;
        } else {
          pathData += ` L ${first.x} ${first.y}`;
        }
        pathData += ' Z';
      }
      
      const { Path } = await import('fabric');
      const { recentColors } = useStore.getState();
      const activeColor = recentColors[0] || '#000000';
      
      const finalPath = new Path(pathData, {
        fill: closed ? activeColor + '33' : 'transparent',
        stroke: activeColor, 
        strokeWidth: 3,
        strokeLineCap: 'round', strokeLineJoin: 'round'
      } as any);
      
      cancelPenDrawing();
      fabricCanvas.add(finalPath);
      fabricCanvas.setActiveObject(finalPath);
      
      useStore.getState().setActiveTool('select');
      useStore.getState().saveHistory('Create Pen Path');
    };

    const cancelPenDrawing = () => {
      if (penPreviewRef.current) fabricCanvas.remove(penPreviewRef.current);
      if (penCursorRef.current) fabricCanvas.remove(penCursorRef.current);
      penUIObjectsRef.current.forEach(obj => fabricCanvas.remove(obj));
      penNodesRef.current = [];
      penPreviewRef.current = null;
      penCursorRef.current = null;
      penUIObjectsRef.current = [];
    };

    const startCrop = () => {
      const active = fabricCanvas.getActiveObject();
      if (!(active instanceof FabricImage)) {
        useStore.getState().setActiveTool('select');
        return;
      }
      cropImageRef.current = active;
      active.set({ selectable: false, evented: false });
      
      const bounds = active.getBoundingRect();
      const overlay = new Rect({
        left: active.left, top: active.top,
        width: active.width * active.scaleX, height: active.height * active.scaleY,
        angle: active.angle,
        fill: 'rgba(0,0,0,0.3)',
        stroke: '#fff', strokeWidth: 2, strokeDashArray: [5, 5],
        cornerColor: '#fff', cornerStrokeColor: '#3b82f6', cornerSize: 12,
        transparentCorners: false,
        originX: active.originX, originY: active.originY,
        name: 'crop-overlay'
      } as any);
      
      fabricCanvas.add(overlay);
      fabricCanvas.setActiveObject(overlay);
      cropOverlayRef.current = overlay;
      fabricCanvas.requestRenderAll();
    };

    const applyCrop = () => {
      const img = cropImageRef.current;
      const overlay = cropOverlayRef.current;
      if (!img || !overlay) { cancelCrop(); return; }

      // Calculate relative crop
      const sX = img.scaleX, sY = img.scaleY;
      const relLeft = (overlay.left - img.left) / sX;
      const relTop = (overlay.top - img.top) / sY;
      const relWidth = (overlay.width * overlay.scaleX) / sX;
      const relHeight = (overlay.height * overlay.scaleY) / sY;

      img.set({
        cropX: (img.cropX || 0) + relLeft,
        cropY: (img.cropY || 0) + relTop,
        width: relWidth,
        height: relHeight,
        left: overlay.left,
        top: overlay.top,
        selectable: true, evented: true
      });
      
      cancelCrop();
      useStore.getState().saveHistory('Crop Image');
    };

    const cancelCrop = () => {
      if (cropOverlayRef.current) fabricCanvas.remove(cropOverlayRef.current);
      if (cropImageRef.current) cropImageRef.current.set({ selectable: true, evented: true });
      cropOverlayRef.current = null;
      cropImageRef.current = null;
      useStore.getState().setActiveTool('select');
      fabricCanvas.requestRenderAll();
    };

    fabricCanvas.on('mouse:dblclick', () => {
      if (useStore.getState().activeTool === ('pen' as any)) {
        // Double click adds a point on the second click, so we remove the last redundant one
        if (penNodesRef.current.length > 1) {
          penNodesRef.current.pop();
        }
        finalizePenPath();
      }
    });

    fabricCanvas.on('mouse:move', (opt: any) => {
      const e = opt.e;
      const pointer = fabricCanvas.getScenePoint(e);
      if ((fabricCanvas as any).isDragging) {
        const vpt = fabricCanvas.viewportTransform;
        const cx = e.clientX || 0, cy = e.clientY || 0;
        const now = Date.now();
        const dt = now - inertiaRef.current.lastTime;
        
        if (vpt && dt > 0) {
          const dx = cx - (fabricCanvas as any).lastPosX;
          const dy = cy - (fabricCanvas as any).lastPosY;
          vpt[4] += dx;
          vpt[5] += dy;
          
          inertiaRef.current.velX = dx / dt;
          inertiaRef.current.velY = dy / dt;
          inertiaRef.current.lastTime = now;
          
          fabricCanvas.requestRenderAll();
        }
        (fabricCanvas as any).lastPosX = cx;
        (fabricCanvas as any).lastPosY = cy;
        return;
      }
      if (drawingObjectRef.current && drawStartPosRef.current) {
        const obj = drawingObjectRef.current;
        const sp = drawStartPosRef.current;
        const w = Math.abs(pointer.x - sp.x), h = Math.abs(pointer.y - sp.y);
        if (obj instanceof Rect) obj.set({ width: w, height: h, left: Math.min(pointer.x, sp.x), top: Math.min(pointer.y, sp.y) });
        else if (obj instanceof Circle) { const r = Math.sqrt(w * w + h * h) / 2; obj.set({ radius: r, left: Math.min(pointer.x, sp.x), top: Math.min(pointer.y, sp.y) }); }
        else if (obj instanceof Line) obj.set({ x2: pointer.x, y2: pointer.y });
        fabricCanvas.requestRenderAll();
      }

      if (useStore.getState().activeTool === ('pen' as any)) {
        let currentX = pointer.x;
        let currentY = pointer.y;

        // SHIFT constraint: snap to 45/90 degrees relative to last node
        if (penNodesRef.current.length > 0 && (opt.e.shiftKey)) {
          const last = penNodesRef.current[penNodesRef.current.length - 1];
          const dx = currentX - last.x;
          const dy = currentY - last.y;
          const angle = Math.atan2(dy, dx);
          const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          const dist = Math.sqrt(dx * dx + dy * dy);
          currentX = last.x + Math.cos(snappedAngle) * dist;
          currentY = last.y + Math.sin(snappedAngle) * dist;
        }

        if (isDraggingPenNodeRef.current && penDragStartRef.current) {
          const last = penNodesRef.current[penNodesRef.current.length - 1];
          const dx = currentX - penDragStartRef.current.x;
          const dy = currentY - penDragStartRef.current.y;
          
          // Set cp2 symmetrically to the drag
          last.cp2 = { x: last.x + dx, y: last.y + dy };
          
          // ALT symmetry break: if ALT not pressed, cp1 is mirrored. If pressed, only cp2 moves.
          if (!opt.e.altKey) {
            last.cp1 = { x: last.x - dx, y: last.y - dy };
          }
          
          updatePenUI({ x: currentX, y: currentY });
        } else {
          updatePenUI({ x: currentX, y: currentY });
        }

        // Close path cursor check / detection is now handled inside updatePenUI
        updatePenPreview({ x: currentX, y: currentY });
        mousePosRef.current = { x: currentX, y: currentY };
      }
    });

    fabricCanvas.on('mouse:up', async (opt: any) => {
      const { activeTool, setActiveTool } = useStore.getState();
      const pointer = fabricCanvas.getScenePoint(opt.e);

      if (activeTool === ('pen' as any)) {
        isDraggingPenNodeRef.current = false;
        penDragStartRef.current = null;
        
        // Close path if clicking near first node
        if (penNodesRef.current.length > 2) {
          const first = penNodesRef.current[0];
          const dist = Math.hypot(pointer.x - first.x, pointer.y - first.y);
          if (dist < 12) {
            finalizePenPath(true);
            return;
          }
        }

        updatePenUI(pointer);
        return;
      }

      if ((fabricCanvas as any).isDragging) {
        if (fabricCanvas.viewportTransform) fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform);
        (fabricCanvas as any).isDragging = false;
        if (activeTool === 'hand') fabricCanvas.defaultCursor = 'grab';

        // Start inertia animation
        const startInertia = () => {
          const friction = 0.95;
          const { velX, velY } = inertiaRef.current;
          if (Math.abs(velX) < 0.01 && Math.abs(velY) < 0.01) return;

          const vpt = fabricCanvas.viewportTransform;
          if (vpt) {
            vpt[4] += velX * 16; // approx 16ms per frame
            vpt[5] += velY * 16;
            inertiaRef.current.velX *= friction;
            inertiaRef.current.velY *= friction;
            fabricCanvas.requestRenderAll();
            inertiaRef.current.animId = requestAnimationFrame(startInertia);
          }
        };
        inertiaRef.current.animId = requestAnimationFrame(startInertia);
        return;
      }

      if (activeTool === 'lasso') {
        fabricCanvas.isDrawingMode = false;
        // The path is automatically added by Fabric in drawing mode
        // We'll find the last path and use it for selection
        const objects = fabricCanvas.getObjects();
        const lastPath = objects[objects.length - 1];
        if (lastPath instanceof Path) {
          const pathBounds = lastPath.getBoundingRect();
          const targetObjects = fabricCanvas.getObjects().filter(o => {
            if (o === lastPath || (o as any).isPageBackground) return false;
            return lastPath.containsPoint(o.getCenterPoint()) || o.intersectsWithRect(pathBounds);
          });
          fabricCanvas.remove(lastPath);
          if (targetObjects.length > 0) {
            const sel = new ActiveSelection(targetObjects, { canvas: fabricCanvas });
            fabricCanvas.setActiveObject(sel);
          }
        }
        setActiveTool('select');
        fabricCanvas.requestRenderAll();
        return;
      }

      if (drawingObjectRef.current) {
        const obj = drawingObjectRef.current;
        
        if ((obj as any).isMarquee) {
          const rect = obj.getBoundingRect();
          // Convert screen rect to scene rect if needed, but getBoundingRect is already in scene units for added objects
          const objects = fabricCanvas.getObjects().filter(o => {
            if ((o as any).isMarquee || (o as any).isPageBackground || (o as any).excludeFromExport) return false;
            return o.intersectsWithRect(rect) || o.isContainedWithinRect(rect);
          });
          fabricCanvas.remove(obj);
          if (objects.length > 0) {
            const sel = new ActiveSelection(objects, { canvas: fabricCanvas });
            fabricCanvas.setActiveObject(sel);
          } else {
            fabricCanvas.discardActiveObject();
          }
          drawingObjectRef.current = null;
          drawStartPosRef.current = null;
          setActiveTool('select');
          fabricCanvas.requestRenderAll();
          useStore.getState().saveHistory('Marquee Selection');
          return;
        }

        (obj as any).isDrawingPreview = false;
        const s = useStore.getState().settings;
        const minSize = 2 * getDisplayScale(s.width, s.height);
        if (obj.width < minSize && obj.height < minSize && !(obj instanceof Line)) {
          fabricCanvas.remove(obj);
        } else {
          if (activeTool === 'arrow' && obj instanceof Line) {
            const x2 = obj.x2!, y2 = obj.y2!, x1 = obj.x1!, y1 = obj.y1!;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLen = 12;
            const pts = [
              { x: 0, y: 0 },
              { x: -headLen, y: -headLen / 2 },
              { x: -headLen, y: headLen / 2 },
            ];
            const head = new Polygon(pts, { 
              fill: obj.stroke, 
              left: x2, top: y2, 
              angle: (angle * 180) / Math.PI,
              originX: 'center', originY: 'center',
              selectable: false, evented: false 
            });
            const group = new Group([obj, head], { name: 'arrow' } as any);
            fabricCanvas.remove(obj);
            fabricCanvas.add(group);
            fabricCanvas.setActiveObject(group);
          } else {
            fabricCanvas.setActiveObject(obj);
          }
          useStore.getState().saveHistory(`Create ${activeTool.toUpperCase()}`);
        }
        drawingObjectRef.current = null;
        drawStartPosRef.current = null;
        setActiveTool('select');
        fabricCanvas.requestRenderAll();
        return;
      }

      if (activeTool === 'text') {
        setCanvasPrompt({ type: 'text', pointer });
        return;
      }
      if (activeTool === 'qr') {
        setCanvasPrompt({ type: 'qr', pointer });
        return;
      }
    });

    fabricCanvas.on('after:render', () => {
      const state = useStore.getState();
      const { settings: s, showRulers, guideLines } = state;
      const ctx = fabricCanvas.getContext();
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return;
      
      const currentZoom = fabricCanvas.getZoom();
      const retina = fabricCanvas.getRetinaScaling();
      const canvasW = fabricCanvas.getWidth();
      const canvasH = fabricCanvas.getHeight();

      const toScreenX = (x: number) => x * currentZoom + vpt[4];
      const toScreenY = (y: number) => y * currentZoom + vpt[5];

      // ── GRID ───────────────────────────────────────────────────────────────
      if (state.showGrid) {
        const grid = getScaledSnapGrid();
        const dims = getRenderDimensions();
        ctx.save();
        ctx.setLineDash([]); // Ensure solid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.06)'; // Faint and fixed
        ctx.lineWidth = 1; 
        
        const gridXStart = Math.max(0, toScreenX(0));
        const gridXEnd = Math.min(canvasW, toScreenX(dims.width));
        const gridYStart = Math.max(0, toScreenY(0));
        const gridYEnd = Math.min(canvasH, toScreenY(dims.height));

        // Vertical lines
        for (let x = 0; x <= dims.width + 0.1; x += grid) {
          const sx = Math.round(toScreenX(x));
          if (sx < 0 || sx > canvasW) continue;
          ctx.beginPath(); ctx.moveTo(sx, gridYStart); ctx.lineTo(sx, gridYEnd); ctx.stroke();
        }
        // Horizontal lines
        for (let y = 0; y <= dims.height + 0.1; y += grid) {
          const sy = Math.round(toScreenY(y));
          if (sy < 0 || sy > canvasH) continue;
          ctx.beginPath(); ctx.moveTo(gridXStart, sy); ctx.lineTo(gridXEnd, sy); ctx.stroke();
        }
        ctx.restore();
      }

      // ── PAGE OVERLAYS ──────────────────────────────────────────────────────
      ctx.save();
      // Draggable guide lines
      ctx.setLineDash([4, 4]);
      guideLines?.forEach(g => {
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        if (g.orientation === 'horizontal') {
          const sy = toScreenY(g.position);
          ctx.moveTo(0, sy); ctx.lineTo(canvasW, sy);
        } else {
          const sx = toScreenX(g.position);
          ctx.moveTo(sx, 0); ctx.lineTo(sx, canvasH);
        }
        ctx.stroke();
      });

      // Smart Guides (Canva-style Magenta/Cyan)
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      smartGuidesRef.current.forEach(g => {
        ctx.strokeStyle = g.type === 'h' ? '#de1fe9' : '#06b6d4'; // Magenta for H, Cyan for V
        ctx.beginPath();
        if (g.type === 'h') {
          const sy = toScreenY(g.pos);
          ctx.moveTo(0, sy); ctx.lineTo(canvasW, sy);
        } else {
          const sx = toScreenX(g.pos);
          ctx.moveTo(sx, 0); ctx.lineTo(sx, canvasH);
        }
        ctx.stroke();
      });
      
      // ── Spacing Guides (Alt-hover) ────────────────────────────────────────
      if (useStore.getState().isAltPressed) {
        const active = fabricCanvas.getActiveObject();
        const hover = (fabricCanvas as any)._hoveredTarget;
        if (active && hover && active !== hover) {
          const r1 = active.getBoundingRect();
          const r2 = hover.getBoundingRect();
          
          ctx.strokeStyle = '#3b82f6'; // Blue spacing guide
          ctx.fillStyle = '#3b82f6';
          ctx.lineWidth = 1 / currentZoom;
          ctx.font = `${10 / currentZoom}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.setLineDash([]);

          // Horizontal distance
          if (r1.left + r1.width < r2.left || r2.left + r2.width < r1.left) {
            const isLeft = r1.left + r1.width < r2.left;
            const x1 = isLeft ? r1.left + r1.width : r1.left;
            const x2 = isLeft ? r2.left : r2.left + r2.width;
            const y = Math.min(r1.top + r1.height / 2, r2.top + r2.height / 2);
            
            ctx.beginPath();
            ctx.moveTo(x1, y); ctx.lineTo(x2, y);
            ctx.stroke();
            const dist = Math.round(Math.abs(x2 - x1));
            ctx.fillText(`${dist}`, (x1 + x2) / 2, y - 5 / currentZoom);
          }
          
          // Vertical distance
          if (r1.top + r1.height < r2.top || r2.top + r2.height < r1.top) {
            const isTop = r1.top + r1.height < r2.top;
            const y1 = isTop ? r1.top + r1.height : r1.top;
            const y2 = isTop ? r2.top : r2.top + r2.height;
            const x = Math.min(r1.left + r1.width / 2, r2.left + r2.width / 2);
            
            ctx.beginPath();
            ctx.moveTo(x, y1); ctx.lineTo(x, y2);
            ctx.stroke();
            const dist = Math.round(Math.abs(y2 - y1));
            ctx.save();
            ctx.translate(x - 5 / currentZoom, (y1 + y2) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${dist}`, 0, 0);
            ctx.restore();
          }
        }
      }

      ctx.restore();

      // ── Rulers (always screen space) ──────────────────────────────────────
      if (showRulers) {
        const RS = RULER_SIZE;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 

        const niceSteps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
        const targetScreenSpacing = 60;
        const rawStep = targetScreenSpacing / currentZoom;
        const step = niceSteps.find(s => s >= rawStep) ?? niceSteps[niceSteps.length - 1];
        const subStep = step / 5;

        // ── Horizontal ruler ──
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(RS, 0, canvasW - RS, RS);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(RS, RS); ctx.lineTo(canvasW, RS); ctx.stroke();

        const sceneLeft = (RS - vpt[4]) / currentZoom;
        const sceneRight = (canvasW - vpt[4]) / currentZoom;
        const sceneTop = (RS - vpt[5]) / currentZoom;
        const sceneBottom = (canvasH - vpt[5]) / currentZoom;

        ctx.fillStyle = '#94a3b8';
        ctx.font = `9px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#cbd5e1';

        const startX = Math.floor(sceneLeft / step) * step;
        for (let x = startX; x <= sceneRight; x += step) {
          const sx = x * currentZoom + vpt[4];
          if (sx < RS || sx > canvasW) continue;
          ctx.beginPath(); ctx.moveTo(sx, RS - 7); ctx.lineTo(sx, RS); ctx.stroke();
          ctx.fillText(String(Math.round(x)), sx, RS - 9);
        }
        if (currentZoom > 0.4) {
          const startXSub = Math.floor(sceneLeft / subStep) * subStep;
          for (let x = startXSub; x <= sceneRight; x += subStep) {
            const sx = x * currentZoom + vpt[4];
            if (sx < RS || sx > canvasW || Math.round(x) % step === 0) continue;
            ctx.beginPath(); ctx.moveTo(sx, RS - 4); ctx.lineTo(sx, RS); ctx.stroke();
          }
        }

        // ── Vertical ruler ──
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, RS, RS, canvasH - RS);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(RS, RS); ctx.lineTo(RS, canvasH); ctx.stroke();

        const startY = Math.floor(sceneTop / step) * step;
        for (let y = startY; y <= sceneBottom; y += step) {
          const sy = y * currentZoom + vpt[5];
          if (sy < RS || sy > canvasH) continue;
          ctx.beginPath(); ctx.moveTo(RS - 7, sy); ctx.lineTo(RS, sy); ctx.stroke();
          ctx.save();
          ctx.textBaseline = 'middle';
          ctx.translate(RS - 9, sy); ctx.rotate(-Math.PI / 2);
          ctx.fillText(String(Math.round(y)), 0, 0);
          ctx.restore();
        }
        if (currentZoom > 0.4) {
          const startYSub = Math.floor(sceneTop / subStep) * subStep;
          for (let y = startYSub; y <= sceneBottom; y += subStep) {
            const sy = y * currentZoom + vpt[5];
            if (sy < RS || sy > canvasH || Math.round(y) % step === 0) continue;
            ctx.beginPath(); ctx.moveTo(RS - 4, sy); ctx.lineTo(RS, sy); ctx.stroke();
          }
        }

        // Corner box
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, RS, RS);
        ctx.strokeRect(0, 0, RS, RS);
        ctx.restore();
      }
    });

    const initCanvas = (retries = 0) => {
      if (!containerRef.current || !fabricRef.current) return;
      const cw = containerRef.current.offsetWidth;
      const ch = containerRef.current.offsetHeight;
      if ((cw === 0 || ch === 0) && retries < 30) {
        setTimeout(() => initCanvas(retries + 1), 50);
        return;
      }
      fabricRef.current.setDimensions({ width: cw, height: ch });
      updatePageBackground(fabricRef.current);
      // Double RAF ensures browser has painted the full layout (sidebar, topbar, footer)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!containerRef.current || !fabricRef.current) return;
          const cw2 = containerRef.current.offsetWidth;
          const ch2 = containerRef.current.offsetHeight;
          fabricRef.current!.setDimensions({ width: cw2, height: ch2 });
          fitToScreen(fabricRef.current!);
        });
      });
    };
    // Delay first init so React layout is fully painted
    requestAnimationFrame(() => {
      setTimeout(initCanvas, 0);
    });

    const handleResize = () => {
      if (!containerRef.current || !fabricRef.current) return;
      const ci = fabricRef.current;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      if (!width || !height) return;

      ci.setDimensions({
        width,
        height
      });
      fitToScreen(ci);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    useStore.setState({
      fitProjectToScreen: () => fitToScreen(),
      centerProject: () => centerPage(),
      zoomTo100: () => {
        if (fabricRef.current) {
          const s = useStore.getState().settings;
          if (s.width < 500 || s.height < 500) fitToScreen();
          else {
            const ci = fabricRef.current;
            ci.setZoom(1);
            setZoom(1);
            centerPage(ci);
          }
        }
      }
    });

    const onCanvasEnter = () => {
      if (useStore.getState().activeTool === ('pen' as any)) {
        finalizePenPath();
      }
    };
    window.addEventListener('canvas:enter', onCanvasEnter);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('canvas:enter', onCanvasEnter);
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; setCanvas(null); }
    };
  }, []);

  const prevDimRef = useRef({ width: settings.width, height: settings.height });

  useEffect(() => {
    if (fabricRef.current) {
      const { width: oldW, height: oldH } = prevDimRef.current;
      const { width: newW, height: newH } = settings;
      
      if (oldW !== newW || oldH !== newH) {
        const oldScale = getDisplayScale(oldW, oldH);
        const newScale = getDisplayScale(newW, newH);
        const ratio = newScale / oldScale;

        fabricRef.current.getObjects().forEach(obj => {
          if ((obj as any).isPageBackground) return;
          obj.scaleX = (obj.scaleX || 1) * ratio;
          obj.scaleY = (obj.scaleY || 1) * ratio;
          obj.left = (obj.left || 0) * ratio;
          obj.top = (obj.top || 0) * ratio;
          obj.setCoords();
        });

        updatePageBackground(fabricRef.current);
        fitToScreen(fabricRef.current);
        
        prevDimRef.current = { width: newW, height: newH };
      }
    }
  }, [settings.width, settings.height]);

  const currentZoom = useStore(s => s.zoom);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-[#e5e7eb] p-0 m-0"
      onMouseMove={(e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        containerMouseRef.current = { x, y };
        setContainerMouse({ x, y });
        // Update dragging guide position
        if (draggingGuide) {
          setDraggingGuide(prev => prev ? { ...prev, pos: prev.type === 'h' ? y : x } : null);
        }
      }}
      onClick={() => {
        if (draggingGuide) {
          const pos = draggingGuide.type === 'h' ? containerMouseRef.current.y : containerMouseRef.current.x;
          
          if (draggingGuide.existingId) {
            // If moved back to ruler, remove it
            if (pos <= 24) {
              removeGuideLine(draggingGuide.existingId);
            } else {
              // Update: remove old and add new at current pos
              removeGuideLine(draggingGuide.existingId);
              addGuideLine({
                id: Math.random().toString(36).substr(2, 9),
                orientation: draggingGuide.type === 'h' ? 'horizontal' : 'vertical',
                position: pos
              });
            }
          } else {
            // New guide placement
            if (pos > 24) {
              addGuideLine({
                id: Math.random().toString(36).substr(2, 9),
                orientation: draggingGuide.type === 'h' ? 'horizontal' : 'vertical',
                position: pos
              });
            }
          }
          setDraggingGuide(null);
        }
      }}
      onMouseUp={() => {
        if (draggingGuide) {
          const pos = draggingGuide.type === 'h' ? containerMouseRef.current.y : containerMouseRef.current.x;
          
          if (draggingGuide.existingId) {
            if (pos <= 24) {
              removeGuideLine(draggingGuide.existingId);
            } else {
              removeGuideLine(draggingGuide.existingId);
              addGuideLine({
                id: Math.random().toString(36).substr(2, 9),
                orientation: draggingGuide.type === 'h' ? 'horizontal' : 'vertical',
                position: pos
              });
            }
          } else {
            if (pos > 100) { 
              addGuideLine({
                id: Math.random().toString(36).substr(2, 9),
                orientation: draggingGuide.type === 'h' ? 'horizontal' : 'vertical',
                position: pos
              });
            }
          }
          setDraggingGuide(null);
        }
      }}
      style={showGrid ? {
        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      } : {}}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Rulers */}
      {showRulers && (
        <>
          {/* Horizontal Ruler - hover shows preview, click places guideline */}
          <div 
            className="absolute top-0 left-0 right-0 h-6 bg-[#f8f8f8] border-b border-gray-300 z-30 overflow-hidden select-none"
            style={{ cursor: 'ns-resize' }}
            onMouseMove={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) setRulerHover({ type: 'h', pos: e.clientY - rect.top });
            }}
            onMouseLeave={() => setRulerHover(null)}
            onMouseDown={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                setDraggingGuide({ type: 'h', pos: e.clientY - rect.top });
                setRulerHover(null);
                e.stopPropagation();
              }
            }}
          >
            <div className="flex h-full items-end pb-1 pl-7">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center shrink-0" style={{ width: 50 * currentZoom }}>
                  <span className="text-[8px] font-black text-gray-400 mb-0.5">{i * 50}</span>
                  <div className="h-2 w-px bg-gray-300" />
                </div>
              ))}
            </div>
          </div>
          {/* Vertical Ruler - hover shows preview, click places guideline */}
          <div 
            className="absolute top-0 left-0 bottom-0 w-6 bg-[#f8f8f8] border-r border-gray-300 z-30 overflow-hidden select-none"
            style={{ cursor: 'ew-resize' }}
            onMouseMove={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) setRulerHover({ type: 'v', pos: e.clientX - rect.left });
            }}
            onMouseLeave={() => setRulerHover(null)}
            onMouseDown={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                setDraggingGuide({ type: 'v', pos: e.clientX - rect.left });
                setRulerHover(null);
                e.stopPropagation();
              }
            }}
          >
            <div className="flex flex-col w-full items-end pr-1 pt-7">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="flex items-center shrink-0" style={{ height: 50 * currentZoom }}>
                  <span className="text-[8px] font-black text-gray-400 mr-0.5" style={{ transform: 'rotate(-90deg)' }}>{i * 50}</span>
                  <div className="w-2 h-px bg-gray-300" />
                </div>
              ))}
            </div>
          </div>
          {/* Ruler Corner */}
          <div className="absolute top-0 left-0 w-6 h-6 bg-gray-100 border-r border-b border-gray-300 z-40 flex items-center justify-center">
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
          </div>
        </>
      )}

      {/* Guidelines Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {guideLines.map(guide => (
          <div 
            key={guide.id}
            className={`absolute pointer-events-auto group`}
            style={guide.orientation === 'horizontal' 
              ? { 
                  top: guide.position, left: 0, right: 0, height: '8px',
                  marginTop: '-4px',
                  cursor: 'ns-resize'
                }
              : { 
                  left: guide.position, top: 0, bottom: 0, width: '8px',
                  marginLeft: '-4px',
                  cursor: 'ew-resize'
                }
            }
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setDraggingGuide({ 
                type: guide.orientation === 'horizontal' ? 'h' : 'v', 
                pos: guide.position,
                existingId: guide.id
              });
            }}
            onContextMenu={(e) => { e.preventDefault(); removeGuideLine(guide.id); }}
          >
            {/* Visible line */}
            <div 
              className="absolute"
              style={guide.orientation === 'horizontal'
                ? { top: '3px', left: 0, right: 0, height: '1px', 
                    backgroundImage: 'repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 6px, transparent 6px, transparent 10px)',
                    opacity: 0.8 }
                : { left: '3px', top: 0, bottom: 0, width: '1px',
                    backgroundImage: 'repeating-linear-gradient(180deg, #3b82f6 0px, #3b82f6 6px, transparent 6px, transparent 10px)',
                    opacity: 0.8 }
              }
            />
            {/* Tooltip */}
            <div className={`absolute opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap transition-opacity z-50`}
              style={guide.orientation === 'horizontal' ? { left: 40, top: -10 } : { top: 40, left: -4 }}
            >
              {Math.round(guide.position)}px · Right-click to remove
            </div>
          </div>
        ))}
        {/* Dragging / hover preview guide */}
        {(draggingGuide || rulerHover) && (() => {
          const g = draggingGuide || rulerHover!;
          const isH = g.type === 'h';
          // Use live container mouse pos when dragging, rulerHover.pos when just hovering
          const pos = draggingGuide 
            ? (isH ? containerMouse.y : containerMouse.x)
            : rulerHover!.pos;
          return (
            <div 
              className="absolute pointer-events-none z-40"
              style={isH 
                ? { top: pos, left: 0, right: 0, height: '1px',
                    backgroundImage: 'repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 6px, transparent 6px, transparent 10px)',
                    opacity: draggingGuide ? 0.9 : 0.45 }
                : { left: pos, top: 0, bottom: 0, width: '1px',
                    backgroundImage: 'repeating-linear-gradient(180deg, #3b82f6 0px, #3b82f6 6px, transparent 6px, transparent 10px)',
                    opacity: draggingGuide ? 0.9 : 0.45 }
              }
            />
          );
        })()}
      </div>

        <FloatingToolbar />
      {/* Canvas Prompts Modal */}
      {canvasPrompt && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[320px] flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-gray-900">
              {canvasPrompt.type === 'callout' && 'Callout Settings'}
              {canvasPrompt.type === 'polygon' && 'Polygon Settings'}
              {canvasPrompt.type === 'star' && 'Star Settings'}
              {canvasPrompt.type === 'text' && 'Add Text'}
              {canvasPrompt.type === 'qr' && 'QR Code Content'}
            </h3>

            {canvasPrompt.type === 'callout' && (
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Direction</label>
                <select 
                  className="w-full border border-gray-200 rounded p-2 text-sm"
                  value={promptInputs['direction'] || 'right'}
                  onChange={e => setPromptInputs({...promptInputs, direction: e.target.value})}
                >
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            )}

            {canvasPrompt.type === 'polygon' && (
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Number of Sides</label>
                <input 
                  type="number" min="3" max="20"
                  className="w-full border border-gray-200 rounded p-2 text-sm"
                  value={promptInputs['sides'] || '6'}
                  onChange={e => setPromptInputs({...promptInputs, sides: e.target.value})}
                />
              </div>
            )}

            {canvasPrompt.type === 'star' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Points</label>
                  <input 
                    type="number" min="3" max="20"
                    className="w-full border border-gray-200 rounded p-2 text-sm"
                    value={promptInputs['points'] || '5'}
                    onChange={e => setPromptInputs({...promptInputs, points: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Inner Radius (0.1-0.9)</label>
                  <input 
                    type="number" step="0.1" min="0.1" max="0.9"
                    className="w-full border border-gray-200 rounded p-2 text-sm"
                    value={promptInputs['inner'] || '0.4'}
                    onChange={e => setPromptInputs({...promptInputs, inner: e.target.value})}
                  />
                </div>
              </>
            )}

            {canvasPrompt.type === 'text' && (
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Type</label>
                <select 
                  className="w-full border border-gray-200 rounded p-2 text-sm mb-3"
                  value={promptInputs['textType'] || 'custom'}
                  onChange={e => setPromptInputs({...promptInputs, textType: e.target.value})}
                >
                  <option value="custom">Custom Text</option>
                  <option value="field">Data Field</option>
                </select>
                {promptInputs['textType'] === 'field' && (
                  <>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Field Name</label>
                    <input 
                      type="text" placeholder="e.g. name"
                      className="w-full border border-gray-200 rounded p-2 text-sm"
                      value={promptInputs['fieldName'] || ''}
                      onChange={e => setPromptInputs({...promptInputs, fieldName: e.target.value})}
                    />
                  </>
                )}
              </div>
            )}

            {canvasPrompt.type === 'qr' && (
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">URL or Text</label>
                <input 
                  type="text" placeholder="https://"
                  className="w-full border border-gray-200 rounded p-2 text-sm"
                  value={promptInputs['qr'] || 'https://'}
                  onChange={e => setPromptInputs({...promptInputs, qr: e.target.value})}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end mt-2">
              <button 
                onClick={() => {
                  setCanvasPrompt(null);
                  useStore.getState().setActiveTool('select');
                }} 
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const ci = fabricRef.current;
                  if (!ci) return;
                  const { type, pointer } = canvasPrompt;
                  let obj: any = null;

                  if (type === 'callout') {
                    const dir = promptInputs['direction'] || 'right';
                    obj = createCallout(pointer.x, pointer.y, 120, 80, dir as any);
                  } 
                  else if (type === 'polygon') {
                    const sides = parseInt(promptInputs['sides'] || '6');
                    if (sides >= 3 && sides <= 20) {
                      const r = 60;
                      const pts = Array.from({ length: sides }, (_, i) => {
                        const a = (2 * Math.PI * i) / sides - Math.PI / 2;
                        return { x: r * Math.cos(a), y: r * Math.sin(a) };
                      });
                      obj = new Polygon(pts, { left: pointer.x, top: pointer.y, fill: '#8b5cf633', stroke: '#8b5cf6', strokeWidth: 2 });
                    }
                  } 
                  else if (type === 'star') {
                    const points = parseInt(promptInputs['points'] || '5');
                    const innerRatio = parseFloat(promptInputs['inner'] || '0.4');
                    if (points >= 3 && points <= 20) {
                      const outerR = 60, innerR = outerR * Math.max(0.1, Math.min(0.9, innerRatio));
                      const pts: { x: number; y: number }[] = [];
                      for (let i = 0; i < points * 2; i++) {
                        const a = (Math.PI * i) / points - Math.PI / 2;
                        const r = i % 2 === 0 ? outerR : innerR;
                        pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
                      }
                      obj = new Polygon(pts, { left: pointer.x, top: pointer.y, fill: '#f59e0b33', stroke: '#f59e0b', strokeWidth: 2 });
                    }
                  } 
                  else if (type === 'text') {
                    const textType = promptInputs['textType'] || 'custom';
                    const s = useStore.getState().settings;
                    const minDim = Math.min(s.width, s.height);
                    const scale = BASE_RENDER_SIZE / Math.max(s.width, s.height);
                    const defaultFontSize = Math.max(minDim / 10, 14) * scale * 0.35;
                    const scaledWidth = Math.min(s.width * 0.8, 200) * scale;
                    
                    if (textType === 'custom') {
                      obj = new Textbox('Double click to edit', {
                        left: pointer.x, top: pointer.y, width: scaledWidth,
                        fontSize: defaultFontSize, fontFamily: 'Outfit', fill: '#000000',
                        splitByGrapheme: true, objectCaching: false
                      });
                      setTimeout(() => { obj.enterEditing(); obj.selectAll(); ci.requestRenderAll(); }, 100);
                    } else {
                      const fn = (promptInputs['fieldName'] || 'field').toLowerCase().replace(/ /g, '_');
                      obj = new Textbox(`{{${fn}}}`, {
                        left: pointer.x, top: pointer.y, width: scaledWidth,
                        fontSize: defaultFontSize, fontFamily: 'Outfit', fill: '#2563eb', fontWeight: 'bold',
                        splitByGrapheme: true, objectCaching: false
                      });
                      const { testData, setTestData } = useStore.getState();
                      if (!testData[fn]) setTestData({ ...testData, [fn]: `[${fn}]` });
                    }
                  } 
                  else if (type === 'qr') {
                    const input = promptInputs['qr'] || 'https://';
                    import('qrcode').then(async (QRCode) => {
                      const dataUrl = await QRCode.toDataURL(input, { margin: 1, width: 256 });
                      const img = new Image();
                      img.onload = () => {
                        const s = useStore.getState().settings;
                        const qrScale = BASE_RENDER_SIZE / Math.max(s.width, s.height);
                        const qrSize = Math.max(80, 100 * qrScale);
                        const fabricImg = new FabricImage(img, {
                          left: pointer.x, top: pointer.y, width: qrSize, height: qrSize,
                          //@ts-ignore
                          qrData: input, name: 'qr-code'
                        });
                        ci.add(fabricImg); ci.setActiveObject(fabricImg); ci.requestRenderAll();
                        useStore.getState().saveHistory();
                      };
                      img.src = dataUrl;
                    });
                    setCanvasPrompt(null);
                    useStore.getState().setActiveTool('select');
                    return;
                  }

                  if (obj) {
                    ci.add(obj);
                    ci.setActiveObject(obj);
                    ci.requestRenderAll();
                    useStore.getState().saveHistory();
                  }
                  
                  setCanvasPrompt(null);
                  useStore.getState().setActiveTool('select');
                }} 
                className="px-4 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <SuggestionPopup
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        position={popupPos}
        onSelect={(idx) => handleSelect(suggestions[idx])}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
      <div className="absolute bottom-6 left-10 bg-white shadow-2xl px-4 py-2 rounded-full text-[10px] font-mono text-gray-500 border border-gray-200 z-20 pointer-events-none flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-gray-300 font-black">X</span>
          <span id="mouse-pos-x" className="font-bold text-blue-600">0px</span>
        </div>
        <div className="w-px h-3 bg-gray-100" />
        <div className="flex items-center gap-1">
          <span className="text-gray-300 font-black">Y</span>
          <span id="mouse-pos-y" className="font-bold text-blue-600">0px</span>
        </div>
      </div>
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur shadow-xl px-3 py-1 rounded-full text-[11px] font-black text-gray-400 border border-gray-200 z-20 pointer-events-none">
        {Math.round(currentZoom * 100)}%
      </div>
    </div>
  );
};
