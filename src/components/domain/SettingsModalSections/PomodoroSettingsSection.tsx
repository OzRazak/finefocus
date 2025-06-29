
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SlidersHorizontal, Settings } from 'lucide-react';
import type { UserSettings } from '@/lib/types';

interface PomodoroSettingsSectionProps {
  settings: Pick<UserSettings, 'workDuration' | 'shortBreakDuration' | 'longBreakDuration' | 'longBreakInterval' | 'enableAdaptiveTimer'>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchChange: (checked: boolean) => void; // Simplified for a single switch in this section
}

const PomodoroSettingsSection: React.FC<PomodoroSettingsSectionProps> = ({
  settings,
  onInputChange,
  onSwitchChange,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline flex items-center"><Settings className="mr-2 h-5 w-5" />Pomodoro Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="workDuration" className="text-foreground">Work Duration (min)</Label>
          <Input id="workDuration" name="workDuration" type="number" min="1" max="120" value={settings.workDuration} onChange={onInputChange} className="mt-1 bg-input text-foreground" />
        </div>
        <div>
          <Label htmlFor="shortBreakDuration" className="text-foreground">Short Break (min)</Label>
          <Input id="shortBreakDuration" name="shortBreakDuration" type="number" min="1" max="60" value={settings.shortBreakDuration} onChange={onInputChange} className="mt-1 bg-input text-foreground" />
        </div>
        <div>
          <Label htmlFor="longBreakDuration" className="text-foreground">Long Break (min)</Label>
          <Input id="longBreakDuration" name="longBreakDuration" type="number" min="1" max="120" value={settings.longBreakDuration} onChange={onInputChange} className="mt-1 bg-input text-foreground" />
        </div>
        <div>
          <Label htmlFor="longBreakInterval" className="text-foreground">Sessions Before Long Break</Label>
          <Input id="longBreakInterval" name="longBreakInterval" type="number" min="1" max="10" value={settings.longBreakInterval} onChange={onInputChange} className="mt-1 bg-input text-foreground" />
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-3">
        <Switch
          id="enableAdaptiveTimer"
          name="enableAdaptiveTimer" // Name is still useful for form context, though handler is specific
          checked={settings.enableAdaptiveTimer ?? false}
          onCheckedChange={onSwitchChange}
        />
        <Label htmlFor="enableAdaptiveTimer" className="text-foreground flex items-center">
          <SlidersHorizontal className="mr-2 h-4 w-4 text-accent"/> Enable Adaptive Timer Intervals
        </Label>
      </div>
       <p className="text-xs text-muted-foreground pl-8">
         Work session duration will adapt based on selected task's estimated time or AI suggestion.
       </p>
    </>
  );
};

export default PomodoroSettingsSection;
