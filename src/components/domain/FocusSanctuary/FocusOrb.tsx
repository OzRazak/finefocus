// src/components/domain/FocusSanctuary/FocusOrb.tsx
"use client";

import React, { useRef } from 'react';
import { useFrame, THREE } from '@/components/r3f-client-exports'; // Updated import

interface FocusData {
  baseColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
}

interface FocusOrbProps {
  focusData: FocusData;
}

const FocusOrb: React.FC<FocusOrbProps> = ({ focusData }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
      
      // Subtle pulsation of emissive intensity (optional)
      // const pulseFactor = (Math.sin(state.clock.elapsedTime * 1.5) + 1) / 2; // 0 to 1
      // (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
      //   focusData.emissiveIntensity * (0.8 + pulseFactor * 0.4); // Pulsate between 80% and 120% of base
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.8, 32, 32]} /> {/* Slightly smaller for better satellite visibility */}
      <meshStandardMaterial
        color={focusData.baseColor}
        emissive={focusData.emissiveColor}
        emissiveIntensity={focusData.emissiveIntensity}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
};

export default FocusOrb;
