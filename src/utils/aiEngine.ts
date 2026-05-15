/// <reference types="vite/client" />
/**
 * AI Engine — Gemini-powered design assistant
 * Connects to Gemini API and translates natural language into canvas operations
 */

import { useStore } from '../store/useStore';

// v2 — multi-key fallback engine (using .env for security)
const ENGINE_VERSION = '2.2';

// Get keys from .env (comma-separated) or fallback to empty
const API_KEYS_ENV = import.meta.env.VITE_GEMINI_API_KEYS || '';
const API_KEYS = API_KEYS_ENV.split(',').map(k => k.trim()).filter(k => k);

let currentKeyIndex = 0;

function buildUrl(key: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
}

console.log(`[AI Engine ${ENGINE_VERSION}] Initialized with ${API_KEYS.length} keys`);

export interface AIAction {
  type: 'add_text' | 'add_rect' | 'add_circle' | 'add_image_placeholder' | 'change_bg' | 'resize_canvas' | 'delete_selected' | 'move_object' | 'change_color' | 'add_field' | 'change_font' | 'change_size' | 'duplicate' | 'align' | 'group' | 'info' | 'set_opacity' | 'set_stroke' | 'bring_to_front' | 'send_to_back' | 'lock' | 'unlock';
  params: Record<string, any>;
  description: string;
}

export interface AIResponse {
  message: string;
  actions: AIAction[];
}

const SYSTEM_PROMPT = `You are an AI design assistant integrated into a professional design studio (like CorelDraw/Canva). You help users create and edit designs by generating specific canvas commands.

AVAILABLE ACTIONS (respond with JSON):
- add_text: Add text to canvas. Params: { text, x, y, fontSize, fontFamily, color, bold, italic }
- add_rect: Add rectangle. Params: { x, y, width, height, fill, stroke, strokeWidth, rx (corner radius) }
- add_circle: Add circle. Params: { x, y, radius, fill, stroke }
- add_image_placeholder: Add image placeholder area. Params: { x, y, width, height, label }
- change_bg: Change page background. Params: { color }
- resize_canvas: Resize canvas. Params: { width, height }
- delete_selected: Delete selected objects. Params: {}
- move_object: Move selected object. Params: { x, y }
- change_color: Change selected object fill. Params: { color }
- add_field: Add a data merge field (dynamic text). Params: { fieldName, x, y, fontSize, color }
- change_font: Change font of selected text. Params: { fontFamily }
- change_size: Change font size of selected text. Params: { fontSize }
- duplicate: Duplicate selected object. Params: { offsetX, offsetY }
- align: Align object. Params: { mode: 'center'|'centerX'|'centerY'|'left'|'right'|'top'|'bottom' }
- group: Group selected objects. Params: {}
- set_opacity: Set transparency. Params: { opacity (0 to 1) }
- set_stroke: Set border. Params: { color, width }
- bring_to_front: Layering. Params: {}
- send_to_back: Layering. Params: {}
- lock: Prevent editing. Params: {}
- unlock: Allow editing. Params: {}
- info: Just provide information, no canvas changes. Params: { detail }

CURRENT CANVAS STATE will be provided with each message.

RESPONSE FORMAT — Always respond with valid JSON:
{
  "message": "Human-friendly explanation of what you'll do",
  "actions": [
    { "type": "action_type", "params": { ... }, "description": "What this specific step does" }
  ]
}

RULES:
1. Always respond with the JSON format above, nothing else.
2. If the user asks a question or wants info, use type "info" with no canvas changes.
3. Use reasonable default positions (center of canvas) if not specified.
4. Use professional colors and typography.
5. For templates like ID cards, certificates etc, generate ALL elements needed.
6. Coordinates: canvas is typically 800x600. Center = (400, 300).
7. Keep descriptions brief and clear.
8. If user uploads/references an image, analyze it and suggest layout changes.`;

