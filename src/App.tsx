/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ALL_FONTS } from './utils/fonts';
import { useStore } from './store/useStore';
import { Toolbar } from './components/common/Toolbar';
import { TopBar } from './components/common/TopBar';
import { CanvasArea } from './components/canvas/CanvasArea';
import { PropertiesPanel } from './components/common/PropertiesPanel';
import { ShapeLibrary } from './components/common/ShapeLibrary';
import { LayersPanel } from './components/common/LayersPanel';
import { SymbolsPanel } from './components/common/SymbolsPanel';
import { DataMergeModal } from './components/common/DataMergeModal';
import { SearchReplaceModal } from './components/common/SearchReplaceModal';
import { ProjectSetupModal } from './components/common/ProjectSetupModal';
import { QRModal } from './components/common/QRModal';
import { FloatingToolbar } from './components/common/FloatingToolbar';
import { Rect, Circle, Line, IText, FabricImage, ActiveSelection, Textbox, Group, util } from 'fabric';
import { PreviewModal } from './components/common/PreviewModal';
import { AIChatPanel } from './components/common/AIChatPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { FontLoader } from './components/common/FontLoader';
import { TranslatorPanel } from './components/common/TranslatorPanel';
import { NewProjectModal } from './components/common/NewProjectModal';
import { IconSidebar } from './components/common/IconSidebar';
import { HistoryPanel } from './components/common/HistoryPanel';
import { SwatchesPanel } from './components/common/SwatchesPanel';
import { Plus, ChevronLeft, ChevronRight, Eye, CheckCircle2, Settings2, Layout, Package } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function App() {
  const { 
    canvas, activeTool, setActiveTool, setSettings, showDataMerge, setShowDataMerge, 
    showSearchReplace, setShowSearchReplace, showNewProject, setShowNewProject, 
    isInitialized, projectName, numPages, addPage, zoom, currentPageIndex, settings, 
    showSaveNotification, activeSidebarPanel, setActiveSidebarPanel
  } = useStore();

  const [showAIChat, setShowAIChat] = React.useState(false);

  useKeyboardShortcuts();

  // Show New Project modal on first load if not initialized
  useEffect(() => {
    if (!isInitialized) {
      setShowNewProject(true);
    }
  }, [isInitialized]);

  // Listen for toggle-ai-chat custom event from TopBar button
  useEffect(() => {
    const handler = () => setShowAIChat(prev => !prev);
    window.addEventListener('toggle-ai-chat', handler);
    return () => window.removeEventListener('toggle-ai-chat', handler);
  }, []);

  // History auto-save — skip drawing previews and page backgrounds
  useEffect(() => {
    if (!canvas) return;
    const save = (opt: any) => {
      if (opt?.target?.isPageBackground || opt?.transform?.target?.isPageBackground) return;
      if (opt?.target?.isDrawingPreview || opt?.target?.isAnchor) return;
      useStore.getState().saveHistory();
    };
    const saveOnModified = (opt: any) => {
      if (opt?.target?.isPageBackground) return;
      useStore.getState().saveHistory();
    };
    canvas.on('object:added', save);
    canvas.on('object:modified', saveOnModified);
    canvas.on('object:removed', saveOnModified);
    return () => { canvas.off('object:added', save); canvas.off('object:modified', saveOnModified); canvas.off('object:removed', saveOnModified); };
  }, [canvas]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 select-none text-gray-900">
      <TopBar />
      <div className="flex-1 flex overflow-hidden relative">
        <Toolbar />
        <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50">
          {/* Context Bar */}
          <div className="h-10 border-b border-gray-200 bg-white flex items-center px-4 space-x-6 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 font-bold">TOOL:</span>
              <span className="text-blue-600 uppercase tracking-widest font-mono font-bold">{activeTool}</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 font-bold">ZOOM:</span>
                <span className="text-gray-600 font-bold">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 font-bold">SIZE:</span>
                <span className="text-gray-600 font-bold">{Math.round(settings.width)}×{Math.round(settings.height)}px</span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <button onClick={() => useStore.getState().setPreviewMode(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-[10px] font-black transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                <Eye size={12} /> Preview
              </button>
            </div>
          </div>
          <CanvasArea />
        </main>
        {/* Right Sidebar Area */}
        <div className="flex h-full">
          <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col z-20 shadow-xl overflow-hidden">
            {activeSidebarPanel === 'props' && <PropertiesPanel />}
            {activeSidebarPanel === 'layers' && <LayersPanel />}
            {activeSidebarPanel === 'history' && <HistoryPanel />}
            {activeSidebarPanel === 'swatches' && <SwatchesPanel />}
            {activeSidebarPanel === 'symbols' && <SymbolsPanel />}
            {activeSidebarPanel === 'shapes' && <ShapeLibrary />}
            {activeSidebarPanel === 'translator' && <TranslatorPanel />}
            {/* Placeholders for new panels */}
            {['info', 'brush', 'text', 'para', 'css'].includes(activeSidebarPanel) && (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase tracking-widest p-12 text-center bg-gray-50/50">
                The {activeSidebarPanel} panel will be available in the next update.
              </div>
            )}
          </div>
          <IconSidebar />
        </div>
      </div>

      <PreviewModal />
      <FontLoader />
      <AIChatPanel isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
      {showDataMerge && <DataMergeModal onClose={() => setShowDataMerge(false)} />}
      {showSearchReplace && <SearchReplaceModal onClose={() => useStore.getState().setShowSearchReplace(false)} />}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
      
      {activeTool === 'qr' && (
        <QRModal onClose={() => setActiveTool('select')} onGenerate={(img) => {
          if (canvas) { canvas.add(img); canvas.setActiveObject(img); canvas.renderAll(); useStore.getState().saveHistory(); }
          setActiveTool('select');
        }} />
      )}

      {/* Footer Status Bar — FIXED: uses reactive currentPageIndex */}
      <footer className="h-8 border-t border-gray-200 bg-white px-4 flex items-center justify-between text-[11px] text-gray-500 font-medium">
        <div className="flex items-center space-x-6">
          <span className="flex items-center gap-2 font-black text-gray-900 tracking-tight">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {projectName.toUpperCase()}
          </span>
          <div className="h-4 w-px bg-gray-100" />
          <span className="flex items-center gap-2">
            <span className="text-gray-400">ACTIVE:</span>
            <span className="text-blue-600 font-bold tracking-widest">{activeTool.toUpperCase()}</span>
          </span>
          <div className="h-4 w-px bg-gray-100" />
          <span className="flex items-center gap-2">
            <span className="text-gray-400">ELEMENTS:</span>
            <span className="text-gray-700 font-bold">{canvas?.getObjects().filter(o => !(o as any).isPageBackground).length || 0}</span>
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            <button disabled={currentPageIndex === 0}
              onClick={() => useStore.getState().setCurrentPage(currentPageIndex - 1)}
              title="Previous Page" aria-label="Previous Page"
              className={cn("p-1 transition-colors", currentPageIndex === 0 ? "text-gray-200" : "text-blue-600 hover:bg-white rounded-full")}>
              <ChevronLeft size={12} />
            </button>
            <span className="text-gray-900 font-black min-w-[70px] text-center tracking-tighter">PAGE {currentPageIndex + 1} OF {numPages}</span>
            <button disabled={currentPageIndex === numPages - 1}
              onClick={() => useStore.getState().setCurrentPage(currentPageIndex + 1)}
              title="Next Page" aria-label="Next Page"
              className={cn("p-1 transition-colors", currentPageIndex === numPages - 1 ? "text-gray-200" : "text-blue-600 hover:bg-white rounded-full")}>
              <ChevronRight size={12} />
            </button>
            <button onClick={addPage} className="p-1 text-blue-600 hover:bg-white rounded-full transition-colors" title="Add Blank Page">
              <Plus size={12} />
            </button>
            <button onClick={() => useStore.getState().duplicatePage()} className="p-1 text-blue-600 hover:bg-white rounded-full transition-colors" title="Duplicate Current Page">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
          <div className="h-4 w-px bg-gray-100" />
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold">READY:</span>
            <span className="font-black text-gray-900">{settings.dpi} DPI / {settings.colorMode?.toUpperCase() || 'RGB'}</span>
          </div>
        </div>
      </footer>

      {/* Save Notification Toast */}
      <div className={cn(
        "fixed top-4 right-4 z-[9999] transition-all duration-300 transform",
        showSaveNotification ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      )}>
        <div className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold border border-green-500">
          <CheckCircle2 size={20} className="text-green-100" />
          Template Saved Successfully!
        </div>
      </div>
    </div>
  );
}
