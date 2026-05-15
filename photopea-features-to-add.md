# Features to Add — Inspired by Photopea
> All tools, menus, options, and features visible in the reference screenshots  
> Source: Photopea (browser-based professional image editor)

---

## 1. New Project Dialog — Upgrades

### Preset Category Tabs
- **Social** — FB Page Cover (1640×664), FB Event Image (1920×1080), FB Group Header (1640×856), Instagram (1080×1080), Insta Story (1080×1920), Insta Portrait (1080×1350)
- **Print** — A4, A3, Business Card, etc.
- **Photo** — Standard photo sizes
- **Screen** — HD, Full HD, 4K
- **Mobile** — Phone and tablet presets
- **Ads** — Banner and ad sizes
- **2ⁿ** — Power-of-2 sizes for game/3D use

### Project Settings
- **Name field** — editable project name on creation
- **Width & Height** with swap button (↔) to flip dimensions instantly
- **Unit selector** — Pixels, Inches, Cm, Mm
- **DPI field** — default 72, editable
- **DPI unit** — Pixels/Inch, Pixels/Cm
- **Background** — White, Black, Transparent, Custom color
- **Artboards** toggle
- **Color Mode** — RGB, CMYK, Grayscale, Lab
- **Bit Depth** — 8 bit, 16 bit, 32 bit
- **Color Profile** — sRGB, Adobe RGB, ProPhoto RGB

### File Format Import Support (shown in bottom bar)
- `.PSD` — Photoshop native
- `.AI` — Adobe Illustrator
- `.XD` — Adobe XD
- `.FIG` — Figma
- `.sketch` — Sketch
- `.PDF` — PDF import
- `.RAW` — Camera RAW
- `ANY` — Universal file open

### Templates Button
- Quick-access templates library from the New Project dialog

---

## 2. Top Menu Bar — Full Structure

### File
- New, Open, Open Recent
- Save, Save As, Export As
- Place (embed external file)
- Revert

### Edit
- **Undo / Redo**
- **Step Forward** — `Shift+Ctrl+Z`
- **Step Backward** — `Ctrl+Z`
- **Fade...** — `Shift+Ctrl+F` (fade last filter/operation)
- **Cut** — `Ctrl+X`
- **Copy** — `Ctrl+C`
- **Copy Merged** — `Shift+Ctrl+C` (copy all visible layers flattened)
- **Paste** — `Ctrl+V`
- **Clear** — Delete
- **Fill...** — `Shift+F5` (fill selection with color/pattern/content-aware)
- **Stroke...** — stroke around selection
- **Content-Aware Scale**
- **Puppet Warp**
- **Perspective Warp**
- **Free Transform** — `Alt+Ctrl+T`
- **Transform** submenu →
- **Auto-Align** (align layers automatically)
- **Auto-Blend** (blend multiple exposures)

### Image
- **Mode** submenu → RGB, CMYK, Grayscale, Lab, Bitmap, Indexed
- **Adjustments** submenu → (see Section 5 below)
- **Auto Tone**
- **Auto Contrast**
- **Auto Color**
- **Reduce Colors...**
- **Vectorize Bitmap...**
- **Wavelet Decompose**
- **Canvas Size...** — `Alt+Ctrl+C`
- **Image Size...** — `Alt+Ctrl+I`
- **Transform** submenu →
- **Crop**
- **Trim...**
- **Reveal All**
- **Duplicate**
- **Apply Image...**
- **Variables...**

### Layer
- **New** submenu → New Layer, New Group, New Layer from Background
- **Duplicate Layer**
- **Duplicate Into...** (duplicate to another document)
- **Delete**
- **Text** submenu →
- **Layer Style** submenu →
- **New Fill Layer** → Solid Color, Gradient, Pattern
- **New Adjustment Layer** → (see Section 5 below)
- **Raster Mask** submenu →
- **Vector Mask** submenu →
- **Clipping Mask** — `Alt+Ctrl+G`
- **Smart Object** submenu →
- **Rasterize**
- **Rasterize Layer Style**
- **Group Layers** — `Ctrl+G`
- **Arrange** submenu → Bring to Front, Bring Forward, Send Backward, Send to Back
- **Combine Shapes** submenu →
- **Animation** submenu →

