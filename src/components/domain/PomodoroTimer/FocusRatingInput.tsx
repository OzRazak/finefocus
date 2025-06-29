
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FocusRatingInputProps {
  onRateSubmit: (rating: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}

const ratings: { value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { value: 1, emoji: '😩', label: 'Very Low Focus' },
  { value: 2, emoji: '😕', label: 'Low Focus' },
  { value: 3, emoji: '😐', label: 'Okay Focus' },
  { value: 4, emoji: '🙂', label: 'Good Focus' },
  { value: 5, emoji: '😄', label: 'Great Focus!' },
];

const FocusRatingInput: React.FC<FocusRatingInputProps> = ({ onRateSubmit, disabled }) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleSubmit = (rating: 1 | 2 | 3 | 4 | 5) => {
    setSelectedRating(rating);
    // Add a small delay for visual feedback before submitting
    setTimeout(() => {
      onRateSubmit(rating);
      setSelectedRating(null); // Reset for next time
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 bg-card/70 backdrop-blur-sm rounded-lg shadow-lg border border-primary/30 my-4 w-full max-w-sm mx-auto"
    >
      <p className="text-sm font-medium text-center text-foreground mb-3">
        How focused were you during that session?
      </p>
      <div className="flex justify-around items-center">
        {ratings.map((item) => (
          <Button
            key={item.value}
            variant="ghost"
            size="icon"
            onClick={() => handleSubmit(item.value)}
            onMouseEnter={() => setHoveredRating(item.value)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={disabled || selectedRating === item.value}
            className={cn(
              "h-12 w-12 rounded-full text-2xl transition-all duration-150 ease-in-out",
              "hover:bg-primary/20 hover:scale-125",
              selectedRating === item.value && "bg-primary text-primary-foreground scale-110 ring-2 ring-primary-foreground ring-offset-2 ring-offset-primary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-label={item.label}
            title={item.label}
          >
            {item.emoji}
          </Button>
        ))}
      </div>
      {hoveredRating && (
        <p className="text-xs text-center text-muted-foreground mt-2 min-h-[16px]">
          {ratings.find(r => r.value === hoveredRating)?.label}
        </p>
      )}
    </motion.div>
  );
};

export default FocusRatingInput;
