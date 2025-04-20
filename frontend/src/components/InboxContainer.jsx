
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import EmailList from "./EmailList";
import EmailContent from "./EmailContent";

// Dummy data for demonstration
const dummyEmails = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  from: `sender${i + 1}@example.com`,
  subject: `Test Email ${i + 1}`,
  content: `This is the content of email ${i + 1}. It can contain a longer message with more details about the email.`,
  date: new Date(Date.now() - Math.random() * 10000000000)
}));

const ITEMS_PER_PAGE = 10;

export default function InboxContainer() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentWidth, setContentWidth] = useState(50);
  
  const totalPages = Math.ceil(dummyEmails.length / ITEMS_PER_PAGE);
  const currentEmails = dummyEmails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedEmail(null);
  };

  if (dummyEmails.length === 0) {
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

  return (
    <div className="bg-muted/30 rounded-lg min-h-[400px] flex relative">
      <motion.div 
        className="flex-1"
        animate={{ width: selectedEmail ? `${100 - contentWidth}%` : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-4">
          <EmailList
            emails={currentEmails}
            onEmailSelect={setSelectedEmail}
            selectedEmail={selectedEmail}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
                    const containerWidth = e.target.parentElement.parentElement.parentElement.offsetWidth;
                    const newWidth = Math.max(30, Math.min(70, startWidth - (deltaX / containerWidth * 100)));
                    setContentWidth(newWidth);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
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
