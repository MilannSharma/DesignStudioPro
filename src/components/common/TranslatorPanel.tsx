/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSuggestions } from '../../lib/transliteration/engine';
import { LANGUAGES as INDIC_LANGS } from '../../lib/transliteration/languageConfig';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
];

export const TranslatorPanel: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'semantic' | 'phonetic'>('phonetic');

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setTargetText('');
      return;
    }

    setIsTranslating(true);
    setError(null);
    try {
      if (mode === 'semantic') {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(sourceText)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data[0]) {
          const translated = data[0].map((s: any) => s[0]).join('');
          setTargetText(translated);
        }
      } else {
        // PHONETIC TRANSLITERATION (Keeping the sound)
        const words = sourceText.split(/\s+/);
        const config = INDIC_LANGS.find(l => l.id === toLang);
        
        if (!config || !config.itc) {
          setTargetText(sourceText);
          return;
        }

        const results = await Promise.all(words.map(async (word) => {
          if (!/^[a-zA-Z]+$/.test(word)) return word;
          const suggestions = await getSuggestions(word, config.itc, config.sanscriptScheme);
          return suggestions[0] || word;
        }));
        
        setTargetText(results.join(' '));
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Failed to process. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    if (!targetText) return;
    navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
        <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <Languages size={14} className="text-blue-600" />
          Indic Assistant
        </h2>
        <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
          <button 
            onClick={() => setMode('phonetic')}
            className={cn(
              "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
              mode === 'phonetic' ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Sound
          </button>
          <button 
            onClick={() => setMode('semantic')}
            className={cn(
              "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
              mode === 'semantic' ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            Meaning
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Language Selection */}
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <select 
            value={fromLang}
            onChange={(e) => setFromLang(e.target.value)}
            className="flex-1 bg-transparent text-[11px] font-bold text-gray-700 outline-none px-2 py-1.5 cursor-pointer"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <button 
            onClick={swapLanguages}
            className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400 hover:text-blue-600 transition-colors border border-gray-100 active:scale-90"
          >
            <ArrowRightLeft size={12} />
          </button>
          <select 
            value={toLang}
            onChange={(e) => setToLang(e.target.value)}
            className="flex-1 bg-transparent text-[11px] font-bold text-gray-700 outline-none px-2 py-1.5 cursor-pointer"
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>

        {/* Source Input */}
        <div className="space-y-2">
          <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest block px-1">Source Text</label>
          <div className="relative group">
            <textarea
              placeholder="Type or paste text to translate..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]",
            isTranslating || !sourceText.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
          )}
        >
          {isTranslating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Translate Now
              <Sparkles size={16} />
            </>
          )}
        </button>

        {/* Result Area */}
        {targetText && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest block">Translation</label>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="w-full min-h-[120px] bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-sm text-gray-900 leading-relaxed">
              {targetText}
            </div>
            <p className="text-[10px] text-gray-400 font-medium px-1 text-center italic">
              Copy and paste this directly into your design text boxes.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 text-red-600">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-tight">{error}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          AI Engine Ready
        </div>
      </div>
    </div>
  );
};
