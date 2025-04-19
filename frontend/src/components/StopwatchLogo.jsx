
import React from "react";
import { Timer } from "lucide-react";

export default function StopwatchLogo({ className }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Timer className="w-6 h-6 text-primary" />
      <span className="font-bold">10 Minute Mail</span>
    </div>
  );
}
