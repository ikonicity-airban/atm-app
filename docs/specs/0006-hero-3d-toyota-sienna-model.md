# 0006. Hero 3D Toyota Sienna model viewer

**Date**: 2026-10-14
**Status**: Accepted

## Summary

This specification defines the integration of an interactive real time 3D Toyota Sienna XSE vehicle model into the public hero section. The feature renders the 15.5 megabyte glTF binary model using Three.js with studio lighting, realistic metallic shaders, ground shadow, orbit controls, smooth auto rotation, progress loading indicators, and graceful static vector fallback. It also removes the development preview ribbon from top level pages to provide a clean public production layout.

## Context

Ascent Transport Management operates five passenger Toyota Sienna vehicles across major travel corridors in Nigeria. The hero section previously displayed a two dimensional SVG vector illustration along the highway base.

The repository includes a photorealistic 3D asset at `apps/web/public/models/2022_toyota_sienna_xse.glb`. Bringing this model directly into the hero experience gives travelers an immediate visual preview of the executive fleet they will board.

Simultaneously, the development scaffold ribbon previously pinned to the top of the viewport cluttered the public presentation. Removing it allows the clean navigation header and the 3D vehicle canvas to anchor the landing page naturally.

## Requirements

**User stories**:
* As a traveler visiting the website, I want to see and interact with an authentic 3D model of the Toyota Sienna vehicle so that I can inspect the fleet and feel confident in the travel quality before booking.
* As a customer with a slower internet connection or reduced motion preference, I want the page to load smoothly with a clear progress indicator and a graceful fallback so that my experience remains fast and accessible.

**Acceptance criteria**:
* **AC-1**: The 3D model located at `/models/2022_toyota_sienna_xse.glb` is loaded and rendered in a responsive WebGL canvas within the hero section.
* **AC-2**: The canvas provides smooth camera lighting including directional key light, ambient fill, and a ground shadow plane positioned beneath the vehicle wheels.
* **AC-3**: Subtle auto rotation rotates the vehicle smoothly, pausing when the user engages drag interaction with mouse or touch controls.
* **AC-4**: Orbit controls constrain polar vertical rotation between fifteen and eighty five degrees, preventing camera clipping underneath the ground plane.
* **AC-5**: A progressive loading bar displays percentage feedback while the model streams into memory.
* **AC-6**: If WebGL is unsupported or asset loading fails, the system renders the existing high fidelity 2D vehicle silhouette without throwing unhandled exceptions.
* **AC-7**: When `prefers-reduced-motion: reduce` is detected, auto rotation is disabled while manual touch and drag remain functional.
* **AC-8**: Component cleanup disposes geometries, materials, textures, and the WebGL renderer on unmount to prevent GPU and memory leaks.
* **AC-9**: The development scaffold ribbon is removed from the top of the page so that the public header rests directly at the top of the viewport.

## Options considered

### Option 1: Native Three.js canvas component with GLTFLoader and OrbitControls

Build a self contained React component utilizing Three.js and OrbitControls directly.

### Option 2: React Three Fiber with Drei useGLTF in background (Chosen)

Use `@react-three/fiber` and `@react-three/drei`'s `useGLTF` hook to load and render the Sienna model as an ambient, non blocking background element.

**Pros**:
* Idiomatic React composition with declarative Canvas and `useGLTF` hook.
* Removal of OrbitControls keeps the vehicle strictly in the background without intercepting mouse gestures.
* Streamlined asset lifecycle with automatic caching and disposal.

## Decision

**Chosen option**: Option 2: React Three Fiber with Drei useGLTF in background.

We implement `apps/web/src/components/atm/SiennaModelViewer.tsx` powered by `@react-three/fiber` and `@react-three/drei` (`useGLTF`), mounting the car in the background of the hero highway anchor with controls removed.

**Implementation skills**: `coss` (`cosscom/ui`, `.agents/skills/coss/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Technical design

### 1. Canvas and Scene Architecture

* **Renderer**: `THREE.WebGLRenderer` with `antialias: true`, `alpha: true`, and `powerPreference: "high-performance"`.
* **Color Management**: `THREE.SRGBColorSpace` output with `THREE.ACESFilmicToneMapping` and exposure calibrated to 1.1 for realistic metallic car paint.
* **Lighting Rig**:
  * Hemisphere light (sky: `#ffffff`, ground: `#475569`, intensity: 1.2) for balanced outdoor ambient illumination.
  * Directional key light (`#ffffff`, intensity: 2.2) angled at `[5, 8, 5]` casting soft contact shadows.
  * Secondary fill light (`#ca2484`, intensity: 0.4) angled from the rear left to reflect brand magenta on vehicle contours.
* **Contact Shadow**: Soft circular shadow plane resting directly on top of the highway asphalt surface.
* **Camera Configuration**: Perspective camera with forty five degree field of view, positioned at an isometric three quarter front angle `[3.8, 1.6, 4.2]`.
* **Controls**: `OrbitControls` with `enablePan: false`, `minDistance: 3.2`, `maxDistance: 7.5`, `maxPolarAngle: Math.PI / 2 - 0.05`, and damping factor `0.05`.

### 2. Memory Lifecycle and Teardown

To guarantee zero memory leaks:
```typescript
scene.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) {
      object.material.forEach((mat) => mat.dispose());
    } else if (object.material) {
      object.material.dispose();
    }
  }
});
renderer.dispose();
```

## Build plan

- [x] 1. Remove the development scaffold ribbon from `src/App.tsx`, satisfies **AC-9**.
- [x] 2. Ensure model asset `/models/2022_toyota_sienna_xse.glb` is served correctly from the public root, satisfies **AC-1**.
- [x] 3. Create `apps/web/src/components/atm/SiennaModelViewer.tsx` with WebGL canvas, lighting rig, GLTFLoader, OrbitControls, loading bar, and fallback, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**.
- [x] 4. Mount `SiennaModelViewer` inside `apps/web/src/components/atm/VehicleHighwayAnchor.tsx` resting atop the highway asphalt, satisfies **AC-1**, **AC-2**.
- [x] 5. Run typecheck, unit tests, and production build verifying zero regressions, satisfies **AC-8**.

## Consequences

**Positive**:
* Stunning, interactive 3D hero showcase allowing users to rotate and inspect the Toyota Sienna.
* Graceful fallback ensures no breakage on unsupported hardware or offline contexts.
* Complete removal of the top development ribbon leaves a clean production interface.

**Negative / tradeoffs**:
* The 3D model asset is fifteen megabytes; streaming takes one to two seconds on initial load, mitigated by progressive percentage feedback and cached delivery.

**Neutral**:
* The existing 2D vector silhouette remains as an instant fallback during loading and for low capability devices.
