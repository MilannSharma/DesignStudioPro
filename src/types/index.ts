/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas, Object as FabricObject } from 'fabric';

export type Tool = 'select' | 'rect' | 'roundedRect' | 'ellipse' | 'line' | 'arrow' | 'polygon' | 'star' | 'pencil' | 'pen' | 'text' | 'v-text' | 'field' | 'image' | 'frame' | 'qr' | 'eraser' | 'hand' | 'callout' | 'spiral' | 'marquee' | 'lasso' | 'wand' | 'eyedropper' | 'bucket' | 'crop';
export type SidebarPanel = 'props' | 'layers' | 'history' | 'swatches' | 'symbols' | 'shapes' | 'info' | 'brush' | 'text' | 'para' | 'css' | 'translator';

export interface DocumentSettings {
  width: number;
  height: number;
  dpi: number;
  unit: 'px' | 'mm' | 'cm' | 'inch';
  bleed: number;
  margin: number;
  orientation: 'portrait' | 'landscape';
  colorMode?: 'rgb' | 'cmyk';
}

export interface GuideLine {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number; // in canvas/scene coordinates
}

export interface StoreState {
  // Canvas State
  canvas: Canvas | null;
  activeTool: Tool;
  selectedObjects: FabricObject[];
  
  // Document State
  settings: DocumentSettings;
  pages: string[]; // JSON strings of canvas state
  currentPageIndex: number;
  
  // UI State
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  showGuides: {
    bleed: boolean;
    margin: boolean;
    safeZone: boolean;
  };
  guideSettings: {
    bleedColor: string;
    marginColor: string;
    safeZoneColor: string;
    thickness: number;
  };
  isDark: boolean;
  showDataMerge: boolean;
  isInitialized: boolean;
  defaultFontFamily: string;
  projectName: string;
  numPages: number;
  assets: string[]; // URLs of imported images
  history: { label: string; data: string }[];
  historyIndex: number;
  _getHistoryState: (index: number) => { label: string; data: string } | null;
  symbols: string[]; // JSON strings of reusable objects
  isHistoryLoading: boolean;
  isAltPressed: boolean;
  
  // Preview & Batch
  previewMode: boolean;
  testData: Record<string, string>;

  // Guide lines (draggable from rulers)
  guideLines: GuideLine[];

  // Color system
  recentColors: string[];

  // Clipboard
  copiedObjectJson: string | null;

  // Page background callback
  updatePageBackgroundFn: (() => void) | null;
  
  // Multi-language support
  activeLanguage: string;
  
  // Notification State
  showSaveNotification: boolean;
  showSearchReplace: boolean;
  showNewProject: boolean;
  activeSidebarPanel: SidebarPanel;
  
  // Actions
  setCanvas: (canvas: Canvas | null) => void;
  setActiveTool: (tool: Tool) => void;
  setSelectedObjects: (objects: FabricObject[]) => void;
  setZoom: (zoom: number) => void;
  setActiveLanguage: (lang: string) => void;
  setSettings: (settings: Partial<DocumentSettings>) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuide: (type: 'bleed' | 'margin' | 'safeZone') => void;
  setGuideSettings: (settings: Partial<StoreState['guideSettings']>) => void;
  setShowDataMerge: (show: boolean) => void;
  setShowNewProject: (show: boolean) => void;
  setDefaultFontFamily: (font: string) => void;
  setActiveSidebarPanel: (panel: SidebarPanel) => void;
  setPreviewMode: (show: boolean) => void;
  setTestData: (data: Record<string, string>) => void;
  initializeProject: (name: string, settings: DocumentSettings, pages: number) => void;
  addPage: () => void;
  duplicatePage: () => void;
  setCurrentPage: (index: number) => void;
  addAsset: (url: string) => void;
  saveHistory: (label?: string) => void;
  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
  fitProjectToScreen: () => void;
  centerProject: () => void;
  zoomTo100: () => void;
  setUpdatePageBackgroundFn: (fn: (() => void) | null) => void;
  addGuideLine: (guide: GuideLine) => void;
  removeGuideLine: (id: string) => void;
  addRecentColor: (color: string) => void;
  setCopiedObjectJson: (json: string | null) => void;
  setShowSaveNotification: (show: boolean) => void;
  setShowSearchReplace: (show: boolean) => void;
  saveTemplate: () => void;
  addSymbol: (json: string) => void;
  removeSymbol: (index: number) => void;
  setIsHistoryLoading: (loading: boolean) => void;
  setIsAltPressed: (isPressed: boolean) => void;
}
