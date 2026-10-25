"use client";

import React, { useState } from "react";
import { DocsSearchTrigger } from "./docs-search-trigger";
import { DocsSearchDialog } from "./search-dialog";

interface DocsHubClientProps {
  locale: string;
}

export function DocsHubSearchClient({ locale }: DocsHubClientProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <DocsSearchTrigger onClick={() => setSearchOpen(true)} />
      <DocsSearchDialog open={searchOpen} onOpenChange={setSearchOpen} locale={locale} />
    </>
  );
}
