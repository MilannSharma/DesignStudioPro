/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { File, FolderOpen, Save, Download, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, ChevronDown, Database, Image as ImageIcon, Sparkles, MessageCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { importImage, getPageDataURL, exportToPDF_Pro } from '../../utils/canvasUtils';
import { Group, Point as FabricPoint } from 'fabric';
import { jsPDF } from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const CUSTOM_PROPS = ['isPageBackground', '__uid', 'name', 'selectable', 'evented', 'excludeFromExport', 'qrData', 'isDrawingPreview'];

export const TopBar: React.FC = () => {
  const { zoom, setZoom, canvas, setShowDataMerge, setShowSearchReplace, setShowNewProject, undo, redo, historyIndex, history, setPreviewMode, fitProjectToScreen, zoomTo100, centerProject } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  // FIXED: Export cropped to page bounds
  const handleExport = (format: 'png' | 'jpeg' = 'png') => {
    if (!canvas) return;
    const dataURL = getPageDataURL(canvas, format, format === 'jpeg' ? 0.92 : undefined);
    const link = document.createElement('a');
    link.download = `design_export.${format === 'jpeg' ? 'jpg' : format}`;
    link.href = dataURL;
    link.click();
    setActiveMenu(null);
  };

  const handleExportSVG = () => {
    if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'design_export.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    setActiveMenu(null);
  };

  // Professional PDF export
  const handleExportPDF = () => {
    exportToPDF_Pro();
    setActiveMenu(null);
  };

  // Save project as JSON
  const saveProject = () => {
    if (!canvas) return;
    const state = useStore.getState();
    const json = JSON.stringify({
      version: '2.0',
      projectName: state.projectName,
      settings: state.settings,
      numPages: state.numPages,
      currentPageIndex: state.currentPageIndex,
      pages: state.pages,
      canvasData: (canvas as any).toJSON(CUSTOM_PROPS),
      testData: state.testData,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${state.projectName || 'design'}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setActiveMenu(null);
  };

  // Load project from JSON
  const openProject = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file && canvas) {
        const reader = new FileReader();
        reader.onload = (f) => {
          try {
            const project = JSON.parse(f.target?.result as string);
            if (project.settings) useStore.getState().setSettings(project.settings);
            if (project.projectName) useStore.setState({ projectName: project.projectName });
            if (project.testData) useStore.getState().setTestData(project.testData);
            if (project.numPages) useStore.setState({ numPages: project.numPages, pages: project.pages || [] });
            const data = project.canvasData || project.data || project;
            const loadPromise = (canvas as any).loadFromJSON(data);
            const handleLoaded = () => {
              canvas.renderAll();
              const fn = useStore.getState().updatePageBackgroundFn;
              if (fn) fn();
              useStore.getState().saveHistory('Load Project');
            };
            if (loadPromise && loadPromise.then) {
              loadPromise.then(handleLoaded);
            } else {
              handleLoaded();
            }
          } catch (err) { console.error('Failed to load project:', err); }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    setActiveMenu(null);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvas) {
      importImage(canvas, file);
      e.target.value = '';
    }
    setActiveMenu(null);
  };

  const handleGroup = () => {
    if (!canvas) return;
    const objs = canvas.getActiveObjects();
    if (objs.length > 1) {
      const group = new Group(objs);
      canvas.discardActiveObject(); objs.forEach(o => canvas.remove(o));
      canvas.add(group); canvas.setActiveObject(group); canvas.renderAll();
      useStore.getState().saveHistory('Group Objects');
    }
    setActiveMenu(null);
  };

  const handleUngroup = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active instanceof Group) { (active as any).toActiveSelection(); canvas.renderAll(); useStore.getState().saveHistory('Ungroup Objects'); }
    setActiveMenu(null);
  };

  const handleDuplicate = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: any) => {
      canvas.discardActiveObject();
      cloned.set({ left: cloned.left + 20, top: cloned.top + 20, evented: true });
      if (cloned.type === 'activeSelection') { cloned.canvas = canvas; cloned.forEachObject((o: any) => canvas.add(o)); }
      else canvas.add(cloned);
      canvas.setActiveObject(cloned); canvas.requestRenderAll(); useStore.getState().saveHistory('Duplicate Object');
    });
    setActiveMenu(null);
  };

  return (
    <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 justify-between z-40 text-[11px]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="font-black text-blue-600 font-display text-base italic tracking-tighter">STUDIO</div>
          <div className="flex gap-4 text-gray-500 font-medium">
            {/* File Menu */}
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", activeMenu === 'file' && "text-blue-600")}>File</button>
              {activeMenu === 'file' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl p-1.5 min-w-[200px] z-50">
                  <MA label="New Design" onClick={() => setShowNewProject(true)} />
                  <MA label="Open Project (.json)" onClick={openProject} />
                  <MA label="Save Project" onClick={saveProject} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Export PNG" onClick={() => handleExport('png')} />
                  <MA label="Export JPG" onClick={() => handleExport('jpeg')} />
                  <MA label="Export SVG" onClick={handleExportSVG} />
                  <MA label="Export PDF" onClick={handleExportPDF} />
                </div>
              )}
            </div>
            {/* Edit Menu */}
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", activeMenu === 'edit' && "text-blue-600")}>Edit</button>
              {activeMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl p-1.5 min-w-[200px] z-50">
                  <MA label="Undo (Ctrl+Z)" onClick={() => { undo(); setActiveMenu(null); }} disabled={historyIndex <= 0} />
                  <MA label="Redo (Ctrl+Shift+Z)" onClick={() => { redo(); setActiveMenu(null); }} disabled={historyIndex >= history.length - 1} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Duplicate (Ctrl+D)" onClick={handleDuplicate} />
                  <MA label="Delete Selected" onClick={() => {
                    canvas?.getActiveObjects().forEach(o => canvas.remove(o));
                    canvas?.discardActiveObject(); canvas?.renderAll(); useStore.getState().saveHistory('Delete Object'); setActiveMenu(null);
                  }} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Search & Replace" onClick={() => { setShowSearchReplace(true); setActiveMenu(null); }} />
                </div>
              )}
            </div>
            {/* Image Menu */}
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === 'image' ? null : 'image')}
                className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", activeMenu === 'image' && "text-blue-600")}>Image</button>
              {activeMenu === 'image' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl p-1.5 min-w-[200px] z-50">
                  <MA label="Image Size..." onClick={() => setActiveMenu(null)} />
                  <MA label="Canvas Size..." onClick={() => setActiveMenu(null)} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Auto Tone" onClick={() => setActiveMenu(null)} />
                  <MA label="Auto Contrast" onClick={() => setActiveMenu(null)} />
                  <MA label="Auto Color" onClick={() => setActiveMenu(null)} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Adjustments" onClick={() => setActiveMenu(null)} />
                </div>
              )}
            </div>

            {/* Layer Menu */}
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === 'layer' ? null : 'layer')}
                className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", activeMenu === 'layer' && "text-blue-600")}>Layer</button>
              {activeMenu === 'layer' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl p-1.5 min-w-[200px] z-50">
                  <MA label="New Layer" onClick={() => setActiveMenu(null)} />
                  <MA label="Duplicate Layer" onClick={() => { handleDuplicate(); setActiveMenu(null); }} />
                  <MA label="Delete" onClick={() => {
                    canvas?.getActiveObjects().forEach(o => canvas.remove(o));
                    canvas?.discardActiveObject(); canvas?.renderAll(); useStore.getState().saveHistory('Delete Object'); setActiveMenu(null);
                  }} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Group Layers" onClick={() => setActiveMenu(null)} />
                  <MA label="Ungroup" onClick={() => setActiveMenu(null)} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Arrange" onClick={() => setActiveMenu(null)} />
                </div>
              )}
            </div>

            {/* Select Menu */}
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === 'select' ? null : 'select')}
                className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", activeMenu === 'select' && "text-blue-600")}>Select</button>
              {activeMenu === 'select' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl p-1.5 min-w-[200px] z-50">
                  <MA label="All (Ctrl+A)" onClick={() => setActiveMenu(null)} />
                  <MA label="Deselect (Ctrl+D)" onClick={() => { canvas?.discardActiveObject(); canvas?.renderAll(); setActiveMenu(null); }} />
                  <MA label="Inverse" onClick={() => setActiveMenu(null)} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Remove BG (AI)" onClick={() => setActiveMenu(null)} />
                  <MA label="Color Range..." onClick={() => setActiveMenu(null)} />
                </div>
              )}
            </div>

            {/* Filter Menu */}
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === 'filter' ? null : 'filter')}
                className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", activeMenu === 'filter' && "text-blue-600")}>Filter</button>
              {activeMenu === 'filter' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl p-1.5 min-w-[200px] z-50">
                  <MA label="Filter Gallery..." onClick={() => setActiveMenu(null)} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Blur" onClick={() => setActiveMenu(null)} />
                  <MA label="Distort" onClick={() => setActiveMenu(null)} />
                  <MA label="Noise" onClick={() => setActiveMenu(null)} />
                  <MA label="Pixelate" onClick={() => setActiveMenu(null)} />
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", activeMenu === 'view' && "text-blue-600")}>View</button>
              {activeMenu === 'view' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl p-1.5 min-w-[200px] z-50">
                  <MA label="Zoom In" onClick={() => { setZoom(zoom * 1.1); setActiveMenu(null); }} />
                  <MA label="Zoom Out" onClick={() => { setZoom(zoom * 0.9); setActiveMenu(null); }} />
                  <MA label="Fit Area" onClick={() => { fitProjectToScreen(); setActiveMenu(null); }} />
                  <div className="h-px bg-gray-50 my-1.5" />
                  <MA label="Rulers" onClick={() => { useStore.getState().toggleRulers(); setActiveMenu(null); }} />
                  <MA label="Grid" onClick={() => { useStore.getState().toggleGrid(); setActiveMenu(null); }} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-4 w-px bg-gray-200 mx-2" />
        <div className="flex items-center gap-1">
          <MB icon={ImageIcon} onClick={() => fileInputRef.current?.click()} label="Import Image" />
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.svg" onChange={onImageUpload} title="Upload image" aria-label="Upload image" />
          <MB icon={Database} onClick={() => setShowDataMerge(true)} label="Data Merge" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
          <button onClick={() => { if (canvas) { const z = canvas.getZoom() * 0.9; canvas.zoomToPoint(new FabricPoint(canvas.width / 2, canvas.height / 2), z); setZoom(z); centerProject(); } }}
            title="Zoom Out" aria-label="Zoom Out"
            className="text-gray-400 hover:text-blue-600 transition-colors"><ZoomOut size={14} /></button>
          <button onClick={() => zoomTo100()} className="text-[10px] font-bold text-blue-600 w-12 text-center uppercase hover:bg-white rounded py-0.5 transition-colors cursor-pointer" title="Reset Zoom">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => { if (canvas) { const z = canvas.getZoom() * 1.1; canvas.zoomToPoint(new FabricPoint(canvas.width / 2, canvas.height / 2), z); setZoom(z); centerProject(); } }}
            title="Zoom In" aria-label="Zoom In"
            className="text-gray-400 hover:text-blue-600 transition-colors"><ZoomIn size={14} /></button>
          <div className="w-px h-3 bg-gray-200 mx-1" />
          <button onClick={() => fitProjectToScreen()} className="text-gray-400 hover:text-blue-600 transition-colors" title="Fit to Screen"><Maximize size={13} /></button>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={historyIndex <= 0} onClick={() => undo()}
            className={cn("p-1.5 rounded transition-all", historyIndex > 0 ? "text-gray-600 hover:bg-gray-100 hover:text-blue-600" : "text-gray-200 cursor-not-allowed")} title="Undo">
            <Undo2 size={16} />
          </button>
          <button disabled={historyIndex >= history.length - 1} onClick={() => redo()}
            className={cn("p-1.5 rounded transition-all", historyIndex < history.length - 1 ? "text-gray-600 hover:bg-gray-100 hover:text-blue-600" : "text-gray-200 cursor-not-allowed")} title="Redo">
            <Redo2 size={16} />
          </button>
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => alert('Background removal feature is being integrated with AI service...')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-pink-200 transition-all active:scale-95"
          >
            <Sparkles size={12} /> BG Remove
          </button>
          <button 
            onClick={() => {
              const event = new CustomEvent('toggle-ai-chat');
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
          >
            <MessageCircle size={12} /> AI Chat
          </button>
        </div>
      </div>
    </div>
  );
};

const MA = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button disabled={disabled} onClick={onClick}
    className={cn("w-full text-left px-3 py-2 rounded text-[11px] transition-colors", disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600")}>
    {label}
  </button>
);

const MB = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) => (
  <button onClick={onClick} className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-all" title={label}>
    <Icon size={18} />
  </button>
);
