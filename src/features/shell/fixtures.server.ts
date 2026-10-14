import "server-only";
import type { PreviewTask } from "./preview-model";

// Explicitly synthetic. The server route must reject production before importing this.
export const previewDate = "2026-10-14";
export const syntheticTasks: PreviewTask[] = [
  { id: "sample-1", title: "Work through integration by parts", domain: "study", studyKind: "self_study", date: previewDate, start: "09:00", end: "09:45", completed: true, source: "Calculus · Integration techniques" },
  { id: "sample-2", title: "Strength & mobility", domain: "fitness", date: previewDate, start: "11:30", end: "12:00", completed: false },
  { id: "sample-3", title: "Review operating systems: process scheduling, memory management and the connections between them", domain: "study", studyKind: "self_study", date: previewDate, start: "16:00", end: "16:45", completed: false, source: "Computer science · Operating systems" },
  { id: "sample-4", title: "Call home", domain: "relationships", date: previewDate, start: "18:30", end: "18:45", completed: false },
  { id: "sample-5", title: "Plan this week’s grocery budget", domain: "finance", date: null, start: "09:00", end: "09:45", completed: false },
];
