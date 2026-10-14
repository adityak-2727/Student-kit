"use client";

import * as Popover from "@radix-ui/react-popover";
import { CalendarDays } from "lucide-react";
import { DateTime } from "luxon";
import { useId, useState } from "react";
import { Button } from "./button";

export function DateControl({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger className="button button-secondary date-trigger" aria-label={`Choose agenda date, ${DateTime.fromISO(value).toFormat("d LLLL yyyy")}`}><CalendarDays aria-hidden="true" />{DateTime.fromISO(value).toFormat("d MMM yyyy")}</Popover.Trigger>
    <Popover.Portal><Popover.Content className="date-popover" sideOffset={8} align="start" aria-label="Choose agenda date">
      <label htmlFor={id} className="field-label">Agenda date</label>
      <input id={id} type="date" value={value} onChange={(event) => { if (event.target.value && event.target.validity.valid) onChange(event.target.value); }} />
      <p className="field-help">Preview dates use Asia/Kolkata. You can type a date directly.</p>
      <Button variant="secondary" onClick={() => setOpen(false)}>Done</Button>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
