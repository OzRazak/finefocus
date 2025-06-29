
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Save } from 'lucide-react';
import { saveAs } from 'file-saver';
import type { UserSettings } from '@/lib/types';
import type { User } from 'firebase/auth'; // Import User type

interface DataManagementSettingsSectionProps {
  settings: UserSettings;
  onImportSettings: (event: React.ChangeEvent<HTMLInputElement>) => void;
  user: User | null;
  onLogout: () => Promise<void>;
  authLoading: boolean;
}

const DataManagementSettingsSection: React.FC<DataManagementSettingsSectionProps> = ({
  settings,
  onImportSettings,
  user,
  onLogout,
  authLoading,
}) => {
  const handleExportSettings = () => {
    const jsonSettings = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonSettings], { type: "application/json;charset=utf-8" });
    saveAs(blob, "auxo_focus_timer_settings.json");
    // Toast for export can be handled in parent or here if toast is passed
  };

  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline">Data Management</h3>
      <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleExportSettings}>Export Settings</Button>
          <Label htmlFor="import-settings-file" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
              Import Settings
          </Label>
          <Input id="import-settings-file" type="file" accept=".json" onChange={onImportSettings} className="hidden" />
          {user && (
            <Button type="button" variant="destructive" onClick={onLogout} disabled={authLoading}>
              {authLoading ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Log Out
            </Button>
          )}
      </div>
    </>
  );
};

export default DataManagementSettingsSection;
