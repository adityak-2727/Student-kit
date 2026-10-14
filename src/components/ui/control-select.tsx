"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";

export function ControlSelect<T extends string>({ label, value, onValueChange, options, disabled = false }: {
  label: string; value: T; onValueChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  disabled?: boolean;
}) {
  const id = useId();
  return <div className="select-field">
    <label className="field-label" htmlFor={id}>{label}</label>
    <Select.Root disabled={disabled} value={value} onValueChange={(next) => { const option = options.find((item) => item.value === next); if (option) onValueChange(option.value); }}>
      <Select.Trigger id={id} className="select-trigger"><Select.Value /><Select.Icon><ChevronDown aria-hidden="true" /></Select.Icon></Select.Trigger>
      <Select.Portal><Select.Content className="select-content" position="popper" sideOffset={6}>
        <Select.ScrollUpButton className="select-scroll"><ChevronUp aria-hidden="true" /></Select.ScrollUpButton>
        <Select.Viewport>{options.map((option) => <Select.Item key={option.value} value={option.value} className="select-item"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check aria-hidden="true" /></Select.ItemIndicator></Select.Item>)}</Select.Viewport>
        <Select.ScrollDownButton className="select-scroll"><ChevronDown aria-hidden="true" /></Select.ScrollDownButton>
      </Select.Content></Select.Portal>
    </Select.Root>
  </div>;
}
