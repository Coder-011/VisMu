# Updated Bug Analysis: Hand Tracking & 3D Flute Issues

## Issue 1: HandLandmarker Model Failed to Load

### Root Cause
In `handTracking.ts`, the model loading logic has hardcoded asset paths:

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

### Specific Problems:
1. **`/VisMu/` hardcoded path**: Assumes deployment at GitHub Pages with exactly this repo name. If deployed differently (different org, different path, custom domain), the asset URLs are 404.
2. **CORS restrictions**: Google Storage URLs may be blocked by CORS depending on browser/deployment context.
3. **No fallback verification**: Code tries paths sequentially but doesn't verify accessibility before loading.
4. **Vague error handling**: Final error `'All combinations failed'` doesn't indicate which path/delegate/reason failed.
5. **Silent failures**: Try/catch blocks swallow errors with `/* try next */`, making root cause invisible.

### Why "Failed to Load" Occurs:
- On production: tries `/VisMu/mediapipe/hand_landmarker.task` → 404 if not deployed there
- On localhost: tries CDN → may work, but no fallback if CDN is slow/blocked
- No logging of actual HTTP errors, CORS issues, or file not found errors

---

## Issue 2: 3D Flute Shows Holes But They Don't Respond Correctly

### Root Cause Analysis
The `Flute3D.tsx` implementation has a **hole state mapping bug**:

```typescript
const FINGER_HOLE_X = [-1.2, -0.7, -0.2, 0.3, 0.8, 1.3];

{FINGER_HOLE_X.map((x, idx) => {
  // Map to holeStates: idx 0 = thumb (H1), 1-4 = fingers
  // For display we show 5 states across 6 holes (last two share pinky state)
  const stateIdx = idx < 5 ? idx : 4;
  const closed = holeStates[stateIdx] ?? false;
```

### Specific Problems:

1. **6 holes, 5 states mismatch**:
   - The flute renders **6 finger holes** (`FINGER_HOLE_X` has 6 elements)
   - But `holeStates` from `handTracking.ts` only provides **5 states** (thumb + 4 fingers)
   - The code tries to patch this by mapping both holes 4 and 5 to `stateIdx === 4` (pinky)
   - **Result**: Holes 4 and 5 always show the same state, creating confusion

2. **State mapping is backwards/incorrect**:
   - `handTracking.ts` defines `TIP_IDS = [4, 8, 12, 16, 20]` (5 fingers)
   - `holeStates` order: `[thumb, index, middle, ring, pinky]` (indices 0-4)
   - `Flute3D.tsx` assumes: `[thumb(H1), finger(H2), finger(H3), finger(H4), finger(H5), pinky(H6)]`
   - **Mismatch**: The visual feedback doesn't match finger tracking intent

3. **Hole visual feedback is inverted/confusing**:
   - Closed hole (true) → cyan neon glow with emissive light
   - Open hole (false) → dark/black
   - This is backwards from physical reality (closed = air stops, no light; open = air flows, visible)
   - **Result**: Visual representation contradicts the interaction model

4. **No handling of missing holeStates**:
   - If `holeStates` is empty or shorter than expected, all holes default to `false`
   - No warning or fallback behavior
   - No graceful degradation when hand tracking is unavailable

---

## Fix Instructions for AI Agent

### Fix 1: Repair HandLandmarker Model Loading

**Priority**: CRITICAL — Hand tracking won't work at all without this

**Instruction to AI Agent**:
```
In handTracking.ts, modify the asset path resolution in the load() method:

STEP 1: Replace hardcoded paths with environment-aware logic:
  - Remove the hardcoded '/VisMu/' path
  - Add support for environment variable or config object for asset base path
  - Default to CDN for both localhost and production
  - Only use local assets if explicitly configured

STEP 2: Add logging for debugging:
  - Log each attempted path before trying it
  - Log the delegate (GPU/CPU) being attempted
  - Log the actual error message if a load fails (don't swallow it with /* try next */)
  - Log which combination finally succeeds

STEP 3: Implement proper error recovery:
  - For localhost: try CDN first (fast load)
  - For production: try CDN (reliable), then fall back to local /assets/ if configured
  - Add a HEAD request validator to check path accessibility before attempting download
  - Return meaningful error with last attempted path and reason

STEP 4: Update the error message:
  - Instead of "All combinations failed", include:
    * Last attempted wasmPath and modelPath
    * Last error message
    * Suggested next steps (check network, check path, check CORS headers)

Example improved code structure:
  const pathConfigs = [
    { wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm', model: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', label: 'CDN' },
    // Only add local paths if explicitly configured
    ...(config.useLocalAssets ? [{ wasm: '/assets/mediapipe/wasm', model: '/assets/mediapipe/hand_landmarker.task', label: 'Local' }] : [])
  ];

  for (const { wasm, model, label } of pathConfigs) {
    for (const delegate of ['GPU', 'CPU']) {
      try {
        console.log(`Trying ${label} with ${delegate}...`);
        // load code
        console.log(`✅ Loaded from ${label} with ${delegate}`);
        return;
      } catch (err) {
        console.warn(`❌ ${label} (${delegate}) failed:`, err.message);
      }
    }
  }
  throw new Error(`All paths failed. Last error: ${lastError}`);
```
---

