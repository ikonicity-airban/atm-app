# 0032. 3D phone model and progressive web app screen scroll animation

**Date**: 2026-10-21
**Status**: Accepted

## Summary

This specification defines the replacement of the static two dimensional image in the mobile application banner with an interactive three dimensional Samsung smartphone scene. The scene renders a glTF model on an alpha transparent canvas that reacts to page scrolling. As you scroll into the section, the phone smoothly rotates from a tilted angle into an upright orientation while a detached floating preview of the progressive web app screen docks flush onto the display.

## Context

The Ascent Transport Management public home page features a dedicated promotional banner highlighting the mobile first progressive web app (a lightweight browser application that operates like an installed mobile program).

Currently, this banner displays a flat graphic asset (`3d-smartphone-pwa.png`) wrapped inside a card hover effect. While functional, a static picture misses an opportunity to deliver genuine spatial depth and tactility.

The repository includes a dedicated three dimensional model asset located at `apps/web/public/models/samsung_s_26_ultra_3d_model.glb`. The goal is to bring this model to life with a transparent background that blends into the purple gradient section container. The phone must begin lying at an angle and smoothly rotate upright as you scroll through the section. At the same time, the progressive web app interface must float slightly detached above the phone body before gliding down to dock flush against the glass.

## Requirements

**User stories**:
* As a traveler visiting the Ascent website, I want to experience an interactive three dimensional preview of the mobile boarding app so that I understand how simple it is to use without installing native app store packages.
* As a visitor using assistive technologies or someone sensitive to motion, I want the phone model and screen to remain static and immediately readable so that the presentation is comfortable and accessible.

**Acceptance criteria**:
* **AC-1**: A responsive WebGL canvas is mounted inside the mobile app banner with full alpha transparency so the container gradient shows through cleanly without rectangular artifacts.
* **AC-2**: The three dimensional model from `/models/samsung_s_26_ultra_3d_model.glb` is loaded and rendered with studio lighting (directional key light and ambient fill) reflecting across the metallic chassis and glass surfaces.
* **AC-3**: The progressive web app interface begins elevated on the Z axis and slightly angled, floating detached from the phone screen face when the section first scrolls into the viewport.
* **AC-4**: Scroll progress through the banner section continuously drives the orientation of the phone into an upright posture facing the camera, while pulling the floating screen plane into flush alignment with the phone display.
* **AC-5**: When `prefers-reduced-motion` is active or if WebGL is unsupported, the phone renders upright with the screen already docked flush and scroll rotation disabled.
* **AC-6**: The canvas is dynamically loaded on the client side without server side rendering to prevent hydration mismatches, and disposes geometries, textures, and renderer contexts on component unmount.

## Options considered

### Option 1: Unified Three.js scene with model and floating screen mesh (Chosen)

Render both the Samsung phone chassis and the floating progressive web app screen mesh inside a single Three.js scene using React Three Fiber or direct Three.js scene composition. The screen plane is placed at a positive coordinate offset above the topface mesh and moves along its local Z vector to meet the glass.

**Pros**:
* Single rendering context ensures matching perspective, focal length, lighting, and shadow occlusion.
* Docking alignment is mathematically exact without CSS perspective discrepancies between screen sizes.
* Alpha transparency integrates naturally with the gradient background.

**Cons**:
* Requires loading Three.js and the glTF binary asset, demanding dynamic imports to isolate client bundle weight.

### Option 2: Hybrid Three.js phone with CSS 3D transformed HTML overlay

Render the phone chassis inside a WebGL canvas, but render the progressive web app interface as a standard DOM element with CSS `transform: perspective() rotate3d() translate3d()`.

**Pros**:
* The floating screen contains live HTML text and buttons rather than a texture image.

**Cons**:
* Aligning CSS 3D transform matrices with WebGL projection matrices across responsive container widths is notoriously brittle.
* Lighting and specular reflections cannot pass between the chassis and the floating layer.

## Decision

**Chosen option**: Option 1: Unified Three.js scene with model and floating screen mesh

We build a dedicated client component that loads the Samsung phone model and a textured floating plane within a single alpha transparent Three.js canvas, synchronized to viewport scroll progress.

**Implementation skills**: `antigravity-design-expert` (`mindrally/skills`, `.agents/skills/antigravity-design-expert/`), `improve-animations` (`emilkowalski/skills`, `.agents/skills/improve-animations/`), `tailwindcss` (`mindrally/skills`, `.agents/skills/tailwindcss/`)

## Rationale

A unified WebGL scene guarantees that the camera projection, focal length, and depth buffer are identical for both the phone chassis and the floating display. When the floating screen descends to dock into the phone frame, there is zero jitter, clipping mismatch, or responsive drift. Driving the scene rotation and plane offset through normalized scroll progress provides fluid control as the user moves down the page.

## Feature design