### Select
- **All** — `Ctrl+A`
- **Deselect** — `Ctrl+D`
- **Inverse** — `Shift+Ctrl+I`
- **Remove BG** — AI background removal
- **Color Range...**
- **Magic Cut...**
- **Subject** — AI select subject
- **Refine Edge...**
- **Modify** submenu → Border, Smooth, Expand, Contract, Feather
- **Grow**
- **Similar**
- **Transform Selection**
- **Quick Mask Mode** — `Q`
- **Load Selection**
- **Save Selection**

### Filter
- **Last Filter** — `Alt+Ctrl+F` (re-apply last filter)
- **Filter Gallery...**
- **Lens Correction...**
- **Camera Raw...**
- **Liquify...**
- **Vanishing Point...**
- **3D** submenu →
- **Blur** submenu →
- **Blur Gallery** submenu →
- **Distort** submenu →
- **Noise** submenu →
- **Pixelate** submenu →
- **Render** submenu →
- **Sharpen** submenu →
- **Stylize** submenu →
- **Other** submenu →
- **Fourier** submenu →

### View
- **Zoom In** — `Ctrl++`
- **Zoom Out** — `Ctrl+-`
- **Fit The Area** — `Ctrl+0`
- **Pixel to Pixel** — `Ctrl+1` (100% zoom)
- **Pattern Preview**
- **Mode** submenu →
- **Extras** — `Ctrl+H` (toggle guides/grids visibility)
- **Show** submenu →
- **Rulers** — `Ctrl+R`
- **Snap** toggle
- **Snap To** submenu →
- **Lock Guides**
- **Clear Guides**
- **Add Guides...**
- **Guides from Layer**
- **Clear Slices**

### Window
- Panels toggle: History, Swatches, Layers, Channels, Paths, etc.

### More
- Additional/overflow options

---

## 3. Left Toolbar — All Tools

| Tool | Shortcut | Notes |
|------|----------|-------|
| Move / Auto-Select | V | With Layer/Group toggle and Transform Controls checkbox |
| Rectangular Marquee | M | Selection tool |
| Lasso | L | Freehand selection |
| Magic Wand / Quick Selection | W | AI-assisted selection |
| Crop | C | Non-destructive crop |
| Eyedropper | I | Color picker |
| Healing Brush | J | Content-aware healing |
| Brush | B | Painting |
| Clone Stamp | S | Clone areas |
| History Brush | Y | Paint from history state |
| Eraser | E | Erase / Background eraser |
| Gradient | G | Linear, radial, angle, reflected, diamond |
| Blur / Sharpen / Smudge | — | Focus tools |
| Dodge / Burn / Sponge | O | Tonal tools |
| Pen | P | Bezier path tool (see Section 4) |
| Text | T | Horizontal and vertical text |
| Path Selection / Direct Selection | A | Select and edit paths |
| Shape Tools | U | Rectangle, Ellipse, Polygon, Line, Custom Shape |
| Hand | H | Pan canvas |
| Zoom | Z | Click to zoom in/out |
| Foreground / Background color swatches | X | Swap colors |
| Keyboard shortcut tool | — | Bottom of toolbar |

---

## 4. Pen Tool — Submenu Options

- **Pen** — Standard bezier pen `P`
- **Free Pen** — Freehand path drawing `P`
- **Curvature Pen** — Click-to-curve simplified pen `P`
- **Add Anchor Point** — `P`
- **Delete Anchor Point** — `P`
- **Convert Point** — Convert between corner and smooth anchor `P`

---

## 5. Adjustments & Filters — Full List

