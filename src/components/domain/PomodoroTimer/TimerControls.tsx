
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerControlsProps {
  isRunning: boolean;
  handleStartPause: () => void;
  handleReset: () => void;
  handleSkip: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  handleStartPause,
  handleReset,
  handleSkip,
}) => {
  const buttonContentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2 }
  };

  return (
    <div className="flex space-x-3" data-testid="timer-controls-group"> {/* Added data-testid */}
      <Button 
        onClick={handleStartPause} 
        variant={isRunning ? "destructive" : "default"} 
        size="lg" 
        className="px-6 py-3 min-w-[120px] text-lg overflow-hidden" 
      >
        <AnimatePresence mode="wait" initial={false}>
          {isRunning ? (
            <motion.span
              key="pause"
              variants={buttonContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex items-center"
            >
              <Pause className="mr-2 h-5 w-5" /> Pause
            </motion.span>
          ) : (
            <motion.span
              key="start"
              variants={buttonContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex items-center"
            >
              <Play className="mr-2 h-5 w-5" /> Start
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
      <Button onClick={handleReset} variant="outline" size="lg" aria-label="Reset Timer" className="border-muted-foreground/50">
        <RotateCcw className="h-5 w-5" />
      </Button>
      <Button onClick={handleSkip} variant="outline" size="lg" aria-label="Skip Session" className="border-muted-foreground/50">
        <SkipForward className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default TimerControls;
