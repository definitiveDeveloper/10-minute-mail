import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EmailDisplay({ email, onGenerateNew }) {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast({
        title: "Email copied!",
        description: "The email address has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mx-auto">
      <div className="relative flex-1 bg-muted rounded-lg p-4 font-mono text-sm">
        <div className="pr-10 overflow-x-auto whitespace-nowrap">
          {email}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={copyToClipboard}
          aria-label="Copy email address"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <Button
        variant="outline"
        className="gap-2 text-primary hover:text-primary border-primary/30 hover:bg-primary/10"
        onClick={onGenerateNew}
      >
        <RefreshCw className="h-4 w-4" />
        New Email
      </Button>
    </div>
  );
}