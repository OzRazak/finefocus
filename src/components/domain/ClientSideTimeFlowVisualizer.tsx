
"use client";

import dynamic, { type DynamicOptionsLoadingProps } from 'next/dynamic';
import React, { useState, useEffect, type ComponentType, type FC } from 'react';

// Define a loading component type
type LoadingComponent = React.ComponentType<DynamicOptionsLoadingProps>;

const ClientSideTimeFlowVisualizer: FC = () => {
  // State to hold the dynamically imported component
  const [VisualizerComponent, setVisualizerComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    // Dynamically import the TimeFlowVisualizer component only on the client-side after mount
    const DynamicallyImportedVisualizer = dynamic(
      () => import('@/components/domain/TimeFlowVisualizer').then((mod) => mod.TimeFlowVisualizer),
      {
        ssr: false,
        loading: () => <div data-testid="cstfv-dynamic-loading" style={{ width: '150px', height: '150px', background: 'transparent', position: 'fixed', bottom: '1rem', right: '1rem', zIndex: -2, pointerEvents: 'none' }}></div>,
      }
    );
    setVisualizerComponent(() => DynamicallyImportedVisualizer); // Set the component constructor to state

  }, []); // Empty dependency array ensures this runs once on mount

  if (!VisualizerComponent) {
    // Render a placeholder or null while the component is loading
    return <div data-testid="cstfv-initializing" style={{ width: '150px', height: '150px', background: 'transparent', position: 'fixed', bottom: '1rem', right: '1rem', zIndex: -2, pointerEvents: 'none' }}></div>;
  }

  // Render the dynamically imported component
  return <VisualizerComponent />;
};

export default ClientSideTimeFlowVisualizer;
