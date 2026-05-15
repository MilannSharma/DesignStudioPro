/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas, FabricImage, IText, Rect, Circle } from 'fabric';
import Papa from 'papaparse';
import { useStore } from '../store/useStore';

export const importImage = async (canvas: Canvas, file: File) => {
  const reader = new FileReader();
  reader.onload = async (f) => {
    const data = f.target?.result as string;
    try {
      // Load via HTMLImageElement first for reliable dimensions
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        imgEl.onload = () => resolve();
        imgEl.onerror = () => reject(new Error('Image load failed'));
        imgEl.src = data;
      });

      const img = new FabricImage(imgEl);
      useStore.getState().addAsset(data);
      const s = useStore.getState().settings;
      
      const scaleBase = 800 / Math.max(s.width, s.height);
      const renderW = s.width * scaleBase;
      const renderH = s.height * scaleBase;
      const centerX = renderW / 2;
      const centerY = renderH / 2;

      const imgW = img.width || imgEl.naturalWidth || 100;
      const imgH = img.height || imgEl.naturalHeight || 100;

      const fitScale = Math.min(
        (renderW * 0.7) / imgW,
        (renderH * 0.7) / imgH
      );
      const safeScale = isFinite(fitScale) && fitScale > 0 ? fitScale : 0.5;

      img.set({
        originX: 'center',
        originY: 'center',
        left: centerX,
        top: centerY,
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
      img.setCoords();
      canvas.requestRenderAll();
      useStore.getState().saveHistory();
    } catch (err) {
      console.error("Failed to import image:", err);
    }
  };
  reader.readAsDataURL(file);
};

export const handleCSVData = (file: File, onComplete: (data: any[]) => void) => {
  Papa.parse(file, {
    header: true,
    complete: (results) => {
      onComplete(results.data);
    },
  });
};

/** Get export options cropped to exact page bounds */
export const getPageExportOptions = (canvas: Canvas, format: 'png' | 'jpeg' = 'png', qualityOrMultiplier?: number) => {
  const { settings } = useStore.getState();
  const vpt = canvas.viewportTransform;
  if (!vpt) return {};

  const zoom = canvas.getZoom();
  const multiplier = settings.dpi / 96;

  return {
    format,
    left: 0,
    top: 0,
    width: settings.width,
    height: settings.height,
    multiplier: multiplier,
    quality: format === 'jpeg' ? (qualityOrMultiplier || 0.92) : undefined,
  };
};

/** Export canvas as cropped DataURL (page bounds only) */
export const getPageDataURL = (canvas: Canvas, format: 'png' | 'jpeg' = 'png', quality?: number): string => {
  const { settings } = useStore.getState();
  const multiplier = settings.dpi / 96;

  // Temporarily set viewport to origin so export captures just the page area
  const origVpt = canvas.viewportTransform ? [...canvas.viewportTransform] : [1,0,0,1,0,0];
  
  // Set viewport to 1:1 at origin for clean export
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  const dataURL = canvas.toDataURL({
    format,
    left: 0,
    top: 0,
    width: settings.width,
    height: settings.height,
    multiplier,
    quality: format === 'jpeg' ? (quality || 0.92) : undefined,
  } as any);

  // Restore original viewport
  canvas.setViewportTransform(origVpt as any);
  
  return dataURL;
};

export const exportToPDF_Pro = async () => {
  const { jsPDF } = await import('jspdf');
  const { settings, pages, projectName } = useStore.getState();
  
  // Calculate dimensions in mm
  const mmWidth = settings.width * (25.4 / settings.dpi);
  const mmHeight = settings.height * (25.4 / settings.dpi);
  const mmBleed = settings.bleed;

  const pdf = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: [mmWidth + (mmBleed * 2), mmHeight + (mmBleed * 2)]
  });

  // Loop through pages
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    
    const canvas = useStore.getState().canvas;
    if (!canvas) continue;

    // For vector export, we use the SVG representation
    const svgStr = canvas.toSVG({
      width: settings.width as any,
      height: settings.height as any,
    });

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    // Use svg2pdf to render the SVG into the PDF
    const { svg2pdf } = await import('svg2pdf.js');
    await svg2pdf(svgElement, pdf, {
      xOffset: mmBleed,
      yOffset: mmBleed,
      scale: 25.4 / settings.dpi
    } as any);

    // Draw crop marks if bleed exists
    if (mmBleed > 0) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.1);
      // Top Left
      pdf.line(mmBleed, 0, mmBleed, mmBleed - 2);
      pdf.line(0, mmBleed, mmBleed - 2, mmBleed);
      // Top Right
      pdf.line(mmWidth + mmBleed, 0, mmWidth + mmBleed, mmBleed - 2);
      pdf.line(mmWidth + mmBleed + 2, mmBleed, mmWidth + (mmBleed * 2), mmBleed);
    }
  }

  pdf.save(`${projectName || 'design'}.pdf`);
};
