/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Download, Camera, FileText, EyeOff, Sparkles, ImageIcon, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { IText, FabricObject } from 'fabric';

export const PreviewModal: React.FC = () => {
  const { 
    previewMode, 
    setPreviewMode, 
    canvas, 
    testData, 
    setTestData, 
    settings, 
    numPages 
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [isAddingField, setIsAddingField] = React.useState(false);
  const [newFieldName, setNewFieldName] = React.useState('');


  if (!previewMode) return null;

  // ═══════════════════════════════════════
  // AUTO-DETECT all {{fields}} and image placeholders from canvas
  // ═══════════════════════════════════════
  const detectedFields: string[] = [];
  const detectedImagePlaceholders: string[] = [];

  if (canvas) {
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      // Detect text fields with {{field_name}} pattern
      if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
        const text = obj.text || '';
        const matches = text.matchAll(/\{\{(\w+)\}\}/g);
        for (const match of matches) {
          const fieldName = match[1];
          if (!detectedFields.includes(fieldName)) {
            detectedFields.push(fieldName);
          }
        }
      }

      // Detect image placeholders
      if (obj.name && (obj.name.toLowerCase().includes('photo') || obj.name.toLowerCase().includes('image') || obj.name.toLowerCase().includes('placeholder') || obj.name.toLowerCase().includes('avatar') || obj.name.toLowerCase().includes('logo'))) {
        const placeholderKey = obj.name.replace(/\s+/g, '_').toLowerCase();
        if (!detectedImagePlaceholders.includes(placeholderKey)) {
          detectedImagePlaceholders.push(placeholderKey);
        }
      }
      if (obj.isPlaceholder) {
        const placeholderKey = (obj.name || 'photo').replace(/\s+/g, '_').toLowerCase();
        if (!detectedImagePlaceholders.includes(placeholderKey)) {
          detectedImagePlaceholders.push(placeholderKey);
        }
      }
    });
  }

  // Ensure all detected fields have a testData entry
  const ensuredTestData = { ...testData };
  detectedFields.forEach(f => {
    if (!(f in ensuredTestData)) {
      ensuredTestData[f] = '';
    }
  });
  // Only show fields that are actually detected on the canvas
  const allTextFields = [...detectedFields];
  const allImageFields = [...detectedImagePlaceholders];

  const getPreviewImage = () => {
    if (!canvas) return '';
    
    const originalContents: Record<number, string> = {};
    const objects = canvas.getObjects();
    
    objects.forEach((obj, i) => {
      if (obj instanceof IText) {
        originalContents[i] = (obj as any).text;
        let newText = (obj as any).text;
        Object.entries(ensuredTestData).forEach(([key, val]) => {
          if (val && !key.endsWith('_photo') && !key.endsWith('_image') && !key.endsWith('_logo')) {
            newText = newText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val as string);
          }
        });
        (obj as any).set('text', newText);
      }
    });

    canvas.renderAll();
    const dataURL = canvas.toDataURL({ multiplier: 2 });

    // Revert
    objects.forEach((obj, i) => {
      if (obj instanceof IText && originalContents[i] !== undefined) {
        (obj as any).set('text', originalContents[i]);
      }
    });
    canvas.renderAll();

    return dataURL;
  };

  const previewImage = getPreviewImage();

  const exportPDF = () => {
    if (!previewImage) return;
    const { width, height, unit } = settings;
    
    let mmWidth = width;
    let mmHeight = height;
    
    if (unit === 'px') {
      mmWidth = width * 0.264583;
      mmHeight = height * 0.264583;
    } else if (unit === 'inch') {
      mmWidth = width * 25.4;
      mmHeight = height * 25.4;
    }

    const pdf = new jsPDF({
      orientation: mmWidth > mmHeight ? 'l' : 'p',
      unit: 'mm',
      format: [mmWidth, mmHeight]
    });

    pdf.addImage(previewImage, 'PNG', 0, 0, mmWidth, mmHeight);
    pdf.save('studio-export.pdf');
  };

  /**
   * Print Layout — tiles multiple cards on A4 sheet
   * Vertical card (56×88mm) on Portrait A4 (210×297mm): margins 14.5mm sides, 4.5mm top/bottom, gap 5mm H, 2mm V
   * Horizontal card (88×56mm) on Landscape A4 (297×210mm): margins 4.5mm sides, 14.5mm top/bottom, gap 2mm H, 5mm V
   */
  const exportPrintLayout = () => {
    if (!previewImage) return;
    const { width, height } = settings;

    // Determine card orientation from canvas aspect ratio
    const isVertical = height > width; // portrait/vertical card

    // Card dimensions in mm
    const cardW = isVertical ? 56 : 88;
    const cardH = isVertical ? 88 : 56;

    // A4 page setup
    const pageW = isVertical ? 210 : 297;  // portrait A4 for vertical cards, landscape for horizontal
    const pageH = isVertical ? 297 : 210;
    const orientation = isVertical ? 'p' : 'l';

    // Margins (mm)
    const marginX = isVertical ? 14.5 : 4.5;
    const marginY = isVertical ? 4.5 : 14.5;

    // Gap between cards (mm)
    const gapX = isVertical ? 5 : 2;
    const gapY = isVertical ? 2 : 5;

    // Calculate grid
    const availW = pageW - 2 * marginX;
    const availH = pageH - 2 * marginY;
    const cols = Math.floor((availW + gapX) / (cardW + gapX));
    const rows = Math.floor((availH + gapY) / (cardH + gapY));
    const totalCards = cols * rows;

    // Center the grid on page
    const gridW = cols * cardW + (cols - 1) * gapX;
    const gridH = rows * cardH + (rows - 1) * gapY;
    const startX = (pageW - gridW) / 2;
    const startY = (pageH - gridH) / 2;

    const pdf = new jsPDF({
      orientation: orientation as any,
      unit: 'mm',
      format: 'a4'
    });

    // Draw cut marks & cards
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        // Add card image
        pdf.addImage(previewImage, 'PNG', x, y, cardW, cardH);

        // Draw thin cut marks (corners)
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.2);
        const markLen = 3;

        // Top-left corner
        pdf.line(x - markLen, y, x - 0.5, y);
        pdf.line(x, y - markLen, x, y - 0.5);

        // Top-right corner
        pdf.line(x + cardW + 0.5, y, x + cardW + markLen, y);
        pdf.line(x + cardW, y - markLen, x + cardW, y - 0.5);

        // Bottom-left corner
        pdf.line(x - markLen, y + cardH, x - 0.5, y + cardH);
        pdf.line(x, y + cardH + 0.5, x, y + cardH + markLen);

        // Bottom-right corner
        pdf.line(x + cardW + 0.5, y + cardH, x + cardW + markLen, y + cardH);
        pdf.line(x + cardW, y + cardH + 0.5, x + cardW, y + cardH + markLen);
      }
    }

    // Footer info
    pdf.setFontSize(6);
    pdf.setTextColor(180, 180, 180);
    pdf.text(
      `Print Layout: ${cols}×${rows} = ${totalCards} cards | Card: ${cardW}×${cardH}mm | Page: A4 ${orientation === 'p' ? 'Portrait' : 'Landscape'}`,
      pageW / 2, pageH - 2,
      { align: 'center' }
    );

    pdf.save(`print-layout-${cols}x${rows}.pdf`);
  };

  const formatFieldLabel = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleImageUpload = (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setTestData({ ...ensuredTestData, [fieldKey]: re.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const hasAnyFields = allTextFields.length > 0 || allImageFields.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          className="bg-white border border-gray-100 rounded-[48px] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-10 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[28px] bg-blue-600 shadow-2xl shadow-blue-200 flex items-center justify-center text-white transform hover:rotate-3 transition-transform">
                <Eye size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Studio Preview</h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                   <p className="text-[10px] text-blue-600 font-bold tracking-[0.3em] uppercase">
                     {detectedFields.length} Fields Detected • Live Preview
                   </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setPreviewMode(false)} 
              title="Close Preview"
              aria-label="Close Preview"
              className="w-14 h-14 rounded-full bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all active:scale-90 border border-gray-100"
            >
              <X size={32} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Preview Area */}
            <div className="flex-1 bg-gray-50/50 flex flex-col items-center justify-center p-12 overflow-auto relative">
              <div className="absolute inset-0 pattern-grid opacity-[0.03] scale-150" />
              
              <div className="flex flex-wrap justify-center gap-20 relative z-10">
                <div className="space-y-6">
                   <div className="px-5 py-2 bg-white rounded-full shadow-sm border border-gray-100 w-fit mx-auto flex items-center gap-3">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Front View</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   </div>
                   <div className="relative group">
                     <div className="absolute -inset-10 bg-blue-600/5 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                     <img src={previewImage} alt="Front Preview" className="relative shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)] rounded-3xl max-w-full h-auto border border-white ring-1 ring-gray-100 transition-transform group-hover:scale-[1.01] duration-500" />
                   </div>
                </div>
                
                {numPages > 1 && (
                  <div className="space-y-6 opacity-40 hover:opacity-100 transition-all duration-700">
                    <div className="px-5 py-2 bg-white rounded-full shadow-sm border border-gray-100 w-fit mx-auto flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Back View</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    </div>
                    <div className="relative bg-white shadow-[0_60px_120px_-30px_rgba(0,0,0,0.1)] rounded-3xl border border-gray-50 flex flex-col items-center justify-center gap-6 min-w-[400px] aspect-[86/54] group">
                       <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all duration-500">
                         <EyeOff size={40} />
                       </div>
                       <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest text-center leading-relaxed">
                         Rear Panel Render <br/>
                         <span className="text-[9px] opacity-60">Separate logical output</span>
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Data Fields Editor */}
            <div className="w-[450px] bg-white border-l border-gray-50 p-8 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <h3 className="text-sm text-gray-900 font-black tracking-tighter uppercase flex items-center gap-3 italic">
                  <div className="w-2 h-8 bg-blue-600 rounded-full" />
                  Test Data
                </h3>
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black tracking-widest uppercase">
                  {allTextFields.length + allImageFields.length} Fields
                </div>
              </div>

              {!hasAnyFields && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-gray-400">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <RefreshCw size={32} className="text-gray-200" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 mb-2">No Data Fields Found</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed max-w-[280px]">
                    Add data fields to your template using Quick Tasks → Text & Fields (e.g., Name Field, Roll No., etc.) to see them here for preview testing.
                  </p>
                </div>
              )}

              {hasAnyFields && (
                <div className="space-y-8 flex-1">
                  {/* Image Upload Fields */}
                  {allImageFields.length > 0 && (
                    <div>
                      <label className="text-[10px] text-gray-400 block uppercase font-black tracking-[0.2em] mb-3 px-1">
                        📷 Photo / Image Fields
                      </label>
                      <div className="space-y-3">
                        {allImageFields.map(imgField => (
                          <div key={imgField}>
                            <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1.5 px-1">
                              {formatFieldLabel(imgField)}
                            </div>
                            <button 
                              onClick={() => {
                                const input = photoInputRefs.current[imgField];
                                if (input) input.click();
                              }}
                              className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-100 hover:border-blue-600/30 bg-gray-50/50 flex flex-col items-center justify-center gap-3 text-gray-300 hover:text-blue-600 transition-all overflow-hidden relative group shadow-inner"
                            >
                              {ensuredTestData[imgField] ? (
                                <>
                                  <img src={ensuredTestData[imgField]} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={imgField} />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="relative z-10 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-900">Change</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                    <Camera size={20} />
                                  </div>
                                  <span className="text-[9px] font-black tracking-[0.2em] uppercase">Upload {formatFieldLabel(imgField)}</span>
                                </>
                              )}
                            </button>
                            <input 
                              type="file" 
                              className="hidden" 
                              ref={el => { photoInputRefs.current[imgField] = el; }}
                              accept="image/*"
                              title={`Upload ${formatFieldLabel(imgField)}`}
                              aria-label={`Upload ${formatFieldLabel(imgField)}`}
                              onChange={(e) => handleImageUpload(imgField, e)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Data Fields */}
                  {allTextFields.length > 0 && (
                    <div>
                      <label className="text-[10px] text-gray-400 block uppercase font-black tracking-[0.2em] mb-3 px-1">
                        📝 Text Fields ({allTextFields.length})
                      </label>
                      <div className="space-y-4">
                        {allTextFields.map(field => (
                          <div key={field} className="space-y-1.5 group">
                            <label className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider px-1 transition-colors group-focus-within:text-blue-600">
                              {formatFieldLabel(field)}
                            </label>
                            <input 
                              type="text"
                              title={`Enter ${formatFieldLabel(field)}`}
                              aria-label={formatFieldLabel(field)}
                              placeholder={`Enter ${formatFieldLabel(field)}...`}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                              value={ensuredTestData[field] || ''}
                              onChange={(e) => setTestData({ ...ensuredTestData, [field]: e.target.value })}
                              spellCheck={false}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAddingField ? (
                    <div className="w-full p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/20">
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Field name (e.g. father_name)"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] mb-2 focus:outline-none focus:border-blue-500"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newFieldName) {
                            const key = newFieldName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                            setTestData({ ...ensuredTestData, [key]: '' });
                            setIsAddingField(false);
                            setNewFieldName('');
                          } else if (e.key === 'Escape') {
                            setIsAddingField(false);
                            setNewFieldName('');
                          }
                        }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setIsAddingField(false); setNewFieldName(''); }} className="text-[10px] text-gray-500 hover:text-gray-700 uppercase font-bold tracking-widest px-2 py-1">Cancel</button>
                        <button onClick={() => {
                          if (newFieldName) {
                            const key = newFieldName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                            setTestData({ ...ensuredTestData, [key]: '' });
                            setIsAddingField(false);
                            setNewFieldName('');
                          }
                        }} className="text-[10px] bg-blue-600 text-white rounded px-3 py-1 uppercase font-bold tracking-widest">Add</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingField(true)}
                      className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl text-[10px] text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all font-black uppercase tracking-[0.15em] bg-gray-50/20"
                    >
                      + Add Custom Field
                    </button>
                  )}
                </div>
              )}

              {/* Export Actions */}
              <div className="mt-8 pt-6 border-t border-gray-50 space-y-3">
                <button 
                  className="w-full py-5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:scale-95"
                  onClick={exportPDF}
                >
                  <FileText size={16} /> Export Single PDF
                </button>
                <button 
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:scale-95"
                  onClick={exportPrintLayout}
                >
                  <FileText size={16} /> 🖨️ Print Layout (A4 Sheet)
                </button>
                <div className="text-[9px] text-gray-400 text-center">
                  Multiple cards tiled on A4 with cut marks
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    className="py-4 bg-white border border-gray-100 hover:bg-gray-50 text-gray-900 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 hover:border-gray-200"
                    onClick={() => {
                       const link = document.createElement('a');
                       link.download = `${ensuredTestData.student_name || ensuredTestData.name || 'export'}.png`;
                       link.href = previewImage || '';
                       link.click();
                    }}
                  >
                    <Download size={14} /> PNG
                  </button>
                  <button className="py-4 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">
                     <Sparkles size={14} /> Cloud Sync
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
