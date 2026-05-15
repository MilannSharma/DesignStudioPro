# Design Studio Pro — Full Codebase Audit

> End-to-end analysis across 15 source files · Fabric.js 7 · React 19 · Vite 6  
> Goal: Achieve smoothness and feature parity with CorelDraw, Canva, Photoshop, Adobe

---

## Table of Contents

1. [Critical Bugs to Fix](#1-critical-bugs-to-fix)
2. [High Priority Bugs](#2-high-priority-bugs)
3. [Medium Priority Bugs](#3-medium-priority-bugs)
4. [Canvas Feel & Smoothness Enhancements](#4-canvas-feel--smoothness-enhancements)
5. [Properties Panel Upgrades](#5-properties-panel-upgrades)
6. [Layers Panel Upgrades](#6-layers-panel-upgrades)
7. [Export Quality Upgrades](#7-export-quality-upgrades)
8. [Color System Upgrades](#8-color-system-upgrades)
9. [Missing Core Features](#9-missing-core-features)
10. [Data Merge / Batch Features](#10-data-merge--batch-features)
11. [Project Management Features](#11-project-management-features)
12. [AI Enhancements](#12-ai-enhancements)
13. [Drawing & Shape Tools to Add](#13-drawing--shape-tools-to-add)
14. [Typography Tools to Add](#14-typography-tools-to-add)
15. [View & Navigation Tools](#15-view--navigation-tools)
16. [Asset Management Tools](#16-asset-management-tools)
17. [Architecture & Performance Issues](#17-architecture--performance-issues)
18. [Code Quality Improvements](#18-code-quality-improvements)

---

## 1. Critical Bugs to Fix

These are UX-breaking issues that need to be fixed first.

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Text tool uses `window.confirm()` / `window.prompt()` — blocks browser thread, feels ancient, destroys flow | `CanvasArea.tsx` | Replace with inline floating modal or FloatingToolbar inline options |
| 2 | Polygon & Star tools use `window.prompt()` for sides/points input | `CanvasArea.tsx` | Use a floating popover positioned near cursor on mouse:down |
| 3 | Callout direction uses `window.prompt()` | `CanvasArea.tsx` | Mini toolbar that appears on draw start |
| 4 | History undo/redo has no loading state — canvas flickers on complex pages during `loadFromJSON` | `useStore.ts` | Add micro-spinner; debounce `saveHistory` |
| 5 | Object boundary enforcement clips objects mid-drag — feels like hitting a hard wall | `CanvasArea.tsx` | Apply clamping on `mouse:up` only, not on `mouse:move` |

---

## 2. High Priority Bugs

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | `fitProjectToScreen`, `centerProject`, `zoomTo100` are empty stubs in the store — overridden by CanvasArea but never wired back, so direct store calls silently fail | `useStore.ts` | Wire callbacks from CanvasArea back into the store after init |
| 2 | Undo/Redo saves history on EVERY `object:added` including shape draw preview objects — `isDrawingPreview` guard is only partial | `App.tsx` | All intermediary drawing objects must be fully excluded |
| 3 | Page switching is synchronous — if canvas is mid-draw when page switches, partial state gets saved | `useStore.ts` | Cancel active drawing before saving current page state |
| 4 | `Ctrl+V` uses top-level `await import('fabric')` inside keydown handler — timing issues in Firefox | `App.tsx` | Pre-import at module level |
| 5 | Smart guides are computed but never rendered — `smartGuidesRef` is populated but no canvas overlay draws the lines | `CanvasArea.tsx` | Draw pink/cyan dashed lines on a canvas overlay during `mouse:move` |
| 6 | Spiral and Callout use hardcoded colors — don't respect active fill/stroke from PropertiesPanel | `CanvasArea.tsx` | Read current fill/stroke from store before creating objects |
| 7 | Pen tool path anchors (`isAnchor` flag) are not excluded from export — they appear in exported SVG/JSON | `CanvasArea.tsx` | Add `isAnchor` to `CUSTOM_PROPS` exclusion list and filter on export |
| 8 | LayersPanel only re-renders on `selectedObjects` change — adding/removing canvas objects doesn't refresh the panel | `LayersPanel.tsx` | Subscribe to `canvas.on('object:added/removed/modified')` |

---

## 3. Medium Priority Bugs

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Ruler mouse position readout lags — `setMousePos` on every `mouse:move` triggers full React re-render of CanvasArea | `CanvasArea.tsx` | Use `ref` + direct DOM manipulation for ruler cursor lines |
| 2 | Guide lines dragged off-canvas are not removed — they persist invisibly and accumulate in state | `CanvasArea.tsx` | Remove guide if dropped outside canvas bounds |
| 3 | Zoom via scroll uses `0.999 ** delta` — extremely slow on trackpads (deltaY ≈ 3); should normalize delta | `CanvasArea.tsx` | Normalize delta: `zoom *= delta > 0 ? 0.95 : 1.05` |
| 4 | Context menu appears on right-click even during text editing mode | `CanvasArea.tsx` | Suppress context menu when `activeObj.isEditing === true` |
| 5 | `ShapeLibrary` component is imported in `App.tsx` but not present in the JSX render tree — likely dead import | `App.tsx` | Either render it or remove the import |
| 6 | PDF export uses `jsPDF` rasterization — not vector; complex layouts lose sharpness at print DPI | `canvasUtils.ts` | Switch to `svg2pdf.js` for true vector PDF output |
| 7 | PropertiesPanel unit conversion (mm/cm/inch) doesn't recalculate existing values when unit changes | `PropertiesPanel.tsx` | Convert all displayed values when `settings.unit` changes |

---

## 4. Canvas Feel & Smoothness Enhancements

These make the canvas feel like CorelDraw / Figma.

- **Smooth inertia panning** — when hand tool is released, continue scrolling and decelerate naturally (apply velocity + friction on `mouse:up`)
- **Render smart guide lines visually** — pink/cyan dashed alignment lines while dragging (math already done, just never drawn)
- **Spacing guides** — show distance in px between selected object and its neighbours while dragging, like Figma
- **Constrain aspect ratio** on `Shift+drag` — verify all shapes including images honour this consistently
- **Multi-select rubber-band highlight** — highlight objects on hover as the selection box sweeps over them
- **Zoom to cursor position** — fix `zoomToPoint` viewport math so zoom centres on mouse, not canvas centre
- **Pinch-to-zoom** touch support for tablet / stylus use
- **Double-click group to enter isolation mode** — edit group contents without ungrouping (Illustrator / Figma behaviour)
- **Smooth shape drawing preview** — add visual fill preview while drawing rectangles and ellipses (currently just a thin stroke)

---

## 5. Properties Panel Upgrades

| Missing Control | Detail |
|----------------|--------|
| Opacity slider | Percentage display; Fabric supports `opacity` on all objects |
| Corner radius | For rectangles — Fabric supports `rx` / `ry` but no UI control exists |
| Stroke dash pattern | Solid, dashed, dotted, dot-dash picker |
| X / Y in document units | Show coordinates in mm/cm/inch, not canvas pixels, with live update while dragging |
| Blend mode selector | Multiply, screen, overlay, etc. — Fabric supports `globalCompositeOperation` |
| Drop shadow controls | Offset X/Y, blur radius, spread, colour — Fabric has full shadow support |
| Text spacing controls | Letter-spacing, line-height, paragraph spacing |
| W × H aspect ratio lock | Toggle when resizing numerically from the panel |

---

## 6. Layers Panel Upgrades

- **Drag to reorder layers** — currently only `[` `]` keyboard shortcuts work; no drag-and-drop in the panel
- **Object thumbnail preview** in each layer row (not just a type icon)
- **Layer groups / folders** — group layers into a collapsible folder for complex designs
- **Auto-refresh** on any canvas change — subscribe to `canvas.on('object:added/removed/modified')`
- **Multi-select in panel** — `Shift+click` / `Ctrl+click` to select multiple layers

---

## 7. Export Quality Upgrades

| Feature | Detail |
|---------|--------|
| Vector PDF export | Use `svg2pdf.js` instead of rasterised `jsPDF` |
| DPI-aware PNG export | Multiply canvas pixel dimensions by DPI ratio for print-resolution output |
| WebP export | Add WebP as an export format option |
| Export all pages as ZIP | Batch export each page as a numbered PNG, bundled in a ZIP |
| Bleed crop marks | Option to include printer crop marks in PDF export |

---

## 8. Color System Upgrades

- **HSL / HSB color picker** — currently only hex input + recent swatches
- **Global project colour palette** — save brand colours as swatches, reuse across the project
- **Multi-stop gradients** — GradientPanel exists but only supports 2-stop linear; add radial and conic types with unlimited stops
- **CMYK colour input** — `colorMode: 'cmyk'` already exists in document settings but has no UI

---

## 9. Missing Core Features

These are expected in any professional design tool.

| Feature | Priority | Notes |
|---------|----------|-------|
| Image editing tools | High | Crop, mask to shape, brightness / contrast / saturation / hue — Fabric ships `filters.Brightness`, `Contrast`, `Saturation`, `Grayscale`, `Sepia`, `Blur` |
| Clipping masks | High | Clip any object inside any shape (Photoshop layer masks / Illustrator clipping masks) |
| Background remover | High | AI-powered or canvas flood-fill removal |
| Text on a path | Medium | Wrap text along a curve or circle — CorelDraw signature feature |
| Pattern fill | Medium | Fill shapes with repeating image / SVG patterns (stripes, dots, custom) |
| Built-in template library | High | Starter templates for ID card, certificate, flyer, poster, banner in ProjectSetupModal |
| Multi-page thumbnail strip | Medium | Show page thumbnails in a sidebar or bottom strip like InDesign / Canva |
| Object effects | Medium | Outline stroke on text, inner glow, bevel / emboss |
| Find & Replace text | Medium | Across all pages — crucial for batch template editing |
| Snap to ruler guides | High | Drag-from-ruler guides exist but objects don't snap to them |

---

## 10. Data Merge / Batch Features

| Feature | Detail |
|---------|--------|
| Bulk export | Generate one rendered image per CSV row automatically — the core value proposition |
| CSV preview table | Show all rows before batch export with validation warnings for missing fields |
| Per-row photo mapping | Map a CSV image-URL column to the photo placeholder automatically |
| Batch export progress bar | Current export gives no feedback for large datasets |
| Export filename pattern | Let user define filename as template e.g. `{{name}}_{{roll_no}}.png` |

---

## 11. Project Management Features

- **Auto-save** — save to IndexedDB every 30 seconds (localStorage can't handle large canvas JSON)
- **Version history** — named save points ("Version 1", "After client feedback") beyond simple undo stack
- **Project thumbnails** — render canvas thumbnail when listing / opening saved `.json` files
- **Share / embed link** — generate a read-only preview URL
- **Cloud save** — Google Drive (MCP connector available) or Dropbox integration

---

## 12. AI Enhancements

| Feature | Detail |
|---------|--------|
| AI image generation | Generate placeholder images or backgrounds from text prompt (Gemini Imagen) |
| AI layout from screenshot | Upload a reference image, AI recreates the layout as editable objects |
| Smart text suggestions | AI completes slogans, certificate text, titles based on context |
| AI colour palette | Generate harmonious palettes from a seed colour or brand description |
| AI font pairing | Suggest complementary font pairings for the selected display font |

---

## 13. Drawing & Shape Tools to Add

| Tool | Status | Notes |
|------|--------|-------|
| Rounded Rectangle | Type defined, toolbar button exists, **no canvas handler** | Wire `roundedRect` in `CanvasArea` `mouse:down` |
| Bezier Curve | Pen tool is straight-line only | True bezier with control handles and tangent drag |
| Freehand Eraser | Type listed in `Tool` type, **no handler** | Use `PencilBrush` in composite mode to erase |
| Table | Missing | Insert editable grid (certificate marks, data display) |
| Barcode generator | Missing | Code128 / EAN-13 alongside existing QR code tool |
| Chart / graph tool | Missing | Bar, pie, line charts populated from CSV data fields |
| Crop tool | Missing | Non-destructive mask-based crop for images |
| Measurement tool | Missing | Click-drag to measure distances in document units |

---

## 14. Typography Tools to Add

- **Text styles** — save and apply H1 / H2 / Body / Caption styles with one click (like Figma text styles)
- **OpenType features** — ligatures, small caps, tabular numbers
- **Vertical text tool** — `v-text` is in the `Tool` type but has no toolbar button or handler
- **Text overflow linking** — flow text between multiple text boxes (InDesign-style threading)
- **Spell checker** — browser spell-check is disabled inside Fabric `Textbox` by default; needs re-enabling via `spellcheck` property

---

## 15. View & Navigation Tools

- **Zoom tool** (magnifying glass) — click to zoom in, `Alt+click` to zoom out
- **Navigator panel** — mini-map overview of full canvas with a draggable viewport box (like Photoshop / CorelDraw)
- **Presentation / slideshow mode** — full-screen slideshow across pages
- **Pixel grid** at zoom > 400% for precise pixel-level work

---

## 16. Asset Management Tools

- **Asset panel** — thumbnails of all imported images with drag-to-canvas support (currently only a URL array in store with no UI)
- **Unsplash / Pexels integration** — search and insert free stock photos without leaving the app
- **SVG import** — paste raw SVG code or upload `.svg` files as editable vector objects
- **Icon library panel** — searchable icon set (Lucide / Font Awesome) insertable as SVG paths
- **Google Fonts browser** — search fonts with live preview instead of a flat dropdown

---

## 17. Architecture & Performance Issues

### Critical Performance Problems

| Problem | Impact | Fix |
|---------|--------|-----|
| `CanvasArea.tsx` is 1400 lines with all tool logic in one `useEffect` | Impossible to maintain; bugs hide easily | Split into per-tool handler classes with a `Tool` strategy interface |
| `PropertiesPanel.tsx` is 900+ lines | Same problem | Extract `TextProperties`, `ShapeProperties`, `ImageProperties`, `AlignmentBar` |
| `setMousePos` state update on every `mouse:move` = full React re-render at 60 fps | Noticeable jank on mid-range hardware | Use `ref` + direct DOM manipulation for ruler readout |
| History stores full JSON strings on every change — MBs per action on complex layouts | Memory bloat; slow undo | Switch to JSON diff patches (`fast-json-patch`) |
| All fonts eagerly preloaded via hidden `div` on App mount — hundreds of network requests | Slow initial load | On-demand font loading only when a font is selected |

### Recommended Architecture Changes

```
src/
  tools/
    SelectTool.ts
    RectTool.ts
    PenTool.ts
    TextTool.ts
    ...each tool implements: onMouseDown / onMouseMove / onMouseUp / onKeyDown / cleanup
  store/
    canvasSlice.ts
    uiSlice.ts
    projectSlice.ts
    historySlice.ts
  components/
    canvas/
      CanvasArea.tsx          (< 300 lines, delegates to tool handlers)
      SmartGuideOverlay.tsx
      RulerOverlay.tsx
    panels/
      PropertiesPanel/
        TextProperties.tsx
        ShapeProperties.tsx
        ImageProperties.tsx
        AlignmentBar.tsx
      LayersPanel/
      AssetsPanel/
  lib/
    utils.ts                  (shared cn() helper — currently duplicated in 6 files)
    constants.ts              (CUSTOM_PROPS — currently duplicated in 2 files)
```

---

## 18. Code Quality Improvements

| Issue | Files Affected | Fix |
|-------|---------------|-----|
| `cn()` helper defined identically in 6+ files | All component files | Extract to `src/lib/utils.ts` and import |
| `CUSTOM_PROPS` array duplicated | `useStore.ts`, `TopBar.tsx` | Single source of truth in `src/lib/constants.ts` |
| No error boundaries | All panel components | Wrap each panel in `<ErrorBoundary>` to prevent full-app crashes |
| Keyboard shortcuts scattered across `App.tsx` and `CanvasArea.tsx` | Both files | Centralise in a `useKeyboardShortcuts` hook + add a `?` cheatsheet modal |
| No TypeScript strict mode | `tsconfig.json` | Enable `"strict": true` — there are several implicit `any` and missing null checks |
| `@ts-ignore` comments in several places | `CanvasArea.tsx`, `Toolbar.tsx` | Fix underlying type issues instead of suppressing |

---

## Quick Win Priority Order

If you want to tackle this incrementally, here's the recommended order:

1. **Replace all `window.prompt()` / `window.confirm()` calls** — biggest UX improvement, ~2 hours work
2. **Render smart guide lines on canvas** — already computed, just needs a draw call
3. **Fix zoom-to-cursor** — one line of math
4. **Wire `roundedRect` and `eraser` tools** — already in type definitions, just need handlers
5. **Auto-refresh LayersPanel** — subscribe to canvas events, 5 lines
6. **Opacity + corner radius in PropertiesPanel** — direct Fabric property, 30 lines
7. **Fix history bloat** — add `fast-json-patch` for diff-based undo
8. **DPI-aware PNG export** — multiply by DPI ratio, 3 lines
9. **Bulk CSV export** — the core feature that makes this app unique
10. **Split CanvasArea into tool strategy classes** — biggest code health improvement

---

*Generated by full codebase analysis · May 2026*
