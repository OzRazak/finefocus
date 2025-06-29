
import type { Timestamp } from 'firebase/firestore';
import type { Layout } from 'react-grid-layout';

export interface LifeAllocations {
  sleep: number; // hours per day
  work: number; // hours per day
  eating: number; // hours per day
  exercise: number; // hours per day
  personalCare: number; // hours per day
  commuting: number; // hours per day
  // Free time is calculated
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type TimerAnimation = 'default' | 'smooth' | 'pulse' | 'colorShift';

export interface UserSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // pomodoros before long break
  dob: string; // YYYY-MM-DD
  expectedLifespan: number; // years
  allocations: LifeAllocations;
  enableSoundNotifications: boolean;
  notificationSoundFile: string;
  soundVolume: number; // 0.0 to 1.0
  enableBrowserNotifications: boolean;
  enableAddToCalendar?: boolean;
  enableAdaptiveTimer?: boolean;
  enableAnimatedBackground?: boolean;
  enableQuotes?: boolean;
  enableCalendarIntegration: boolean; // Kept for structure, but effectively disabled
  totalTasksCompleted: number;
  completedTasksStreak: number; // Number of consecutive days a task was completed
  lastCompletionDate: string | null; // YYYY-MM-DD format
  backgroundType?: 'color' | 'image';
  backgroundValue?: string; // hex color or image URL
  goldCoins: number;
  silverCoins: number;
  displayName?: string | null;
  photoURL?: string | null;
  marketingOptIn?: boolean;
  theme?: ThemePreference;
  timerAnimation?: TimerAnimation;
  timerAnimationSpeed?: number;
  role?: string;
  currentProject?: string;
  preferredVoice?: string; // For "Start My Day" briefing
  plannerLayouts?: { [breakpoint: string]: Layout[] }; // For react-grid-layout
  focusDnaReport?: FocusDnaReport | null;
  focusDnaReportGeneratedAt?: string | null;
  calendarEventsLastFetched?: string | null;
  googleAccessToken?: string | null; // Kept for structure
  googleRefreshToken?: string | null; // Kept for structure
  googleTokenExpiresAt?: number | null; // Timestamp in ms, Kept for structure
  googleCalendarLinked: boolean; // Kept for structure, will be false
}

export interface PublicProfile {
  userId: string;
  displayName?: string | null;
  photoURL?: string | null;
  goldCoins: number;
  silverCoins: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  timeRemaining: number; // seconds
  completedPomodorosInCycle: number;
  totalCompletedPomodoros: number;
  currentCycle: number;
}

export interface Quote {
  text: string;
  author?: string;
}

export interface LifespanMetrics {
  totalYears: number;
  yearsLived: number;
  yearsRemaining: number;
  monthsLived: number;
  monthsRemaining: number;
  totalMonths: number;
  percentageLived: number;
  allocatedTime: {
    sleep: number;
    work: number;
    eating: number;
    exercise: number;
    personalCare: number;
    commuting: number;
    freeTime: number;
  }; // in remaining years
}

export interface Task {
  id: string;
  userId: string;
  text: string;
  isCompleted: boolean;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
}

export interface LocalTask {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string; 
  completedAt?: string | null; 
}

export interface LeaderboardItem {
  id: string; 
  rank?: number;
  displayName?: string | null;
  photoURL?: string | null;
  goldCoins: number;
  silverCoins: number;
}

export interface FeedbackEntry {
  id?: string; 
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  subject: "bug" | "feature" | "question" | "general";
  message: string;
  createdAt: Timestamp;
  status?: "new" | "seen" | "addressed"; 
}

export interface PlannerSubtask {
  id: string;
  text: string;
  isCompleted: boolean;
  order?: number;
  createdAt?: string; 
  updatedAt?: string; 
}

export interface PlannerRecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'none'; 
  interval?: number; 
  daysOfWeek?: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[]; 
  dayOfMonth?: number; 
}

export type PlannerTaskPanel = 'brainDump' | string; 

export interface PlannerTask {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  estimatedTime: number; 
  scheduledDate: string | null; 
  panel: PlannerTaskPanel;
  order: number;
  isCompleted: boolean;
  completedAt?: string | null; 
  createdAt: string; 
  updatedAt: string; 
  labelIds: string[];
  subtasks: PlannerSubtask[]; 
  subtaskStats?: { total: number; completed: number }; 
  recurrenceRule: PlannerRecurrenceRule | null;
  timeboxedStartTime?: string | null; 
}

export interface TaskLabel {
  id: string;
  userId: string;
  name: string;
  color: string; 
  createdAt: string; 
  updatedAt: string; 
}

