
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AdditionalFeaturesSettingsSectionProps {
  enableQuotes: boolean;
  onQuotesToggle: (checked: boolean) => void;
}

const AdditionalFeaturesSettingsSection: React.FC<AdditionalFeaturesSettingsSectionProps> = ({
  enableQuotes,
  onQuotesToggle,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline">Additional Features</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
            <Switch id="enableQuotes" name="enableQuotes" checked={enableQuotes} onCheckedChange={onQuotesToggle} />
            <Label htmlFor="enableQuotes" className="text-foreground">Show Inspirational Quotes on Timer Page</Label>
        </div>
      </div>
    </>
  );
};

export default AdditionalFeaturesSettingsSection;
