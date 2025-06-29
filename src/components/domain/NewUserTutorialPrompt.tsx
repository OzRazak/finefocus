
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Map } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const TUTORIAL_PROMPT_DISMISSED_KEY = 'shepherdTourCompleted_v1'; // Changed to match react-shepherd key

interface NewUserTutorialPromptProps {
  onStartTour?: () => void;
}

const NewUserTutorialPrompt: React.FC<NewUserTutorialPromptProps> = ({ onStartTour }) => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || user) { 
      setShowPrompt(false);
      return;
    }

    const promptDismissed = localStorage.getItem(TUTORIAL_PROMPT_DISMISSED_KEY) === 'true';

    if (!promptDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [isClient, user]);

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isClient) {
      localStorage.setItem(TUTORIAL_PROMPT_DISMISSED_KEY, 'true');
    }
  };

  const handleStartTourClick = () => {
    if (isClient) {
      if (onStartTour) {
        onStartTour(); 
      }
      // The tour itself will set the localStorage item upon completion/cancellation
      setShowPrompt(false); 
    }
  };

  if (!isClient || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
          className="fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-sm z-50"
        >
          <Card className="shadow-2xl bg-card/90 backdrop-blur-lg border-primary/50">
            <CardContent className="p-5 relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-muted/50 rounded-full"
                aria-label="Dismiss tutorial prompt"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex flex-col space-y-3">
                <div className='flex items-center gap-2'>
                    <Sparkles className="h-7 w-7 text-primary flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-foreground leading-tight">
                        Welcome to {APP_NAME}!
                    </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {APP_NAME} is an AI-Powered Smart Pomodoro timer. This is the first version, with many exciting updates planned!
                  {onStartTour ? " Take a quick tour to see how it works." : ""}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  {onStartTour && (
                    <Button onClick={handleStartTourClick} className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Map className="mr-2 h-4 w-4" /> Show Me Around
                    </Button>
                  )}
                  <Button onClick={handleDismiss} variant="outline" className="w-full sm:w-auto flex-1">
                    Maybe Later
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewUserTutorialPrompt;
