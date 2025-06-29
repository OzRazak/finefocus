
"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Music } from 'lucide-react';

const FocusMusicPlayer: React.FC = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="spotify-player" className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg rounded-lg">
        <AccordionTrigger 
          data-testid="focus-music-trigger" // Added data-testid
          className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline hover:text-foreground/80"
        >
          <div className="flex items-center">
            <Music className="mr-2 h-5 w-5" /> Focus Music Player
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-4 pt-0">
          <div className="aspect-video_ spotify-embed-container rounded-lg overflow-hidden border border-border/30">
            <iframe
              style={{ borderRadius: "8px" }}
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0"
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Deep Focus Playlist"
            ></iframe>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Can't see the player? Ensure your browser doesn't block third-party content or try opening Spotify directly.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default FocusMusicPlayer;
