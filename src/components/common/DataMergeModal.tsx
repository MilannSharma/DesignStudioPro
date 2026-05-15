/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Database, Upload, X, CheckCircle2, Play } from 'lucide-react';
import { handleCSVData } from '../../utils/canvasUtils';

export const DataMergeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { canvas } = useStore();
  const [data, setData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCSVData(file, (csvData) => {
        setData(csvData);
      });
    }
  };

  const applyRecord = async (index: number) => {
    const record = data[index];
    if (!record || !canvas) return;

    const objects = canvas.getObjects();
    for (const obj of objects) {
      const csvField = Object.keys(mapping).find(key => mapping[key] === obj.name || mapping[key] === (obj as any).__uid);
      if (!csvField) continue;
      
      const val = String(record[csvField]);

      if (obj.type === 'textbox' || obj.type === 'i-text') {
        (obj as any).set('text', val);
      } 
      else if ((obj as any).qrData !== undefined) {
        // Regenerate QR Code
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(val, { margin: 1, width: 256 });
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            (obj as any).setElement(img);
            (obj as any).qrData = val;
            resolve();
          };
          img.src = dataUrl;
        });
      }
      else if (obj.type === 'image' && (val.startsWith('http') || val.startsWith('data:'))) {
        // Update image source
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            (obj as any).setElement(img);
            resolve();
          };
          img.src = val;
        });
      }
    }
    
    canvas.renderAll();
    setCurrentIndex(index);
  };

  const handleBatchExport = async () => {
    if (data.length === 0 || !canvas) return;
    setIsExporting(true);
    setProgress(0);
    
    const JSZip = (await import('jszip')).default;
    const { getPageDataURL } = await import('../../utils/canvasUtils');
    const zip = new JSZip();

    for (let i = 0; i < data.length; i++) {
      await applyRecord(i);
      const dataUrl = getPageDataURL(canvas, 'png');
      const base64 = dataUrl.split(',')[1];
      zip.file(`record_${i + 1}.png`, base64, { base64: true });
      setProgress(Math.round(((i + 1) / data.length) * 100));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `batch_export_${new Date().getTime()}.zip`;
    link.click();
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#222] border border-[#333] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-white font-display font-bold">
            <Database size={18} className="text-blue-500" />
            Data Merge (CSV)
          </h2>
          <button onClick={onClose} title="Close" aria-label="Close" className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          {data.length === 0 ? (
            <div className="border-2 border-dashed border-[#333] rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Upload size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">Upload a CSV file to begin data merge for ID cards or certificates.</p>
              <label className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors shadow-lg shadow-blue-900/40">
                Choose CSV File
                <input type="file" accept=".csv" className="hidden" onChange={onFileUpload} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Map CSV Fields</h3>
                <div className="space-y-2">
                  {Object.keys(data[0]).map(field => (
                    <div key={field} className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded border border-[#333]">
                      <span className="text-xs text-gray-300">{field}</span>
                      <select 
                        title={`Map ${field} to canvas object`}
                        aria-label={`Map ${field} to canvas object`}
                        className="bg-black text-[10px] text-blue-400 border-0 outline-none"
                        onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                        value={mapping[field] || ''}
                      >
                        <option value="">Map to Object...</option>
                        {canvas?.getObjects().filter(o => !(o as any).isPageBackground).map((obj: any, i) => {
                          const label = obj.name || `${obj.type} ${obj.__uid || i}`;
                          return <option key={i} value={obj.name || obj.__uid || `obj-${i}`}>{label}</option>;
                        })}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview Records ({data.length})</h3>
                <div className="bg-[#1a1a1a] rounded border border-[#333] p-4 flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <button 
                      disabled={currentIndex === 0}
                      onClick={() => applyRecord(currentIndex - 1)}
                      className="text-xs bg-[#333] px-2 py-1 rounded disabled:opacity-30"
                    >Prev</button>
                    <span className="text-xs font-mono text-blue-500">{currentIndex + 1} / {data.length}</span>
                    <button 
                      disabled={currentIndex === data.length - 1}
                      onClick={() => applyRecord(currentIndex + 1)}
                      className="text-xs bg-[#333] px-2 py-1 rounded disabled:opacity-30"
                    >Next</button>
                  </div>
                  <pre className="text-[10px] text-gray-500 bg-black/30 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(data[currentIndex], null, 2)}
                  </pre>
                </div>
                <button 
                  onClick={handleBatchExport}
                  className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/40"
                >
                  <Play size={16} />
                  Batch Export All
                </button>
              </div>
            </div>
          )}
        </div>
        
        {isExporting && (
          <div className="absolute inset-0 bg-black/80 z-[110] flex flex-col items-center justify-center p-12">
            <div className="w-full max-w-sm bg-[#1a1a1a] p-1 rounded-full border border-[#333] mb-4">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white font-bold text-lg mb-2">Exporting {progress}%</p>
            <p className="text-gray-500 text-sm">Generating high-resolution records and packing ZIP...</p>
          </div>
        )}
      </div>
    </div>
  );
};
