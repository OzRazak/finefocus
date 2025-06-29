
"use client";

import React from 'react';
import type { UserSettings, TimerMode, PlannerTask, TimerAnimation, PomodoroTaskList } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth'; // For user prop type
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, CalendarPlus, Timer, PlusCircle, MessageSquareHeart, Info, Lock, CheckIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';

import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import TimerStats from './TimerStats';
import TaskSelector from './TaskSelector';
import FocusRatingInput from './FocusRatingInput';

interface PomodoroCardProps {
  user: FirebaseUser | null;
  dynamicModeText: string;
  cycleText: string;

  showTaskSelection: boolean;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  pomodoroTasks: PomodoroTaskList;
  isLoadingTasks: boolean;
  newQuickTaskText: string;
  setNewQuickTaskText: (text: string) => void;
  isAddingQuickTask: boolean;
  handleQuickAddTaskAndFocus: (e?: React.FormEvent<HTMLFormElement>) => Promise<void>;

  showFocusRatingPrompt: boolean;
  handleFocusRatingSubmit: (rating: 1 | 2 | 3 | 4 | 5) => void;
  isSuggestingBreak: boolean;

  showTimerDisplay: boolean;
  timeRemaining: number;
  mode: TimerMode;
  progressPercentage: number;
  timerAnimation: TimerAnimation;
  animationSpeed: number;
  isRunning: boolean;
  timerColor: string;

  handleStartPause: () => void;
  handleReset: () => void;
  handleSkip: () => void;

  pomodoroDotsElements: JSX.Element[];
  totalCompletedPomodoros: number;
  goldCoins: number;
  silverCoins: number;

  showBreakSuggestion: boolean;
  currentBreakSuggestion: string | null;

  showAddToCalendarButton: boolean;
  handleAddToCalendar: () => void;

  onOpenSettings: () => void;
  onQuickDurationChange: (newDuration: number) => void;
  currentWorkDuration: number;
  enableAddToCalendarConfig: boolean;
}

const PREDEFINED_DURATIONS = [15, 20, 25, 30, 45, 50, 60, 90];

const PomodoroCard: React.FC<PomodoroCardProps> = ({
  user,
  dynamicModeText,
  cycleText,
  showTaskSelection,
  selectedTaskId,
  setSelectedTaskId,
  pomodoroTasks,
  isLoadingTasks,
  newQuickTaskText,
  setNewQuickTaskText,
  isAddingQuickTask,
  handleQuickAddTaskAndFocus,
  showFocusRatingPrompt,
  handleFocusRatingSubmit,
  isSuggestingBreak,
  showTimerDisplay,
  timeRemaining,
  mode,
  progressPercentage,
  timerAnimation,
  animationSpeed,
  isRunning,
  timerColor,
  handleStartPause,
  handleReset,
  handleSkip,
  pomodoroDotsElements,
  totalCompletedPomodoros,
  goldCoins,
  silverCoins,
  showBreakSuggestion,
  currentBreakSuggestion,
  showAddToCalendarButton,
  handleAddToCalendar,
  onOpenSettings,
  onQuickDurationChange,
  currentWorkDuration,
  enableAddToCalendarConfig,
}) => {

  const timerWrapperClassNames = cn(
    "relative w-48 h-48 md:w-60 md:h-60 rounded-full border-8 flex items-center justify-center text-center mt-2 cursor-pointer",
    isRunning ? "border-accent" : "border-muted/50",
    {
        'animate-pulse': isRunning && timerAnimation === 'pulse',
    }
  );

  const timerWrapperStyle = {
      animationDuration: isRunning && timerAnimation === 'pulse' ? `${2 / (animationSpeed || 1)}s` : undefined,
  };

  return (
    <Card className="shadow-2xl bg-card/90 backdrop-blur-md border-primary/40">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-primary truncate px-2" title={dynamicModeText}>
          {dynamicModeText}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {cycleText}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {showTaskSelection && (
          <div className="w-full px-2 space-y-3">
            <TaskSelector
              user={user}
              selectedTaskId={selectedTaskId}
              setSelectedTaskId={setSelectedTaskId}
              todayTasks={pomodoroTasks.todayTasks}
              inboxTasks={pomodoroTasks.inboxTasks}
              isLoadingTasks={isLoadingTasks}
            />
            <form onSubmit={handleQuickAddTaskAndFocus} className="space-y-1.5">
              <Label htmlFor="quick-add-task-pomodoro" className="text-sm text-muted-foreground">
                Or, focus on something new:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quick-add-task-pomodoro"
                  type="text"
                  value={newQuickTaskText}
                  onChange={(e) => setNewQuickTaskText(e.target.value)}
                  placeholder="e.g., Draft email to client"
                  className="bg-input text-foreground flex-grow"
                  disabled={isAddingQuickTask}
                />
                <Button type="submit" size="sm" variant="outline" disabled={!newQuickTaskText.trim() || isAddingQuickTask} className="border-primary text-primary hover:bg-primary/10">
                  {isAddingQuickTask ? <Timer className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  <span className="ml-1.5">Focus</span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {showFocusRatingPrompt && user && (
          <FocusRatingInput onRateSubmit={handleFocusRatingSubmit} disabled={isSuggestingBreak} />
        )}

        {showTimerDisplay && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className={timerWrapperClassNames}
                  style={timerWrapperStyle}
                  data-testid="pomodoro-timer-display"
                  role="button"
                  tabIndex={0}
                  aria-label="Change timer duration"
                >
                  <TimerDisplay
                    timeRemaining={timeRemaining}
                    mode={mode}
                    progressPercentage={progressPercentage}
                    timerAnimation={timerAnimation}
                    animationSpeed={animationSpeed}
                    isRunning={isRunning}
                    timerColor={timerColor}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2 bg-popover text-popover-foreground shadow-xl border-border">
                <div className="space-y-1">
                  {PREDEFINED_DURATIONS.map(duration => (
                    <Button
                      key={duration}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm",
                        currentWorkDuration === duration && "bg-primary/10 text-primary"
                      )}
                      onClick={() => onQuickDurationChange(duration)}
                    >
                      {currentWorkDuration === duration && <CheckIcon className="mr-2 h-4 w-4" />}
                      {duration} minutes
                    </Button>
                  ))}
                  <hr className="my-1 border-border" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={onOpenSettings}
                  >
                    <Lock className="mr-2 h-4 w-4" /> Custom
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <TimerControls
              isRunning={isRunning}
              handleStartPause={handleStartPause}
              handleReset={handleReset}
              handleSkip={handleSkip}
            />
          </>
        )}

        <TimerStats
          pomodoroDots={pomodoroDotsElements}
          totalCompletedPomodoros={totalCompletedPomodoros}
          goldCoins={goldCoins}
          silverCoins={silverCoins}
        />

        {showBreakSuggestion && (
           <Alert variant="default" className="w-full max-w-xs bg-accent/10 border-accent/30 text-accent-foreground">
             <Info className="h-5 w-5 text-accent" />
              <AlertTitle className="font-semibold text-accent">Break Suggestion:</AlertTitle>
              <AlertDescription>
                {isSuggestingBreak ? "Thinking of a good break..." : currentBreakSuggestion}
              </AlertDescription>
            </Alert>
        )}

        {showAddToCalendarButton && (
          <Button
              onClick={handleAddToCalendar}
              variant="outline"
              className="mt-2 w-full max-w-xs border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground"
          >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Add Session to Google Calendar
          </Button>
        )}

         <Button onClick={onOpenSettings} variant="ghost" className="text-foreground mt-2">
            <Settings2 className="mr-2 h-4 w-4" /> Timer Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default PomodoroCard;
