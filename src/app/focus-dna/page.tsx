
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { APP_NAME, DEFAULT_SETTINGS } from '@/lib/constants';
import HeaderComponent from '@/components/domain/HeaderComponent';
import SettingsModal from '@/components/domain/SettingsModal';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/ui/animations/PageTransition';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrainCircuit, BarChart3, AlertTriangle, Lightbulb, Database, Sparkles, Loader2, Clock, CalendarDays, TrendingUp, Target, Activity } from 'lucide-react';
import Link from 'next/link';
import type { FocusSessionLog, FocusDnaReport, UserSettings } from '@/lib/types';
import { getFocusSessions } from '@/lib/firebase/firestoreService';
import { analyzeFocusDna } from '@/ai/flows/analyze-focus-dna-flow';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';


const focusLevelEmojis: Record<number, string> = {
  1: '😩', 2: '😕', 3: '😐', 4: '🙂', 5: '😄',
};
const focusLevelLabels: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great',
};

export default function FocusDnaPage() {
  const { user, userSettings, setUserSettings, loading: authLoading, isLoadingSettings, setFocusDnaReport: setReportInAuthContext, focusDnaReport: reportFromAuthContext } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [loggedSessions, setLoggedSessions] = useState<FocusSessionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [localFocusDnaReport, setLocalFocusDnaReport] = useState<FocusDnaReport | null>(reportFromAuthContext);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const { toast } = useToast();

  const currentEffectiveSettings = userSettings || DEFAULT_SETTINGS;

  useEffect(() => {
    document.title = `Your Focus DNA | ${APP_NAME}`;
  }, []);
  
  useEffect(() => {
    // Initialize local report from AuthContext or persisted userSettings
    if (reportFromAuthContext) {
        setLocalFocusDnaReport(reportFromAuthContext);
    } else if (userSettings?.focusDnaReport) {
        setLocalFocusDnaReport(userSettings.focusDnaReport);
        setReportInAuthContext(userSettings.focusDnaReport); // Sync to AuthContext if loaded from UserSettings
    }
  }, [reportFromAuthContext, userSettings, setReportInAuthContext]);


  const fetchLogs = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingLogs(true);
      try {
        const sessions = await getFocusSessions(user.uid);
        setLoggedSessions(sessions);
      } catch (error) {
        console.error("Error fetching focus logs:", error);
        toast({ title: "Error", description: "Could not load your focus session data.", variant: "destructive" });
      } finally {
        setIsLoadingLogs(false);
      }
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchLogs();
    }
  }, [user, authLoading, fetchLogs]);

  const handleGenerateReport = async () => {
    if (!user || loggedSessions.length === 0) {
      const notEnoughDataReport: FocusDnaReport = {
        summary: "Not enough focus session data to generate a meaningful report.",
        dataSufficiencyMessage: "Please use the Pomodoro timer and rate your focus after sessions. More data leads to better insights!",
        recommendations: ["Log at least 5-10 focus sessions to start seeing patterns."]
      };
      setLocalFocusDnaReport(notEnoughDataReport);
      setReportInAuthContext(notEnoughDataReport);
      if (user && userSettings) {
        setUserSettings({ // This is AuthContext's setUserSettings
          ...userSettings,
          focusDnaReport: notEnoughDataReport,
          focusDnaReportGeneratedAt: new Date().toISOString(),
        });
      }
      toast({ title: "Not Enough Data", description: "Please log some focus sessions first to generate a report.", variant: "default" });
      return;
    }

    setIsGeneratingReport(true);
    setReportError(null);
    setLocalFocusDnaReport(null);
    setReportInAuthContext(null);

    try {
      const report = await analyzeFocusDna({ focusSessions: loggedSessions });
      setLocalFocusDnaReport(report);
      setReportInAuthContext(report);

      if (user && userSettings) {
        setUserSettings({ // This is AuthContext's setUserSettings
          ...userSettings,
          focusDnaReport: report,
          focusDnaReportGeneratedAt: new Date().toISOString(),
        });
      }

      if (report.dataSufficiencyMessage && (!report.summary && !report.peakProductivityTimes && !report.optimalSessionLengths)) {
         toast({ title: "Focus DNA Report", description: report.dataSufficiencyMessage, duration: 7000});
      } else {
         toast({ title: "Focus DNA Report Generated!", description: "Scroll down to view your insights and persisted.", duration: 5000});
      }
    } catch (error) {
      console.error("Error generating Focus DNA report:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during report generation.";
      setReportError(`Failed to generate report: ${errorMessage}`);
      toast({ title: "Report Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  const renderReportSection = (title: string, items: string[] | undefined, icon: React.ElementType) => {
    if (!items || items.length === 0) return null;
    const IconComponent = icon;
    return (
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-accent mb-3 flex items-center">
          <IconComponent className="mr-2 h-5 w-5" /> {title}
        </h3>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/90">
          {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </div>
    );
  };


  if (authLoading || isLoadingSettings) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
          <main className="flex-grow container mx-auto px-4 py-12 md:py-16 text-center">
            <BrainCircuit className="mx-auto h-16 w-16 text-primary mb-6" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground mb-4">
              Unlock Your Focus DNA
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Please <Button variant="link" className="p-0 h-auto text-lg md:text-xl text-primary hover:text-primary/80" onClick={() => {/*TODO: open signin modal*/}}>sign in</Button> to track your focus sessions and generate personalized insights.
            </p>
            <Card className="bg-card/80 shadow-xl border-border text-left max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-accent flex items-center">
                    <Lightbulb className="mr-3 h-6 w-6" />
                    How It Works
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground">
                    <p>By consistently rating your focus after Pomodoro sessions, you'll provide the data our AI needs.</p>
                    <p>Once logged in, you'll receive a report here with insights like your most productive times, optimal session lengths, and personalized recommendations.</p>
                </CardContent>
            </Card>
          </main>
        </div>
      </PageTransition>
    );
  }


  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
        <main className="flex-grow container mx-auto px-4 py-12 md:py-16 space-y-10">
          <div className="text-center">
            <BrainCircuit className="mx-auto h-16 w-16 text-primary mb-6" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground mb-4">
              Your Focus DNA
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze your logged focus sessions to discover patterns and receive personalized insights to boost your productivity.
              {userSettings?.focusDnaReportGeneratedAt && (
                <span className="block text-xs mt-1">Last report generated: {format(parseISO(userSettings.focusDnaReportGeneratedAt), "MMM d, yyyy HH:mm")}</span>
              )}
            </p>
          </div>

          <Card className="bg-card/80 shadow-xl border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-accent flex items-center">
                <Database className="mr-3 h-6 w-6" /> Your Logged Focus Sessions
              </CardTitle>
              <CardDescription>
                This is the data used to generate your Focus DNA report. The more sessions you log, the more accurate your insights will be.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" /> Loading session data...
                </div>
              ) : loggedSessions.length === 0 ? (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>No Sessions Logged Yet</AlertTitle>
                  <AlertDescription>
                    Start using the Pomodoro timer and rate your focus after each work session. Your data will appear here.
                    <Button asChild variant="link" className="p-0 h-auto ml-1 text-primary">
                        <Link href="/">Go to Timer</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[300px] pr-3">
                  <ul className="space-y-3">
                    {loggedSessions.map(session => (
                      <li key={session.id} className="p-3 bg-background/50 rounded-md border border-border/30 shadow-sm">
                        <div className="flex justify-between items-start text-sm">
                          <span className="font-medium text-foreground">{session.taskTitle || "General Focus"}</span>
                          <span className="text-xs text-muted-foreground">{format(parseISO(session.timestamp), "MMM d, yyyy HH:mm")}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1 text-muted-foreground">
                          <span>Duration: {session.pomodoroDurationMinutes} min</span>
                          <span className="flex items-center" title={`Focus: ${focusLevelLabels[session.focusLevel] || session.focusLevel}`}>
                            {focusLevelEmojis[session.focusLevel] || '❓'}
                            <span className="ml-1">({session.focusLevel}/5)</span>
                          </span>
                          <span>Time: {session.timeOfDay.charAt(0).toUpperCase() + session.timeOfDay.slice(1)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
                onClick={handleGenerateReport} 
                disabled={isGeneratingReport || isLoadingLogs || loggedSessions.length < 1}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3"
            >
              {isGeneratingReport ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {userSettings?.focusDnaReport ? 'Re-generate Report' : 'Generate My Focus DNA Report'}
            </Button>
          </div>
          
          {reportError && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Report Generation Error</AlertTitle>
                <AlertDescription>{reportError}</AlertDescription>
            </Alert>
          )}

          {localFocusDnaReport && !isGeneratingReport && (
            <Card className="bg-gradient-to-br from-primary/5 via-card to-card/90 shadow-2xl border-primary/30 mt-10 p-6 md:p-8 rounded-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl md:text-4xl font-headline text-primary">
                  Your Focus DNA Unlocked!
                </CardTitle>
                {localFocusDnaReport.summary && (
                  <CardDescription className="text-muted-foreground text-md pt-2 max-w-xl mx-auto">
                    {localFocusDnaReport.summary}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {localFocusDnaReport.dataSufficiencyMessage && (
                  <Alert variant="default" className="bg-accent/10 border-accent/30 text-accent-foreground">
                    <Lightbulb className="h-4 w-4 text-accent" />
                    <AlertTitle>Data Note</AlertTitle>
                    <AlertDescription>{localFocusDnaReport.dataSufficiencyMessage}</AlertDescription>
                  </Alert>
                )}

                {localFocusDnaReport.peakProductivityTimes && localFocusDnaReport.peakProductivityTimes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-accent mb-3 flex items-center"><Clock className="mr-2 h-5 w-5" /> Peak Productivity Times</h3>
                    {localFocusDnaReport.peakProductivityTimes.map((insight, idx) => (
                      <div key={idx} className="p-3 bg-background/40 rounded-md mb-2 shadow-sm border border-border/20">
                        <p className="font-medium text-foreground">{insight.period}</p>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {localFocusDnaReport.optimalSessionLengths && localFocusDnaReport.optimalSessionLengths.length > 0 && (
                   <div>
                    <h3 className="text-xl font-semibold text-accent mb-3 flex items-center"><CalendarDays className="mr-2 h-5 w-5" /> Optimal Session Lengths</h3>
                    {localFocusDnaReport.optimalSessionLengths.map((insight, idx) => (
                       <div key={idx} className="p-3 bg-background/40 rounded-md mb-2 shadow-sm border border-border/20">
                        <p className="font-medium text-foreground">{insight.taskTypeContext}: <span className="text-primary">{insight.optimalLength}</span></p>
                        {insight.reasoning && <p className="text-sm text-muted-foreground">{insight.reasoning}</p>}
                      </div>
                    ))}
                  </div>
                )}
                
                {localFocusDnaReport.taskImpacts && localFocusDnaReport.taskImpacts.length > 0 && (
                   <div>
                    <h3 className="text-xl font-semibold text-accent mb-3 flex items-center"><TrendingUp className="mr-2 h-5 w-5" /> Task Impact Insights</h3>
                    {localFocusDnaReport.taskImpacts.map((insight, idx) => (
                       <div key={idx} className="p-3 bg-background/40 rounded-md mb-2 shadow-sm border border-border/20">
                        <p className="font-medium text-foreground">{insight.factor}</p>
                        <p className="text-sm text-muted-foreground">{insight.impactDescription}</p>
                      </div>
                    ))}
                  </div>
                )}

                {renderReportSection("Actionable Recommendations", localFocusDnaReport.recommendations, Target)}
                
                <div className="text-center mt-8">
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/">Back to Timer</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={currentEffectiveSettings}
          onSaveSettings={(newSettings: UserSettings, wasUserChange?: boolean) => { // Accept wasUserChange
            if (user) { 
              setUserSettings(newSettings); // This is AuthContext's setUserSettings
              if (wasUserChange) {
                toast({ title: "Settings Saved", description: "Your preferences have been updated."});
              }
            }
          }}
        />
      </div>
    </PageTransition>
  );
}