### Image > Adjustments submenu
- Levels
- Curves
- Exposure
- Vibrance
- Hue / Saturation
- Color Balance
- Black & White
- Photo Filter
- Channel Mixer
- Color Lookup
- Invert
- Posterize
- Threshold
- Gradient Map
- Selective Color
- Shadows / Highlights
- Brightness / Contrast
- Desaturate
- Match Color
- Replace Color
- Equalize

### Filter > Blur submenu
- Average, Blur, Blur More
- Box Blur
- Gaussian Blur
- Lens Blur
- Motion Blur
- Radial Blur
- Shape Blur
- Smart Blur
- Surface Blur

### Filter > Blur Gallery
- Field Blur
- Iris Blur
- Tilt-Shift
- Path Blur
- Spin Blur

### Filter > Distort submenu
- Displace, Ripple, Shear, Spherize, Twirl, Wave, ZigZag, Pinch, Polar Coordinates

### Filter > Noise submenu
- Add Noise, Despeckle, Dust & Scratches, Median, Reduce Noise

### Filter > Pixelate submenu
- Color Halftone, Crystallize, Fragment, Mezzotint, Mosaic, Pointillize

### Filter > Sharpen submenu
- Sharpen, Sharpen Edges, Sharpen More, Smart Sharpen, Unsharp Mask

### Filter > Stylize submenu
- Diffuse, Emboss, Extrude, Find Edges, Oil Paint, Solarize, Tiles, Trace Contour, Wind

### Filter > Render submenu
- Clouds, Difference Clouds, Fibers, Lens Flare, Lighting Effects

### Filter > Other submenu
- Custom, High Pass, Maximum, Minimum, Offset

### Filter > Fourier
- Fourier Transform (frequency-domain editing)

---

## 6. Top Options Bar (Context-Sensitive)

Shown for the Move tool:
- **Auto-Select** checkbox — click to auto-select the layer under cursor
- **Layer / Group** dropdown — select layer or entire group
- **Transform Controls** checkbox — show bounding box handles
- **Distances** checkbox — show spacing between objects

### Alignment Buttons (top bar icons)
- Align Left, Center, Right
- Align Top, Middle, Bottom
- Distribute Horizontally
- Distribute Vertically
- Make same Width, Height, Size
- Tidy / Auto-arrange

---

## 7. Right Panel — Tabs & Sections

### History Panel
- Step-by-step action history list
- Click any step to revert to that state
- Snapshot support

### Swatches Panel
- Color swatches library
- Add custom swatches
- Load preset swatch libraries

