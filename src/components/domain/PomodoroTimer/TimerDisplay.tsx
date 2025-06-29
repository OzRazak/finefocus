
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/lib/utils';
import type { TimerMode, TimerAnimation } from '@/lib/types';

interface TimerDisplayProps {
  timeRemaining: number;
  mode: TimerMode;
  progressPercentage: number;
  timerAnimation: TimerAnimation;
  animationSpeed: number;
  isRunning: boolean;
  timerColor: string;
  // Removed timerWrapperClassNames and timerWrapperStyle as they are handled by PopoverTrigger now
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  progressPercentage,
  timerAnimation,
  animationSpeed,
  timerColor,
}) => {
  const CIRCLE_RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

  const timerCircleStyle: React.CSSProperties = {
    stroke: timerColor,
    strokeDasharray: `${(progressPercentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
    transitionProperty: 'stroke-dasharray, stroke',
    transitionTimingFunction: 'linear',
    transitionDuration: `${1 / animationSpeed}s`,
  };

  const animationKey = timeRemaining; // Separate the key
  const digitAnimationOnlyProps = { // Props without the key
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.2 * (1 / animationSpeed) }
  };

  return (
    <>
      <div className="absolute inset-1 rounded-full border-4 border-background/80"></div>
      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          r={CIRCLE_RADIUS}
          cx="60"
          cy="60"
          style={timerCircleStyle}
        />
      </svg>
      <div className="z-10">
        {timerAnimation === 'default' ? (
          <div className="text-5xl md:text-6xl font-code font-bold text-foreground tabular-nums">
            {formatTime(timeRemaining)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={animationKey} // Pass key directly
              {...digitAnimationOnlyProps} // Spread the rest of the props
              className="text-5xl md:text-6xl font-code font-bold text-foreground tabular-nums"
            >
              {formatTime(timeRemaining)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default TimerDisplay;

