'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Smartphone } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';

/**
 * Creates a plane geometry with smooth rounded corners matching modern smartphone screens.
 */
function createRoundedPlaneGeometry(width: number, height: number, radius: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + height - radius);
  shape.quadraticCurveTo(x, y + height, x + radius, y + height);
  shape.lineTo(x + width - radius, y + height);
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  shape.lineTo(x + width, y + radius);
  shape.quadraticCurveTo(x + width, y, x + width - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);

  const geometry = new THREE.ShapeGeometry(shape, 24);

  // Generate UV coordinates normalized from 0 to 1 across the plane surface
  const pos = geometry.attributes.position;
  if (!pos) return geometry;

  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    uvs[i * 2] = (vx - x) / width;
    uvs[i * 2 + 1] = (vy - y) / height;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a high-resolution 2D canvas texture representing the Ascent Progressive Web App
 * digital boarding pass, optimized for smartphone screen aspect ratio (~1:2.1).
 */
function createPwaScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2160;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 16;
    fallbackCanvas.height = 16;
    return new THREE.CanvasTexture(fallbackCanvas);
  }

  // 1. Deep Atmospheric Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 2160);
  bgGrad.addColorStop(0, '#090214');
  bgGrad.addColorStop(0.35, '#17052a');
  bgGrad.addColorStop(0.75, '#280b45');
  bgGrad.addColorStop(1, '#0e021a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 2160);

  // Subtle radial glows in background
  const glow1 = ctx.createRadialGradient(250, 450, 20, 250, 450, 400);
  glow1.addColorStop(0, 'rgba(202, 36, 132, 0.32)');
  glow1.addColorStop(1, 'rgba(202, 36, 132, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 1024, 1000);

  const glow2 = ctx.createRadialGradient(800, 1500, 20, 800, 1500, 500);
  glow2.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
  glow2.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 1000, 1024, 1160);

  // 2. Status Bar (Top)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('09:41', 80, 85);

  // Punch Hole Camera Simulation (Center Pill)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(472, 48, 80, 24, 12);
  ctx.fill();

  // Network / Battery Icons (Right)
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('5G  100%', 944, 85);

  // 3. Top Navigation & Ascent Brand Header
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f472b6';
  ctx.font = '800 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('ASCENT TRANSPORT MANAGEMENT', 80, 165);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px system-ui, -apple-system, sans-serif';
  ctx.fillText('Digital Boarding Pass', 80, 225);

  // Live PWA Offline Badge
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.beginPath();
  ctx.roundRect(80, 250, 290, 46, 23);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(105, 273, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('OFFLINE PASS READY', 125, 281);

  // 4. Primary Pass Ticket Container (Card)
  const cardX = 70;
  const cardY = 330;
  const cardW = 884;
  const cardH = 1420;
  const cardRadius = 36;

  // Glass card backdrop
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Route Corridor Header (Enugu -> Abuja)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ENU', cardX + 60, cardY + 115);
  ctx.font = 'normal 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#d8b4fe';
  ctx.fillText('Ogui Road Terminal', cardX + 60, cardY + 158);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px system-ui, -apple-system, sans-serif';
  ctx.fillText('ABJ', cardX + cardW - 60, cardY + 115);
  ctx.font = 'normal 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#d8b4fe';
  ctx.fillText('Utako District Hub', cardX + cardW - 60, cardY + 158);

  // Corridor Connector Line with Shuttle Icon
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ca2484';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText('───  🚐  ───', cardX + cardW / 2, cardY + 110);
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f472b6';
  ctx.fillText('EXECUTIVE SIENNA', cardX + cardW / 2, cardY + 154);

  // Dotted separation line
  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + 210);
  ctx.lineTo(cardX + cardW - 40, cardY + 210);
  ctx.stroke();
  ctx.setLineDash([]);

  // Passenger & Travel Details Grid
  const gridY = cardY + 258;
  ctx.textAlign = 'left';

  // Row 1: Passenger & Seat
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('PASSENGER', cardX + 60, gridY);
  ctx.fillText('SEAT NUMBER', cardX + 480, gridY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText('Chukwudi Okafor', cardX + 60, gridY + 44);

  ctx.fillStyle = '#34d399';
  ctx.font = '900 42px system-ui, -apple-system, sans-serif';
  ctx.fillText('04 (Window)', cardX + 480, gridY + 46);

  // Row 2: Date & Departure Time
  const row2Y = gridY + 116;
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('TRAVEL DATE', cardX + 60, row2Y);
  ctx.fillText('DEPARTURE TIME', cardX + 480, row2Y);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  ctx.fillText('Today • Scheduled', cardX + 60, row2Y + 40);
  ctx.fillText('08:30 AM WAT', cardX + 480, row2Y + 40);

  // QR Code Verification Box
  const qrBoxY = row2Y + 115;
  const qrBoxSize = 510;
  const qrBoxX = cardX + (cardW - qrBoxSize) / 2;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
  ctx.fill();

  // Draw Stylized QR Code Pattern
  const cellSize = 17;
  const qrPadding = 34;
  const matrixCount = Math.floor((qrBoxSize - qrPadding * 2) / cellSize);

  ctx.fillStyle = '#0f172a';
  for (let r = 0; r < matrixCount; r++) {
    for (let c = 0; c < matrixCount; c++) {
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= matrixCount - 7;
      const isBottomLeft = r >= matrixCount - 7 && c < 7;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isTopLeft ? r : isTopRight ? r : r - (matrixCount - 7);
        const localC = isTopLeft ? c : isTopRight ? c - (matrixCount - 7) : c;
        if (localR === 0 || localR === 6 || localC === 0 || localC === 6 || (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4)) {
          ctx.fillRect(qrBoxX + qrPadding + c * cellSize, qrBoxY + qrPadding + r * cellSize, cellSize, cellSize);
        }
      } else {
        const hash = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
        if ((hash - Math.floor(hash)) > 0.48) {
          ctx.fillRect(qrBoxX + qrPadding + c * cellSize, qrBoxY + qrPadding + r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }
  }

  // Brand Center Mark inside QR
  const centerSize = 76;
  const centerX = qrBoxX + (qrBoxSize - centerSize) / 2;
  const centerY = qrBoxY + (qrBoxSize - centerSize) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(centerX - 6, centerY - 6, centerSize + 12, centerSize + 12);
  ctx.fillStyle = '#ca2484';
  ctx.beginPath();
  ctx.roundRect(centerX, centerY, centerSize, centerSize, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATM', qrBoxX + qrBoxSize / 2, centerY + 52);

  // Glowing Scan Line on QR
  ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
  ctx.fillRect(qrBoxX + 16, centerY + 14, qrBoxSize - 32, 6);

  // Ticket Code & Terminal Instruction
  const postQrY = qrBoxY + qrBoxSize + 56;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px monospace';
  ctx.fillText('REF: ATM-789-2694-LAG', cardX + cardW / 2, postQrY);

  ctx.fillStyle = '#34d399';
  ctx.font = '600 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('✓ Scan at Gate 02 Departure Turnstile', cardX + cardW / 2, postQrY + 42);

  // 5. Bottom Quick Action Buttons on Screen
  const btnY = cardY + cardH + 40;
  const btnW = (cardW - 40) / 2;

  // Button 1: Waybill Tracker
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.roundRect(cardX, btnY, btnW, 80, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('📦 Waybill Track', cardX + btnW / 2, btnY + 49);

  // Button 2: Gate Announcement
  ctx.fillStyle = '#ca2484';
  ctx.beginPath();
  ctx.roundRect(cardX + btnW + 40, btnY, btnW, 80, 20);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('📢 Live Dispatch', cardX + btnW + 40 + btnW / 2, btnY + 49);

  // 6. Home Indicator Bar (Bottom)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.roundRect(362, 2120, 300, 10, 5);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function SamsungPhoneCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Accessibility Check: prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const container = mountRef.current;
    if (!container) return;

    // 2. WebGL Support Verification
    const hasWebGL = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')));
      } catch {
        return false;
      }
    })();

    if (!hasWebGL) {
      setLoadError('WebGL not supported');
      setIsLoading(false);
      return;
    }

    // 3. Three.js Scene Setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 520;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Camera positioned with generous breathing room so the full phone and elevated screen are never cropped
    camera.position.set(0, 0, 9.6);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    // 4. Lighting Setup (Studio Rim & Key Lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xca2484, 1.8);
    fillLight.position.set(-6, -2, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(0, 9, -4);
    scene.add(rimLight);

    // 5. Scene Objects Hierarchy
    // Master group holds both the phone and floating screen for unified rotation and longitudinal spin
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Floating PWA Screen Plane with smooth rounded corners matching S26 Ultra display
    // S26 Ultra screen dimensions: width 2.28, height 4.82, corner radius 0.12
    const screenGeo = createRoundedPlaneGeometry(2.28, 4.82, 0.12);
    const pwaTexture = createPwaScreenTexture();
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: pwaTexture,
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
    });

    const floatingScreen = new THREE.Mesh(screenGeo, screenMaterial);
    // When phone is rotated by Math.PI around Y, front glass is at z = +0.1652.
    // Docked position is z = 0.178 (resting flush on front glass with zero clipping).
    // Detached position is z = 1.35 (elevated forward in 3D space with ample camera frustum clearance).
    const dockedZ = 0.178;
    const detachedZ = 1.35;
    floatingScreen.position.set(0, -0.002, detachedZ);
    floatingScreen.rotation.set(-0.10, 0.08, 0);
    masterGroup.add(floatingScreen);

    // Subtle atmospheric glow plane with rounded corners behind floating screen when detached
    const glowGeo = createRoundedPlaneGeometry(2.38, 4.92, 0.15);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xca2484,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const floatingGlow = new THREE.Mesh(glowGeo, glowMat);
    floatingGlow.position.set(0, -0.002, detachedZ - 0.02);
    masterGroup.add(floatingGlow);

    // 6. Load S26 Ultra Model Asset
    const loader = new GLTFLoader();

    loader.load(
      '/models/samsung_s_26_ultra_3d_model.glb',
      (gltf) => {
        const phoneModel = gltf.scene;

        // Rotate phone 180 degrees around Y so front glass faces forward to camera (+Z)
        phoneModel.rotation.y = Math.PI;

        phoneModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.envMapIntensity = 1.3;
              mat.needsUpdate = true;
            }
          }
        });

        // Add phone into master group behind floating screen
        masterGroup.add(phoneModel);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Failed to load S26 Ultra model:', error);
        setLoadError('Model failed to load');
        setIsLoading(false);
      }
    );

    // 7. Scroll Progress & 3D Magnetic Hover Rotation Handling
    let targetProgress = 0;
    let currentProgress = 0;
    let isHovered = false;
    let targetMagneticRotX = 0;
    let targetMagneticRotY = 0;
    let targetMagneticRotZ = 0;
    let currentMagneticRotX = 0;
    let currentMagneticRotY = 0;
    let currentMagneticRotZ = 0;

    const computeScrollProgress = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight || 1;

      // Start entering at bottom of viewport, reach 1.0 when centered
      const start = windowHeight;
      const end = windowHeight * 0.30;
      const progress = (start - rect.top) / (start - end);
      targetProgress = Math.min(Math.max(progress, 0), 1);
    };

    window.addEventListener('scroll', computeScrollProgress, { passive: true });
    computeScrollProgress();

    // 3D Magnetic rotate effect on mouse hover
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInside) {
        isHovered = true;
        // Normalized coordinates from -1 to 1 across the phone container
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        // Magnetic yaw tilting up to ~35 degrees following mouse
        targetMagneticRotY = normX * 0.62;
        // Magnetic pitch tilting up to ~25 degrees following mouse
        targetMagneticRotX = -normY * 0.44;
        // Subtle organic roll
        targetMagneticRotZ = -normX * 0.10;
      } else if (isHovered) {
        // Pointer moved outside: gently spring back to original facing position
        isHovered = false;
        targetMagneticRotX = 0;
        targetMagneticRotY = 0;
        targetMagneticRotZ = 0;
      }
    };

    const onMouseLeave = () => {
      isHovered = false;
      targetMagneticRotX = 0;
      targetMagneticRotY = 0;
      targetMagneticRotZ = 0;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('mouseleave', onMouseLeave);

    // Responsive Canvas Resize Observer with adaptive camera depth
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          // Set distance far enough back so the phone and detached screen are completely in view
          if (newW < 360) {
            camera.position.z = 11.2;
          } else if (newW < 500) {
            camera.position.z = 10.4;
          } else {
            camera.position.z = 9.6;
          }
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 8. Animation Render Loop with Longitudinal Vertical Spin
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (mediaQuery.matches) {
        // Reduced motion: snap directly upright and docked
        masterGroup.rotation.set(0, 0, 0);
        floatingScreen.position.set(0, -0.002, dockedZ);
        floatingScreen.rotation.set(0, 0, 0);
        floatingGlow.visible = false;
        renderer.render(scene, camera);
        return;
      }

      // Smooth lerp scroll progress
      currentProgress += (targetProgress - currentProgress) * 0.085;

      // Smooth lerp magnetic 3D rotation:
      // Snappy responsiveness (0.085) while hovering, gentle soft return (0.042) when mouse leaves
      const magneticDampSpeed = isHovered ? 0.085 : 0.042;
      currentMagneticRotX += (targetMagneticRotX - currentMagneticRotX) * magneticDampSpeed;
      currentMagneticRotY += (targetMagneticRotY - currentMagneticRotY) * magneticDampSpeed;
      currentMagneticRotZ += (targetMagneticRotZ - currentMagneticRotZ) * magneticDampSpeed;

      // 1) Longitudinal axis vertical spin combined with magnetic hover yaw:
      const spinAngleY = (1 - currentProgress) * (Math.PI * 2) + currentMagneticRotY;

      // Casual tilt back around X axis combined with magnetic hover pitch:
      const tiltX = THREE.MathUtils.lerp(-0.35, 0, currentProgress) + currentMagneticRotX;

      // Subtle yaw on Z combined with magnetic roll:
      const tiltZ = THREE.MathUtils.lerp(-0.05, 0, currentProgress) + currentMagneticRotZ;

      masterGroup.rotation.set(tiltX, spinAngleY, tiltZ);

      // 2) Dock floating PWA screen onto phone
      const currentZ = THREE.MathUtils.lerp(detachedZ, dockedZ, currentProgress);
      const pitchX = THREE.MathUtils.lerp(-0.10, 0, currentProgress);
      const yawY = THREE.MathUtils.lerp(0.08, 0, currentProgress);

      floatingScreen.position.set(0, -0.002, currentZ);
      floatingScreen.rotation.set(pitchX, yawY, 0);

      // 3) Fade glow out as screen docks flush
      floatingGlow.position.set(0, -0.002, currentZ - 0.02);
      glowMat.opacity = 0.22 * (1 - currentProgress);
      floatingGlow.visible = currentProgress < 0.98;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', computeScrollProgress);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      resizeObserver.disconnect();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      renderer.dispose();
      screenGeo.dispose();
      glowGeo.dispose();
      pwaTexture.dispose();
      screenMaterial.dispose();
      glowMat.dispose();
    };
  }, []);

  // Fallback if WebGL is unsupported
  if (loadError) {
    return (
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/19] rounded-3xl bg-slate-900/60 border border-white/20 p-6 flex flex-col justify-center items-center text-center text-white">
        <Icon icon={Smartphone} size="lg" className="text-pink-400 mb-3" />
        <h4 className="font-bold text-sm mb-1">Ascent Mobile PWA</h4>
        <p className="text-xs text-purple-200/80 mb-4">Boarding pass, live waybill tracking, and gate departures.</p>
        <div className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
          Offline Pass Ready
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] flex justify-center items-center select-none overflow-visible">
      {/* 3D WebGL Canvas Mount Node */}
      <div
        ref={mountRef}
        className="w-full h-full flex justify-center items-center touch-none overflow-visible"
        style={{ cursor: 'grab' }}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none text-white/80 transition-opacity duration-300">
          <div className="w-10 h-10 rounded-full border-2 border-pink-400 border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-medium tracking-wide uppercase text-pink-300">Loading 3D Smartphone...</span>
        </div>
      )}
    </div>
  );
}
