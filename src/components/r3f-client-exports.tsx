
"use client";

// Re-export from @react-three/fiber
export { Canvas, useFrame, useThree } from '@react-three/fiber';

// Re-export from @react-three/drei
// OrbitControls and Html removed as they are not currently used or causing issues
// export { OrbitControls, Html } from '@react-three/drei'; 

// Re-export from @react-three/postprocessing
export { EffectComposer, Bloom } from '@react-three/postprocessing';

// Re-export * as THREE from 'three'
export * as THREE from 'three';

    