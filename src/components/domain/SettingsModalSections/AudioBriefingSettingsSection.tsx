
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioTower, Mic2 } from 'lucide-react';
import { TTS_VOICE_OPTIONS } from '@/lib/constants';

interface AudioBriefingSettingsSectionProps {
  preferredVoice: string;
  onPreferredVoiceChange: (voiceId: string) => void;
}

const AudioBriefingSettingsSection: React.FC<AudioBriefingSettingsSectionProps> = ({
  preferredVoice,
  onPreferredVoiceChange,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline flex items-center"><RadioTower className="mr-2 h-5 w-5" />Audio Briefing</h3>
      <div>
        <Label htmlFor="preferredVoice" className="text-foreground flex items-center">
          <Mic2 className="mr-2 h-4 w-4" /> Preferred Voice for "Start My Day"
        </Label>
        <Select
          value={preferredVoice}
          onValueChange={onPreferredVoiceChange}
        >
          <SelectTrigger id="preferredVoice" className="mt-1 bg-input text-foreground">
            <SelectValue placeholder="Select a voice..." />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground">
            {TTS_VOICE_OPTIONS.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.name} {option.gender && `(${option.gender})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
         <p className="text-xs text-muted-foreground mt-1">
            Voice selection is for the "Start My Day" feature. Actual voice quality depends on the Text-to-Speech service.
          </p>
      </div>
    </>
  );
};

export default AudioBriefingSettingsSection;
