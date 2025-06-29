
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button'; 
import { CalendarDays, Link as LinkIcon } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext'; 
import { useToast } from '@/hooks/use-toast'; 


interface NotificationsAndIntegrationsSectionProps {
  enableBrowserNotifications: boolean;
  enableAddToCalendar: boolean;
  enableCalendarIntegration: boolean; // This prop might become unused or re-purposed
  onBrowserNotificationsToggle: (checked: boolean) => void;
  onAddToCalendarToggle: (checked: boolean) => void;
  onCalendarIntegrationToggle: (checked: boolean) => void; // This prop might become unused
}

const NotificationsAndIntegrationsSection: React.FC<NotificationsAndIntegrationsSectionProps> = ({
  enableBrowserNotifications,
  enableAddToCalendar,
  enableCalendarIntegration, // Value will be from settings, now defaulted to false
  onBrowserNotificationsToggle,
  onAddToCalendarToggle,
  onCalendarIntegrationToggle, // Handler might not be called if UI is hidden
}) => {
  const { user, userSettings } = useAuth();
  const { toast } = useToast(); 

  const handleLinkGoogleCalendar = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to link your Google Calendar.",
        variant: "destructive",
      });
      return;
    }
    try {
      const idToken = await user.getIdToken();
      window.location.href = `/api/auth/google/redirect?idToken=${idToken}`;
    } catch (error) {
      console.error("Error getting ID token for calendar link:", error);
      toast({
        title: "Error",
        description: "Could not initiate Google Calendar linking. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine if the Google Calendar integration UI should be shown
  // For now, we are disabling it, so this will be false.
  const showCalendarIntegrationSettings = userSettings?.enableCalendarIntegration === true;


  return (
    <>
      <h3 className="text-lg font-semibold text-accent font-headline">Other Notifications & Integrations</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch id="enableBrowserNotifications" name="enableBrowserNotifications" checked={enableBrowserNotifications} onCheckedChange={onBrowserNotificationsToggle} />
          <Label htmlFor="enableBrowserNotifications" className="text-foreground">Enable Browser Notifications</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="enableAddToCalendar" name="enableAddToCalendar" checked={enableAddToCalendar} onCheckedChange={onAddToCalendarToggle} />
          <Label htmlFor="enableAddToCalendar" className="text-foreground">Enable "Add to Google Calendar" Button</Label>
        </div>
        
        {/* Conditionally hide the Calendar Overlay settings based on feature flag (which is now hard-disabled via DEFAULT_SETTINGS) */}
        {showCalendarIntegrationSettings && (
          <>
            <div className="flex items-center space-x-2">
              <Switch
                id="enableCalendarIntegration"
                name="enableCalendarIntegration"
                checked={enableCalendarIntegration} // This will be false
                onCheckedChange={onCalendarIntegrationToggle}
                // disabled // Could also disable it visually
              />
              <Label htmlFor="enableCalendarIntegration" className="text-foreground flex items-center">
                <CalendarDays className="mr-2 h-4 w-4 text-accent"/> Enable External Calendar Overlay (Disabled)
              </Label>
            </div>
            
            {user && enableCalendarIntegration && !userSettings?.googleCalendarLinked && (
              <div className="pl-8 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLinkGoogleCalendar}
                  className="border-primary text-primary hover:bg-primary/10"
                  // disabled // Could also disable it visually
                >
                  <LinkIcon className="mr-2 h-4 w-4" /> Link Google Calendar (Disabled)
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Google Calendar linking is temporarily disabled.
                </p>
              </div>
            )}
            {user && enableCalendarIntegration && userSettings?.googleCalendarLinked && (
              <div className="pl-8 pt-1">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Google Calendar linked. (Feature temporarily disabled)
                </p>
              </div>
            )}
          </>
        )}
         
      </div>
    </>
  );
};

export default NotificationsAndIntegrationsSection;

