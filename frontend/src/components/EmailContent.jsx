
import React from "react";
import { motion } from "framer-motion";

export default function EmailContent({ email }) {
  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select an email to view its content</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{email.subject}</h2>
        <div className="text-sm text-muted-foreground mb-2">
          <span>From: {email.from}</span>
          <span className="mx-2">•</span>
          <span>{new Date(email.date).toLocaleString()}</span>
        </div>
      </div>
      <div className="prose prose-invert max-w-none">
        {email.content}
      </div>
    </div>
  );
}