function getCanvasState(): string {
  const state = useStore.getState();
  const canvas = state.canvas;
  if (!canvas) return 'Canvas not available';
  
  const objects = canvas.getObjects().filter((o: any) => !o.isPageBackground);
  const selected = canvas.getActiveObject();
  
  const objSummary = objects.map((o: any, i: number) => {
    const base = `[${i}] type=${o.type}, left=${Math.round(o.left)}, top=${Math.round(o.top)}`;
    if (o.type === 'textbox' || o.type === 'i-text') {
      return `${base}, text="${(o.text || '').substring(0, 30)}", fontSize=${o.fontSize}, fontFamily=${o.fontFamily}`;
    }
    if (o.type === 'rect') {
      return `${base}, w=${Math.round(o.width * (o.scaleX||1))}, h=${Math.round(o.height * (o.scaleY||1))}, fill=${o.fill}`;
    }
    return `${base}, w=${Math.round((o.width||0) * (o.scaleX||1))}, h=${Math.round((o.height||0) * (o.scaleY||1))}`;
  }).join('\n');

  return `Canvas: ${state.settings.width}x${state.settings.height}px
Objects (${objects.length}):
${objSummary || '(empty canvas)'}
Selected: ${selected ? `type=${selected.type}, left=${Math.round(selected.left)}, top=${Math.round(selected.top)}` : 'none'}`;
}

