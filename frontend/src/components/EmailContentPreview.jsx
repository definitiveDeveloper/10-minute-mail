import React from "react";

export default function EmailContentPreview({ email }) {
  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-6">
        <p className="text-center">Select an email from the list to view its content here.</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold mb-2 text-foreground">{email.subject}</h2>
        <div className="text-sm text-muted-foreground">
          <p><span className="font-medium">From:</span> {email.from}</p>
          <p><span className="font-medium">To:</span> {email.to}</p>
          <p><span className="font-medium">Date:</span> {new Date(email.date).toLocaleString()}</p>
        </div>
      </div>
      <div className="prose prose-sm sm:prose-base max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
        {email.content}
      </div>
    </div>
  );
}