export interface PomodoroTaskList {
  todayTasks: PlannerTask[];
  inboxTasks: PlannerTask[];
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown';

export interface FocusSessionLog {
    id?: string; 
    userId: string;
    timestamp: string; 
    focusLevel: 1 | 2 | 3 | 4 | 5; 
    pomodoroDurationMinutes: number;
    taskId?: string | null;
    taskTitle?: string | null;
    timeOfDay: TimeOfDay;
}

export interface BreakSuggestionInput {
    taskTitle?: string | null;
    pomodoroDurationMinutes: number;
}
export interface BreakSuggestionOutput {
    suggestion: string;
}

export interface AnalyzeFocusDnaInput {
  focusSessions: FocusSessionLog[];
}

export interface PeakTimeInsight {
  period: string; 
  description: string;
}

export interface SessionLengthInsight {
  taskTypeContext: string; 
  optimalLength: string; 
  reasoning?: string;
}

export interface TaskImpactInsight {
  factor: string; 
  impactDescription: string;
}

export interface FocusDnaReport {
  summary?: string; 
  peakProductivityTimes?: PeakTimeInsight[];
  optimalSessionLengths?: SessionLengthInsight[];
  taskImpacts?: TaskImpactInsight[];
  recommendations?: string[]; 
  dataSufficiencyMessage?: string; 
}
export type AnalyzeFocusDnaOutput = FocusDnaReport;

export interface TaskForOptimization {
  id: string;
  title: string;
  estimatedTime: number; 
}
export interface OptimizeDayScheduleInput {
  tasksForDay: TaskForOptimization[];
  focusDnaReport?: FocusDnaReport | null;
  dayStartTime: string; 
  dayEndTime: string;   
  currentDate: string; 
}

export interface OptimizedTaskSuggestion {
  taskId: string;
  suggestedStartTime: string; 
  notes?: string;
}

export interface OptimizeDayScheduleOutput {
  optimizedSchedule: OptimizedTaskSuggestion[];
  overallNotes?: string;
}

export interface EstimateTaskDurationInput {
  taskTitle: string;
}
export interface EstimateTaskDurationOutput {
  estimatedDurationMinutes: number;
}

export interface GenerateTasksInput {
  description: string;
  imageDataUris?: string[];
  historicalContext?: string[];
  profileContext?: {
    role?: string;
    currentProject?: string;
  };
  pomodoroDuration: number;
}

export interface GeneratedTask {
  taskText: string;
  estimatedPomodoros: number;
}

export interface GenerateTasksOutput {
  suggestedTasks: GeneratedTask[];
}

export interface CompletedSessionDetails {
  durationMinutes: number;
  taskId: string | null;
  taskTitle?: string | null;
}

export interface DailyBriefingInput {
  userName: string | null;
  currentDate: string; 
  weatherPlaceholder: string;
  previousDayTaskTitles: string[]; 
  todayTaskTitles: string[];       
  quote: { text: string; author?: string };
}

export interface DailyBriefingOutput {
  greeting: string;
  dateWeatherInfo: string;
  accomplishments: string;
  todayFocus: string;
  motivationalQuote: string;
  interactiveQuestion?: string; 
  fullBriefingText: string; 
}

export interface TextToSpeechInput {
  text: string;
  voiceId: string; 
}

export interface TextToSpeechOutput {
  audioBase64?: string; 
  audioUrl?: string;
  error?: string; 
}


export interface StartMyDayApiResponse {
    briefingScript: DailyBriefingOutput;
    audioData: TextToSpeechOutput; 
}

// Kept for structure, but feature is effectively disabled
export interface ExternalCalendarEvent {
  id: string;
  title: string;
  startTime: string; 
  endTime: string;   
  allDay?: boolean;
  color?: string; 
  description?: string;
}

export interface CalendarEventsApiResponse {
  events: ExternalCalendarEvent[];
  error?: string;
}


export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signInWithMicrosoft: () => Promise<FirebaseUser | null>;
  signUpWithEmailPassword: (email: string, password: string, displayName?: string, marketingOptIn?: boolean) => Promise<FirebaseUser | null>;
  signInWithEmailPassword: (email: string, password: string) => Promise<FirebaseUser | null>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  userSettings: UserSettings | null;
  setUserSettings: (settings: Partial<UserSettings>) => Promise<void>; // Changed to Partial<UserSettings>
  isLoadingSettings: boolean;
  focusDnaReport: FocusDnaReport | null;
  setFocusDnaReport: (report: FocusDnaReport | null) => void;
}

// Helper type for Firebase User, can be expanded
export interface UserProfile extends Pick<FirebaseUser, 'uid' | 'displayName' | 'email' | 'photoURL'> {}
// Ensure FirebaseUser is imported if not already
import type { User as FirebaseUser } from 'firebase/auth';