### Layers Panel
- **Normal** blend mode dropdown (full list of blend modes)
- **Opacity** — numeric with dropdown `100%`
- **Fill** — separate fill opacity (doesn't affect layer effects) `100%`
- **Lock** row — lock: Transparent Pixels, Image Pixels, Position, All
- Layer rows with: visibility eye, thumbnail, layer name, lock icon
- Drag to reorder layers
- Layer group folders (collapsible)

### Channels Panel
- RGB composite channel
- R, G, B individual channels
- Alpha channels
- Create / delete channels

### Paths Panel
- Work paths
- Save path
- Stroke / fill path
- Load path as selection

---

## 8. Right Sidebar — Icon Panel

Vertical icon panel between canvas and properties:
- **Info** — document info panel
- **Properties / Settings** — context properties
- **Paint** — brush settings panel
- **Text** — character/paragraph panel (Tt)
- **Paragraph** — paragraph panel (¶)
- **CSS** — live CSS code for selected layer

---

## 9. Layer Types & Layer Features

### New Fill Layer
- Solid Color fill layer
- Gradient fill layer
- Pattern fill layer

### New Adjustment Layer (non-destructive)
- All adjustments from Section 5 available as adjustment layers

### Layer Masks
- Raster Mask — paint to hide/reveal
- Vector Mask — use path to mask
- Clipping Mask — clip to layer below

### Smart Objects
- Convert to Smart Object
- Edit contents
- Smart Filters (non-destructive filter application)
- Rasterize Smart Object

### Layer Styles (Layer Style submenu)
- Drop Shadow
- Inner Shadow
- Outer Glow
- Inner Glow
- Bevel & Emboss
- Satin
- Color Overlay
- Gradient Overlay
- Pattern Overlay
- Stroke

### Animation
- Frame-based animation
- Timeline animation

---

## 10. Selection Tools & Features

| Feature | Detail |
|---------|--------|
| Rectangular / Elliptical Marquee | Standard selections |
| Lasso | Freehand selection |
| Polygonal Lasso | Click-to-select polygon selection |
| Magnetic Lasso | Snaps to edges |
| Magic Wand | Tolerance-based flood selection |
| Quick Selection | Brush-based AI selection |
| Select Subject | One-click AI subject detection |
| Remove BG | One-click AI background removal |
| Color Range | Select by colour range with fuzziness |
| Refine Edge | Smooth, feather, shift edge, smart radius |
| Quick Mask Mode | Paint selection as red overlay mask |
| Save / Load Selection | Store selections as alpha channels |
| Modify → Border | Select just the border of a selection |
| Modify → Smooth | Smooth jagged selections |
| Modify → Expand / Contract | Grow or shrink selection by pixels |
| Modify → Feather | Soften selection edges |
| Grow | Expand selection by similar pixels |
| Similar | Select similarly coloured pixels throughout |
| Transform Selection | Scale / rotate the selection boundary |
| Inverse | Select everything except current selection |

---

## 11. Keyboard Shortcuts — Full Set to Implement

| Action | Shortcut |
|--------|----------|
| Zoom In | `Ctrl++` |
| Zoom Out | `Ctrl+-` |
| Fit to Screen | `Ctrl+0` |
| 100% / Pixel to Pixel | `Ctrl+1` |
| Undo (Step Backward) | `Ctrl+Z` |
| Step Forward | `Shift+Ctrl+Z` |
| Cut | `Ctrl+X` |
| Copy | `Ctrl+C` |
| Copy Merged | `Shift+Ctrl+C` |
| Paste | `Ctrl+V` |
| Fill | `Shift+F5` |
| Free Transform | `Alt+Ctrl+T` |
| Last Filter | `Alt+Ctrl+F` |
| Canvas Size | `Alt+Ctrl+C` |
| Image Size | `Alt+Ctrl+I` |
| Toggle Rulers | `Ctrl+R` |
| Toggle Extras | `Ctrl+H` |
| Select All | `Ctrl+A` |
| Deselect | `Ctrl+D` |
| Inverse Selection | `Shift+Ctrl+I` |
| Quick Mask Mode | `Q` |
| Group Layers | `Ctrl+G` |
| Clipping Mask | `Alt+Ctrl+G` |

---

## 12. Additional Photopea-Specific Features to Add

- **Pattern Preview mode** — tile the canvas to preview repeating patterns
- **Wavelet Decompose** — frequency separation for retouching
- **Vectorize Bitmap** — auto-trace raster to vector
- **Fourier Transform filter** — frequency domain editing
- **Vanishing Point** — perspective-correct editing
- **Liquify** — warp/push/pull pixels interactively
- **Camera Raw** — RAW photo editing panel with exposure, WB, tone curve
- **Lens Correction** — fix barrel/pincushion distortion, chromatic aberration
- **Content-Aware Scale** — scale image while protecting subject
- **Puppet Warp** — pin-based mesh warp
- **Perspective Warp** — adjust perspective of objects
- **Guides from Layer** — auto-generate guides from a layer's bounds
- **Slices** — define export slices on canvas
- **Copy Merged** — copy all visible layers as one flattened copy
- **Apply Image** — blend channels between documents
- **Variables** — data-driven design (like Design Studio's CSV merge but Photoshop-style)
- **Reduce Colors** — posterize to limited palette
- **Auto Tone / Auto Contrast / Auto Color** — one-click automatic corrections

---

*Reference: Photopea — photopea.com · Screenshots captured May 2026*
