import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Check } from "lucide-react";  // Import Check icon
import { useToast } from "@/components/ui/use-toast";

export default function EmailBox({ email, onRefresh }) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);  // State to track if the email is copied

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setIsCopied(true);  // Set copied status to true
      toast({
        title: "Email copied!",
        description: "The email address has been copied to your clipboard.",
      });

      // Reset the icon back to clipboard after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);  // Reset after 3 seconds
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full max-w-2xl mx-auto">
      <div className="relative flex-1 bg-muted rounded-lg p-4 font-poppins text-sm border border-primaryPurple bg-primaryBackground">
        <div className="pr-10 overflow-x-auto whitespace-nowrap text-base">
          {email}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={copyToClipboard}
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />  // Show Check mark when copied
          ) : (
            <Copy className="h-4 w-4" />  // Show Clipboard icon by default
          )}
        </Button>
      </div>
      <Button
        variant="purpleOutline"
        className="gap-2"
        onClick={onRefresh}
      >
        <RefreshCw className="h-4 w-4" />
        New Email
      </Button>
    </div>
  );
}