**Component architecture**:
* `SamsungPhoneCanvas.tsx`: Client component loaded dynamically with `next/dynamic` and `ssr: false`. Houses the canvas, camera setup, and scroll progress listener.
* `SamsungPhoneModel.tsx`: Loads `/models/samsung_phone.glb` via Three.js GLTFLoader. Maps materials to `topface`, `lowerface`, and `sides`.
* `FloatingScreenMesh.tsx`: A thin plane mesh positioned directly above `topface`. Applies the progressive web app interface texture (`/images/home/3d-smartphone-pwa.png` or dedicated mobile pass texture).
* `MobileAppBanner.tsx`: Replaces the static image element with `SamsungPhoneCanvas`, preserving existing WobbleCard and badge overlays.

**Scene and camera setup**:
* Canvas background: Alpha set to zero for full transparency.
* Camera: Perspective camera with forty five degree field of view, positioned centered on the phone anchor.
* Lighting: Ambient light intensity 0.8, directional key light intensity 1.5 positioned at top right, subtle rim light positioned at bottom left for metallic rim definition.

**Animation and scroll mapping**:
* Section progress: Computed between 0.0 (banner enters lower viewport) and 1.0 (banner centers in viewport).
* Phone rotation:
  * Start (progress 0.0): Tilted back forty degrees (X rotation) and angled thirty degrees (Y rotation), lying casually.
  * End (progress 1.0): Facing directly forward with zero rotation.
* Floating screen offset:
  * Start (progress 0.0): Elevated 1.2 units along the normal axis away from the phone face, with slight outward pitch.
  * End (progress 1.0): Offset 0.01 units flush above the phone glass display.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Load phone model | 3D geometry and mesh hierarchy | `apps/web/public/models/samsung_s_26_ultra_3d_model.glb` |
| Load screen graphic | PWA interface texture | High-definition canvas PWA boarding pass texture |
| Compute scroll fraction | Value from 0.0 to 1.0 | Window scroll event or IntersectionObserver relative to container rect |
| Check motion preference | Boolean flag | Media query `(prefers-reduced-motion: reduce)` |

**Key invariants**:
* The canvas must never block page pointer events or document scrolling.
* Model geometries, textures, materials, and WebGL animation frame loops must be cleaned up on component unmount.
* Total memory allocation must remain under thirty megabytes.

**Security model**:
* Public static client asset loading only. No authentication tokens or sensitive customer data are passed to the 3D canvas.

**Critical test scenarios**:
* Initial render: Model loads on screen without visual flash or hydration mismatch, verifies **AC-1**, **AC-2**, **AC-6**.
* Scroll progression: Scrolling into view causes phone to rotate upright while floating screen docks flush, verifies **AC-3**, **AC-4**.
* Motion reduction: With reduced motion enabled, phone displays upright and static immediately, verifies **AC-5**.
* Component unmount: Navigating away cleans up WebGL contexts without memory leaks, verifies **AC-6**.

## Build plan

- [x] 1. Create the client side dynamic Three.js canvas component with transparent background and resize observation, satisfies **AC-1**, **AC-6**
- [x] 2. Load and inspect the `samsung_s_26_ultra_3d_model.glb` model with proper material assignment and ambient studio lighting, satisfies **AC-2**
- [x] 3. Create the floating screen mesh plane textured with the progressive web app interface, positioned elevated above the phone face, satisfies **AC-3**
- [x] 4. Connect the viewport scroll progress listener to rotate the phone group and glide the floating screen mesh into docked alignment, satisfies **AC-4**
- [x] 5. Implement accessibility checks for reduced motion preference and WebGL unsupported fallback, satisfies **AC-5**
- [x] 6. Integrate the 3D phone canvas into `MobileAppBanner.tsx` replacing the static image asset, satisfies **AC-1**, **AC-4**

## Consequences

**Positive**:
* Delivers an elevated, high craft visual showcase that highlights the progressive web app experience.
* Interactive 3D depth draws traveler attention to mobile booking capabilities.
* Full respect for reduced motion ensures comfort and compliance for all visitors.

**Negative / tradeoffs**:
* Adds client side Three.js bundle parsing overhead to the home page (mitigated by lazy dynamic loading).
* Older devices with weak mobile GPUs may run at lower frame rates, requiring the reduced motion and fallback paths.

**Neutral**:
* The canvas layout requires responsive camera framing across mobile and desktop container widths.

## Follow-up

- [ ] Verify visual contrast and readability of the progressive web app screen texture across dark and light themes.
- [ ] Measure framerate on low tier mobile hardware to confirm smooth 60 frames per second scroll response.

## Migration plan

**Strategy**: Direct in place replacement within `MobileAppBanner.tsx`.
**Phases**:
1. Implement the Three.js canvas and model components under `apps/web/src/components/home/`.
2. Swap the static image in `MobileAppBanner.tsx` with the dynamically imported canvas component.
3. Test locally across desktop and mobile viewports with smooth scroll and reduced motion toggles.
**Rollback**: Revert `MobileAppBanner.tsx` to restore the static image element.
**Risks**: Minor rendering differences on browsers without WebGL 2.0 support, mitigated by the static upright fallback.
