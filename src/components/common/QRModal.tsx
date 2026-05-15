/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { FabricImage } from 'fabric';
import { useStore } from '../../store/useStore';

interface QRModalProps {
  onClose: () => void;
  onGenerate: (img: FabricImage) => void;
}

export const QRModal: React.FC<QRModalProps> = ({ onClose, onGenerate }) => {
  const [text, setText] = useState('https://google.com');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text or a URL');
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(text, {
        margin: 2,
        width: 512,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const img = new Image();
      img.onload = () => {
        const s = useStore.getState().settings;
        const scaleBase = 800 / Math.max(s.width, s.height);
        const pageWidth = s.width * scaleBase;
        const pageHeight = s.height * scaleBase;

        const fabricImg = new FabricImage(img, {
          originX: 'center',
          originY: 'center',
          left: pageWidth / 2,
          top: pageHeight / 2,
          scaleX: 0.25,
          scaleY: 0.25,
        });
        (fabricImg as any).qrData = text; // Store data for future editing
        onGenerate(fabricImg);
      };
      img.src = dataUrl;
    } catch (err) {
      console.error('QR generation failed:', err);
      setError('Failed to generate QR code');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between bg-[#1e1e1e]">
          <h2 className="text-white font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
            <QrCode size={16} className="text-blue-500" /> Generate QR Code
          </h2>
          <button onClick={onClose} title="Close" aria-label="Close" className="text-[#666] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Source URL or Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all resize-none h-32"
              placeholder="Enter text or paste link here..."
            />
            {error && <p className="text-red-500 text-[10px] uppercase font-bold">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-2"
            >
              Add to Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
