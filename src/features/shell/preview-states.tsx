import { AlertCircle, CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PreviewState = "ready" | "empty" | "loading" | "error" | "offline";
export const stateOptions: { value: PreviewState; label: string }[] = [
  { value: "ready", label: "Sample day" }, { value: "empty", label: "Empty sample" },
  { value: "loading", label: "Loading sample" }, { value: "error", label: "Error sample" }, { value: "offline", label: "Offline sample" },
];

export function PreviewStatePanel({ state, onRetry }: { state: "loading" | "error" | "offline"; onRetry: () => void }) {
  if (state === "loading") return <section className="loading-preview" aria-busy="true" aria-label="Loading sample agenda"><p className="muted" role="status">Loading state example. Use the preview state control to return to your day.</p>{[0, 1, 2].map((row) => <div className="skeleton-row" key={row}><span className="skeleton skeleton-time" /><span className="skeleton skeleton-task" /></div>)}</section>;
  const offline = state === "offline";
  return <section className="empty-state state-message" role="status">{offline ? <CloudOff aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}<h2>{offline ? "You’re viewing an offline example." : "This is a failed-load example."}</h2><p>{offline ? "A live app would keep an unsaved draft in this view. No completion is confirmed while offline." : "A live app would explain the problem and let you retry. Your draft would stay available."}</p><Button variant="secondary" onClick={onRetry}><RefreshCw aria-hidden="true" />Return to sample day</Button></section>;
}
