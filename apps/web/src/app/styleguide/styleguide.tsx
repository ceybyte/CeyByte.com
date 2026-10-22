"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Callout } from "@/components/brand/callout";
import { Crosshair } from "@/components/brand/crosshair";
import { Figure } from "@/components/brand/figure";
import { GridCanvas } from "@/components/brand/grid-canvas";
import { HashBlock } from "@/components/brand/hash-block";
import { Kbd } from "@/components/brand/kbd";
import { Logo } from "@/components/brand/logo";
import { StatTile } from "@/components/brand/stat-tile";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { FileDrop, type FileDropState } from "@/components/forms/file-drop";
import { PhoneInput } from "@/components/forms/phone-input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Dev-only. Sinhala/Tamil strings below are clipping-test samples, not product copy (product copy comes
// from messages/*.json and native translators, CLAUDE.md §1.6).
const SAMPLES = {
  en: { lang: "en", button: "Download CB POS", heading: "Bill every customer.", body: "Payments and taxes" },
  si: { lang: "si", button: "බාගත කරන්න", heading: "ගෙවීම් සහ බදු", body: "මුද්‍රණ යන්ත්‍රය සම්බන්ධ කරන්න" },
  ta: { lang: "ta", button: "பதிவிறக்கு", heading: "கட்டணம் மற்றும் வரி", body: "அச்சுப்பொறியை இணைக்கவும்" },
} as const;

const SWATCHES = [
  "canvas",
  "surface",
  "surface-elevated",
  "surface-legal",
  "hairline",
  "hairline-grid",
  "text",
  "text-muted",
  "primary",
  "azure",
  "azure-text",
  "gold",
  "warning",
  "error",
  "success",
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-hairline-grid relative border-t py-12">
      <Crosshair className="-top-[5px] -left-[5px]" />
      <h2 className="text-h3 mb-6">{title}</h2>
      {children}
    </section>
  );
}

