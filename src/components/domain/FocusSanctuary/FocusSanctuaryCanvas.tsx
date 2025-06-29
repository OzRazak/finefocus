
// src/components/domain/FocusSanctuary/FocusSanctuaryCanvas.tsx
"use client";

import React, { useState, Suspense, useMemo } from 'react';
import { Canvas, EffectComposer, Bloom } from '@/components/r3f-client-exports'; // OrbitControls, Html removed
import { Loader2 } from 'lucide-react';

import FocusOrb from './FocusOrb';
import TaskSatellite from './TaskSatellite';
import AchievementStarfield from './AchievementStarfield';


interface SanctuaryTask {
  id: string;
  title: string;
  categoryColor: string;
  initialPosition: [number, number, number];
}

interface FocusData {
  baseColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
}

interface FocusSanctuaryCanvasProps {
  tasks: SanctuaryTask[];
  focusData: FocusData;
  completedTasksCount: number;
}

const FocusSanctuaryCanvas: React.FC<FocusSanctuaryCanvasProps> = ({
  tasks,
  focusData,
  completedTasksCount,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // selectedTaskDetails is no longer used as Html for display is removed.
  // const selectedTaskDetails = useMemo(() => {
  //   return tasks.find(task => task.id === selectedTaskId);
  // }, [tasks, selectedTaskId]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(prevId => (prevId === taskId ? null : taskId)); // Toggle selection
  };

  return (
    <div className="w-full h-[calc(100vh-var(--header-height,80px))]"> {/* Adjust height based on your header */}
      <Canvas camera={{ position: [0, 2, 7], fov: 50 }} shadows>
        <Suspense fallback={
             <group> {/* Using group as Html is not available */}
                 <mesh position={[0,0,0]}>
                    <sphereGeometry args={[0.1]} />
                    <meshBasicMaterial color="white" transparent opacity={0} />
                 </mesh>
                 {/* Cannot render Loader2 directly here without Html from drei */}
             </group>
        }>
          {/* Lighting */}
          <ambientLight intensity={0.3} color="#ffffff" />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.5}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffccaa" />

          {/* Main Focus Orb */}
          <FocusOrb focusData={focusData} />

          {/* Task Satellites */}
          {tasks.map((task) => (
            <TaskSatellite
              key={task.id}
              taskData={task}
              position={task.initialPosition} // Pass as array
              onClick={() => handleTaskClick(task.id)}
              onPointerOver={() => setHoveredTaskId(task.id)}
              onPointerOut={() => setHoveredTaskId(null)}
              isSelected={selectedTaskId === task.id}
              isHovered={hoveredTaskId === task.id}
            />
          ))}

          {/* Achievement Starfield */}
          <AchievementStarfield completedTasksCount={completedTasksCount} />

          {/* Controls - OrbitControls removed */}
          
          {/* Post-Processing Effects */}
          <EffectComposer>
            <Bloom
              intensity={0.6} // Softer bloom
              luminanceThreshold={0.1} // Pixels brighter than this will bloom
              luminanceSmoothing={0.2} // Softer transition for bloom
              mipmapBlur
            />
          </EffectComposer>

            {/* Display selected task title - Html removed */}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default FocusSanctuaryCanvas;

    