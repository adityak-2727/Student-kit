"use client";

import { useId, useState } from "react";
import { CalendarDays, Clock3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlSelect } from "@/components/ui/control-select";
import { Toggle } from "@/components/ui/toggle";
import { domainOptions, previewDraftSchema, type PreviewDomain, type PreviewTask } from "./preview-model";

export function TaskEditor({ task, date, onApply, onCancel }: { task: PreviewTask | null; date: string; onApply: (task: PreviewTask) => void; onCancel: () => void }) {
  const id = useId();
  const [title, setTitle] = useState(task?.title ?? "");
  const [domain, setDomain] = useState<PreviewDomain>(task?.domain ?? "study");
  const [scheduled, setScheduled] = useState(task ? !!task.date : true);
  const [day, setDay] = useState(task?.date ?? date);
  const [start, setStart] = useState(task?.start ?? "09:00");
  const [end, setEnd] = useState(task?.end ?? "09:45");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locked = !!task?.completed;
  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = previewDraftSchema.safeParse({ title, domain, scheduled, date: day, start, end });
    if (!result.success) {
      const messages: Record<string, string> = {};
      for (const issue of result.error.issues) messages[String(issue.path[0])] = issue.message;
      setErrors(messages);
      const field = result.error.issues[0]?.path[0];
      if (field) document.getElementById(`${id}-${String(field)}`)?.focus();
      return;
    }
    onApply({ id: task?.id ?? `preview-${crypto.randomUUID()}`, title: result.data.title, domain: result.data.domain, date: result.data.scheduled ? result.data.date : null, start: result.data.scheduled ? result.data.start : "", end: result.data.scheduled ? result.data.end : "", completed: task?.completed ?? false, ...(task?.source ? { source: task.source } : {}), ...(result.data.domain === "study" ? { studyKind: result.data.scheduled ? task?.studyKind ?? "general" : "general" } : {}) });
  }
  return <form className="editor-form" onSubmit={apply} noValidate>
    <div className="editor-scroll">
      <p className="preview-disclosure"><Info aria-hidden="true" />Temporary synthetic draft. Nothing is saved to a server, and no XP is awarded.</p>
      <div className="field"><label htmlFor={`${id}-title`} className="field-label">Task title</label><input id={`${id}-title`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="What would you like to plan?" aria-invalid={!!errors.title} aria-describedby={errors.title ? `${id}-title-error` : undefined} />{errors.title && <p className="field-error" id={`${id}-title-error`}>{errors.title}</p>}</div>
      {locked && <p className="section-note">Completed sample: only its title can be edited. Create a new preview draft to choose a different domain or time.</p>}
      <ControlSelect label="Domain" value={domain} onValueChange={setDomain} options={domainOptions} disabled={locked} />
      <Toggle label="Schedule this draft" checked={scheduled} onCheckedChange={setScheduled} disabled={locked} description="Turn off to place it in the preview inbox." />
      {scheduled && <>
        <div className="field"><label htmlFor={`${id}-date`} className="field-label"><CalendarDays aria-hidden="true" />Date</label><input id={`${id}-date`} type="date" value={day} disabled={locked} onChange={(event) => setDay(event.target.value)} aria-invalid={!!errors.date} aria-describedby={errors.date ? `${id}-date-error` : `${id}-zone`} />{errors.date && <p className="field-error" id={`${id}-date-error`}>Choose a valid date.</p>}<p id={`${id}-zone`} className="field-help">Asia/Kolkata · preview timezone</p></div>
        <div className="time-fields"><div className="field"><label htmlFor={`${id}-start`} className="field-label"><Clock3 aria-hidden="true" />Start time</label><input id={`${id}-start`} type="time" value={start} disabled={locked} onChange={(event) => setStart(event.target.value)} aria-invalid={!!errors.start} aria-describedby={errors.start ? `${id}-start-error` : undefined} />{errors.start && <p className="field-error" id={`${id}-start-error`}>Choose a valid start time.</p>}</div><div className="field"><label htmlFor={`${id}-end`} className="field-label">End time</label><input id={`${id}-end`} type="time" value={end} disabled={locked} onChange={(event) => setEnd(event.target.value)} aria-invalid={!!errors.end} aria-describedby={errors.end ? `${id}-end-error` : undefined} />{errors.end && <p className="field-error" id={`${id}-end-error`}>{errors.end}</p>}</div></div>
      </>}
      {task?.source && <div className="source-reference"><span className="field-label">Sample college source</span><p>{task.source}</p></div>}
      <p className="field-help">Completion and recurrence will use verified server services in later builds. This editor only reviews layout and temporary wording.</p>
    </div>
    <footer className="editor-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit">Apply to preview</Button></footer>
  </form>;
}
