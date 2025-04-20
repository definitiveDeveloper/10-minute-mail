import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, RefreshCw } from "lucide-react";

import EmailList from "./EmailList";
import EmailContent from "./EmailContent";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Pagination size
const ITEMS_PER_PAGE = 10;

export default function InboxContainer({ email }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentWidth, setContentWidth] = useState(50);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [emails, setEmails] = useState([]);

  const { toast } = useToast();

  const totalPages = Math.ceil(emails.length / ITEMS_PER_PAGE);
  const currentEmails = emails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedEmail(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Give time for spinner animation to visibly kick in
      await new Promise((resolve) => setTimeout(resolve, 500));

      const inboxes = JSON.parse(localStorage.getItem("inboxes") || "{}");
      const inboxEmails = inboxes[email] || [];

      setEmails(inboxEmails.reverse()); // Newest first

      toast({
        title: "Inbox refreshed",
        description: "Your inbox has been updated with the latest emails.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh inbox. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto refresh every 10 seconds
  useEffect(() => {
    handleRefresh(); // Initial load
    const interval = setInterval(() => {
      handleRefresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [email]);

  return (
    <div className="bg-muted/30 rounded-lg min-h-[400px] flex relative">
      <motion.div
        className="flex-1"
        animate={{ width: selectedEmail ? `${100 - contentWidth}%` : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-4">
          <div className="flex justify-end mb-4">
            <Button
              variant="purpleCascade"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Inbox"}
            </Button>
          </div>

          {emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Inbox className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Your inbox is empty</p>
              <p className="text-sm">New emails will appear here automatically</p>
            </div>
          ) : (
            <EmailList
              emails={currentEmails}
              onEmailSelect={setSelectedEmail}
              selectedEmail={selectedEmail}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            className="bg-muted/30"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${contentWidth}%`, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative h-full">
              <div
                className="absolute left-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors"
                onMouseDown={(e) => {
                  const startX = e.pageX;
                  const startWidth = contentWidth;

                  const handleMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.pageX - startX;
                    const containerWidth =
                      e.target.parentElement.parentElement.parentElement
                        .offsetWidth;
                    const newWidth = Math.max(
                      30,
                      Math.min(
                        70,
                        startWidth - (deltaX / containerWidth) * 100
                      )
                    );
                    setContentWidth(newWidth);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
              />
              <EmailContent email={selectedEmail} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
