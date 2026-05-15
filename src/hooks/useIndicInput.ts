import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { LANGUAGES } from '../lib/transliteration/languageConfig';
import { getSuggestions, loadGoogleFont } from '../lib/transliteration/engine';

export function useIndicInput() {
  const { canvas, saveHistory } = useStore();
  const processingRef = useRef(false);
  const historyTimeout = useRef<any>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [activeWordInfo, setActiveWordInfo] = useState<{
    word: string;
    start: number;
    end: number;
    obj: any;
  } | null>(null);

  const lastConversionRef = useRef<{
    start: number;
    nativeWord: string;
    englishWord: string;
    cursorAfterSpace: number;
  } | null>(null);

  const replaceWordInObject = useCallback(
    (
      obj: any,
      start: number,
      end: number,
      replacement: string,
      newCursor: number
    ) => {
      const oldText = obj.text || '';
      const newText =
        oldText.substring(0, start) +
        replacement +
        oldText.substring(end);

      obj.set({ text: newText });
      obj.dirty = true;
      obj.initDimensions();

      if (obj.isEditing) {
        obj.selectionStart = newCursor;
        obj.selectionEnd = newCursor;
        if (obj.hiddenTextarea) {
          obj.hiddenTextarea.value = newText;
          obj.hiddenTextarea.selectionStart = newCursor;
          obj.hiddenTextarea.selectionEnd = newCursor;
        }
        obj.hiddenTextarea?.focus();
      }

      obj.canvas?.requestRenderAll();
      setTimeout(() => obj.canvas?.requestRenderAll(), 50);

      clearTimeout(historyTimeout.current);
      historyTimeout.current = setTimeout(() => saveHistory(), 300);
    },
    [saveHistory]
  );

  const ensureIndicFont = useCallback(
    (obj: any, config: any) => {
      if (!config || config.id === 'en') return;

      if (config.googleFont) {
        loadGoogleFont(config.googleFont);
      }

      obj.set({
        fontFamily: config.fontFamily,
        splitByGrapheme: true
      });

      obj.dirty = true;
      obj.initDimensions();
      obj.canvas?.requestRenderAll();
    },
    []
  );

  useEffect(() => {
    if (!canvas) {
      setSuggestions([]);
      return;
    }

    const handleTextChange = async (e: any) => {
      if (processingRef.current) return;

      const obj = e.target;
      if (!obj || !obj.isEditing) return;

      // Infer language from fontFamily
      const config = LANGUAGES.find(l => l.fontFamily === obj.fontFamily);
      if (!config || config.id === 'en' || !config.itc) {
        setSuggestions([]);
        return;
      }

      ensureIndicFont(obj, config);

      const text: string = obj.text || '';
      const cursor: number = obj.selectionStart !== undefined ? obj.selectionStart : (obj.hiddenTextarea ? obj.hiddenTextarea.selectionStart : text.length);

      // Handle Backspace Reversion
      if (lastConversionRef.current) {
        const { start, nativeWord, englishWord, cursorAfterSpace } = lastConversionRef.current;
        if (cursor === cursorAfterSpace - 1) {
           const currentWordAtPos = text.substring(start, cursor);
           if (currentWordAtPos === nativeWord) {
             processingRef.current = true;
             replaceWordInObject(obj, start, cursor, englishWord, start + englishWord.length);
             lastConversionRef.current = null;
             processingRef.current = false;
             return;
           }
        }
        if (cursor !== cursorAfterSpace) {
          lastConversionRef.current = null;
        }
      }

      // Space/Enter pressed: convert the preceding latin word
      if (
        cursor > 0 &&
        (text[cursor - 1] === ' ' || text[cursor - 1] === '\n') &&
        text[cursor - 2] !== ' '
      ) {
        const spaceIdx = cursor - 1;
        let pwStart = spaceIdx - 1;
        while (pwStart >= 0 && text[pwStart] !== ' ' && text[pwStart] !== '\n') {
          pwStart--;
        }
        pwStart++;

        const previousWord = text.substring(pwStart, spaceIdx);

        if (previousWord && /^[a-zA-Z]+$/.test(previousWord)) {
          processingRef.current = true;
          setSuggestions([]);

          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          const controller = new AbortController();
          abortControllerRef.current = controller;
          const requestId = ++requestIdRef.current;

          try {
            const sug = await getSuggestions(previousWord, config.itc, config.sanscriptScheme, controller.signal);
            if (!mountedRef.current || requestId !== requestIdRef.current) {
              processingRef.current = false;
              return;
            }

            if (sug && sug.length > 0 && sug[0] !== previousWord) {
              const nativeWord = sug[0];
              const newCursor = pwStart + nativeWord.length + 1; // +1 for the space that we kept
              replaceWordInObject(obj, pwStart, spaceIdx, nativeWord, newCursor);

              lastConversionRef.current = {
                start: pwStart,
                nativeWord,
                englishWord: previousWord,
                cursorAfterSpace: newCursor
              };
            }
          } catch (err) {
            if (!mountedRef.current || requestId !== requestIdRef.current) {
              processingRef.current = false;
              return;
            }
          }
          processingRef.current = false;
          setSuggestions([]);
          return;
        }

        setSuggestions([]);
        return;
      }

      // Actively typing: show live suggestion popup
      let wordStart = cursor - 1;
      while (wordStart >= 0 && text[wordStart] !== ' ' && text[wordStart] !== '\n') {
        wordStart--;
      }
      wordStart++;

      const currentWord = text.substring(wordStart, cursor);

      if (currentWord && /^[a-zA-Z]+$/.test(currentWord)) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const requestId = ++requestIdRef.current;

        try {
          const sug = await getSuggestions(currentWord, config.itc, config.sanscriptScheme, controller.signal);
          if (!mountedRef.current || requestId !== requestIdRef.current) return;

          setSuggestions(sug);
          setSelectedIndex(0);
          setActiveWordInfo({ word: currentWord, start: wordStart, end: cursor, obj });

          const point = obj.getPointByOrigin('left', 'top');
          const viewport = obj.canvas?.viewportTransform || [1, 0, 0, 1, 0, 0];
          const canvasEl = obj.canvas?.getElement?.();
          const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0 };
          
          const screenX = canvasRect.left + (point.x * viewport[0] + viewport[4]);
          const screenY = canvasRect.top + (point.y * viewport[3] + viewport[5]);
          setPopupPos({ top: screenY, left: screenX });
        } catch (_) {
          if (!mountedRef.current || requestId !== requestIdRef.current) return;
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    canvas.on('text:changed', handleTextChange);
    return () => {
      canvas.off('text:changed', handleTextChange);
    };
  }, [canvas, ensureIndicFont, replaceWordInObject]);

  // Arrow/Enter/Escape navigation for suggestion popup
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => (p + 1) % suggestions.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => (p - 1 + suggestions.length) % suggestions.length); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (activeWordInfo) handleSelect(suggestions[selectedIndex]); }
      else if (e.key === 'Escape') { setSuggestions([]); }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [suggestions, selectedIndex, activeWordInfo]);

  const handleSelect = useCallback(
    (word: string) => {
      if (!activeWordInfo) return;
      const { start, end, obj } = activeWordInfo;
      const englishWord = activeWordInfo.word;
      const withSpace = word + ' ';
      const newCursor = start + withSpace.length;
      
      replaceWordInObject(obj, start, end, withSpace, newCursor);

      lastConversionRef.current = {
        start,
        nativeWord: word,
        englishWord: englishWord,
        cursorAfterSpace: newCursor
      };

      setSuggestions([]);
      setActiveWordInfo(null);
    },
    [activeWordInfo, replaceWordInObject]
  );

  return { suggestions, selectedIndex, popupPos, handleSelect };
}

