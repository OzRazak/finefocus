
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Sun, Moon, Laptop, ImageIcon, CheckIcon as CheckLucideIcon } from 'lucide-react';
import type { ThemePreference } from '@/lib/types';
import { SAMPLE_BACKGROUND_IMAGES } from '@/lib/constants';

interface AppearanceSettingsSectionProps {
  theme: ThemePreference;
  backgroundType: 'color' | 'image';
  backgroundValue: string;
  enableAnimatedBackground: boolean;
  onThemeChange: (value: string) => void;
  onBackgroundTypeChange: (value: 'color' | 'image') => void;
  onBackgroundValueChange: (value: string) => void; // For color text input
  onImageSelect: (imageUrl: string) => void;
  onAnimatedBackgroundToggle: (checked: boolean) => void;
}

const AppearanceSettingsSection: React.FC<AppearanceSettingsSectionProps> = ({
  theme,
  backgroundType,
  backgroundValue,
  enableAnimatedBackground,
  onThemeChange,
  onBackgroundTypeChange,
  onBackgroundValueChange,
  onImageSelect,
  onAnimatedBackgroundToggle,
}) => {
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBackgroundValueChange(e.target.value);
  };
  
  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline flex items-center"><ImageIcon className="mr-2 h-5 w-5" />Appearance</h3>
      <div className="space-y-3">
        <Label className="text-foreground">Theme</Label>
        <RadioGroup
          value={theme}
          onValueChange={onThemeChange}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Laptop },
          ].map((item) => (
            <Label
              key={item.value}
              htmlFor={`theme-${item.value}`}
              className={cn(
                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                theme === item.value && "border-primary ring-2 ring-primary"
              )}
            >
              <RadioGroupItem value={item.value} id={`theme-${item.value}`} className="sr-only" />
              <item.icon className="mb-2 h-5 w-5" />
              {item.label}
            </Label>
          ))}
        </RadioGroup>
      </div>
      
      <div className="space-y-3 pt-4">
        <Label className="text-foreground">Background Type</Label>
        <RadioGroup
          value={backgroundType}
          onValueChange={onBackgroundTypeChange}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="color" id="bg-type-color" />
            <Label htmlFor="bg-type-color" className="text-foreground">Solid Color</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="bg-type-image" />
            <Label htmlFor="bg-type-image" className="text-foreground">Image</Label>
          </div>
        </RadioGroup>

        {backgroundType === 'color' && (
          <div>
            <Label htmlFor="backgroundColor" className="text-foreground">Background Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="backgroundColorPicker"
                name="backgroundColorPicker"
                type="color"
                value={backgroundValue.startsWith('#') ? backgroundValue : '#FFFFFF'}
                onChange={handleColorInputChange}
                className="w-16 h-10 p-1 bg-input border-border"
              />
               <Input
                id="backgroundColorText"
                name="backgroundColorText"
                type="text"
                value={backgroundValue}
                onChange={handleColorInputChange}
                placeholder="#RRGGBB"
                className="bg-input text-foreground flex-1"
              />
            </div>
          </div>
        )}

        {backgroundType === 'image' && (
          <div>
            <Label className="text-foreground">Select Background Image</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2 max-h-60 overflow-y-auto p-1 rounded-md border border-border">
              {SAMPLE_BACKGROUND_IMAGES.map((image) => (
                <button
                  type="button"
                  key={image.url}
                  onClick={() => onImageSelect(image.url)}
                  className={cn(
                    "relative aspect-video rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card transition-all",
                    backgroundValue === image.url && "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105 shadow-lg"
                  )}
                  title={image.name}
                >
                  <Image
                    src={image.url}
                    alt={image.name}
                    width={160}
                    height={90}
                    className="object-cover w-full h-full"
                    data-ai-hint={image.hint}
                  />
                   {backgroundValue === image.url && (
                      <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                          <CheckLucideIcon className="w-6 h-6 text-primary-foreground" />
                      </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
           <div className="flex items-center space-x-2 pt-4">
          <Switch
            id="enableAnimatedBackground"
            name="enableAnimatedBackground"
            checked={enableAnimatedBackground}
            onCheckedChange={onAnimatedBackgroundToggle}
          />
          <Label htmlFor="enableAnimatedBackground" className="text-foreground">
            Enable Animated Background Effects
          </Label>
        </div>
      </div>
    </>
  );
};

export default AppearanceSettingsSection;
