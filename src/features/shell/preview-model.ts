import { z } from "zod";

export const domainOptions = [
  { value: "study", label: "Study" }, { value: "fitness", label: "Fitness" },
  { value: "relationships", label: "Relationships" }, { value: "finance", label: "Finance" },
] as const;
export type PreviewDomain = typeof domainOptions[number]["value"];
export type PreviewTask = {
  id: string; title: string; domain: PreviewDomain; date: string | null;
  start: string; end: string; completed: boolean; source?: string;
  studyKind?: "self_study" | "general";
};

// Only checks temporary preview input. This is not the future scheduling service.
const draftFields = {
  title: z.string().trim().min(1, "Enter a title.").max(160, "Keep the title to 160 characters."),
  domain: z.enum(["study", "fitness", "relationships", "finance"]),
};
export const previewDraftSchema = z.discriminatedUnion("scheduled", [z.object({
  ...draftFields,
  scheduled: z.literal(true),
  date: z.iso.date(), start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).refine((draft) => draft.end > draft.start, { path: ["end"], message: "Choose an end time after the start. Split overnight work into separate sessions." }), z.object({ ...draftFields, scheduled: z.literal(false) })]);
