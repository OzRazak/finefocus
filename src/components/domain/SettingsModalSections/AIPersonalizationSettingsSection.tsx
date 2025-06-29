
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Brain, Briefcase } from 'lucide-react';

interface AIPersonalizationSettingsSectionProps {
  role: string;
  currentProject: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const AIPersonalizationSettingsSection: React.FC<AIPersonalizationSettingsSectionProps> = ({
  role,
  currentProject,
  onInputChange,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline">AI Personalization</h3>
      <p className="text-sm text-muted-foreground mb-3">Help the AI Task Assistant understand you better.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="profileRole" className="text-foreground flex items-center">
            <Brain className="mr-2 h-4 w-4" /> Your Role (Optional)
          </Label>
          <Input
            id="profileRole"
            name="role"
            value={role}
            onChange={onInputChange}
            className="mt-1 bg-input text-foreground"
            placeholder="e.g., Software Developer, Student, Project Manager"
          />
        </div>
        <div>
          <Label htmlFor="profileCurrentProject" className="text-foreground flex items-center">
            <Briefcase className="mr-2 h-4 w-4" /> Current Project/Focus (Optional)
          </Label>
          <Input
            id="profileCurrentProject"
            name="currentProject"
            value={currentProject}
            onChange={onInputChange}
            className="mt-1 bg-input text-foreground"
            placeholder="e.g., Q3 Marketing Campaign, Thesis Research, App Feature X"
          />
        </div>
      </div>
    </>
  );
};

export default AIPersonalizationSettingsSection;
