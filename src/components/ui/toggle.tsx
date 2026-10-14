"use client";

import * as Switch from "@radix-ui/react-switch";
import { useId } from "react";

export function Toggle({ label, checked, onCheckedChange, description, disabled = false }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; description?: string; disabled?: boolean }) {
  const id = useId();
  return <div className="toggle-row"><label htmlFor={id}><span className="field-label">{label}</span>{description && <span className="field-help">{description}</span>}</label><Switch.Root id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="switch"><Switch.Thumb className="switch-thumb" /></Switch.Root></div>;
}
