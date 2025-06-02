
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

function formatTimeAgo(dateString, t) {
  if (!dateString) return ""; 

  const date = new Date(dateString);
  if (isNaN(date.getTime())) { 
    return t('timeJustNow'); 
  }

  const now = new Date();
  let seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
  seconds = Math.max(0, seconds); // Ensure seconds is not negative

  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); 
  const years = Math.round(days / 365.25); 

  if (seconds < 5) return t('timeJustNow');
  if (seconds < 60) return t(seconds === 1 ? 'timeSecondsAgo_one' : 'timeSecondsAgo_other', { count: seconds });
  if (minutes < 60) return t(minutes === 1 ? 'timeMinutesAgo_one' : 'timeMinutesAgo_other', { count: minutes });
  if (hours < 24) return t(hours === 1 ? 'timeHoursAgo_one' : 'timeHoursAgo_other', { count: hours });
  if (days < 7) return t(days === 1 ? 'timeDaysAgo_one' : 'timeDaysAgo_other', { count: days });
  if (weeks < 5) return t(weeks === 1 ? 'timeWeeksAgo_one' : 'timeWeeksAgo_other', { count: weeks });
  if (months < 12) return t(months === 1 ? 'timeMonthsAgo_one' : 'timeMonthsAgo_other', { count: months });
  return t(years === 1 ? 'timeYearsAgo_one' : 'timeYearsAgo_other', { count: years });
}

export default function EmailList({ emails = [], onEmailSelect, selectedEmailId, currentPage, totalPages, onPageChange }) {
  const { t } = useI18n();
  return (
    <div className="w-full flex flex-col flex-grow">
      <div className="rounded-md border border-primary flex-grow overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-primary hover:bg-primary/90 bg-primary">
              <TableHead className="text-left font-semibold text-primary-foreground w-[30%] text-sm">{t('tableHeaderFrom')}</TableHead>
              <TableHead className="text-left font-semibold text-primary-foreground w-[45%] text-sm">{t('tableHeaderSubject')}</TableHead>
              <TableHead className="text-left font-semibold text-primary-foreground w-[25%] text-sm">{t('tableHeaderTime')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow
                key={email.id}
                className="cursor-pointer transition-colors duration-150 ease-in-out"
                onClick={() => onEmailSelect(email)}
                data-state={selectedEmailId === email.id ? "selected" : undefined}
                style={{ backgroundColor: selectedEmailId === email.id ? 'hsl(var(--accent))' : 'transparent' }}
              >
                <TableCell className="font-medium text-left text-sm py-3 truncate text-foreground/90">{email.from}</TableCell>
                <TableCell className="text-left text-sm py-3 truncate text-foreground/90">{email.subject}</TableCell>
                <TableCell className="text-left text-sm text-foreground/90 py-3 truncate">{formatTimeAgo(email.date, t)}</TableCell>
              </TableRow>
            ))}
            {emails.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                  {t('tableNoEmails')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4 mt-auto">
          <Button
            variant="default"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">{t('paginationPrevious')}</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('paginationPageInfo', { currentPage, totalPages })}
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">{t('paginationNext')}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