### Fix 2: Reconcile Flute Holes with Hand Tracking States

**Priority**: HIGH — Holes exist but don't behave as intended

**Instruction to AI Agent**:

```
In Flute3D.tsx, fix the hole-to-state mapping:

STEP 1: Determine correct hole count:
  Option A (Recommended): 5 holes matching hand tracking
    - Remove hole 6 from FINGER_HOLE_X
    - Change: const FINGER_HOLE_X = [-1.2, -0.7, -0.2, 0.3, 0.8];
    - Now 5 holes = 5 hand states (thumb, index, middle, ring, pinky)
  
  Option B: Keep 6 holes, extend holeStates
    - Modify handTracking.ts to generate 6 states instead of 5
    - Map duplicates (e.g., pinky state to both holes 5 and 6)
    - Less recommended: creates artificial state

  Use Option A unless there's a specific musical reason for 6 holes.

STEP 2: Simplify state mapping:
  Current buggy code:
    const stateIdx = idx < 5 ? idx : 4;
    const closed = holeStates[stateIdx] ?? false;
  
  Fixed code (after removing hole 6):
    const closed = holeStates[idx] ?? false;
  
  This removes the confusion and 1:1 maps each hole to its corresponding hand state.

STEP 3: Fix visual feedback (closed hole behavior):
  Current: closed=true shows CYAN NEON GLOW (confusing)
  
  The logic is inverted. In hand tracking:
    - closed: true = finger bent down = hole BLOCKED = no air = visual should be DARKER/BLOCKED
    - closed: false = finger extended = hole OPEN = air flows = visual should be LIGHTER/OPEN
  
  Fix the visuals:
    - Closed hole (true): Dark/opaque material, NO glow (air is blocked)
    - Open hole (false): Bright/light material or slight glow (air can flow)
  
  Replace the color logic:
    OLD: color={closed ? '#00f2ff' : '#0d0500'}  // inverted!
    NEW: color={closed ? '#1a0800' : '#00f2ff'}  // closed=dark, open=bright
  
    OLD: emissive={closed ? '#00f2ff' : '#000000'}
    NEW: emissive={closed ? '#000000' : '#00f2ff'}  // only glow when open
  
    OLD: {closed && <pointLight ... />}  // light only when closed
    NEW: {!closed && <pointLight ... />}  // light only when open

STEP 4: Add fallback visual indicator:
  - If holeStates is undefined or too short, render all holes in a neutral gray color
  - Add console warning: "holeStates length mismatch: expected 5, got {length}"
  - Add a text label above flute showing current states: "States: [T I M R P]" → "States: [0 1 1 0 1]"

STEP 5: Update type definitions:
  - Ensure Flute3D.d.ts correctly reflects:
    interface Flute3DProps {
      holeStates: boolean[];  // Must have exactly 5 elements: [thumb, index, middle, ring, pinky]
      currentNote?: string;
      confidence?: number;
    }
  - Add JSDoc comment explaining expected length and order
```

---

## Summary Table

| Issue | Current Behavior | Root Cause | Fix |
|-------|------------------|-----------|-----|
| **Model fails to load** | "Failed to load" generic error | Hardcoded `/VisMu/` path doesn't match deployment | Use CDN by default, add logging, remove hardcoded paths |
| **6 holes / 5 states mismatch** | Holes 5&6 always show same state | Flute has 6 holes, hand tracking provides 5 states | Remove hole 6 from FINGER_HOLE_X, simplify mapping to 1:1 |
| **Inverted hole visuals** | Closed hole glows cyan, open hole is dark | Logic is backwards (closed should be dark, open should be light) | Swap the color, emissive, and pointLight conditions |
| **No feedback on state mismatch** | Silent failure if holeStates wrong size | No validation or warning | Add length check, console warning, fallback colors |

---

## Testing Checklist

After applying fixes:

1. **Hand Tracking**:
   - [ ] Open browser console, check for successful model load logs (not "All combinations failed")
   - [ ] Move hand in front of camera, check that landmarks appear
   - [ ] Bend fingers, verify holeStates changes in console

2. **3D Flute Display**:
   - [ ] Only 5 holes visible (remove hole 6)
   - [ ] Close hand (all fingers bent) → all holes should turn DARK/OPAQUE
   - [ ] Open hand (all fingers extended) → all holes should turn BRIGHT/GLOW CYAN
   - [ ] Each individual finger bend/extend affects only its corresponding hole
   - [ ] Hole glow only appears when hole is OPEN (not closed)

3. **Edge Cases**:
   - [ ] If hand tracking fails, flute renders with neutral gray holes (no cyan glow)
   - [ ] If holeStates is shorter than 5, console shows warning
   - [ ] Model loads from CDN even if local assets don't exist
