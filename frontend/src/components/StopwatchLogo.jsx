import React from 'react';
import { Zap } from 'lucide-react'; 

export default function StopwatchLogo({ className }) {
  return (
    <div className={`flex items-center gap-2 text-foreground ${className}`}>
      <Zap className="h-7 w-7 text-primary" />
      <span className="font-bold text-xl tracking-tight">QuickMail</span>
    </div>
  );
}