
"use client";

import React from 'react';
import { Award, Medal } from 'lucide-react';

interface TimerStatsProps {
  pomodoroDots: JSX.Element[];
  totalCompletedPomodoros: number;
  goldCoins: number;
  silverCoins: number;
}

const TimerStats: React.FC<TimerStatsProps> = ({
  pomodoroDots,
  totalCompletedPomodoros,
  goldCoins,
  silverCoins,
}) => {
  return (
    <div className="text-center">
      <div className="flex justify-center my-2">{pomodoroDots}</div>
      <p className="text-sm text-muted-foreground">Total pomodoros this session: {totalCompletedPomodoros}</p>
      <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Award className="h-4 w-4 text-yellow-400" /> {goldCoins}</span>
        <span className="flex items-center gap-1"><Medal className="h-4 w-4 text-slate-400" /> {silverCoins}</span>
      </div>
    </div>
  );
};

export default TimerStats;
