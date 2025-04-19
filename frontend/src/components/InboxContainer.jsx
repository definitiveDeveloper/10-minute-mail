
import React from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

export default function InboxContainer() {
  return (
    <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] relative">
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Inbox className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Your inbox is empty</p>
        <p className="text-sm">New emails will appear here automatically</p>
      </div>
    </div>
  );
}
