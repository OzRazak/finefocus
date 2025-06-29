
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Quote } from '@/lib/types';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import quotesData from '@/data/quotes.json'; // Import directly from JSON

const QuoteCard: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const QUOTES: Quote[] = quotesData; // Assign imported data

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setCurrentQuote(QUOTES[randomIndex]);
  };

  useEffect(() => {
    getRandomQuote();
  }, []); // Empty dependency array means this runs once on mount, QUOTES is stable

  if (!currentQuote) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-primary/30 animate-pulse">
        <CardContent className="p-6">
          <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4 ml-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-lg border-primary/30">
      <CardContent className="p-6 relative">
        <blockquote className="text-lg md:text-xl font-body italic text-foreground/90">
          &ldquo;{currentQuote.text}&rdquo;
        </blockquote>
        {currentQuote.author && (
          <p className="text-right text-sm text-muted-foreground mt-3">- {currentQuote.author}</p>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={getRandomQuote} 
          className="absolute top-3 right-3 text-accent hover:text-accent/80 hover:bg-accent/10 rounded-full"
          aria-label="New Quote"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuoteCard;
