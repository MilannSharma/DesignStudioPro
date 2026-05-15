const LANG_MAP: { [key: string]: string } = {
  'Noto Sans Devanagari': 'hi-t-i0-und',
  'Hindi': 'hi-t-i0-und',
  'Marathi': 'mr-t-i0-und',
  'Telugu': 'te-t-i0-und',
  'Tamil': 'ta-t-i0-und',
  'Gujarati': 'gu-t-i0-und',
  'Bengali': 'bn-t-i0-und',
  'Punjabi': 'pa-t-i0-und',
  'Kannada': 'kn-t-i0-und',
  'Malayalam': 'ml-t-i0-und',
  'Arabic': 'ar-t-i0-und',
  'Urdu': 'ur-t-i0-und'
};

export const transliterateText = async (text: string, fontFamily: string): Promise<string> => {
  const itc = Object.keys(LANG_MAP).find(k => fontFamily.includes(k));
  if (!itc) return text;

  const langCode = LANG_MAP[itc];
  const lastWord = text.split(' ').pop();
  if (!lastWord || lastWord.length < 2) return text;

  try {
    const response = await fetch(`https://inputtools.google.com/request?text=${lastWord}&itc=${langCode}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`);
    const data = await response.json();
    if (data[0] === 'SUCCESS') {
      const result = data[1][0][1][0];
      const words = text.split(' ');
      words[words.length - 1] = result;
      return words.join(' ');
    }
  } catch (e) {
    console.error('Transliteration failed', e);
  }
  
  return text;
};
