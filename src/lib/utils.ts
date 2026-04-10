import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhbnp5dnljcWdjdmtxdHlwbnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjU5NjgsImV4cCI6MjA5MTE0MTk2OH0.XhhDNbaYI2w6VAPMkyO2f4akR8KUnDLansBMOvQPMbc';
