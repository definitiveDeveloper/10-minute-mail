import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/context/I18nContext";

export default function EmailDisplay({ email }) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast({
        title: t('emailCopiedToastTitle'),
        description: t('emailCopiedToastDescription'),
      });
      setCopied(true);
    } catch (err) {
      toast({
        title: t('copyFailedToastTitle'),
        description: t('copyFailedToastDescription'),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div className="relative w-full bg-muted rounded-lg p-4 text-base font-sans border-2 border-primary">
      <div className="pr-12 overflow-x-auto whitespace-nowrap font-medium" style={{fontFamily: "'Poppins', sans-serif"}}>
        {email || t('generatingEmail')}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent hover:bg-accent focus:bg-accent"
        onClick={copyToClipboard}
        aria-label={t('copyEmailAriaLabel')}
        disabled={!email}
      >
        {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
      </Button>
    </div>
  );
}