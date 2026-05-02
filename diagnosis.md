# VisMu — Root Cause Diagnosis

## Bug 1 — MediaPipe WASM path is wrong for local dev (Model fails to load)

**File:** `frontend/src/systems/handTracking.ts` · Line 89

```ts
// ❌ WRONG — hardcoded GitHub Pages path breaks localhost
const wasmPath = window.location.origin + '/VisMu/mediapipe';
```

The WASM path is **always** built as `http://localhost:5173/VisMu/mediapipe`.  
On the local dev server (Vite), there is **no `/VisMu/` prefix** and **no `/mediapipe/` folder** — only GitHub Pages uses those paths.

The `FilesetResolver.forVisionTasks()` call fails immediately because the WASM files cannot be fetched from that URL → `HandLandmarker` throws → `this.failed = true` → UI shows **"MODEL FAILED TO LOAD"**.

**Fix:** Detect environment and route to CDN on dev, local assets on production:

```ts
// ✅ CORRECT
const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const wasmPath = isProd
  ? window.location.origin + '/VisMu/mediapipe'
  : 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16/wasm';
```

---

## Bug 2 — MediaPipe assets missing from `dist/` (Model fails on GitHub Pages too)

**File:** `frontend/dist/` (local build output)

The local `dist/` directory has **no `mediapipe/` folder**:
```
dist/
  assets/
  favicon.svg
  icons.svg
  index.html      ← no mediapipe/ subfolder
```

The deploy workflow downloads mediapipe assets into `frontend/dist/mediapipe/` *after* the `vite build` step — but the **local dist is what is currently committed / being tested**, and it is missing those files entirely.  
On GitHub Actions the assets *are* downloaded, but on any local `vite preview` run the model path still points to `/VisMu/mediapipe` which will 404.

---

## Bug 3 — `audioEngine.playNote()` called with note `'--'` every frame (no audio ever plays)

**File:** `frontend/src/components/WebcamView.tsx` · Line 81

```ts
audioEngine.playNote(d.note);   // d.note is '--' when no match found
```

**File:** `frontend/src/systems/audioEngine.ts` · Line 81

```ts
if (!note || note === '--') return;   // early exit — correct
```

The audio engine itself correctly guards against `'--'`. However, the **note detection logic is almost certainly returning `'--'` for every frame** because of Bug 1 — tracking never starts, so `onResults` receives empty `multiHandLandmarks` → `audioEngine.playNote(null)` → silence.

Even when tracking *does* work (CDN fallback), the note key is built incorrectly:

**File:** `frontend/src/systems/handTracking.ts` · Line 48

```ts
// ❌ BUG — appends holeStates[4] (pinky) twice instead of a thumb-hole bool
const key = [...holeStates, holeStates[4]].slice(0, 6).map(s => s ? '1' : '0').join('');
```

`holeStates` already has 5 items (thumb + 4 fingers from TIP_IDS).  
Appending `holeStates[4]` again produces `[thumb, index, middle, ring, pinky, pinky]` — a 6-char key — but the NOTE_MAP keys are designed as `[thumb, index, middle, ring, pinky, littlePinky]` with all 6 holes represented distinctly.  
For most hand poses this duplicate pinky entry generates a key that does **not exist in NOTE_MAP**, so `note` is always `'--'` and no audio plays.

---

## Bug 4 — Finger-closed detection logic is inverted for non-thumb fingers

**File:** `frontend/src/systems/handTracking.ts` · Line 45

```ts
// ❌ INVERTED — tip.y > mcp.y means the finger is EXTENDED (pointing up in camera coords)
// In MediaPipe normalized coords, y=0 is TOP, y=1 is BOTTOM
// A CLOSED/bent finger has tip.y LESS THAN mcp.y (tip is above the knuckle)
return (tip.y - mcp.y) > palmSize * 0.1;
```

The condition `tip.y > mcp.y` is true when the fingertip is **below** the knuckle — i.e. the finger is **straight/extended**, not bent/closed.  
This means a flat open hand is detected as "all holes covered" and a closed fist is detected as "all holes open" — the exact opposite of the intended flute fingering logic.

**Fix:**
```ts
// ✅ Closed finger = tip is ABOVE mcp (smaller y value in MediaPipe coords)
return (mcp.y - tip.y) > palmSize * 0.1;
```

---

## Summary Table

| # | Where | What breaks | Severity |
|---|-------|-------------|----------|
| 1 | `handTracking.ts:89` | WASM path hardcoded to `/VisMu/mediapipe` — fails on localhost → model never loads | 🔴 Critical |
| 2 | `dist/` + `deploy.yml` | Local `dist/` has no `mediapipe/` folder; only CI runner downloads assets | 🟠 High |
| 3 | `handTracking.ts:48` | 6-char key built incorrectly (pinky duplicated) → NOTE_MAP never matches → no note output | 🔴 Critical |
| 4 | `handTracking.ts:45` | Finger-closed check is **inverted** in MediaPipe y-axis coords | 🔴 Critical |

Fixing bugs 1, 3, and 4 in `handTracking.ts` will restore both finger tracking and audio playback locally. Bug 2 only affects `vite preview` and is handled by the CI pipeline on GitHub Pages.
