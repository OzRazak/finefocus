
// src/components/domain/FocusSanctuary/TaskSatellite.tsx
"use client";

import React, { useRef } from 'react';
import { useFrame, useThree, THREE } from '@/components/r3f-client-exports'; // Html removed

interface TaskData {
  id: string;
  title: string;
  categoryColor: string;
}

interface TaskSatelliteProps {
  taskData: TaskData;
  position: [number, number, number]; // Expecting array
  onClick: (taskId: string) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  isSelected: boolean;
  isHovered: boolean;
}

const TaskSatellite: React.FC<TaskSatelliteProps> = ({
  taskData,
  position,
  onClick,
  onPointerOver,
  onPointerOut,
  isSelected,
  isHovered,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const initialScale = 0.2;
  const hoverScale = 0.25;
  const selectedScale = 0.28;

  const targetEmissiveIntensity = isSelected ? 1.2 : isHovered ? 0.8 : 0;
  const targetScale = isSelected ? selectedScale : isHovered ? hoverScale : initialScale;

  // Store initial position as a Vector3 for calculations
  const initialPositionVec = useRef(new THREE.Vector3(...position)).current;


  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smoothly interpolate scale
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10);

      // Smoothly interpolate emissive intensity
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        targetEmissiveIntensity,
        delta * 10
      );
      // Orbit around the center (0,0,0)
      const speed = 0.05 + (parseInt(taskData.id.slice(-1), 16) % 5) * 0.01; // Vary speed based on ID
      const R = Math.sqrt(initialPositionVec.x * initialPositionVec.x + initialPositionVec.z * initialPositionVec.z);
      const currentAngle = Math.atan2(meshRef.current.position.z, meshRef.current.position.x);
      const newAngle = currentAngle + speed * delta;
      
      meshRef.current.position.x = R * Math.cos(newAngle);
      meshRef.current.position.z = R * Math.sin(newAngle);
      // Keep y position, or add slight bobbing
      meshRef.current.position.y = initialPositionVec.y + Math.sin(state.clock.elapsedTime * (1 + (parseInt(taskData.id.slice(-2,-1), 16) % 5) * 0.2)) * 0.1;


      // Rotate the satellite itself
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });
  

  return (
    <mesh
      ref={meshRef}
      position={position} // Initial position from prop
      onClick={(e) => {
        e.stopPropagation(); // Prevent OrbitControls from engaging on click
        onClick(taskData.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut();
        document.body.style.cursor = 'default';
      }}
      castShadow
    >
      <icosahedronGeometry args={[1, 1]} /> {/* Detail level 1 for more faces */}
      <meshStandardMaterial
        color={taskData.categoryColor}
        emissive={taskData.categoryColor} // Satellites also glow slightly
        emissiveIntensity={0} // Initial emissive intensity
        roughness={0.5}
        metalness={0.2}
      />
        {/* Html for hover title removed */}
    </mesh>
  );
};

export default TaskSatellite;

    