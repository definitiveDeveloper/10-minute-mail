import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import EmailList from "./EmailList";
import EmailContentPreview from "./EmailContentPreview";
import { useI18n } from "@/context/I18nContext";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

const generateInitialDummyEmails = (count, emailAddress, t) => Array.from({ length: count }, (_, i) => ({
  id: `${emailAddress}-initial-${i + 1}-${Date.now()}`,
  from: `sender${i + 1}@example.com`,
  to: emailAddress,
  subject: t('welcomeEmailSubject', { number: i + 1, emailPrefix: emailAddress.substring(0,5) }),
  content: t('welcomeEmailContent', { number: i + 1, emailAddress }),
  date: new Date(Date.now() - (Math.random() * 50000 + 5000)) 
}));

const generateNewDummyEmail = (emailAddress, existingEmails, t) => {
  const newId = `${emailAddress}-new-${existingEmails.length + 1}-${Date.now()}`;
  return {
    id: newId,
    from: `new.sender${existingEmails.length + 1}@example.com`,
    to: emailAddress,
    subject: t('newEmailSubject', { number: existingEmails.length + 1 }),
    content: t('newEmailContent', { emailAddress }),
    date: new Date() 
  };
};


export default function InboxManager({ currentEmail }) {
  const { t } = useI18n();
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentWidth, setContentWidth] = useState(50); // Percentage
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const fetchEmails = useCallback(async (isInitialFetch = false) => {
    if (!currentEmail) return;
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 750)); 
    
    if (isInitialFetch) {
      const initialEmails = generateInitialDummyEmails(Math.floor(Math.random() * 2) + 1, currentEmail, t);
      setEmails(initialEmails.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      if (Math.random() < 0.3) { 
        const newEmail = generateNewDummyEmail(currentEmail, emails, t);
        setEmails(prevEmails => [newEmail, ...prevEmails].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50));
      }
    }
    
    setIsLoading(false);
  }, [currentEmail, emails, t]);

  useEffect(() => {
    setEmails([]); 
    setSelectedEmail(null);
    setCurrentPage(1);
    if (currentEmail) {
      fetchEmails(true); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmail]); 

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentEmail) {
        fetchEmails(false); 
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

  const handleMouseDownResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.pageX;
    const startWidthPct = contentWidth;
    const containerTotalWidth = e.target.parentElement.parentElement.parentElement.offsetWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const deltaWidthPct = (deltaX / containerTotalWidth) * 100;
      
      let newWidthPct = startWidthPct - deltaWidthPct; // Inverted because we are dragging left edge of right panel
      newWidthPct = Math.max(30, Math.min(70, newWidthPct)); 
      setContentWidth(newWidthPct);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  if (!currentEmail) {
     return (
      <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] relative flex flex-col items-center justify-center text-muted-foreground">
        <Inbox className="w-16 h-16 mb-6 text-primary/50" />
        <p className="text-xl font-medium mb-2">{t('inboxInitializingTitle')}</p>
        <p className="text-base text-center max-w-sm">{t('inboxInitializingDescription')}</p>
      </div>
    );
  }

  if (emails.length === 0 && !isLoading) {
    return (
      <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] relative flex flex-col items-center justify-center text-muted-foreground">
        <Inbox className="w-16 h-16 mb-6 text-primary/50" />
        <p className="text-xl font-medium mb-2">{t('inboxEmptyTitle')}</p>
        <p className="text-base text-center max-w-sm">{t('inboxEmptyDescription', { email: currentEmail })}</p>
      </div>
    );
  }
  
  if (isLoading && emails.length === 0) {
     return (
      <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] relative flex flex-col items-center justify-center text-muted-foreground">
        <Inbox className="w-16 h-16 mb-6 text-primary" />
        <p className="text-xl font-medium mb-2">{t('inboxLoadingTitle')}</p>
        <p className="text-base">{t('inboxLoadingDescription', { email: currentEmail })}</p>
      </div>
    );
  }

  const showPreviewPane = selectedEmail && window.innerWidth >= 768; // Only show side-by-side on md screens and up

  return (
    <div className={`bg-muted/30 rounded-lg min-h-[400px] flex ${showPreviewPane ? 'flex-row' : 'flex-col'} relative overflow-hidden`}>
      <motion.div 
        className="flex-1 overflow-hidden" 
        animate={{ 
          width: showPreviewPane ? `${100 - contentWidth}%` : "100%",
          height: !showPreviewPane && selectedEmail ? "0%" : "100%" 
        }}
        style={{ display: !showPreviewPane && selectedEmail ? 'none' : 'flex', flexDirection: 'column' }} // Hide list on mobile when preview is active
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-2 sm:p-4 h-full flex flex-col">
          {isLoading && emails.length > 0 && (
            <div className="text-center py-2 text-sm text-primary">{t('inboxRefreshing')}...</div>
          )}
          <EmailList
            emails={currentDisplayEmails}
            onEmailSelect={(email) => {
              setSelectedEmail(email);
            }}
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
            className={`bg-background ${showPreviewPane ? 'border-l border-border' : 'w-full h-full absolute top-0 left-0 z-20'}`}
            initial={{ 
              width: showPreviewPane ? 0 : "100%", 
              height: "100%",
              opacity: 0 
            }}
            animate={{ 
              width: showPreviewPane ? `${contentWidth}%` : "100%",
              height: "100%",
              opacity: 1 
            }}
            exit={{ 
              width: showPreviewPane ? 0 : "100%", 
              opacity: 0 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative h-full">
              {showPreviewPane && (
                <div
                  className={`absolute left-0 top-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors z-30 ${isResizing ? 'bg-primary/20' : ''}`}
                  onMouseDown={handleMouseDownResize}
                />
              )}
               <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`absolute top-2 right-2 z-30 ${showPreviewPane ? 'hidden' : 'md:hidden'} bg-background hover:bg-muted`} 
                  onClick={() => setSelectedEmail(null)}
                >
                  {t('emailContentClose')}
                </Button>
              <EmailContentPreview email={selectedEmail} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}