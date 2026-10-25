"use client";

import { useEffect, useState } from "react";
import { TicketDetailView } from "@/features/feedback/components/TicketDetailView";

interface TicketDetailClientProps {
  initialNumber: string;
  locale: string;
}

export function TicketDetailClient({ initialNumber, locale }: TicketDetailClientProps) {
  const [ticketNumber, setTicketNumber] = useState(initialNumber);

  useEffect(() => {
    if (initialNumber === "ticket" && typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/feedback\/(CB-\d+)/i);
      if (match && match[1]) {
        setTicketNumber(match[1].toUpperCase());
      }
    }
  }, [initialNumber]);

  return <TicketDetailView ticketNumber={ticketNumber} locale={locale} />;
}
