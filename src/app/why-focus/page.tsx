
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap, TrendingUp, Target } from "lucide-react";
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `The Power of Focus & Deep Work | ${APP_NAME}`,
  description: `Learn why focus is crucial in the modern world and how ${APP_NAME}, your AI Powered Pomodoro Timer, helps you achieve deep work, reduce distractions, and boost productivity.`,
};

export default function WhyFocusPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="text-center">
          <Brain className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">
            Unlock Your Superpower: The Art of Focus with an AI Timer
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            In a world brimming with distractions, the ability to concentrate is more valuable than ever. {APP_NAME} helps you harness it.
          </p>
        </header>

        <Card className="bg-card/80 shadow-xl border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" /> The Challenge: A Distracted World
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground/90">
            <p>
              We live in an era of unprecedented information flow. Notifications ping, feeds scroll endlessly, and the pressure to multitask is immense. This constant barrage fragments our attention, making deep, meaningful work increasingly difficult.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Information Overload:</strong> The sheer volume of data we encounter daily can be overwhelming, leading to mental fatigue.
              </li>
              <li>
                <strong>Digital Distractions:</strong> Social media, emails, and instant messages create a cycle of interruptions.
              </li>
              <li>
                <strong>The Myth of Multitasking:</strong> Trying to do too many things at once often means doing none of them well. Research indicates multitasking can slash productivity by up to <strong className="text-accent">40%</strong>.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/80 shadow-xl border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" /> The Power of Focused Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground/90">
            <p>
              Cultivating focus is not just about getting more done; it's about enhancing the quality of your work, your learning, and your overall well-being. {APP_NAME}, an AI Powered Pomodoro Timer, is designed to help you harness this power.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Deep Work:</strong> Achieve a state of 'flow' where you're fully immersed and performing at your peak.
              </li>
              <li>
                <strong>Higher Quality Output:</strong> Concentrated effort leads to more thoughtful, creative, and error-free results.
              </li>
              <li>
                <strong>Reduced Stress:</strong> Tackling tasks one by one with clear focus diminishes feelings of being overwhelmed.
              </li>
              <li>
                <strong>Improved Learning & Memory:</strong> Focused attention is crucial for absorbing and retaining new information.
              </li>
              <li>
                <strong>Sense of Accomplishment:</strong> Completing tasks with intention brings greater satisfaction.
              </li>
            </ul>
            <p className="pt-2">
              Studies suggest it can take over <strong className="text-accent">20 minutes</strong> to regain deep concentration after a significant interruption. Techniques like the Pomodoro method, which {APP_NAME} champions with AI enhancements, provide a structured approach to minimize these costly context switches.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/80 shadow-xl border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" /> How {APP_NAME} Helps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground/90">
            <p>
              {APP_NAME} provides tools and a framework, enhanced by AI, to help you reclaim your attention and make the most of your precious time:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Structured Time Management:</strong> The Pomodoro timer encourages dedicated focus intervals followed by restorative breaks.
              </li>
              <li>
                <strong>Mindful Task Breakdown with AI:</strong> AI-assisted task management helps you deconstruct large goals into achievable steps.
              </li>
              <li>
                <strong>Lifespan Perspective:</strong> Visualizing your time (accessible via the footer link) encourages a more intentional approach to how you spend it.
              </li>
              <li>
                <strong>Reduced Distractions:</strong> By committing to a focus session with our AI Pomodoro timer, you consciously set aside potential interruptions.
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center pt-6">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/">Start Focusing with {APP_NAME}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
