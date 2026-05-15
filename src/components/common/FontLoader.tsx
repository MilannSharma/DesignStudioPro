/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { GOOGLE_FONTS } from '../../utils/fonts';

export const FontLoader: React.FC = () => {
  const { pages, canvas } = useStore();
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(['Inter', 'Outfit']));

  useEffect(() => {
    // Collect all fonts from pages
    const usedFonts = new Set(['Inter', 'Outfit']);
    
    pages.forEach(pageJson => {
      try {
        const page = JSON.parse(pageJson);
        const objects = page.objects || [];
        objects.forEach((obj: any) => {
          if (obj.fontFamily && GOOGLE_FONTS.includes(obj.fontFamily)) {
            usedFonts.add(obj.fontFamily);
          }
        });
      } catch (e) {}
    });

    // Also check current canvas
    if (canvas) {
      canvas.getObjects().forEach(obj => {
        const font = (obj as any).fontFamily;
        if (font && GOOGLE_FONTS.includes(font)) {
          usedFonts.add(font);
        }
      });
    }

    // Compare with currently loaded
    const newFonts = Array.from(usedFonts).filter(f => !loadedFonts.has(f));
    if (newFonts.length > 0) {
      const nextSet = new Set([...Array.from(loadedFonts), ...newFonts]);
      loadFonts(newFonts);
      setLoadedFonts(nextSet);
    }
  }, [pages, canvas]);

  const loadFonts = (fonts: string[]) => {
    if (fonts.length === 0) return;
    
    const families = fonts.map(f => `${f.replace(/ /g, '+')}:wght@400;700`).join('&family=');
    const url = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    
    const link = document.createElement('link');
    link.href = url;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Also use document.fonts.load to ensure they are ready for Fabric
    fonts.forEach(f => {
      //@ts-ignore
      if (document.fonts && document.fonts.load) {
        //@ts-ignore
        document.fonts.load(`14px ${f}`).then(() => {
          if (canvas) canvas.renderAll();
        });
      }
    });
  };

  return null;
};
