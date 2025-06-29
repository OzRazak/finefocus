
"use client";

import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { Brain, CalendarHeart, MessageCircleQuestion, FileText, Shield, Info, BrainCircuit, Lightbulb, Menu } from 'lucide-react';

const FooterComponent = () => {
  return (
    <footer className="py-10 border-t border-border/50 bg-card text-muted-foreground">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8 text-sm">
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-md">App</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="hover:text-primary transition-colors">Home / Pomodoro</Link>
              <Link href="/overview" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Info className="h-4 w-4 opacity-80" /> App Overview
              </Link>
              <Link href="/lifespan" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <CalendarHeart className="h-4 w-4 opacity-80" /> Lifespan Visualizer
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-md">Resources</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/features" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 opacity-80" /> Features & Roadmap
              </Link>
              <Link href="/why-focus" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Brain className="h-4 w-4 opacity-80" /> Why Focus?
              </Link>
              <Link href="/focus-dna" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4 opacity-80" /> Focus DNA (Beta)
              </Link>
              <Link href="/feedback" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <MessageCircleQuestion className="h-4 w-4 opacity-80" /> Support & Feedback
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-md">Legal</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/terms" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <FileText className="h-4 w-4 opacity-80" /> Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Shield className="h-4 w-4 opacity-80" /> Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
        <div className="text-center text-xs border-t border-border/30 pt-6">
          <p>
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved. Built by OzGPT.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;

