# Bug Analysis: Hand Tracking & 3D Flute Issues

## Issue 1: HandLandmarker Model Failed to Load

### Root Cause
In `handTracking.ts`, the model loading logic has multiple path resolution problems:

```typescript
const isProd = window.location.hostname !== 'localhost' &&
               window.location.hostname !== '127.0.0.1';
const wasmPath = isProd
  ? window.location.origin + '/VisMu/mediapipe'
  : 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm';

const modelPaths = isProd
  ? [window.location.origin + '/VisMu/mediapipe/hand_landmarker.task']
  : ['https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'];
```

### Problems:
1. **Hardcoded `/VisMu/mediapipe` path**: Assumes your app is deployed at `/VisMu/` on GitHub Pages. If deployed elsewhere (different repo name, custom domain, different path structure), it fails silently.
2. **CORS restrictions**: The Google Storage URL may be blocked by CORS policies depending on your deployment.
3. **No fallback verification**: The code tries paths sequentially but doesn't validate that paths are actually accessible before attempting to load.
4. **Missing error context**: The final error `'All combinations failed'` doesn't indicate which specific path or delegate failed.

### Why "Failed to Load" Occurs:
- On localhost, it tries CDN first (may work or timeout)
- On production, it tries `/VisMu/mediapipe/*` which doesn't exist if:
  - Deployed to a different path
  - Assets aren't at that exact location
  - Assets aren't served correctly (wrong MIME type, CORS headers missing)

---

## Issue 2: 3D Flute Has No Holes

### Root Cause
The `Flute3D.d.ts` file is a **TypeScript declaration file (.d.ts)**, not the actual implementation.

```typescript
interface Flute3DProps {
    holeStates: boolean[];
    currentNote?: string;
    confidence?: number;
}
declare const Flute3D: React.FC<Flute3DProps>;
export default Flute3D;
```

This is just a **type definition** that describes the component signature. The actual 3D rendering code (`Flute3D.tsx` or `Flute3D.jsx`) is missing or not included.

### Problems:
1. **Missing Implementation**: There's no `.tsx` or `.jsx` file with actual Three.js/Babylon.js code to render the 3D model
2. **No Hole Geometry**: Even if the component exists, it likely doesn't:
   - Parse the `holeStates` boolean array
   - Dynamically create/hide hole meshes based on finger positions
   - Update material/geometry based on which holes are open/closed
3. **No Visual Feedback**: The component doesn't reflect which holes are currently open or closed based on `holeStates`

---

## Fix Instructions for AI Agent

### Fix 1: Repair HandLandmarker Loading

**Instruction:**
```
In handTracking.ts, replace the path resolution logic with:

1. Add a configuration object at the top:
   const ASSET_CONFIG = {
     localAssets: ['localhost', '127.0.0.1'].includes(window.location.hostname),
     wasmDir: '/assets/mediapipe/wasm',
     modelUrl: '/assets/mediapipe/hand_landmarker.task'
   };

2. Update the load() method to:
   - Accept the config as a parameter (allow override)
   - Use relative paths starting with '/' instead of hardcoded domain paths
   - Add proper error logging for each failed attempt: log the attempted path, delegate, and specific error message
   - For localhost: use CDN as fallback
   - For production: use local assets with `/assets/` prefix instead of `/VisMu/`

3. Add validation:
   - After FilesetResolver initialization, verify WASM files are accessible
   - Add a HEAD request check before attempting to load the model
   - Return detailed error messages indicating which path failed and why

4. Expected behavior:
   - Production: Try local /assets/mediapipe/*, then fallback to CDN
   - Localhost: Try CDN directly, skip local assets
```

### Fix 2: Create Complete Flute3D Implementation

**Instruction:**
```
Create a new file Flute3D.tsx that:

1. Import Three.js library (or Babylon.js)

2. Implement the Flute3D React component that:
   - Creates a 3D bansuri (flute) geometry with 5 holes
   - Holes positioned at TIP_IDS: [4, 8, 12, 16, 20] → thumb, index, middle, ring, pinky
   - Each hole is a cylindrical mesh subtracted from the main flute body (or rendered as separate torus outlines)

3. Map holeStates boolean array to visual feedback:
   - holeStates[0] (thumb): show/hide or change color of hole 1
   - holeStates[1] (index): hole 2
   - holeStates[2] (middle): hole 3
   - holeStates[3] (ring): hole 4
   - holeStates[4] (pinky): hole 5
   - Closed hole (true) = darker/opaque material
   - Open hole (false) = lighter/transparent or highlighted material

4. Add currentNote and confidence props:
   - Display current note label above flute
   - Show confidence level as a visual indicator (progress bar or color fade)

5. Animation:
   - Smooth transitions when holeStates change
   - Rotate flute slightly for better view angle
   - Optional: add glow effect to open holes

6. Return proper TypeScript types in the .d.ts file after implementation
```

---

## Summary

| Issue | Cause | Impact | Priority |
|-------|-------|--------|----------|
| **Model Failed to Load** | Hardcoded path `/VisMu/mediapipe` doesn't match actual deployment | App can't detect hand gestures | **CRITICAL** |
| **No Holes in Flute** | Missing implementation file (only .d.ts exists) | Visual feedback incomplete; can't show which holes are open/closed | **HIGH** |
| **Poor Error Messages** | Generic "All combinations failed" error | Hard to debug which specific asset or path failed | **MEDIUM** |
