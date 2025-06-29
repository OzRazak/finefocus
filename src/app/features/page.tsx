
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PageTransition from '@/components/ui/animations/PageTransition';
import HeaderComponent from '@/components/domain/HeaderComponent';
import SettingsModal from '@/components/domain/SettingsModal';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_SETTINGS, APP_NAME } from '@/lib/constants';
import type { UserSettings } from '@/lib/types';
import {
  Lightbulb, Search, Sparkles, TimerIcon, BrainCircuit, ListChecks, CalendarHeart,
  Orbit, BarChart3, Palette, Music, SlidersHorizontal, AlertTriangle, HelpCircle,
  Briefcase, Settings, MessageCircleQuestion, Shield, ExternalLink, Info, Rocket, History, Smartphone, RadioTower, CalendarDays
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  icon: React.ElementType;
  category: 'current' | 'upcoming' | 'faq';
  keywords: string[];
  content: React.ReactNode;
  status?: 'active' | 'beta' | 'disabled' | 'development';
  relatedPages?: { title: string; href: string }[];
}

const featuresAndFaqs: FeatureItem[] = [
  // Current Features
  {
    id: 'pomodoro-timer',
    title: 'Customizable Pomodoro Timer',
    icon: TimerIcon,
    category: 'current',
    status: 'active',
    keywords: ['pomodoro', 'timer', 'focus', 'work', 'break', 'session', 'duration'],
    content: (
      <div className="space-y-2">
        <p>The core of {APP_NAME}. Utilize the proven Pomodoro Technique to break your work into focused intervals (Pomodoros) separated by short breaks. This helps maintain concentration and prevent burnout.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Set custom durations for work, short breaks, and long breaks in Settings.</li>
          <li>Tracks your Pomodoro cycles and sessions within a cycle.</li>
          <li>Visual progress indicators and optional sound/browser notifications.</li>
          <li>Keyboard shortcuts (Space to start/pause, R to reset, S to skip).</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'Go to Timer', href: '/' }],
  },
  {
    id: 'ai-task-breakdown',
    title: 'AI Task Assistant & Breakdown',
    icon: Sparkles,
    category: 'current',
    status: 'active',
    keywords: ['ai', 'task', 'breakdown', 'subtask', 'assistant', 'genkit', 'gemini', 'image'],
    content: (
      <div className="space-y-2">
        <p>Overwhelmed by a large goal? Describe it to our AI Task Assistant, optionally upload a relevant image (e.g., a whiteboard sketch, a complex diagram), and let the AI suggest smaller, manageable sub-tasks.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access via the Task Focus List page.</li>
          <li>Input text description or use voice input.</li>
          <li>Upload up to 3 images for context.</li>
          <li>AI considers your Pomodoro duration (from settings), role, and current project (if set in settings) for more relevant suggestions.</li>
          <li>Suggested tasks can be easily added to your Planner Inbox.</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'Go to Task List', href: '/#tasks' }]
  },
  {
    id: 'task-management',
    title: 'Task Focus List & Planner Inbox',
    icon: ListChecks,
    category: 'current',
    status: 'active',
    keywords: ['task', 'list', 'management', 'todo', 'planner', 'inbox'],
    content: (
      <div className="space-y-2">
        <p>Manage your tasks effectively. Tasks added manually or via the AI Assistant go to your Planner Inbox if you're signed in, or are stored locally if you're a guest.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Add, complete, and delete tasks.</li>
          <li>View active and completed tasks.</li>
          <li>Insights on task completion (today, this week, this month, all-time, streak).</li>
          <li>For logged-in users, tasks are synced with the more comprehensive <Link href="/planner" className="text-primary hover:underline">Modular Task Planner</Link>.</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'Go to Task List', href: '/#tasks' }, { title: 'Advanced Planner', href: '/planner' }]
  },
  {
    id: 'lifespan-visualizer',
    title: 'Lifespan Visualizer',
    icon: CalendarHeart,
    category: 'current',
    status: 'active',
    keywords: ['lifespan', 'time', 'visualization', 'memento mori', 'perspective'],
    content: (
      <div className="space-y-2">
        <p>Gain a unique perspective on your most valuable asset: time. This feature visualizes your estimated lifespan, how much you've lived, and how your time might be allocated based on your daily routines.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Set your Date of Birth and Expected Lifespan in Settings.</li>
          <li>Define daily allocations for sleep, work, exercise, etc.</li>
          <li>See charts for remaining time and years by activity.</li>
          <li>"Life in Dots" provides a striking visual of years lived vs. remaining.</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'View Lifespan', href: '/lifespan' }]
  },
  {
    id: 'leaderboard',
    title: 'Gamified Leaderboard',
    icon: BarChart3,
    category: 'current',
    status: 'active',
    keywords: ['leaderboard', 'gamification', 'coins', 'rank', 'competition', 'motivation'],
    content: (
      <div className="space-y-2">
        <p>Stay motivated by earning Gold and Silver coins for completed Pomodoro sessions. See how you rank against other users on the leaderboard.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Requires sign-in to participate and appear on the leaderboard.</li>
          <li>Gold coins primarily determine rank.</li>
          <li>Encourages consistent focus and productivity.</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'View Leaderboard', href: '/#leaderboard' }]
  },
  {
    id: 'personalization',
    title: 'Personalization Settings',
    icon: Palette,
    category: 'current',
    status: 'active',
    keywords: ['settings', 'theme', 'background', 'sound', 'notifications', 'customization'],
    content: (
      <div className="space-y-2">
        <p>Tailor {APP_NAME} to your preferences. Access a wide range of settings by clicking the gear icon in the header.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>**Profile:** Set display name and photo URL for the leaderboard.</li>
          <li>**Pomodoro:** Adjust work, short/long break durations, and long break interval.</li>
          <li>**Appearance:** Choose light, dark, or system theme. Set custom background colors or select from sample images. Enable/disable animated background effects.</li>
          <li>**Animation:** Select timer animation style and speed.</li>
          <li>**Sound:** Enable/disable sound notifications, choose notification sound, adjust volume.</li>
          <li>**Other Notifications & Integrations:** Enable/disable browser notifications.</li>
          <li>**AI Personalization:** Provide your role and current project to help the AI Task Assistant generate more relevant sub-tasks.</li>
          <li>**Lifespan:** Configure DOB, expected lifespan, and daily time allocations.</li>
          <li>**Additional Features:** Toggle display of inspirational quotes.</li>
          <li>**Data Management:** Export or import your settings. Log out.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'focus-music',
    title: 'Focus Music Player',
    icon: Music,
    category: 'current',
    status: 'active',
    keywords: ['music', 'spotify', 'focus', 'playlist', 'background', 'sound'],
    content: <p>Enhance your focus sessions with a curated Spotify playlist embedded directly in the Pomodoro timer page. Expand the "Focus Music Player" section to access it.</p>,
  },
  {
    id: 'adaptive-timer',
    title: 'Adaptive Timer Intervals',
    icon: SlidersHorizontal,
    category: 'current',
    status: 'active',
    keywords: ['adaptive', 'timer', 'smart', 'ai', 'duration', 'estimate'],
    content: (
      <div className="space-y-2">
        <p>When enabled in Settings, work session durations can automatically adjust based on the selected task's estimated time (if set in the Planner) or an AI-generated estimate for new tasks.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Helps align focus sessions with the perceived effort of specific tasks.</li>
          <li>If no estimate is available for a selected task, the AI attempts to suggest a duration.</li>
          <li>Can be overridden by manually selecting a predefined duration from the timer display popover.</li>
        </ul>
      </div>
    )
  },
   {
    id: 'focus-dna-logging',
    title: 'Focus DNA (Session Logging)',
    icon: BrainCircuit,
    category: 'current',
    status: 'beta',
    keywords: ['focus', 'dna', 'rating', 'log', 'analysis', 'insights', 'productivity'],
    content: (
        <div className="space-y-2">
            <p>After completing a work session (if signed in), you'll be prompted to rate your focus level. This data is logged and used to build your "Focus DNA" report.</p>
            <ul className="list-disc pl-5 space-y-1">
            <li>Logged sessions are viewable on the Focus DNA page.</li>
            <li>The current report generation offers basic insights.</li>
            <li>More advanced analysis and personalized recommendations are planned for the "Coming Soon" phase.</li>
            </ul>
        </div>
    ),
    relatedPages: [{ title: 'View Focus DNA Page', href: '/focus-dna' }]
  },
  {
    id: 'focus-sanctuary-basic',
    title: 'Focus Sanctuary (Basic Visualization)',
    icon: Orbit,
    category: 'current',
    status: 'beta',
    keywords: ['focus', 'sanctuary', '3d', 'visualization', 'tasks', 'achievements'],
    content: (
        <div className="space-y-2">
            <p>An experimental 3D space to visualize your active tasks as orbiting satellites and completed tasks as stars in a starfield.</p>
            <ul className="list-disc pl-5 space-y-1">
            <li>Currently offers a passive visualization.</li>
            <li>The number of stars grows with your completed tasks from the Planner.</li>
            <li>Active tasks from your Planner Inbox and Today's Plan are shown as satellites.</li>
            <li>Further interactivity and goal completion effects are "Coming Soon".</li>
            </ul>
        </div>
    ),
    relatedPages: [{ title: 'Visit Focus Sanctuary', href: '/focus-sanctuary' }]
  },
  {
    id: 'modular-task-planner',
    title: 'Modular Task Planner',
    icon: CalendarDays,
    category: 'current',
    status: 'active',
    keywords: ['planner', 'advanced', 'tasks', 'timebox', 'daily', 'inbox', 'labels', 'subtasks', 'grid'],
    content: (
      <div className="space-y-2">
        <p>A flexible, grid-based interface for more detailed task planning and organization, accessible for logged-in users.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>**Task Inbox:** A brain dump area for all your tasks.</li>
          <li>**Daily Planner:** A horizontally scrollable view of tasks assigned to specific days.</li>
          <li>**Timebox View:** A vertical timeline to drag and drop tasks for specific times on a selected day.</li>
          <li>**Drag & Drop:** Move tasks between inbox, days, and time slots.</li>
          <li>**Task Details:** Add descriptions, estimated times (predefined or custom), labels, and subtasks.</li>
          <li>**Customizable Layout:** Resize and rearrange panels (Task Inbox, Daily Planner, Timebox) to fit your workflow (layout saved per user). Panel expansion for focused view.</li>
          <li>**Label Management:** Create and assign color-coded labels to tasks.</li>
          <li>**AI Day Optimization:** (Beta) Uses your Focus DNA (if available) to suggest an optimal order for tasks on a selected day.</li>
          <li>**Carry Over Tasks:** Move uncompleted tasks from yesterday to today.</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'Go to Planner', href: '/planner' }]
  },

  // Coming Soon & In Development
  {
    id: 'start-my-day',
    title: 'Start My Day Audio Briefing',
    icon: RadioTower,
    category: 'upcoming',
    status: 'development',
    keywords: ['audio', 'briefing', 'morning', 'summary', 'tts', 'voice', 'tasks', 'quote'],
    content: (
      <div className="space-y-2">
        <p>Begin your day with a personalized audio summary, including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>A friendly greeting.</li>
          <li>The current date and a placeholder for weather information.</li>
          <li>A recap of 1-2 key tasks completed the previous day.</li>
          <li>A highlight of 1-2 main tasks for the current day.</li>
          <li>An inspirational or productivity-focused quote.</li>
          <li>Text-to-Speech (TTS) playback of the briefing.</li>
          <li>Option to select preferred voice type.</li>
        </ul>
        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center"><AlertTriangle className="h-4 w-4 mr-2"/>This feature is currently under development and disabled. The UI on the <Link href="/start-my-day" className="text-primary hover:underline">Start My Day page</Link> is a placeholder.</p>
      </div>
    ),
    relatedPages: [{ title: 'View Start My Day Page (Placeholder)', href: '/start-my-day' }]
  },
  {
    id: 'google-calendar-overlay',
    title: 'Google Calendar Overlay in Timebox',
    icon: CalendarDays,
    category: 'upcoming',
    status: 'disabled',
    keywords: ['google', 'calendar', 'integration', 'overlay', 'timebox', 'schedule', 'events'],
    content: (
      <div className="space-y-2">
        <p>Visualize your Google Calendar events directly within the Timebox view of the Modular Task Planner. This will help you see your existing commitments alongside your planned tasks.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Requires linking your Google Calendar account (OAuth).</li>
          <li>Events from your primary Google Calendar for the selected day will be displayed as non-interactive blocks in the Timebox.</li>
          <li>Helps avoid scheduling conflicts and provides a holistic view of your day.</li>
        </ul>
        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center"><AlertTriangle className="h-4 w-4 mr-2"/>This feature is temporarily disabled due to configuration requirements with Google Cloud Platform. It will be re-evaluated for a future release.</p>
      </div>
    )
  },
  {
    id: 'focus-sanctuary-enhanced',
    title: 'Focus Sanctuary - Enhanced Interactivity',
    icon: Orbit,
    category: 'upcoming',
    status: 'development',
    keywords: ['focus', 'sanctuary', '3d', 'interactive', 'goals', 'completion', 'rewards'],
    content: (
      <div className="space-y-2">
        <p>The Focus Sanctuary will evolve from a passive visualization into a more interactive and rewarding experience.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click on task satellites to view details or mark as complete directly from the 3D view.</li>
          <li>Visual effects upon task completion (e.g., satellite transforming into a brighter star).</li>
          <li>Potential for "focus energy" accumulation that influences the orb's appearance.</li>
          <li>More dynamic camera controls and exploration options.</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'Visit Focus Sanctuary', href: '/focus-sanctuary' }]
  },
  {
    id: 'focus-dna-advanced',
    title: 'Focus DNA - Advanced Insights',
    icon: BrainCircuit,
    category: 'upcoming',
    status: 'development',
    keywords: ['focus', 'dna', 'advanced', 'analysis', 'patterns', 'recommendations', 'personalized'],
    content: (
      <div className="space-y-2">
        <p>Beyond basic logging, the Focus DNA feature will provide deeper, AI-driven analysis of your focus patterns.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Identification of your peak productivity times.</li>
          <li>Analysis of optimal Pomodoro session lengths for different types of tasks.</li>
          <li>Insights into how task linkage or context switching impacts your focus.</li>
          <li>More personalized and actionable recommendations to improve focus and productivity.</li>
          <li>Data visualizations within the Focus DNA report.</li>
        </ul>
      </div>
    ),
    relatedPages: [{ title: 'View Focus DNA Page', href: '/focus-dna' }]
  },

  // FAQs
  {
    id: 'faq-save-settings',
    title: 'How do I save my settings?',
    icon: HelpCircle,
    category: 'faq',
    keywords: ['settings', 'save', 'profile', 'account', 'local storage'],
    content: (
      <div className="space-y-2">
        <p>If you are signed in, your settings (Pomodoro durations, theme, background, etc.) are automatically saved to your user profile in the cloud whenever you make a change in the Settings modal. They will sync across devices where you sign in.</p>
        <p>If you are not signed in (using the app as a guest), settings are saved locally in your browser's local storage. These settings will persist on that specific browser but won't be available on other devices or if you clear your browser data.</p>
      </div>
    )
  },
  {
    id: 'faq-pomodoro-coins',
    title: 'How are Pomodoro coins calculated?',
    icon: HelpCircle,
    category: 'faq',
    keywords: ['coins', 'gold', 'silver', 'leaderboard', 'rewards', 'pomodoro'],
    content: <p>For each successfully completed Pomodoro work session (not breaks), you earn a random amount of Gold Coins (currently between 8-12) and a fixed amount of Silver Coins (currently 5). These coins contribute to your ranking on the Leaderboard. This feature requires you to be signed in.</p>,
  },
  {
    id: 'faq-start-my-day-disabled',
    title: 'Why is the "Start My Day" briefing not working or showing as unavailable?',
    icon: HelpCircle,
    category: 'faq',
    keywords: ['start my day', 'audio briefing', 'disabled', 'coming soon', 'feature'],
    content: <p>The "Start My Day" audio briefing feature is currently under development and has been temporarily disabled in the main interface. We are working on enhancing its capabilities and reliability. Please check the "Coming Soon" section on this page for updates on its status. The page at <Link href="/start-my-day" className="text-primary hover:underline">/start-my-day</Link> is a placeholder for now.</p>,
  },
  {
    id: 'faq-calendar-overlay-disabled',
    title: 'Why is the Google Calendar Overlay feature disabled?',
    icon: HelpCircle,
    category: 'faq',
    keywords: ['google calendar', 'overlay', 'integration', 'disabled', 'coming soon', 'planner'],
    content: <p>The Google Calendar Overlay for the Modular Task Planner is temporarily disabled. This feature requires specific configurations with Google Cloud Platform services that are being re-evaluated for stability and user experience. We plan to reintroduce this or a similar calendar integration feature in a future update. See the "Coming Soon" section for more details.</p>,
  },
  {
    id: 'faq-feedback',
    title: 'How can I suggest a feature or report a bug?',
    icon: HelpCircle,
    category: 'faq',
    keywords: ['feedback', 'support', 'bug', 'feature request', 'contact'],
    content: <p>We'd love to hear from you! Please use the <Link href="/feedback" className="text-primary hover:underline">Support & Feedback page</Link> to submit bug reports, suggest new features, ask questions, or provide general feedback about {APP_NAME}.</p>,
    relatedPages: [{ title: 'Go to Feedback Page', href: '/feedback' }]
  },
  {
    id: 'faq-privacy',
    title: 'Is my data private and secure?',
    icon: HelpCircle,
    category: 'faq',
    keywords: ['privacy', 'security', 'data', 'firebase', 'google'],
    content: <p>We take your privacy seriously. For logged-in users, data like tasks and settings are stored securely using Firebase services. AI processing of task descriptions for breakdown is handled by Google's Generative AI models, and we strive to minimize data sent. For detailed information, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.</p>,
    relatedPages: [
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' }
    ]
  },
  {
    id: 'faq-adaptive-timer',
    title: 'How does the Adaptive Timer work?',
    icon: HelpCircle,
    category: 'faq',
    keywords: ['adaptive timer', 'smart timer', 'ai duration', 'task estimate'],
    content: (
      <div className="space-y-2">
        <p>When "Enable Adaptive Timer Intervals" is turned on in Settings:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>If you select a task from your Planner that has an "Estimated Time" set, the Pomodoro work duration will automatically adjust to that estimate.</li>
          <li>If you type in a new "quick task" or select a task without an estimate, the AI Task Assistant will attempt to estimate a suitable Pomodoro duration based on the task title.</li>
          <li>This helps in dedicating appropriate focus time for tasks of varying complexities.</li>
          <li>You can always manually override the work duration for the current session using the popover on the timer display.</li>
        </ul>
      </div>
    )
  },
];


