
import React from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableVariants,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 604800;
  if (interval > 1) return Math.floor(interval) + " weeks ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return Math.floor(seconds) + " seconds ago";
}

export default function EmailList({ emails = [], onEmailSelect, selectedEmail, currentPage, totalPages, onPageChange }) {
  return (
    <div className="w-full">
      <div className="rounded-md border border-[#6F5AF6]">
        <Table>
          <TableHeader variant="purpleOutline">
            <TableRow>
              <TableHead className="text-left">From</TableHead>
              <TableHead className="text-left">Subject</TableHead>
              <TableHead className="text-left">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow
                key={email.id}
                className="cursor-pointer"
                onClick={() => onEmailSelect(email)}
                data-state={selectedEmail?.id === email.id ? "selected" : undefined}
              >
                <TableCell className="font-medium text-left">{email.from}</TableCell>
                <TableCell className="text-left">{email.subject}</TableCell>
                <TableCell className="text-left">{formatTimeAgo(email.date)}</TableCell>
              </TableRow>
            ))}
            {emails.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  No emails yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
