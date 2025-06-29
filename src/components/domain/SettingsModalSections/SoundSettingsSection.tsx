
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Music, Volume2 } from 'lucide-react';
import { NOTIFICATION_SOUND_OPTIONS } from '@/lib/constants';

interface SoundSettingsSectionProps {
  enableSoundNotifications: boolean;
  notificationSoundFile: string;
  soundVolume: number;
  onEnableToggle: (checked: boolean) => void;
  onSoundFileChange: (soundFile: string) => void;
  onVolumeChange: (value: number[]) => void;
}

const SoundSettingsSection: React.FC<SoundSettingsSectionProps> = ({
  enableSoundNotifications,
  notificationSoundFile,
  soundVolume,
  onEnableToggle,
  onSoundFileChange,
  onVolumeChange,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline flex items-center"><Music className="mr-2 h-5 w-5" />Sound Preferences</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch id="enableSoundNotifications" name="enableSoundNotifications" checked={enableSoundNotifications} onCheckedChange={onEnableToggle} />
          <Label htmlFor="enableSoundNotifications" className="text-foreground">Enable Sound Notifications</Label>
        </div>
        <div>
          <Label htmlFor="notificationSoundFile" className="text-foreground">Timer End Sound</Label>
          <Select
            value={notificationSoundFile}
            onValueChange={onSoundFileChange}
            disabled={!enableSoundNotifications}
          >
            <SelectTrigger id="notificationSoundFile" className="mt-1 bg-input text-foreground">
              <SelectValue placeholder="Select a sound..." />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {NOTIFICATION_SOUND_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Ensure sound files are in the `public` folder.
          </p>
        </div>
        <div>
          <Label htmlFor="soundVolume" className="text-foreground flex items-center">
            <Volume2 className="mr-2 h-4 w-4" /> Sound Volume
          </Label>
          <div className="flex items-center gap-3 mt-1">
            <Slider
              id="soundVolume"
              min={0}
              max={100}
              step={1}
              value={[Math.round(soundVolume * 100)]}
              onValueChange={onVolumeChange}
              className="flex-1"
              disabled={!enableSoundNotifications}
            />
            <span className="text-sm font-medium text-muted-foreground w-12 text-center">
              {Math.round(soundVolume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SoundSettingsSection;
