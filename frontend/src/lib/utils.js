import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getGenderFromName(name) {
  const maleNames = ['James', 'Alex', 'Alexander', 'John', 'William', 'David'];
  const femaleNames = ['Lisa', 'Emma', 'Sarah', 'Emily', 'Anna', 'Mary'];
  
  const firstName = name.split(' ')[0];
  
  if (maleNames.includes(firstName)) return 'male';
  if (femaleNames.includes(firstName)) return 'female';
  
  return 'male'; // default fallback
}

export function getAvatarFallbackUrl(name) {
  const gender = getGenderFromName(name);
  return gender === 'male' 
    ? "https://images.unsplash.com/photo-1566492031773-4f4e44671857"  // Male placeholder
    : "https://images.unsplash.com/photo-1544005313-94ddf0286df2";     // Female placeholder
}
