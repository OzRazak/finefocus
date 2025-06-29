
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Share, PlusSquare, Smartphone, Menu as MenuIcon } from 'lucide-react'; // Renamed Menu to MenuIcon to avoid conflict
import { APP_NAME } from '@/lib/constants';
import { motion } from 'framer-motion';

const PwaInstallNudge: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'other_mobile' | null>(null);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) { // Added MSStream check to exclude IE on Windows Phone
        setDeviceType('ios');
      } else if (/Android/.test(ua)) {
        setDeviceType('android');
      } else if (/Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) { // Broader mobile check
        setDeviceType('other_mobile');
      }

      const inStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone === true) || window.matchMedia('(display-mode: standalone)').matches;
      setIsInStandaloneMode(inStandalone);
    }
  }, []);

  if (!isClient || isInStandaloneMode || !deviceType) {
    return null; // Don't render if not on client, or in PWA mode, or not detected as mobile
  }

  let instructionsText: React.ReactNode = null;
  const appNameStrong = <strong>{APP_NAME}</strong>;

  if (deviceType === 'ios') {
    instructionsText = (
      <>
        For the best experience, add {appNameStrong} to your Home Screen!
        Tap the <Share className="inline h-3 w-3 align-middle mx-0.5" /> Share icon,
        then scroll down and tap '<PlusSquare className="inline h-3 w-3 align-middle mx-0.5" /> Add to Home Screen'.
      </>
    );
  } else if (deviceType === 'android') {
    instructionsText = (
      <>
        Install {appNameStrong} for quick access!
        Tap the <MenuIcon className="inline h-3 w-3 align-middle mx-0.5" /> Menu icon (usually 3 dots),
        then look for 'Install app' or 'Add to Home Screen'.
      </>
    );
  } else { // Generic for other mobile devices
     instructionsText = (
      <>
        Add {appNameStrong} to your device for easy access!
        Check your browser's menu for an 'Install app' or 'Add to Home Screen' option.
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="my-6 mx-auto container max-w-3xl"
    >
      <Card className="shadow-lg bg-card/90 backdrop-blur-md border-primary/40">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-10 w-10 text-primary flex-shrink-0" />
            <div>
              <p className="text-md font-semibold text-foreground mb-1">
                Get the Full {APP_NAME} Experience!
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {instructionsText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PwaInstallNudge;