export function Styleguide() {
  const [phone, setPhone] = useState("771234567");
  const [upload, setUpload] = useState<FileDropState>({ status: "idle" });

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-[var(--content-max)] px-[var(--gutter)] pb-24">
        <header className="flex items-center justify-between py-6">
          <Logo />
          <ThemeToggle toLight="Switch to light theme" toDark="Switch to dark theme" />
        </header>

        <Section title="Brand">
          <div className="flex flex-wrap items-end gap-8">
            <Logo size="sm" />
            <Logo size="md" />
            <Logo size="lg" />
            <div
              className="h-1.5 w-48 rounded-full [background:var(--azure-gradient)]"
              aria-label="Azure gradient"
            />
          </div>
        </Section>

        <Section title="Colour tokens">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
            {SWATCHES.map((name) => (
              <div key={name} className="border-hairline overflow-hidden rounded-md border">
                <div className="h-14" style={{ background: `var(--${name})` }} />
                <p className="text-muted px-2 py-1.5 font-mono text-xs">--{name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className="space-y-4">
            <p className="text-display">Bill every customer.</p>
            <p className="text-h1">Releases</p>
            <p className="text-h2">Built for the counter, not the cloud.</p>
            <p className="text-h3">VAT and SSCL, worked out from the MRP.</p>
            <p className="text-h4">Use the printer you already have.</p>
            <p className="text-lead text-muted max-w-prose">
              CB POS is free point-of-sale software for Sri Lankan shops.
            </p>
            <p className="max-w-prose">
              Every sale is written to a SQLite database on the PC in milliseconds. Switch the Wi-Fi off and
              keep billing.
            </p>
            <p className="text-stat">Rs. 1,180.00</p>
            <p className="text-hash max-w-md">
              9f2c4b0e8d1a7c3e5f6a2b9c0d4e8f1a3b5c7d9e0f2a4c6e8b0d2f4a6c8e0b2d4
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {Object.values(SAMPLES).map((s) => (
              <div key={s.lang} lang={s.lang} className="border-hairline space-y-3 rounded-md border p-4">
                <Badge variant="locale">{s.lang.toUpperCase()}</Badge>
                <p className="text-h2">{s.heading}</p>
                <p>{s.body}</p>
                <Button variant="primary" size="lg">
                  {s.button}
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="xl">
              Download CB POS — Free
            </Button>
            <Button variant="secondary">Read the setup guide</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="link">Tax disclaimer</Button>
            <Button variant="destructive">Delete permanently</Button>
            <Button variant="gold">Get payment details</Button>
            <Button variant="secondary" kbd="/">
              Search the docs
            </Button>
            <Button variant="secondary" loading>
              Starting download…
            </Button>
            <Button variant="secondary" disabled>
              Continue
            </Button>
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid max-w-xl gap-5">
            <div className="grid gap-2">
              <Label htmlFor="sg-shop">Shop name</Label>
              <Input id="sg-shop" placeholder="e.g. Perera Stores" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sg-phone">Phone number</Label>
              <PhoneInput id="sg-phone" value={phone} onChange={setPhone} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sg-phone-bad">Phone number (invalid)</Label>
              <PhoneInput
                id="sg-phone-bad"
                value="12"
                onChange={() => {}}
                invalid
                aria-describedby="sg-phone-err"
              />
              <p id="sg-phone-err" className="text-error text-xs">
                Enter a Sri Lankan number, like 77 123 4567.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sg-desc">Describe it</Label>
              <Textarea id="sg-desc" rows={3} />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="sg-map" />
              <Label htmlFor="sg-map" className="leading-snug">
                Show my shop on the public CB POS map
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sg-sup" />
              <Label htmlFor="sg-sup">Gold Supporters only</Label>
            </div>
            <FileDrop
              accept="image/jpeg,image/png,application/pdf"
              state={upload}
              onFile={(f) => setUpload({ status: "done", fileName: f.name })}
              labels={{
                prompt: "Drop slip here or browse",
                hint: "JPG, PNG or PDF, up to 5 MB.",
                replace: "Replace",
                uploading: "Uploading slip…",
              }}
            />
            <FileDrop
              accept="image/png"
              state={{ status: "uploading", progress: 64, fileName: "slip.png" }}
              onFile={() => {}}
              labels={{ prompt: "Browse", hint: "", replace: "Replace", uploading: "Uploading slip…" }}
            />
            <FileDrop
              accept="image/png"
              state={{ status: "error", message: "That file is over 5 MB. Choose a smaller file." }}
              onFile={() => {}}
              labels={{ prompt: "Browse", hint: "", replace: "Replace", uploading: "" }}
            />
          </div>
        </Section>

        <Section title="Badges, keys, callouts">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="supporter">Gold Supporter</Badge>
            <Badge status="open">Open</Badge>
            <Badge status="planned">Planned</Badge>
            <Badge status="shipped">Shipped</Badge>
            <Badge variant="version">v1.3+</Badge>
            <Badge variant="locale">SI</Badge>
            <span className="inline-flex items-center gap-1">
              <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
            </span>
            <Kbd pressed>F5</Kbd>
          </div>
          <div className="mt-6 grid max-w-2xl gap-3">
            <Callout variant="tip" title="Tip">
              Press F1 in CB POS to see every shortcut.
            </Callout>
            <Callout variant="tax" title="Not IRD-certified">
              CB POS calculates tax from the rates you set. <a href="#">Read the tax disclaimer</a>.
            </Callout>
            <Callout variant="danger" title="Back up first">
              Ceybyte can&apos;t recover lost data.
            </Callout>
          </div>
        </Section>

        <Section title="Data">
          <div className="divide-hairline-grid border-hairline-grid grid max-w-3xl border sm:grid-cols-2 sm:divide-x md:grid-cols-4">
            <StatTile value={0} format={() => "0 ms"} label="Waiting on a network" />
            <StatTile value={0} format={() => "Rs. 0 / mo"} label="No subscription" />
            <StatTile value={17} format={(n) => `${n}/25`} label="Districts with CB POS shops" />
            <StatTile value={null} label="Loading" />
          </div>
          <HashBlock
            className="mt-6 max-w-xl"
            label="SHA-256"
            fileName="CBPOSSetup-1.3.0.exe"
            hash="9f2c4b0e8d1a7c3e5f6a2b9c0d4e8f1a3b5c7d9e0f2a4c6e8b0d2f4a6c8e0b2d4"
            copyLabel="Copy hash"
            copiedLabel="Hash copied"
          />
          <div className="mt-6 flex max-w-xl flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Section>

        <Section title="Disclosure, tabs, overlays">
          <Accordion type="single" collapsible className="max-w-2xl">
            <AccordionItem value="free">
              <AccordionTrigger>Is CB POS really free? What&apos;s the catch?</AccordionTrigger>
              <AccordionContent className="text-muted">
                Yes, it&apos;s free. No subscription, no trial period, no locked features, no ads.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="si" lang="si">
              <AccordionTrigger>{SAMPLES.si.heading}</AccordionTrigger>
              <AccordionContent className="text-muted">{SAMPLES.si.body}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="ta" lang="ta">
              <AccordionTrigger>{SAMPLES.ta.heading}</AccordionTrigger>
              <AccordionContent className="text-muted">{SAMPLES.ta.body}</AccordionContent>
            </AccordionItem>
          </Accordion>

          <Tabs defaultValue="en" className="mt-8 max-w-md">
            <TabsList>
              <TabsTrigger value="en">EN</TabsTrigger>
              <TabsTrigger value="si">සිං</TabsTrigger>
              <TabsTrigger value="ta">தமி</TabsTrigger>
            </TabsList>
            <TabsContent value="en">Receipt text in English.</TabsContent>
            <TabsContent value="si" lang="si">
              {SAMPLES.si.body}
            </TabsContent>
            <TabsContent value="ta" lang="ta">
              {SAMPLES.ta.body}
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tell us about your shop</DialogTitle>
                  <DialogDescription>Takes 30 seconds.</DialogDescription>
                </DialogHeader>
                <Input placeholder="e.g. Perera Stores" />
              </DialogContent>
            </Dialog>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary">Open sheet</Button>
              </DrawerTrigger>
              <DrawerContent data-lenis-prevent>
                <DrawerHeader>
                  <DrawerTitle>Where is your shop?</DrawerTitle>
                </DrawerHeader>
                <div className="p-4">
                  <Input placeholder="Town or city" />
                </div>
              </DrawerContent>
            </Drawer>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Copied to clipboard</TooltipContent>
            </Tooltip>
            <Button variant="secondary" onClick={() => toast("Ticket CB-0142 created.")}>
              Show toast
            </Button>
          </div>
        </Section>

        <Section title="Hairline figures and grid">
          <div className="border-hairline relative grid gap-6 overflow-hidden rounded-md border p-6 sm:grid-cols-3">
            <GridCanvas />
            <Figure name="keyboard" className="relative" />
            <Figure name="vault" className="relative" />
            <Figure name="plug" className="relative" />
          </div>
        </Section>
      </main>
      <Toaster />
    </TooltipProvider>
  );
}
