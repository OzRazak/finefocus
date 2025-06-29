
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_BACKGROUND_TYPE, DEFAULT_BACKGROUND_VALUE } from '@/lib/constants';
import dynamic from 'next/dynamic';
import ClientSideTimeFlowVisualizer from '@/components/domain/ClientSideTimeFlowVisualizer'; // Import for conditional rendering

const ClientOnlyAnimatedBackground = dynamic(
  () => import('@/components/domain/AnimatedBackground').then((mod) => mod.AnimatedBackground),
  { ssr: false }
);

const BackgroundManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userSettings, isLoadingSettings } = useAuth();

  useEffect(() => {
    if (isLoadingSettings) {
      document.body.style.backgroundColor = 'hsl(var(--background))';
      document.body.style.backgroundImage = '';
      document.body.classList.remove('custom-bg-image-active');
      return;
    }

    const type = userSettings?.backgroundType || DEFAULT_BACKGROUND_TYPE;
    const value = userSettings?.backgroundValue || DEFAULT_BACKGROUND_VALUE;

    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = '';
    document.body.classList.remove('custom-bg-image-active');


    if (type === 'color') {
      document.body.style.backgroundColor = value;
    } else if (type === 'image' && value) {
      document.body.style.backgroundImage = `url('${value}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.classList.add('custom-bg-image-active');
    } else {
      // Default to theme background if no specific color/image is set or type is invalid
      document.body.style.backgroundColor = 'hsl(var(--background))';
    }

  }, [userSettings, isLoadingSettings]);

  const shouldRenderAnimatedBackgrounds = userSettings?.enableAnimatedBackground && !isLoadingSettings;

  return (
    <>
      {shouldRenderAnimatedBackgrounds && <ClientOnlyAnimatedBackground />}
      {shouldRenderAnimatedBackgrounds && <ClientSideTimeFlowVisualizer />}
      {children}
    </>
  );
};

export default BackgroundManager;
