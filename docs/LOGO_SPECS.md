# Curfew Brand Identity & Logo Specifications 🛡️⏱️

This specification defines the visual identity, iconography, color science, and asset production guidelines for **Curfew**.

---

## 1. Brand Concept & Core Metaphors

Curfew is built around **honorable, intent-based accountability and focus**. The logo synthesizes three core visual motifs:

1. **The Guardian Shield (Outer Bezel):**
   - Represents protection, self-discipline, and non-invasive defense against impulsive gaming or digital relapse.
   - Brushed titanium and obsidian finish with faceted beveled geometry.
2. **The Countdown Stopwatch (Inner Ring):**
   - Represents the finite daily time budget, tick-by-tick awareness, and the save-your-progress grace period.
   - Radiant crimson neon rim with precision tick notches at 5-minute / second intervals.
3. **The Focus Reticle (Center Crosshair):**
   - Subtle crosshair intersecting the dial center, symbolizing gaming precision, clarity, and intentionality.

---

## 2. Color Palette & Lighting Tokens

| Token | Hex | RGB | Purpose |
| :--- | :--- | :--- | :--- |
| **Crimson Glow (Primary)** | `#f43f5e` | `rgb(244, 63, 94)` | Active stopwatch dial, strike indicators, primary buttons, emergency grace warnings. |
| **Deep Rose (Primary Dark)**| `#e11d48` | `rgb(225, 29, 72)` | Gradient depths, button active states, hover shadows. |
| **Cyber Violet (Accent)** | `#6366f1` | `rgb(99, 102, 241)` | Secondary rim lighting, history charts, subtle ambient background glow. |
| **Emerald Sentinel (Status)**| `#10b981` | `rgb(16, 185, 129)` | Active tracking beacon, healthy standby guard, success states. |
| **Obsidian Void (Background)**| `#07090e` | `rgb(7, 9, 14)` | Matte background, window container, deep elevation layers. |
| **Brushed Titanium (Bezel)** | `#334155` | `rgb(51, 65, 85)` | Shield metal edge, high-contrast borders, physical depth. |

---

## 3. Geometry & Grid Specifications

- **Aspect Ratio:** `1:1` square canvas for app icons, avatars, and favicons.
- **Center Alignment:** Perfect optical centering on the crosshair axis.
- **Corner Curvature:** Shield top is angled at $120^\circ$ apex with chamfered corners, tapering to an aerodynamic bottom point.
- **Dial Proportion:** Inner dial occupies $68\%$ of the shield width, allowing the titanium shield bezel to frame the neon ring cleanly.

---

## 4. Required Icon Formats & Export Sizes

For complete Windows deployment and packaging (`electron-builder.json`):

### A. Windows Application Icon (`build/icon.ico`)
A multi-resolution `.ico` containing the following square mipmap sizes:
- `16x16` (Taskbar small / details view)
- `24x24` (Start menu small)
- `32x32` (Desktop standard / taskbar large)
- `48x48` (Desktop medium)
- `64x64` (File explorer large icons)
- `128x128` (Windows high DPI)
- `256x256` (Windows extra large / Store asset)

### B. System Tray Icon (`resources/tray.png` / `resources/tray@2x.png`)
- **Dimensions:** `16x16` (1x) and `32x32` (2x high DPI).
- **Design:** Simplified silhouette of the shield with high-contrast crimson outline or clean monochrome mask for Windows 10/11 taskbars.

### C. NSIS Windows Installer Graphics
- **Header Image (`installerHeaderIcon.ico`):** `48x48`
- **Installer Sidebar (`installerSidebar.bmp`):** `164x314` (Dark gradient with Curfew emblem and tagline)
- **Uninstaller Sidebar (`uninstallerSidebar.bmp`):** `164x314`

---

## 5. Typography

- **Display & UI Headings:** `Plus Jakarta Sans` (Weights: `700 Bold`, `800 ExtraBold`)
- **Body & Controls:** `Plus Jakarta Sans` (Weights: `400 Regular`, `500 Medium`, `600 SemiBold`)
- **Timers, Metrics, PIDs & Code:** `JetBrains Mono` (Weights: `500 Medium`, `700 Bold`)