export default function FeaturesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>(undefined);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { userSettings, setUserSettings } = useAuth();
  const currentEffectiveSettings = userSettings || DEFAULT_SETTINGS;

  useEffect(() => {
    document.title = `Features & Roadmap | ${APP_NAME}`;
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return featuresAndFaqs;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return featuresAndFaqs.filter(item =>
      item.title.toLowerCase().includes(lowerSearchTerm) ||
      (typeof item.content === 'string' && item.content.toLowerCase().includes(lowerSearchTerm)) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearchTerm))
    );
  }, [searchTerm]);

  const groupedItems = useMemo(() => {
    return {
      current: filteredItems.filter(item => item.category === 'current'),
      upcoming: filteredItems.filter(item => item.category === 'upcoming'),
      faq: filteredItems.filter(item => item.category === 'faq'),
    };
  }, [filteredItems]);

  const handleSaveSettings = (newSettings: UserSettings, wasUserChange?: boolean) => {
    setUserSettings(newSettings);
    // Toast for settings save is handled within SettingsModal if wasUserChange is true
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
        <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-12">
            <Lightbulb className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
              Explore {APP_NAME}
            </h1>
            <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover current features, see what's on the horizon, and find answers to common questions.
            </p>
          </div>

          <div className="mb-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search features or FAQs (e.g., AI, timer, privacy)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input text-input-foreground rounded-lg"
                aria-label="Search features and FAQs"
              />
            </div>
          </div>

          {Object.entries(groupedItems).map(([categoryKey, items]) => {
            if (items.length === 0 && searchTerm.trim()) return null; // Hide empty categories when searching

            const categoryInfo = {
              current: { title: "Current Features", icon: Sparkles, description: `Core functionalities available in ${APP_NAME} right now.` },
              upcoming: { title: "Coming Soon & In Development", icon: Rocket, description: "Exciting new features and enhancements we're working on." },
              faq: { title: "Frequently Asked Questions", icon: HelpCircle, description: `Answers to common questions about ${APP_NAME}.` },
            }[categoryKey as 'current' | 'upcoming' | 'faq'];

            if (!categoryInfo) return null;
            const CategoryIcon = categoryInfo.icon;

            return (
              <section key={categoryKey} className="mb-12" id={categoryKey.replace(/\s+/g, '-').toLowerCase()}>
                <Card className="bg-card/80 shadow-xl border-border">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-headline text-primary flex items-center">
                      <CategoryIcon className="mr-3 h-7 w-7" />
                      {categoryInfo.title}
                    </CardTitle>
                    {categoryInfo.description && <CardDescription className="text-muted-foreground">{categoryInfo.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 && !searchTerm.trim() ? (
                       <p className="text-muted-foreground">No items in this category yet.</p>
                    ): items.length === 0 && searchTerm.trim() ? (
                        <p className="text-muted-foreground text-center py-4">No results found for "{searchTerm}" in this section.</p>
                    ) : (
                      <Accordion
                        type="single"
                        collapsible
                        value={activeAccordionItem}
                        onValueChange={setActiveAccordionItem}
                        className="w-full space-y-3"
                      >
                        {items.map(item => {
                          const ItemIcon = item.icon;
                          return (
                            <AccordionItem key={item.id} value={item.id} className="border border-border/50 rounded-lg bg-background/30 hover:bg-muted/10 transition-colors">
                              <AccordionTrigger className="px-4 py-3 text-left hover:no-underline text-base">
                                <div className="flex items-center gap-3">
                                  <ItemIcon className="h-5 w-5 text-accent flex-shrink-0" />
                                  <span className="flex-grow text-foreground">{item.title}</span>
                                  {item.status && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium
                                      ${item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' :
                                        item.status === 'beta' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300' :
                                        item.status === 'development' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' :
                                        item.status === 'disabled' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' :
                                        'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300'}`}>
                                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                    </span>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 pt-1 text-sm text-foreground/80 prose prose-sm dark:prose-invert max-w-none">
                                {item.content}
                                {item.relatedPages && item.relatedPages.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-border/30">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Related Links:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.relatedPages.map(page => (
                                                <Button key={page.href} asChild variant="link" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                                                    <Link href={page.href}><ExternalLink className="h-3 w-3 mr-1"/>{page.title}</Link>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </section>
            );
          })}
           {filteredItems.length === 0 && searchTerm.trim() && (
              <div className="text-center py-10">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No features or FAQs match your search for "{searchTerm}".</p>
                <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2 text-primary">Clear search</Button>
              </div>
            )}
        </main>
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={currentEffectiveSettings}
          onSaveSettings={handleSaveSettings}
        />
      </div>
    </PageTransition>
  );
}

    