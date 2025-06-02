import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import EmailList from "./EmailList";
import EmailContentPreview from "./EmailContentPreview";
import { useToast } from "@/components/ui/use-toast";

const ITEMS_PER_PAGE = 10;

const generateDummyEmails = (count, emailAddress) => Array.from({ length: count }, (_, i) => ({
  id: `${emailAddress}-${i + 1}-${Date.now()}`,
  from: `sender${i + 1}@example.com`,
  to: emailAddress,
  subject: `Test Email ${i + 1} for ${emailAddress.substring(0,5)}...`,
  content: `This is the content of email ${i + 1} for ${emailAddress}. It can contain a longer message with more details about the email. This is just a placeholder.`,
  date: new Date(Date.now() - Math.random() * 10000000000) 
}));


export default function InboxManager({ currentEmail }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentWidth, setContentWidth] = useState(50);
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmails = useCallback(async () => {
    if (!currentEmail) return;
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 750)); 
    
    const newEmails = generateDummyEmails(Math.floor(Math.random() * 5) + 1, currentEmail);
    setEmails(prevEmails => [...newEmails, ...prevEmails].sort((a, b) => b.date - a.date));
    
    setIsLoading(false);
    toast({
      title: "Inbox Refreshed",
      description: `New emails for ${currentEmail} loaded.`,
    });
  }, [currentEmail, toast]);

  useEffect(() => {
    setEmails([]); 
    setSelectedEmail(null);
    setCurrentPage(1);
    if (currentEmail) {
      fetchEmails(); 
    }
  }, [currentEmail, fetchEmails]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentEmail) {
        fetchEmails();
      }
    }, 10000); 
    return () => clearInterval(intervalId);
  }, [currentEmail, fetchEmails]);
  
  const totalPages = Math.ceil(emails.length / ITEMS_PER_PAGE);
  const currentDisplayEmails = emails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedEmail(null); 
  };

  if (emails.length === 0 && !isLoading) {
    return (
      <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] relative flex flex-col items-center justify-center text-muted-foreground">
        <Inbox className="w-16 h-16 mb-6 text-primary/50" />
        <p className="text-xl font-medium mb-2">Your inbox is empty</p>
        <p className="text-base text-center max-w-sm">Waiting for new emails at <span className="font-semibold text-foreground">{currentEmail}</span>. They will appear here automatically.</p>
      </div>
    );
  }
  
  if (isLoading && emails.length === 0) {
     return (
      <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] relative flex flex-col items-center justify-center text-muted-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mb-6"
        >
          <Inbox className="w-full h-full text-primary" />
        </motion.div>
        <p className="text-xl font-medium mb-2">Loading emails...</p>
        <p className="text-base">Checking for new messages for <span className="font-semibold text-foreground">{currentEmail}</span>.</p>
      </div>
    );
  }


  return (
    <div className="bg-muted/30 rounded-lg min-h-[400px] flex relative overflow-hidden">
      <motion.div 
        className="flex-1"
        animate={{ width: selectedEmail ? `${100 - contentWidth}%` : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-4 h-full flex flex-col">
          {isLoading && emails.length > 0 && (
            <div className="text-center py-2 text-sm text-primary">Refreshing...</div>
          )}
          <EmailList
            emails={currentDisplayEmails}
            onEmailSelect={setSelectedEmail}
            selectedEmailId={selectedEmail?.id}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            className="bg-background border-l border-border" 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${contentWidth}%`, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative h-full">
              <div
                className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.pageX;
                  const startWidthPct = contentWidth;

                  const handleMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.pageX - startX;
                    const containerTotalWidth = e.target.parentElement.parentElement.parentElement.offsetWidth;
                    const deltaWidthPct = (deltaX / containerTotalWidth) * 100;
                    
                    let newWidthPct = startWidthPct - deltaWidthPct;
                    newWidthPct = Math.max(30, Math.min(70, newWidthPct)); 
                    setContentWidth(newWidthPct);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              <EmailContentPreview email={selectedEmail} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}