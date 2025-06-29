// src/components/domain/FocusSanctuary/AchievementStarfield.tsx
"use client";

import React, { useMemo, useRef } from 'react';
import { useFrame, THREE } from '@/components/r3f-client-exports'; // Updated import

interface AchievementStarfieldProps {
  completedTasksCount: number;
}

const AchievementStarfield: React.FC<AchievementStarfieldProps> = ({ completedTasksCount }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const starCount = Math.min(5000, completedTasksCount * 10); // Max 5000 stars, 10 per task

  const positions = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    const spherical = new THREE.Spherical();
    const baseRadius = 20; // Stars further out

    for (let i = 0; i < starCount; i++) {
      // Distribute points more or less evenly on a sphere surface
      spherical.radius = baseRadius + (Math.random() - 0.5) * 10; // Slight variation in distance
      spherical.phi = Math.acos(-1 + (2 * i) / (starCount -1 + 1e-6)); // Added epsilon for starCount=0 or 1 case
      spherical.theta = Math.sqrt(starCount * Math.PI) * spherical.phi; 
      
      const point = new THREE.Vector3().setFromSpherical(spherical);
      
      pos[i * 3] = point.x;
      pos[i * 3 + 1] = point.y;
      pos[i * 3 + 2] = point.z;
    }
    return pos;
  }, [starCount]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.005; // Slow rotation of the starfield
    }
  });
  
  if (starCount === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.05} // Star size
        color="#ffffff"
        opacity={0.8}
        transparent
        sizeAttenuation // Stars further away appear smaller
      />
    </points>
  );
};

export default AchievementStarfield;
