import Sanscript from '@indic-transliteration/sanscript';

const COMMON_DICTIONARY: Record<string, string> = {
  sharma: 'शर्मा',
  saharma: 'शर्मा', // Common typo/mis-mapping
  milan: 'मिलन',
  sharm: 'शर्म',
  namaste: 'नमस्ते',
  shree: 'श्री',
  shri: 'श्री',
  kumar: 'कुमार',
  singh: 'सिंह',
  aditya: 'आदित्य',
  sahara: 'सहारा',
  rahul: 'राहुल',
  prarthana: 'प्रार्थना',
  kshama: 'क्षमा',
  gyaan: 'ज्ञान',
  shakti: 'शक्ति',
  bharat: 'भारत',
  mahesh: 'महेश',
  suresh: 'सुरेश',
  rohit: 'रोहित',
  vikas: 'विकास',
  sanjay: 'संजय',
  amit: 'अमित',
  pooja: 'पूजा',
  neha: 'नेहा',
  kavita: 'कविता',
  rajesh: 'राजेश',
  ram: 'राम',
  krishna: 'कृष्ण',
  shiv: 'शिव',
  rajput: 'राजपूत',
  priyansh: 'प्रियंश',
  design: 'डिजाइन',
  studio: 'स्टूडियो',
  pamplet: 'पम्फलेट',
  card: 'कार्ड',
  adhar: 'आधार',
  id: 'आईडी',
  name: 'नाम',
  my: 'माय',
  me: 'मी',
  am: 'एम',
  is: 'इज',
  hello: 'हेलो'
};

export function transliterate(text: string, sanscriptScheme: string): string {
  if (!sanscriptScheme || !text) {
    return text;
  }

  const input = text.trim();
  const lower = input.toLowerCase();

  // Special case for common words (assumes Devanagari output for Hindi/Marathi)
  if ((sanscriptScheme === 'devanagari' || sanscriptScheme === 'marathi') && COMMON_DICTIONARY[lower]) {
    return COMMON_DICTIONARY[lower];
  }

  // Use sanscript.js to transliterate from ITRANS to the target scheme
  try {
    return Sanscript.t(text, 'itrans', sanscriptScheme);
  } catch (error) {
    console.error('Transliteration error:', error);
    return text;
  }
}

const suggestionCache = new Map<string, string[]>();

export async function getSuggestions(text: string, itc: string, sanscriptScheme: string, signal?: AbortSignal): Promise<string[]> {
  if (!text) return [];
  
  const cacheKey = `${itc}:${sanscriptScheme}:${text}`;
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }

  const lower = text.trim().toLowerCase();

  // FIRST PRIORITY: Custom Dictionary (Strict Phonetic Accuracy)
  if (sanscriptScheme && (sanscriptScheme === 'devanagari' || sanscriptScheme === 'marathi')) {
    if (COMMON_DICTIONARY[lower]) {
      const result = [COMMON_DICTIONARY[lower]];
      suggestionCache.set(cacheKey, result);
      return result;
    }
  }

  // SECOND PRIORITY: Google Input Tools API (Dynamic Phonetics)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Give Google 2 seconds

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }

    if (itc) {
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data[0] === 'SUCCESS') {
        const results = data[1][0][1];
        suggestionCache.set(cacheKey, results);
        return results; // Return Google's highly accurate phonetic suggestions!
      }
    }
  } catch (e: any) {
    if (e.name === 'AbortError' && signal?.aborted) throw e;
    console.warn("Google Input Tools failed. Falling back to offline dictionary/Sanscript.");
  }

  // FALLBACK: Sanscript (Rigid scientific rules)
  if (sanscriptScheme) {
    const fallback = transliterate(text, sanscriptScheme);
    if (fallback && fallback !== text) {
      const result = [fallback];
      suggestionCache.set(cacheKey, result);
      return result;
    }
  }

  return [];
}

export function loadGoogleFont(fontName: string) {
  if (!fontName || fontName === 'Inter') return;
  const id = `font-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}