export async function sendToGemini(userMessage: string, imageBase64?: string): Promise<AIResponse> {
  if (API_KEYS.length === 0) {
    return {
      message: "⚠️ Gemini API keys are not configured. Please add VITE_GEMINI_API_KEYS to your .env file.",
      actions: []
    };
  }

  const canvasState = getCanvasState();
  
  const parts: any[] = [
    { text: SYSTEM_PROMPT },
    { text: `\n\nCURRENT CANVAS STATE:\n${canvasState}\n\nUSER REQUEST: ${userMessage}` }
  ];

  if (imageBase64) {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: base64Data
      }
    });
  }

  const requestBody = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  });

  const MAX_RETRIES = 3;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Try each API key with retries for rate limits
  let lastError = '';
  for (let keyAttempt = 0; keyAttempt < API_KEYS.length; keyAttempt++) {
    const keyIndex = (currentKeyIndex + keyAttempt) % API_KEYS.length;
    const apiKey = API_KEYS[keyIndex];
    const url = buildUrl(apiKey);

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });

        if (response.status === 429) {
          // Rate limited — wait and retry with exponential backoff
          const waitTime = Math.pow(2, retry + 1) * 1000; // 2s, 4s, 8s
          console.warn(`[AI Engine] Rate limited (429). Waiting ${waitTime / 1000}s before retry ${retry + 1}/${MAX_RETRIES}...`);
          await delay(waitTime);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[AI Engine] API error ${response.status}:`, errText);
          if (response.status >= 500) {
            lastError = 'server';
            break;
          }
          if (response.status === 403) {
            lastError = 'auth';
            break; // try next key
          }
          if (response.status === 400) {
            lastError = 'expired';
            break; // try next key
          }
          lastError = 'unknown';
          break;
        }

        // Success!
        currentKeyIndex = keyIndex;

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }
        
        const parsed = JSON.parse(jsonStr);
        return {
          message: parsed.message || 'Done!',
          actions: parsed.actions || []
        };
      } catch (err: any) {
        console.error(`[AI Engine] Error:`, err.message);
        lastError = 'network';
        if (retry < MAX_RETRIES - 1) {
          await delay(1000);
        }
      }
    }
  }

  // All keys and retries exhausted — show friendly message
  const friendlyMessages: Record<string, string> = {
    'server': '😔 The AI server is temporarily unavailable. Please try again in a moment.',
    'auth': '🔑 AI service authentication issue. Please check your API key in settings.',
    'expired': '🔑 Your AI key needs to be renewed. Please generate a new key from Google AI Studio.',
    'network': '🌐 Connection issue. Please check your internet and try again.',
    'unknown': '😔 Something went wrong. Please try again.',
  };

  return {
    message: friendlyMessages[lastError] || '😔 AI is temporarily busy. Please try again in a few seconds, or use ⚡ Quick Tasks for instant actions!',
    actions: []
  };
}

/**
 * Execute a single AI action on the canvas
 */
export async function executeAction(action: AIAction): Promise<string> {
  const { canvas } = useStore.getState();
  if (!canvas) return 'Canvas not available';

  const { Rect, Circle, Textbox, FabricImage, Group } = await import('fabric');

  switch (action.type) {
    case 'add_text': {
      const p = action.params;
      const text = new Textbox(p.text || 'Text', {
        left: p.x ?? 200,
        top: p.y ?? 200,
        fontSize: p.fontSize ?? 24,
        fontFamily: p.fontFamily ?? 'Inter',
        fill: p.color ?? '#000000',
        fontWeight: p.bold ? 'bold' : 'normal',
        fontStyle: p.italic ? 'italic' : 'normal',
        width: p.width ?? 300,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
      useStore.getState().saveHistory();
      return `Added text: "${p.text}"`;
    }

    case 'add_rect': {
      const p = action.params;
      const rect = new Rect({
        left: p.x ?? 100,
        top: p.y ?? 100,
        width: p.width ?? 200,
        height: p.height ?? 100,
        fill: p.fill ?? '#3b82f6',
        stroke: p.stroke ?? undefined,
        strokeWidth: p.strokeWidth ?? 0,
        rx: p.rx ?? 0,
        ry: p.rx ?? 0,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.requestRenderAll();
      useStore.getState().saveHistory();
      return `Added rectangle`;
    }

    case 'add_circle': {
      const p = action.params;
      const circle = new Circle({
        left: p.x ?? 200,
        top: p.y ?? 200,
        radius: p.radius ?? 50,
        fill: p.fill ?? '#ef4444',
        stroke: p.stroke ?? undefined,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.requestRenderAll();
      useStore.getState().saveHistory();
      return `Added circle`;
    }

    case 'add_image_placeholder': {
      const p = action.params;
      const w = p.width ?? 150, h = p.height ?? 150;
      // Create a placeholder rectangle with an X pattern
      const rect = new Rect({
        left: p.x ?? 100,
        top: p.y ?? 100,
        width: w,
        height: h,
        fill: '#f3f4f6',
        stroke: '#9ca3af',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
      });
      (rect as any).name = p.label || 'Image Placeholder';
      canvas.add(rect);
      // Add label
      const label = new Textbox(p.label || '📷 Image Here', {
        left: (p.x ?? 100) + w / 2 - 50,
        top: (p.y ?? 100) + h / 2 - 10,
        fontSize: 12,
        fill: '#6b7280',
        fontFamily: 'Inter',
        textAlign: 'center',
        width: 100,
        selectable: true,
      });
      canvas.add(label);
      canvas.requestRenderAll();
      useStore.getState().saveHistory();
      return `Added image placeholder: "${p.label}"`;
    }

    case 'change_bg': {
      const p = action.params;
      const bgObj = canvas.getObjects().find((o: any) => o.isPageBackground);
      if (bgObj) {
        bgObj.set('fill', p.color || '#ffffff');
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Changed background to ${p.color}`;
    }

    case 'resize_canvas': {
      const p = action.params;
      if (p.width && p.height) {
        useStore.getState().setSettings({ width: p.width, height: p.height });
      }
      return `Resized canvas to ${p.width}x${p.height}`;
    }

    case 'delete_selected': {
      const active = canvas.getActiveObject();
      if (active) {
        canvas.remove(active);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Deleted selected object`;
    }

    case 'move_object': {
      const p = action.params;
      const active = canvas.getActiveObject();
      if (active) {
        if (p.relative) {
          active.set({
            left: (active.left || 0) + (p.x || 0),
            top: (active.top || 0) + (p.y || 0)
          });
        } else {
          active.set({ left: p.x, top: p.y });
        }
        active.setCoords();
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return p.relative ? `Moved object by (${p.x}, ${p.y})` : `Moved object to (${p.x}, ${p.y})`;
    }

    case 'change_color': {
      const p = action.params;
      const active = canvas.getActiveObject();
      if (active) {
        active.set('fill', p.color);
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Changed color to ${p.color}`;
    }

    case 'add_field': {
      const p = action.params;
      const field = new Textbox(`{{${p.fieldName || 'field'}}}`, {
        left: p.x ?? 200,
        top: p.y ?? 200,
        fontSize: p.fontSize ?? 18,
        fill: p.color ?? '#2563eb',
        fontFamily: 'Inter',
        fontWeight: 'bold',
        width: 200,
      });
      (field as any).name = `Field: ${p.fieldName}`;
      canvas.add(field);
      canvas.setActiveObject(field);
      canvas.requestRenderAll();
      useStore.getState().saveHistory();
      return `Added data field: {{${p.fieldName}}}`;
    }

    case 'change_font': {
      const p = action.params;
      const active = canvas.getActiveObject() as any;
      if (active && active.set) {
        active.set('fontFamily', p.fontFamily);
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Changed font to ${p.fontFamily}`;
    }

    case 'change_size': {
      const p = action.params;
      const active = canvas.getActiveObject() as any;
      if (active && active.set) {
        active.set('fontSize', p.fontSize);
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Changed font size to ${p.fontSize}`;
    }

    case 'duplicate': {
      const p = action.params;
      const active = canvas.getActiveObject();
      if (active) {
        const cloned = await active.clone();
        cloned.set({
          left: (cloned.left || 0) + (p.offsetX ?? 20),
          top: (cloned.top || 0) + (p.offsetY ?? 20),
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Duplicated object`;
    }

    case 'align': {
      const p = action.params;
      const active = canvas.getActiveObject();
      if (!active) return 'No object selected for alignment';
      const { settings } = useStore.getState();
      const br = active.getBoundingRect();
      
      switch (p.mode) {
        case 'center': canvas.viewportCenterObject(active); break;
        case 'centerX': active.set('left', settings.width / 2 - br.width / 2); break;
        case 'centerY': active.set('top', settings.height / 2 - br.height / 2); break;
        case 'left': active.set('left', 0); break;
        case 'right': active.set('left', settings.width - br.width); break;
        case 'top': active.set('top', 0); break;
        case 'bottom': active.set('top', settings.height - br.height); break;
      }
      active.setCoords();
      canvas.requestRenderAll();
      useStore.getState().saveHistory();
      return `Aligned object to ${p.mode}`;
    }

    case 'group': {
      const objs = canvas.getActiveObjects();
      if (objs.length > 1) {
        const group = new Group(objs);
        canvas.discardActiveObject();
        objs.forEach(o => canvas.remove(o));
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        useStore.getState().saveHistory();
        return 'Grouped selected objects';
      }
      return 'Need multiple objects selected to group';
    }
    case 'set_opacity': {
      const active = canvas.getActiveObject();
      if (active) {
        active.set('opacity', action.params.opacity);
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Set opacity to ${action.params.opacity}`;
    }

    case 'set_stroke': {
      const active = canvas.getActiveObject() as any;
      if (active && active.set) {
        active.set({
          stroke: action.params.color || active.stroke,
          strokeWidth: action.params.width ?? active.strokeWidth
        });
        canvas.requestRenderAll();
        useStore.getState().saveHistory();
      }
      return `Updated stroke settings`;
    }

    case 'bring_to_front': {
      const active = canvas.getActiveObject();
      if (active) {
        canvas.bringObjectToFront(active);
        canvas.renderAll();
        useStore.getState().saveHistory();
      }
      return `Brought object to front`;
    }

    case 'send_to_back': {
      const active = canvas.getActiveObject();
      if (active) {
        canvas.sendObjectToBack(active);
        canvas.renderAll();
        useStore.getState().saveHistory();
      }
      return `Sent object to back`;
    }

    case 'lock': {
      const active = canvas.getActiveObject();
      if (active) {
        active.set({
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true
        });
        canvas.discardActiveObject();
        canvas.renderAll();
        useStore.getState().saveHistory();
      }
      return `Locked object`;
    }

    case 'unlock': {
      // For unlock, we might need to find by ID if it's not selectable
      // But for now we assume the AI knows what it's doing
      const objs = canvas.getObjects();
      objs.forEach((o: any) => {
        o.set({
          selectable: true,
          evented: true,
          lockMovementX: false,
          lockMovementY: false,
          lockScalingX: false,
          lockScalingY: false,
          lockRotation: false
        });
      });
      canvas.renderAll();
      useStore.getState().saveHistory();
      return `Unlocked all objects`;
    }
    case 'info':
      return action.params.detail || action.description || '';

    default:
      return `Unknown action: ${action.type}`;
  }
}
