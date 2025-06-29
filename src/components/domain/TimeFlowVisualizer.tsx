// src/components/domain/TimeFlowVisualizer.tsx
"use client";

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, THREE } from '@/components/r3f-client-exports'; // Updated import

const Smoke = () => {
  const smokeRef = useRef<THREE.Group>(null!);
  const [smokeTexture, setSmokeTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // TextureLoader should only be called client-side
    if (typeof window !== 'undefined') {
        const loader = new THREE.TextureLoader();
        loader.load('/smoke.png', (texture) => {
            setSmokeTexture(texture);
        },
        undefined, // onProgress callback (optional)
        (error) => { // onError callback
            console.error('An error happened loading the smoke texture:', error);
        });
    }
  }, []);

  const particles = useMemo(() => {
    if (!smokeTexture) return []; // Don't create particles until texture is loaded

    const temp: THREE.Mesh[] = [];
    // Use a single material instance for all particles for better performance
    const smokeMaterial = new THREE.MeshLambertMaterial({
      map: smokeTexture,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    smokeMaterial.color.setHSL(0.5, 0.7, 0.5); // Example: A desaturated cyan/greenish smoke

    const smokeGeo = new THREE.PlaneGeometry(300, 300);

    for (let p = 0; p < 30; p++) { // Reduced particle count further for performance
      const particle = new THREE.Mesh(smokeGeo, smokeMaterial); // Share material
      particle.position.set(
        (Math.random() - 0.5) * 700, 
        (Math.random() - 0.5) * 500, 
        (Math.random() - 0.5) * 250 - 200 
      );
      particle.rotation.z = Math.random() * 2 * Math.PI;
      // particle.material.opacity = Math.random() * 0.15 + 0.05; // Opacity can be varied per particle if needed, but cloning material is heavier
      temp.push(particle);
    }
    return temp;
  }, [smokeTexture]); // smokeTexture is the crucial dependency

  useFrame((state, delta) => {
    if (!smokeRef.current || particles.length === 0) return;
    const time = state.clock.getElapsedTime();
    particles.forEach((p, i) => {
      p.rotation.z += delta * 0.03 * (i % 2 === 0 ? 1 : -1); // Vary rotation speed/direction
      p.position.y -= delta * (8 + (i % 5)); // Vary speed
      
      // Add some gentle horizontal sway
      p.position.x += Math.sin(time * 0.1 + i * 0.5) * 0.2;

      if (p.position.y < -250) { // Reset particles that move out of view
        p.position.y = 250;
        p.position.x = (Math.random() - 0.5) * 700; // Reset x position too
      }
    });
  });

  if (!smokeTexture) { // If texture hasn't loaded, don't render anything for smoke
    return <mesh data-testid="smoke-no-texture-placeholder" visible={false} />;
  }
  if (particles.length === 0) { // If particles array is empty post-texture load (shouldn't happen if texture loads)
    return <mesh data-testid="smoke-no-particles-placeholder" visible={false} />;
  }

  return (
    <group ref={smokeRef}>
      {particles.map((particle, i) => (
        <primitive key={i} object={particle} />
      ))}
    </group>
  );
};

export const TimeFlowVisualizer = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div data-testid="tfv-isclient-false-placeholder" style={{ width: '150px', height: '150px', background: 'transparent', position: 'fixed', bottom: '1rem', right: '1rem', zIndex: -2, pointerEvents: 'none' }} />;
  }

  return (
    <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', width: '150px', height: '150px', zIndex: -2, pointerEvents: 'none', opacity: 0.5 }}>
      <Canvas camera={{ position: [0, 0, 600], fov: 55 }}>
        <ambientLight intensity={0.5} />
        <directionalLight color={0x88aaff} intensity={0.3} position={[1, 0.5, 1]} />
        <directionalLight color={0xff88aa} intensity={0.15} position={[-1, -0.5, -0.5]} />
        <Smoke />
      </Canvas>
    </div>
  );
};
