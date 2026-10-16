'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

export interface SiennaModelViewerProps {
  modelUrl?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * 3D Toyota Sienna model component using Drei useGLTF.
 * Centers model, aligns wheels to ground, and adds subtle background rotation.
 */
function SiennaModelMesh({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto center and scale model
  const processedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = 4.8 / maxDim;
    clone.scale.setScalar(targetScale);

    // Recalculate bounding box
    box.setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());

    // Align wheels to ground y = 0
    clone.position.x = -center.x;
    clone.position.y = -box.min.y;
    clone.position.z = -center.z;

    // Enhance materials and shadows
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 1.1;
        }
      }
    });

    return clone;
  }, [scene]);

  // Ambient gentle background rotation (pauses if reduced motion requested)
  useFrame((_, delta) => {
    if (!prefersReducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={processedScene} />
    </group>
  );
}

/**
 * Ground contact shadow disc
 */
function ContactShadowPlane() {
  const shadowTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 64, 10, 128, 64, 120);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.20)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  if (!shadowTex) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <planeGeometry args={[6.5, 3.2]} />
      <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
    </mesh>
  );
}

/**
 * Simple React Error Boundary for WebGL initialization failures
 */
class WebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('WebGL failed, using 2D fallback:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Background 3D Sienna Model Viewer powered by @react-three/fiber and @react-three/drei.
 * Controls are removed, and canvas has pointer-events-none so the car stays strictly in the background.
 */
export function SiennaModelViewer({
  modelUrl = '/models/2022_toyota_sienna_xse.glb',
  className = '',
  fallback,
}: SiennaModelViewerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className={`relative w-full ${className}`}>{fallback}</div>;
  }

  return (
    <div
      className={`relative w-full h-[240px] sm:h-[280px] lg:h-[320px] flex items-center justify-end overflow-hidden pointer-events-none select-none ${className}`}
    >
      <WebGLErrorBoundary fallback={<>{fallback}</>}>
        <Canvas
          shadows
          camera={{ position: [4.4, 1.7, 4.2], fov: 38 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
            powerPreference: 'high-performance',
          }}
          className="w-full h-full pointer-events-none"
        >
          {/* Studio Lighting Rig */}
          <ambientLight intensity={0.9} />
          <hemisphereLight
            color="#ffffff"
            groundColor="#475569"
            intensity={1.3}
          />
          <directionalLight
            position={[6, 9, 6]}
            intensity={2.3}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={25}
          />
          <directionalLight
            position={[-5, 4, -4]}
            intensity={0.5}
            color="#ca2484"
          />
          <directionalLight position={[0, 3, 7]} intensity={0.7} />

          {/* Contact Ground Shadow */}
          <ContactShadowPlane />

          {/* Background 3D Model with Suspense Fallback */}
          <Suspense fallback={null}>
            <SiennaModelMesh modelUrl={modelUrl} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

// Preload model asset for instant delivery
try {
  useGLTF.preload('/models/2022_toyota_sienna_xse.glb');
} catch {
  // Ignore in SSR
}
