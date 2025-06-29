
"use client"
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';
import { Timer, Brain, BarChart3, TrendingUp, Users, Palette, Trophy, Zap, Target, SlidersHorizontal, ListChecks, CalendarHeart } from 'lucide-react';
import PageTransition from '@/components/ui/animations/PageTransition';
import { useEffect } from 'react';
import ScrollToView from '@/components/ui/animations/ScrollToView';
import { motion } from 'framer-motion';
import AnimatedButton from '@/components/ui/animations/AnimatedButton';


const FeatureCard = ({ icon: Icon, title, description, imageSrc, imageAlt, imageHint, reverse = false }: { icon: React.ElementType, title: string, description: string, imageSrc: string, imageAlt: string, imageHint: string, reverse?: boolean }) => (
  <ScrollToView>
    <motion.div
      whileHover={{ scale: 1.02, y: -5, boxShadow: "0px 20px 30px -10px rgba(0,0,0,0.2)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`container mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center py-12 md:py-16 bg-card/40 p-8 rounded-2xl border border-border/20 ${reverse ? 'md:grid-flow-col-dense' : ''}`}>
      <div className={`space-y-4 ${reverse ? 'md:col-start-2' : ''}`}>
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-headline font-semibold text-foreground">{title}</h2>
        <p className="text-lg text-foreground/80 leading-relaxed">
          {description}
        </p>
      </div>
      <div className={`mt-8 md:mt-0 rounded-lg overflow-hidden shadow-2xl ${reverse ? 'md:col-start-1' : ''}`}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={600}
          height={400}
          className="object-cover w-full h-auto"
          data-ai-hint={imageHint}
        />
      </div>
    </motion.div>
  </ScrollToView>
);


export default function OverviewPage() {
    useEffect(() => {
        document.title = `App Features & Overview | ${APP_NAME} AI Pomodoro Timer`;
        // Meta description for client components is ideally set via server-side rendering or a general one in RootLayout.
        // For client-only, you might update it here if necessary, but Next.js prefers metadata object for server components.
        // Example: document.querySelector('meta[name="description"]')?.setAttribute("content", "New description...");
    }, [])
  return (
    <PageTransition>
    <main className="text-foreground">
      {/* Hero Section */}
      <section className="relative text-center py-20 md:py-32 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden">
        <div className="absolute inset-0 opacity-10 SvgBackground">
            {/* Simple SVG background pattern */}
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#smallGrid)" />
            </svg>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Zap className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="text-4xl md:text-6xl font-headline font-extrabold text-foreground mb-6">
            Master Your Focus with AI. Achieve Your Goals.
          </h1>
          <p className="text-xl md:text-2xl text-accent max-w-3xl mx-auto mb-10">
            {APP_NAME} combines proven productivity techniques with smart AI to help you conquer distractions, manage your time effectively, and make every moment count using an AI Powered Pomodoro Timer.
          </p>
          <AnimatedButton asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/">Get Started with {APP_NAME}</Link>
          </AnimatedButton>
        </div>
      </section>

      {/* What is AuxoFocus? */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto text-center max-w-3xl px-4">
          <Brain className="mx-auto h-12 w-12 text-primary mb-4" />
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-6">
            What is {APP_NAME}?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {APP_NAME} is more than just a timer; it's your personal AI productivity co-pilot. We integrate the renowned Pomodoro Technique with intelligent AI task management and insightful visualizations. Whether you're studying, working on a complex project, or simply trying to build better habits, {APP_NAME} provides the tools you need to stay on track and achieve deep work.
          </p>
        </div>
      </section>

      {/* Features */}
      <div className="space-y-12 md:space-y-0">
        <FeatureCard
          icon={Timer}
          title="The Pomodoro Powerhouse"
          description={`Harness the classic Pomodoro Technique with our customizable AI timer. Work in focused sprints, take effective breaks, and maintain peak concentration. ${APP_NAME} helps you build a rhythm for sustained productivity.`}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt={`Interface of the ${APP_NAME} AI Pomodoro Timer`}
          imageHint="pomodoro interface"
        />

        <FeatureCard
          icon={ListChecks}
          title="AI-Powered Task Management"
          description={`Overwhelmed by large projects? Describe your goal, and let our AI break it down into manageable, Pomodoro-sized sub-tasks. Seamlessly add these to your focus list and conquer your to-dos one step at a time with our smart AI assistant.`}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt={`Example of AI task breakdown in ${APP_NAME}`}
          imageHint="ai tasklist"
          reverse={true}
        />

        <FeatureCard
          icon={CalendarHeart}
          title="Visualize Your Finite Time"
          description={`Gain a profound perspective on your most valuable resource: time. Our Lifespan Visualizer helps you understand how you allocate your days and encourages a more intentional approach to living.`}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt={`Lifespan Visualization chart from ${APP_NAME}`}
          imageHint="lifespan chart"
        />

        <FeatureCard
          icon={BarChart3}
          title="Insightful Productivity Stats"
          description={`Track your progress and gain valuable insights into your work patterns. See your daily, weekly, and monthly task completions, and build motivating streaks. Understand your achievements and identify areas for growth with ${APP_NAME}.`}
          imageSrc="https://placehold.co/600x400.png"
          imageAlt={`Productivity statistics dashboard in ${APP_NAME}`}
          imageHint="stats dashboard"
          reverse={true}
        />

        <FeatureCard
          icon={SlidersHorizontal}
          title="Personalize Your Experience"
          description={`Tailor ${APP_NAME} to your unique workflow. Customize timer durations, notification preferences, background aesthetics, and more. Make our AI Pomodoro app truly yours for an optimal focus environment.`}
          imageSrc="https://images.unsplash.com/photo-1603808283650-173a39f7ced8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxwZXJzb25hbGlzZXxlbnwwfHx8fDE3NDk0ODE0Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt={`Customization settings interface for ${APP_NAME} AI Pomodoro Timer`}
          imageHint="app settings" 
        />

        <FeatureCard
          icon={Trophy}
          title="Gamified Focus with Leaderboards"
          description={`Stay motivated by earning coins for completed Pomodoro sessions and climbing the leaderboard. Compete with others or challenge yourself to reach new heights of productivity.`}
          imageSrc="https://images.unsplash.com/photo-1553481187-be93c21490a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxnYW1lfGVufDB8fHx8MTc0OTQ4MTQ5MHww&ixlib=rb-4.1.0&q=80&w=1080"
          alt={`Leaderboard showing user rankings and coins in ${APP_NAME}`}
          imageHint="gamified leaderboard"
          reverse={true}
        />
      </div>

      {/* Why AuxoFocus? */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto text-center max-w-3xl px-4">
          <Target className="mx-auto h-12 w-12 text-primary mb-4" />
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-6">
            Why Choose {APP_NAME}?
          </h2>
          <div className="space-y-6 text-lg text-foreground/80 leading-relaxed">
            <p>
              In a world saturated with distractions, {APP_NAME} is your sanctuary for focus. We believe that true productivity isn't about working harder, but smarter, with the help of AI.
            </p>
            <p>
              Our app is designed with a deep understanding of cognitive science and productivity principles. By combining time-tested techniques like Pomodoro with modern AI and a user-centric design, we empower you to:
            </p>
            <ul className="list-disc list-inside text-left max-w-xl mx-auto space-y-2">
              <li><strong className="text-primary">Minimize Distractions:</strong> Create an environment conducive to deep work.</li>
              <li><strong className="text-primary">Improve Time Management:</strong> Make conscious decisions about how you spend your time with our AI timer.</li>
              <li><strong className="text-primary">Enhance Concentration:</strong> Train your focus muscle for longer, more productive sessions.</li>
              <li><strong className="text-primary">Reduce Overwhelm:</strong> Break down daunting tasks into achievable steps with AI assistance.</li>
              <li><strong className="text-primary">Build Consistency:</strong> Develop sustainable habits for long-term success.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 md:py-32 text-center bg-gradient-to-tr from-primary/5 via-transparent to-transparent">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-8">
            Ready to Transform Your Productivity with an AI Pomodoro Timer?
          </h2>
          <AnimatedButton asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/">Start Focusing with {APP_NAME} Today</Link>
          </AnimatedButton>
        </div>
      </section>
    </main>
    </PageTransition>
  );
}
