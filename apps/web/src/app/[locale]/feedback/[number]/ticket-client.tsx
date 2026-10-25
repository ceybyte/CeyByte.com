"use client";

import { useEffect, useState } from "react";
import { TicketDetailView } from "@/features/feedback/components/TicketDetailView";

interface TicketDetailClientProps {
  initialNumber: string;
  locale: string;
}

export function TicketDetailClient({ initialNumber, locale }: TicketDetailClientProps) {
  const [ticketNumber, setTicketNumber] = useState(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/feedback\/(CB-\d+)/i);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return initialNumber;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/feedback\/(CB-\d+)/i);
      if (match && match[1] && match[1].toUpperCase() !== ticketNumber) {
        setTicketNumber(match[1].toUpperCase());
      }
    }
  }, [initialNumber, ticketNumber]);

  return <TicketDetailView ticketNumber={ticketNumber} locale={locale} />;
}
