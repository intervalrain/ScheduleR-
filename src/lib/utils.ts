import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateSprintHealth(completedHours: number, consumedHours: number): number {
  if (consumedHours === 0) {
    return 100;
  }
  
  const healthPercentage = Math.max(0, Math.min(100, (completedHours / consumedHours) * 100));
  
  return Math.round(healthPercentage);
}
