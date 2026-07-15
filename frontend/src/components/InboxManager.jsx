import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, RefreshCw } from "lucide-react";
import EmailList from "./EmailList";
import EmailContentPreview from "./EmailContentPreview";
import { useI18n } from "@/context/I18nContext";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;
const AUTO_POLL_MS = 20000; // poll every 20 s
const REFRESH_COOLDOWN_MS = 10000; // 10 s cooldown on manual refresh

export default function InboxManager({ currentEmail }) {
  const { t } = useI18n();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentWidth, setContentWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const cooldownTimer = useRef(null);
  const cooldownInterval = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!currentEmail) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setEmails(data.messages.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (err) {
      console.error('[InboxManager] fetchMessages:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentEmail]);

  // Initial fetch + reset when email changes
  useEffect(() => {
    setEmails([]);
    setSelectedEmail(null);
    setCurrentPage(1);
    if (currentEmail) fetchMessages();
  }, [currentEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-poll
  useEffect(() => {
    if (!currentEmail) return;
    const id = setInterval(fetchMessages, AUTO_POLL_MS);
    return () => clearInterval(id);
  }, [currentEmail, fetchMessages]);

  // Fetch full message content when an email row is clicked
  const handleEmailSelect = useCallback(async (email) => {
    setSelectedEmail({ ...email, _loading: true });
    setIsLoadingContent(true);
    try {
      const res = await fetch(`/api/messages/${email.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const full = await res.json();
      setSelectedEmail(full);
    } catch (err) {
      console.error('[InboxManager] fetchContent:', err.message);
      setSelectedEmail({ ...email, text: email.intro, _loading: false });
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  // Manual refresh with 10-second cooldown
  const handleRefresh = useCallback(() => {
    if (refreshCooldown) return;
    fetchMessages();
    setRefreshCooldown(true);
    setCooldownLeft(10);

    cooldownInterval.current = setInterval(() => {
      setCooldownLeft(prev => {
        if (prev <= 1) {
          clearInterval(cooldownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    cooldownTimer.current = setTimeout(() => {
      setRefreshCooldown(false);
      setCooldownLeft(0);
    }, REFRESH_COOLDOWN_MS);
  }, [refreshCooldown, fetchMessages]);

  useEffect(() => {
    return () => {
      clearTimeout(cooldownTimer.current);
      clearInterval(cooldownInterval.current);
    };
  }, []);

  const handleMouseDownResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.pageX;
    const startWidthPct = contentWidth;
    const containerTotalWidth = e.target.parentElement.parentElement.parentElement.offsetWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const deltaWidthPct = (deltaX / containerTotalWidth) * 100;
      const newWidthPct = Math.max(30, Math.min(70, startWidthPct - deltaWidthPct));
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

  const totalPages = Math.ceil(emails.length / ITEMS_PER_PAGE);
  const currentDisplayEmails = emails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedEmail(null);
  };

  if (!currentEmail) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 h-[240px] flex flex-col items-center justify-center text-muted-foreground">
        <Inbox className="w-8 h-8 mb-2.5 text-primary/50" />
        <p className="text-sm font-semibold mb-1">{t('inboxInitializingTitle')}</p>
        <p className="text-[11px] text-center max-w-xs text-muted-foreground/70">{t('inboxInitializingDescription')}</p>
      </div>
    );
  }

  if (isLoading && emails.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 h-[240px] flex flex-col items-center justify-center text-muted-foreground">
        <Inbox className="w-8 h-8 mb-2.5 text-primary animate-pulse" />
        <p className="text-sm font-semibold mb-1">{t('inboxLoadingTitle')}</p>
        <p className="text-[11px] text-muted-foreground/70">{t('inboxLoadingDescription', { email: currentEmail })}</p>
      </div>
    );
  }

  if (emails.length === 0 && !isLoading) {
    // Split the description at the email address so the "New messages…" sentence
    // falls on its own line regardless of locale.
    const descFull = t('inboxEmptyDescription', { email: currentEmail });
    const emailEnd = descFull.indexOf(currentEmail) + currentEmail.length;
    const descLine1 = emailEnd > 0 ? descFull.slice(0, emailEnd) : descFull;
    const descLine2 = emailEnd > 0
      ? descFull.slice(emailEnd).replace(/^[\s.,!?;:。۔।．]+/, '').trim()
      : '';

    return (
      <div className="bg-muted/30 rounded-lg p-4 h-[240px] flex flex-col items-center justify-center text-muted-foreground">
        <Inbox className="w-8 h-8 mb-2.5 text-primary/50" />
        <p className="text-sm font-semibold mb-1">{t('inboxEmptyTitle')}</p>
        <p className="text-[11px] text-center max-w-xs text-muted-foreground/70">{descLine1}</p>
        {descLine2 && (
          <p className="text-[11px] text-center max-w-xs text-muted-foreground/70 mt-0.5">{descLine2}</p>
        )}
        <Button
          onClick={handleRefresh}
          disabled={refreshCooldown}
          variant="outline"
          size="sm"
          className="mt-4 gap-2 h-7 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {refreshCooldown ? `${cooldownLeft}s` : t('inboxRefresh')}
        </Button>
      </div>
    );
  }

  const showPreviewPane = selectedEmail && window.innerWidth >= 768;

  return (
    <div className={`bg-muted/30 rounded-lg h-[240px] flex ${showPreviewPane ? 'flex-row' : 'flex-col'} relative overflow-hidden`}>
      <motion.div
        className="flex-1 overflow-hidden min-h-0"
        animate={{
          width: showPreviewPane ? `${100 - contentWidth}%` : '100%',
        }}
        style={{ display: !showPreviewPane && selectedEmail ? 'none' : 'flex', flexDirection: 'column' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="p-2 sm:p-4 h-full flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-2">
            {isLoading && emails.length > 0 ? (
              <span className="text-xs text-primary">{t('inboxRefreshing')}…</span>
            ) : (
              <span className="text-xs text-muted-foreground">{t(emails.length === 1 ? 'inboxMessageCount_one' : 'inboxMessageCount_other', { count: emails.length })}</span>
            )}
            <Button
              onClick={handleRefresh}
              disabled={refreshCooldown}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-7 px-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {refreshCooldown ? `${cooldownLeft}s` : t('inboxRefresh')}
            </Button>
          </div>

          <EmailList
            emails={currentDisplayEmails}
            onEmailSelect={handleEmailSelect}
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
            initial={{ width: showPreviewPane ? 0 : '100%', height: '100%', opacity: 0 }}
            animate={{ width: showPreviewPane ? `${contentWidth}%` : '100%', height: '100%', opacity: 1 }}
            exit={{ width: showPreviewPane ? 0 : '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="relative h-full min-h-0 overflow-hidden">
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
              <EmailContentPreview email={selectedEmail} isLoading={isLoadingContent} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
