
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';
import { Info } from 'lucide-react';
import type { UserSettings, LifeAllocations } from '@/lib/types';

interface LifespanSettingsSectionProps {
  settings: Pick<UserSettings, 'dob' | 'expectedLifespan' | 'allocations'>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloseModal: () => void;
}

const allocationFields: { key: keyof LifeAllocations; label: string }[] = [
  { key: 'sleep', label: 'Sleep (hours/day)' },
  { key: 'work', label: 'Work/Productivity (hours/day)' },
  { key: 'eating', label: 'Eating & Food Prep (hours/day)' },
  { key: 'exercise', label: 'Exercise (hours/day)' },
  { key: 'personalCare', label: 'Personal Care (hours/day)' },
  { key: 'commuting', label: 'Commuting (hours/day)' },
];

const LifespanSettingsSection: React.FC<LifespanSettingsSectionProps> = ({
  settings,
  onInputChange,
  onCloseModal,
}) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="lifespan-settings" className="border-border/50 bg-card/10 backdrop-blur-sm shadow-sm rounded-lg">
        <AccordionTrigger className="px-4 py-3 text-lg font-semibold text-accent font-headline hover:no-underline">
          <div className="flex items-center">
            <Info className="mr-2 h-5 w-5" /> Lifespan Visualization Settings
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure settings related to your lifespan visualization. This includes your date of birth, expected lifespan,
            and how you typically allocate your hours in a day. You can view your personalized lifespan visualization on the <Link href='/lifespan' className='text-accent underline hover:text-accent/80' onClick={onCloseModal}>Lifespan page</Link>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dob" className="text-foreground">Date of Birth</Label>
              <Input id="dob" name="dob" type="date" value={settings.dob} onChange={onInputChange} className="mt-1 bg-input text-foreground" />
            </div>
            <div>
              <Label htmlFor="expectedLifespan" className="text-foreground">Expected Lifespan (years)</Label>
              <Input id="expectedLifespan" name="expectedLifespan" type="number" min="1" max="150" value={settings.expectedLifespan} onChange={onInputChange} className="mt-1 bg-input text-foreground" />
            </div>
          </div>

          <h4 className="text-md font-semibold text-foreground pt-2">Daily Life Allocations</h4>
          {allocationFields.map(field => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={`allocations.${field.key}`} className="text-foreground">{field.label}</Label>
              <Input id={`allocations.${field.key}`} name={`allocations.${field.key}`} type="number" min="0" max="24" step="0.5" value={settings.allocations[field.key]} onChange={onInputChange} className="bg-input text-foreground" />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default LifespanSettingsSection;
