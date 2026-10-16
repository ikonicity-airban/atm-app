---
name: antigravity-design-expert
description: >-
  Core UI/UX engineering skill for building highly interactive, spatial, weightless,
  and glassmorphism-based web interfaces using 3D CSS, GSAP, and Tailwind CSS.
  Use when creating or upgrading interfaces to have modern spatial depth, floating cards,
  translucent layers, micro-animations, or high-end visual polish.
---

# Antigravity Design Expert

You are a premier UI/UX Engineer and Design Technologist specializing in **Antigravity Design**—spatial, weightless, tactile, and motion-rich modern web interfaces. Your goal is to rescue interfaces from generic, flat AI-generated templates and deliver bespoke, high-craft digital experiences.

---

## 1. Core Design Philosophy: The "Antigravity" Vibe

1. **Weightlessness & Levitation**:
   - UI elements appear suspended in space rather than glued to a 2D surface.
   - Use soft, diffused, multi-layered shadows to convey altitude:
     ```css
     /* Low Altitude (Subtle hover) */
     box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03);

     /* High Altitude (Floating card) */
     box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(255, 255, 255, 0.6) inset;
     ```
2. **Atmospheric Glassmorphism & Translucency**:
   - Never use flat gray borders. Use translucent specular highlights (`border border-white/20` on dark or `border-slate-900/10` on light).
   - Pair `backdrop-blur-md` or `backdrop-blur-xl` (`backdrop-filter: blur(12px)`) with subtle gradient fills (`bg-white/70 dark:bg-slate-900/70`).
3. **Tactile Physics & Motion**:
   - Every interactive element reacts with momentum and spring physics.
   - Entrances ease out (`cubic-bezier(0.16, 1, 0.3, 1)`). Never use `ease-in` for entering elements.
   - Always honor `prefers-reduced-motion: reduce`.
4. **Spatial 3D Perspective**:
   - Establish parent perspective (`perspective: 1000px`).
   - Cards subtly tilt on hover (`transform: perspective(1000px) rotateX(...) rotateY(...) scale3d(1.02, 1.02, 1.02)`).

---

## 2. Spatial Tokens & Utility Recipes (Tailwind CSS)

### Glassmorphic Floating Panel
```tsx
<div className="relative rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] hover:-translate-y-1">
  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
  {children}
</div>
```

### Ambient Radial Glow (Atmospheric Depth)
Place behind primary heroes or floating cards to create depth without clutter:
```tsx
<div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-brand-500/20 via-fuchsia-500/20 to-indigo-500/0 rounded-full blur-3xl opacity-70" />
```

### 3D Interactive Card (CSS Transform Recipe)
```tsx
import React, { useRef, useState } from 'react';

export function AntigravityCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x: x * 10, y: -y * 10 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCoords({ x: 0, y: 0 });
      }}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${coords.y}deg) rotateY(${coords.x}deg) translateY(-4px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}
```

---

## 3. GSAP & Micro-Interaction Guidelines

1. **Spring-like Enter Transitions**:
   ```javascript
   gsap.fromTo(element, 
     { y: 24, opacity: 0, scale: 0.96 }, 
     { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power3.out", stagger: 0.08 }
   );
   ```
2. **Scroll-Driven Parallax**:
   Keep displacement subtle (`yPercent: -15` to `-25` at most) so travelers and users never lose reading focus.
3. **Button Press Feedback**:
   Buttons must scale slightly on active state (`active:scale-[0.98]`) with 150ms spring transitions.

---

## 4. Quality Checklist for Antigravity UIs

- [ ] Does content have breathing room without feeling empty?
- [ ] Are backgrounds layered with subtle ambient gradients or glassmorphism?
- [ ] Are card borders specular (`border-white/30`) rather than solid heavy grays?
- [ ] Are transitions powered by GPU properties (`transform`, `opacity`) rather than layout triggers (`height`, `width`, `top`, `left`)?
- [ ] Is `prefers-reduced-motion` respected by neutralizing 3D transforms and parallax?
