/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { StoreState, Tool, DocumentSettings, GuideLine } from '../types';
import { Canvas, Object as FabricObject } from 'fabric';
import { compare, applyPatch, Operation } from 'fast-json-patch';

type HistoryEntry = { label: string } & ({ type: 'full'; data: any } | { type: 'patch'; data: Operation[] });

const CUSTOM_PROPS = ['isPageBackground', '__uid', 'name', 'selectable', 'evented', 'excludeFromExport', 'qrData', 'isDrawingPreview'];

export const useStore = create<StoreState>((set, get) => ({
  canvas: null,
  activeTool: 'select',
  selectedObjects: [],
  settings: {
    width: 800,
    height: 600,
    dpi: 300,
    unit: 'px',
    bleed: 0,
    margin: 10,
    orientation: 'landscape',
    colorMode: 'rgb',
  },
  pages: [],
  currentPageIndex: 0,
  zoom: 1,
  showGrid: true,
  showRulers: true,
  showGuides: {
    bleed: true,
    margin: true,
    safeZone: false,
  },
  guideSettings: {
    bleedColor: '#ef4444',
    marginColor: '#3b82f6',
    safeZoneColor: '#10b981',
    thickness: 1,
  },
  isDark: true,
  showDataMerge: false,
  isInitialized: false,
  defaultFontFamily: 'Inter',
  projectName: 'Untitled Project',
  numPages: 1,
  assets: [],
  history: [] as HistoryEntry[],
  historyIndex: -1,
  previewMode: false,
  testData: {
    student_name: 'John Doe',
    roll_no: '2024-001',
    class: 'X-A',
    blood_group: 'B+',
    id_number: 'ID-9921'
  },
  guideLines: [],
  recentColors: [],
  copiedObjectJson: null,
  updatePageBackgroundFn: null,
  showSaveNotification: false,
  showSearchReplace: false,
  showNewProject: false,
  isHistoryLoading: false,
  isAltPressed: false,
  activeSidebarPanel: 'props',
  symbols: [],

  setIsHistoryLoading: (loading) => set({ isHistoryLoading: loading }),
  setIsAltPressed: (isPressed) => set({ isAltPressed: isPressed }),

  setCanvas: (canvas) => set({ canvas }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedObjects: (selectedObjects) => set({ selectedObjects }),
  setZoom: (zoom) => set({ zoom }),
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
  toggleGuide: (type) => set((state) => ({
    showGuides: { ...state.showGuides, [type]: !state.showGuides[type] }
  })),
  setGuideSettings: (newSettings) => set((state) => ({
    guideSettings: { ...state.guideSettings, ...newSettings }
  })),
  setShowDataMerge: (show) => set({ showDataMerge: show }),
  setShowNewProject: (show) => set({ showNewProject: show }),
  setDefaultFontFamily: (font) => set({ defaultFontFamily: font }),
  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel }),
  setPreviewMode: (show) => set({ previewMode: show }),
  setTestData: (testData) => set({ testData }),
  setUpdatePageBackgroundFn: (fn) => set({ updatePageBackgroundFn: fn }),
  setShowSaveNotification: (show) => set({ showSaveNotification: show }),
  setShowSearchReplace: (show) => set({ showSearchReplace: show }),

  addGuideLine: (guide) => set((state) => ({
    guideLines: [...state.guideLines, guide]
  })),
  removeGuideLine: (id) => set((state) => ({
    guideLines: state.guideLines.filter(g => g.id !== id)
  })),
  addRecentColor: (color) => set((state) => {
    const filtered = state.recentColors.filter(c => c !== color);
    return { recentColors: [color, ...filtered].slice(0, 10) };
  }),
  setCopiedObjectJson: (json) => set({ copiedObjectJson: json }),

  initializeProject: (name, settings, pages) => set({
    projectName: name,
    settings: { ...settings },
    numPages: pages,
    isInitialized: true,
    pages: Array(pages).fill('')
  }),

  addPage: () => {
    const state = get();
    const newPages = [...state.pages, ''];
    set({
      numPages: state.numPages + 1,
      pages: newPages
    });
    get().setCurrentPage(newPages.length - 1);
  },

  addSymbol: (json) => set((state) => ({
    symbols: [...state.symbols, json]
  })),
  removeSymbol: (index) => set((state) => ({
    symbols: state.symbols.filter((_, i) => i !== index)
  })),

  duplicatePage: () => {
    const state = get();
    if (!state.canvas) return;
    const json = JSON.stringify((state.canvas as any).toJSON(CUSTOM_PROPS));
    const newPages = [...state.pages, json];
    set({
      numPages: state.numPages + 1,
      pages: newPages
    });
    get().setCurrentPage(newPages.length - 1);
  },

  setCurrentPage: (index) => {
    const state = get();
    if (!state.canvas) return;
    
    if (state.activeTool !== 'select') {
      state.setActiveTool('select');
    }
    
    const newPages = [...state.pages];
    newPages[state.currentPageIndex] = JSON.stringify((state.canvas as any).toJSON(CUSTOM_PROPS));
    
    set({ currentPageIndex: index, pages: newPages, isHistoryLoading: true });

    if (newPages[index]) {
      const loadPromise = (state.canvas as any).loadFromJSON(newPages[index]);
      const handleLoaded = () => {
        state.canvas?.renderAll();
        const fn = get().updatePageBackgroundFn;
        if (fn) fn();
        set({ isHistoryLoading: false });
      };
      if (loadPromise && loadPromise.then) {
        loadPromise.then(handleLoaded);
      } else {
        handleLoaded();
      }
    } else {
      state.canvas.clear();
      state.canvas.backgroundColor = '#f3f4f6';
      state.canvas.renderAll();
      const fn = get().updatePageBackgroundFn;
      if (fn) fn();
      set({ isHistoryLoading: false });
    }
  },

  addAsset: (url) => set((state) => ({
    assets: [...state.assets, url]
  })),

  saveTemplate: () => {
    const state = get();
    if (!state.canvas) return;
    const json = JSON.stringify((state.canvas as any).toJSON(CUSTOM_PROPS));
    const newPages = [...state.pages];
    newPages[state.currentPageIndex] = json;
    set({ pages: newPages, showSaveNotification: true });
    setTimeout(() => set({ showSaveNotification: false }), 2000);
  },

  saveHistory: (label = 'Action') => {
    const state = get();
    if (!state.canvas || state.isHistoryLoading) return;
    
    const json = (state.canvas as any).toJSON(CUSTOM_PROPS);
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    
    if (newHistory.length === 0 || newHistory.length % 10 === 0) {
      newHistory.push({ label, type: 'full', data: json });
    } else {
      const prevEntry = newHistory[newHistory.length - 1];
      let prevFullData: any;
      
      if (prevEntry.type === 'full') {
        prevFullData = prevEntry.data;
      } else {
        let lastFullIdx = newHistory.length - 1;
        while (newHistory[lastFullIdx].type !== 'full') lastFullIdx--;
        let reconstructed = JSON.parse(JSON.stringify((newHistory[lastFullIdx] as any).data));
        for (let i = lastFullIdx + 1; i < newHistory.length; i++) {
          reconstructed = applyPatch(reconstructed, (newHistory[i] as any).data).newDocument;
        }
        prevFullData = reconstructed;
      }
      
      const patch = compare(prevFullData, json);
      if (patch.length === 0) return; // No change
      newHistory.push({ label, type: 'patch', data: patch });
    }

    if (newHistory.length > 50) newHistory.shift();
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  _getHistoryState: (index: number) => {
    const state = get();
    if (index < 0 || index >= state.history.length) return null;
    
    let lastFullIdx = index;
    while (state.history[lastFullIdx].type !== 'full') lastFullIdx--;
    
    let reconstructed = JSON.parse(JSON.stringify((state.history[lastFullIdx] as any).data));
    for (let i = lastFullIdx + 1; i <= index; i++) {
      reconstructed = applyPatch(reconstructed, (state.history[i] as any).data).newDocument;
    }
    return reconstructed;
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      state.jumpToHistory(state.historyIndex - 1);
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      state.jumpToHistory(state.historyIndex + 1);
    }
  },

  jumpToHistory: (index: number) => {
    const state = get();
    const data = state._getHistoryState(index);
    if (data && state.canvas) {
      set({ isHistoryLoading: true, historyIndex: index });
      (state.canvas as any).loadFromJSON(data).then(() => {
        state.canvas?.renderAll();
        const fn = get().updatePageBackgroundFn;
        if (fn) fn();
        set({ isHistoryLoading: false });
      });
    }
  },

  fitProjectToScreen: () => {}, 
  centerProject: () => {},
  zoomTo100: () => {},
}));
