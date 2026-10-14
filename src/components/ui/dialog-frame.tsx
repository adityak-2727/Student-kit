"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  sheet?: boolean;
  returnFocus?: RefObject<HTMLElement | null>;
  fallbackFocus?: RefObject<HTMLElement | null>;
};

export function DialogFrame({ open, onOpenChange, title, description, children, sheet = false, returnFocus, fallbackFocus }: Props) {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    function updateViewport() {
      content.current?.style.setProperty("--dialog-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      content.current?.style.setProperty("--dialog-offset-top", `${viewport?.offsetTop ?? 0}px`);
    }
    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);
    return () => {
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [open]);
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content ref={content} className={`dialog-content ${sheet ? "editing-sheet" : ""}`} onOpenAutoFocus={(event) => {
        if (sheet) {
          const input = content.current?.querySelector<HTMLInputElement>("form input");
          if (input) { event.preventDefault(); input.focus(); }
        }
      }} onCloseAutoFocus={(event) => {
        const target = [returnFocus?.current, fallbackFocus?.current].find((element) => element?.isConnected && element.getClientRects().length);
        const destination = target ?? document.getElementById("main");
        if (destination) { event.preventDefault(); destination.focus(); }
      }}>
        <header className="dialog-header">
          <div><Dialog.Title className="dialog-title">{title}</Dialog.Title><Dialog.Description className="dialog-description">{description}</Dialog.Description></div>
          <Dialog.Close className="icon-button" aria-label="Close dialog"><X aria-hidden="true" /></Dialog.Close>
        </header>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
