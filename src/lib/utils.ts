
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserSettings, LifespanMetrics, LifeAllocations } from "./types";
import { differenceInYears, differenceInMonths, addYears, format, parseISO } from 'date-fns';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function calculateLifespanMetrics(dob: string, expectedLifespan: number, allocations: LifeAllocations): LifespanMetrics {
  const birthDate = parseISO(dob);
  const currentDate = new Date();
  const deathDate = addYears(birthDate, expectedLifespan);

  const yearsLived = differenceInYears(currentDate, birthDate);
  const monthsLived = differenceInMonths(currentDate, birthDate);
  
  const yearsRemaining = Math.max(0, differenceInYears(deathDate, currentDate));
  const monthsRemaining = Math.max(0, differenceInMonths(deathDate, currentDate));
  
  const totalYears = expectedLifespan;
  const totalMonths = totalYears * 12;

  const percentageLived = totalYears > 0 ? (monthsLived / totalMonths) * 100 : 0;

  const hoursInYear = 365.25 * 24;
  const remainingYearsTotalHours = yearsRemaining * hoursInYear;
  
  const allocatedTimeInYears = {
    sleep: (allocations.sleep / 24) * yearsRemaining,
    work: (allocations.work / 24) * yearsRemaining,
    eating: (allocations.eating / 24) * yearsRemaining,
    exercise: (allocations.exercise / 24) * yearsRemaining,
    personalCare: (allocations.personalCare / 24) * yearsRemaining,
    commuting: (allocations.commuting / 24) * yearsRemaining,
    freeTime: 0,
  };

  const totalAllocatedHoursPerDay = Object.values(allocations).reduce((sum, h) => sum + h, 0);
  const freeTimeHoursPerDay = Math.max(0, 24 - totalAllocatedHoursPerDay);
  allocatedTimeInYears.freeTime = (freeTimeHoursPerDay / 24) * yearsRemaining;
  
  return {
    totalYears,
    yearsLived,
    yearsRemaining,
    monthsLived,
    monthsRemaining,
    totalMonths,
    percentageLived,
    allocatedTime: allocatedTimeInYears,
  };
}


export function requestNotificationPermission(): Promise<NotificationPermission> {
  return new Promise((resolve) => {
    if (!('Notification' in window)) {
      resolve('denied');
    } else if (Notification.permission === 'granted') {
      resolve('granted');
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        resolve(permission);
      });
    } else {
      resolve('denied');
    }
  });
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}

// Function to play a sound
export function playSound(soundUrl: string) {
  // Check if AudioContext is available for a more robust solution,
  // but for simplicity, a basic Audio element is used here.
  const audio = new Audio(soundUrl);
  audio.play().catch(error => console.warn("Audio play failed:", error));
}

// Format date for Google Calendar URL (YYYYMMDDTHHMMSSZ)
export function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
}

export function formatMinutesToHoursAndMinutes(totalMinutes: number): string {
  if (totalMinutes < 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}h`;
  }
  if (minutes > 0 || hours === 0) {
    if (hours > 0) result += " ";
    result += `${minutes}m`;
  }
  return result || "0m";
}
    
