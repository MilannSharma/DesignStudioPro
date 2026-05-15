export interface LanguageConfig {
  id: string;
  name: string;
  nativeName: string;
  fontFamily: string;
  googleFont: string;
  itc: string;
  sanscriptScheme: string;
  rtl?: boolean;
}

export const LANGUAGES: LanguageConfig[] = [
  { id: 'en', name: 'English', nativeName: 'English', fontFamily: 'Inter', googleFont: 'Inter', itc: '', sanscriptScheme: '' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', fontFamily: 'Noto Sans Devanagari', googleFont: 'Noto+Sans+Devanagari', itc: 'hi-t-i0-und', sanscriptScheme: 'devanagari' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी', fontFamily: 'Noto Sans Devanagari', googleFont: 'Noto+Sans+Devanagari', itc: 'mr-t-i0-und', sanscriptScheme: 'devanagari' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', fontFamily: 'Noto Sans Telugu', googleFont: 'Noto+Sans+Telugu', itc: 'te-t-i0-und', sanscriptScheme: 'telugu' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', fontFamily: 'Noto Sans Tamil', googleFont: 'Noto+Sans+Tamil', itc: 'ta-t-i0-und', sanscriptScheme: 'tamil' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', fontFamily: 'Noto Sans Gujarati', googleFont: 'Noto+Sans+Gujarati', itc: 'gu-t-i0-und', sanscriptScheme: 'gujarati' },
  { id: 'ne', name: 'Nepali', nativeName: 'नेपाली', fontFamily: 'Noto Sans Devanagari', googleFont: 'Noto+Sans+Devanagari', itc: 'ne-t-i0-und', sanscriptScheme: 'devanagari' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', fontFamily: 'Noto Sans Bengali', googleFont: 'Noto+Sans+Bengali', itc: 'bn-t-i0-und', sanscriptScheme: 'bengali' },
  { id: 'as', name: 'Assamese', nativeName: 'অসমীয়া', fontFamily: 'Noto Sans Bengali', googleFont: 'Noto+Sans+Bengali', itc: 'as-t-i0-und', sanscriptScheme: 'assamese' },
  { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', fontFamily: 'Noto Sans Gurmukhi', googleFont: 'Noto+Sans+Gurmukhi', itc: 'pa-t-i0-und', sanscriptScheme: 'gurmukhi' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', fontFamily: 'Noto Sans Kannada', googleFont: 'Noto+Sans+Kannada', itc: 'kn-t-i0-und', sanscriptScheme: 'kannada' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', fontFamily: 'Noto Sans Malayalam', googleFont: 'Noto+Sans+Malayalam', itc: 'ml-t-i0-und', sanscriptScheme: 'malayalam' },
  { id: 'or', name: 'Oriya', nativeName: 'ଓଡ଼ିଆ', fontFamily: 'Noto Sans Oriya', googleFont: 'Noto+Sans+Oriya', itc: 'or-t-i0-und', sanscriptScheme: 'oriya' },
  { id: 'ur', name: 'Urdu', nativeName: 'اردو', fontFamily: 'Noto Nastaliq Urdu', googleFont: 'Noto+Nastaliq+Urdu', itc: 'ur-t-i0-und', rtl: true, sanscriptScheme: 'urdu' },
  { id: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', fontFamily: 'Noto Sans Devanagari', googleFont: 'Noto+Sans+Devanagari', itc: 'sa-t-i0-und', sanscriptScheme: 'devanagari' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', fontFamily: 'Noto Sans Arabic', googleFont: 'Noto+Sans+Arabic', itc: 'ar-t-i0-und', rtl: true, sanscriptScheme: '' },
  { id: 'kok', name: 'Konkani', nativeName: 'कोंकणी', fontFamily: 'Noto Sans Devanagari', googleFont: 'Noto+Sans+Devanagari', itc: 'kok-t-i0-und', sanscriptScheme: 'devanagari' },
  { id: 'ks', name: 'Kashmiri', nativeName: 'كأشُر', fontFamily: 'Noto Nastaliq Urdu', googleFont: 'Noto+Nastaliq+Urdu', itc: 'ks-t-i0-und', rtl: true, sanscriptScheme: '' },
  { id: 'sd', name: 'Sindhi', nativeName: 'سنڌي', fontFamily: 'Noto Nastaliq Urdu', googleFont: 'Noto+Nastaliq+Urdu', itc: 'sd-t-i0-und', rtl: true, sanscriptScheme: '' },
];
