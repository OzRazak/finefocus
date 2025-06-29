
import type { UserSettings, Quote, LifeAllocations, ThemePreference, TimerAnimation } from './types';
import type { Layout } from 'react-grid-layout'; // Import Layout type

export const DEFAULT_LIFE_ALLOCATIONS: LifeAllocations = {
  sleep: 8,
  work: 8,
  eating: 2,
  exercise: 1,
  personalCare: 1,
  commuting: 1,
};

// Default background for the new light theme
export const DEFAULT_BACKGROUND_TYPE: 'color' | 'image' = 'color';
export const DEFAULT_BACKGROUND_VALUE: string = '#FFFFFF'; // White

export const SAMPLE_BACKGROUND_IMAGES: { name: string; url: string; hint: string }[] = [
  { name: 'Focus Lightbulb', url: 'https://images.unsplash.com/photo-1504507926084-34cf0b939964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxmb2N1c3xlbnwwfHx8fDE3NDk1NjAzMDR8MA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'focus lightbulb' },
  { name: 'Minimalist Off-White', url: 'https://images.unsplash.com/photo-1499810631641-541e76d678a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjYWxtfGVufDB8fHx8MTc0OTQ4MTc4OHww&ixlib=rb-4.1.0&q=80&w=1080', hint: 'minimalist white' },
  { name: 'Analog Clock Focus', url: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMXx8Y2xvY2t8ZW58MHx8fHwxNzQ5NTU4MzAyfDA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'clock time' },
  { name: 'Modern Interior Plant', url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNXx8UGxhbnRzfGVufDB8fHx8MTc0OTU1OTY0NXww&ixlib=rb-4.1.0&q=80&w=1080', hint: 'interior plant' },
  { name: 'Sunny Meadow', url: 'https://images.unsplash.com/photo-1606799955515-85468ee78c26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx0YWJsZSUyMG1vdW50YWlufGVufDB8fHx8MTc0OTYzMTYxMXww&ixlib=rb-4.1.0&q=80&w=1080', hint: 'sunny meadow' },
  { name: 'Light Cosmic Dust', url: 'https://images.unsplash.com/photo-1501644898242-cfea317d7faf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxM3x8Zm9jdXN8ZW58MHx8fHwxNzQ5NTYwMzA0fDA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'light cosmic' },
  { name: 'Geometric Light', url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMnx8Y29tcHV0ZXJ8ZW58MHx8fHwxNzQ5NjMxNzQ0fDA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'geometric light' },
  { name: 'Beach Day', url: 'https://images.unsplash.com/photo-1473042904451-00171c69419d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOHx8ZmFzdHxlbnwwfHx8fDE3NDk2MzE0MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'beach day' },
  { name: 'Super Saiyan Power', url: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxzdXBlciUyMHNhaXlhbnxlbnwwfHx8fDE3NDk1Njc4NTV8MA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'super saiyan' },
  { name: 'Gentle Sunrise', url: 'https://images.unsplash.com/photo-1536532184021-da5392b55da1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxibHVlJTIwc2t5fGVufDB8fHx8MTc0OTYzMTc5OHww&ixlib=rb-4.1.0&q=80&w=1080', hint: 'gentle sunrise' },
];

export const DEFAULT_PLANNER_LAYOUTS: { [breakpoint: string]: Layout[] } = {
  lg: [ 
    { i: 'inbox', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 6 }, // Increased width
    { i: 'daily', x: 4, y: 0, w: 5, h: 10, minW: 4, minH: 6 }, // Adjusted width
    { i: 'timebox', x: 9, y: 0, w: 3, h: 12, minW: 2, minH: 8 }, // Increased height
  ],
  md: [ 
    { i: 'inbox', x: 0, y: 0, w: 3, h: 10, minW: 2, minH: 6 }, // Increased width
    { i: 'daily', x: 3, y: 0, w: 4, h: 10, minW: 3, minH: 6 }, // Adjusted width
    { i: 'timebox', x: 7, y: 0, w: 3, h: 12, minW: 2, minH: 8 }, // Increased height
  ],
  sm: [ 
    { i: 'inbox', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },    // Full width for 'sm'
    { i: 'daily', x: 0, y: 6, w: 6, h: 8, minW: 3, minH: 5 },    // Full width for 'sm'
    { i: 'timebox', x: 0, y: 14, w: 6, h: 10, minW: 3, minH: 6 }, // Full width and increased height
  ],
};


export const DEFAULT_SETTINGS: UserSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dob: '1993-02-08',
  expectedLifespan: 80,
  allocations: { ...DEFAULT_LIFE_ALLOCATIONS },
  enableSoundNotifications: true,
  notificationSoundFile: "notification.mp3",
  soundVolume: 0.75, 
  enableBrowserNotifications: false,
  enableAddToCalendar: true,
  enableAdaptiveTimer: false,
  enableAnimatedBackground: false,
  enableQuotes: false,
  enableCalendarIntegration: false, // Disabled by default
  totalTasksCompleted: 0,
  completedTasksStreak: 0,
  lastCompletionDate: null,
  backgroundType: DEFAULT_BACKGROUND_TYPE,
  backgroundValue: DEFAULT_BACKGROUND_VALUE,
  goldCoins: 0,
  silverCoins: 0,
  displayName: null,
  photoURL: null,
  marketingOptIn: false,
  theme: 'light' as ThemePreference,
  timerAnimation: 'default',
  timerAnimationSpeed: 1,
  role: '',
  currentProject: '',
  preferredVoice: 'default-female-1', 
  plannerLayouts: DEFAULT_PLANNER_LAYOUTS,
  focusDnaReport: null,
  focusDnaReportGeneratedAt: null,
  calendarEventsLastFetched: null,
  googleAccessToken: null, // Disabled
  googleRefreshToken: null, // Disabled
  googleTokenExpiresAt: null, // Disabled
  googleCalendarLinked: false, // Disabled
};

export const APP_NAME = "AuxoFocus";
export const APP_SUBTITLE = "Your Productivity Companion.";

export const LOCAL_STORAGE_SETTINGS_KEY = 'focusTimerSettings';
export const LOCAL_STORAGE_ACTIVE_TASKS_KEY = 'focusTimerActiveTasks';
export const LOCAL_STORAGE_COMPLETED_TASKS_KEY = 'focusTimerCompletedTasks';


export const firebaseConfig = {
  apiKey: "AIzaSyBqmN53wceBjEKQVmDJJsGW4yqAQPah1ok",
  authDomain: "doomsday-pomodoro-810c1.firebaseapp.com",
  projectId: "doomsday-pomodoro-810c1",
  storageBucket: "doomsday-pomodoro-810c1.firebasestorage.app",
  messagingSenderId: "671031688974",
  appId: "1:671031688974:web:14a68196e1aec19be6615f"
};

export const MIN_GOLD_COINS_PER_POMODORO = 8;
export const MAX_GOLD_COINS_PER_POMODORO = 12;
export const SILVER_COINS_PER_POMODORO = 5;

export const NOTIFICATION_SOUND_OPTIONS = [
    { value: "notification.mp3", label: "Default (Notification)" },
    { value: "chime.mp3", label: "Chime" },
    { value: "bell.mp3", label: "Bell" },
    { value: "digital-tone.mp3", label: "Digital Tone" },
    { value: "success.mp3", label: "Success" },
];

export const PLANNER_TASKS_COLLECTION = 'plannerTasks';
export const SUBTASKS_COLLECTION = 'subtasks'; 
export const PLANNER_LABELS_COLLECTION = 'plannerLabels';
export const TASKS_COLLECTION = 'tasks';

export const TTS_VOICE_OPTIONS: { id: string; name: string; gender?: string; lang?: string }[] = [
  { id: 'default-female-1', name: 'Standard Female Voice', gender: 'FEMALE', lang: 'en-US' },
  { id: 'default-male-1', name: 'Standard Male Voice', gender: 'MALE', lang: 'en-US' },
];

export const PLACEHOLDER_AUDIO_BASE64 = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

