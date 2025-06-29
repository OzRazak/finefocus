
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import type { TimerAnimation } from '@/lib/types';

interface AnimationSettingsSectionProps {
  animationStyle: TimerAnimation;
  animationSpeed: number;
  onStyleChange: (value: string) => void;
  onSpeedChange: (value: number[]) => void;
}

const AnimationSettingsSection: React.FC<AnimationSettingsSectionProps> = ({
  animationStyle,
  animationSpeed,
  onStyleChange,
  onSpeedChange,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline">Timer Animations</h3>
      <div className="space-y-4">
        <div>
          <Label className="text-foreground">Animation Style</Label>
          <RadioGroup
            value={animationStyle}
            onValueChange={onStyleChange}
            className="grid grid-cols-2 gap-2 mt-2"
          >
            <Label htmlFor="anim-default" className="flex items-center space-x-2 cursor-pointer rounded-md border border-muted p-2 hover:bg-accent">
              <RadioGroupItem value="default" id="anim-default" />
              <span>Default (No Animation)</span>
            </Label>
            <Label htmlFor="anim-smooth" className="flex items-center space-x-2 cursor-pointer rounded-md border border-muted p-2 hover:bg-accent">
              <RadioGroupItem value="smooth" id="anim-smooth" />
              <span>Smooth Fill</span>
            </Label>
            <Label htmlFor="anim-pulse" className="flex items-center space-x-2 cursor-pointer rounded-md border border-muted p-2 hover:bg-accent">
              <RadioGroupItem value="pulse" id="anim-pulse" />
              <span>Breathing Pulse</span>
            </Label>
            <Label htmlFor="anim-colorshift" className="flex items-center space-x-2 cursor-pointer rounded-md border border-muted p-2 hover:bg-accent">
              <RadioGroupItem value="colorShift" id="anim-colorshift" />
              <span>Color Shift</span>
            </Label>
          </RadioGroup>
        </div>
        <div>
          <Label htmlFor="timerAnimationSpeed" className="text-foreground">Animation Speed (for non-default styles)</Label>
          <div className="flex items-center gap-4 mt-2">
            <Slider
              id="timerAnimationSpeed"
              min={0.1}
              max={2}
              step={0.1}
              value={[animationSpeed]}
              onValueChange={onSpeedChange}
              className="flex-1"
              disabled={animationStyle === 'default'}
            />
            <span className="text-sm font-medium text-muted-foreground w-12 text-center">
              {animationSpeed.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnimationSettingsSection;
