"use client";

import { ArrowRight, BookOpen, Check, Circle, Clock3, Inbox, Plus } from "lucide-react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import type { PreviewTask } from "./preview-model";

export function WeekStrip({ date, onDateChange }: { date: string; onDateChange: (day: string) => void }) {
  const start = DateTime.fromISO(date).startOf("week");
  return <div className="week-strip" role="group" aria-label="Choose a day this week">{Array.from({ length: 7 }, (_, index) => {
    const day = start.plus({ days: index });
    const key = day.toISODate() ?? date;
    return <button key={key} aria-pressed={key === date} aria-label={day.toFormat("cccc, d LLLL yyyy")} onClick={() => onDateChange(key)}><span>{day.toFormat("ccc")}</span><strong>{day.day}</strong><span className="day-indicator" aria-hidden="true" /></button>;
  })}</div>;
}

export function Agenda({ tasks, date, onInspect, onAdd, showSources, compact }: { tasks: PreviewTask[]; date: string; onInspect: (task: PreviewTask, trigger: HTMLElement) => void; onAdd: (trigger: HTMLElement) => void; showSources: boolean; compact: boolean }) {
  const scheduled = tasks.filter((task) => task.date === date).sort((a, b) => a.start.localeCompare(b.start));
  const inbox = tasks.filter((task) => task.date === null);
  return <div className="agenda" data-compact={compact}>
    <div className="section-heading"><h2>Your day, in order</h2><span>{scheduled.length} sample {scheduled.length === 1 ? "plan" : "plans"}</span></div>
    {scheduled.length ? <ol className="timeline">{scheduled.map((task) => <li key={task.id} className="timeline-row"><div className="time-label"><time>{task.start}</time><span>{task.end}</span></div><button className="task-row" onClick={(event) => onInspect(task, event.currentTarget)} aria-label={`Inspect ${task.title}`}><span className={`task-status ${task.completed ? "is-complete" : ""}`}>{task.completed ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}</span><span className="task-copy"><span className={`domain-label domain-${task.domain}`}>{task.domain === "study" && task.studyKind === "self_study" ? "Self-study" : task.domain}</span><strong>{task.title}</strong>{showSources && task.source && <span className="task-source"><BookOpen aria-hidden="true" />{task.source}</span>}<span className="task-state">{task.completed ? "Completed · sample state" : "Planned · sample state"}</span></span><ArrowRight className="task-arrow" aria-hidden="true" /></button></li>)}</ol> : <EmptyAgenda onAdd={onAdd} />}
    <section className="inbox-section" aria-labelledby="inbox-heading"><div className="section-heading"><h2 id="inbox-heading"><Inbox aria-hidden="true" />Without a time</h2><span>{inbox.length} sample {inbox.length === 1 ? "idea" : "ideas"}</span></div>{inbox.length ? inbox.map((task) => <button key={task.id} className="inbox-row" onClick={(event) => onInspect(task, event.currentTarget)}><span><span className={`domain-label domain-${task.domain}`}>{task.domain}</span><strong>{task.title}</strong></span><ArrowRight aria-hidden="true" /></button>) : <p className="muted">No unscheduled ideas in this preview filter.</p>}</section>
  </div>;
}

function EmptyAgenda({ onAdd }: { onAdd: (trigger: HTMLElement) => void }) {
  return <div className="empty-state"><Clock3 aria-hidden="true" /><h3>A little open space.</h3><p>No sample plans for this day or domain. Try another date, or add a temporary preview draft.</p><Button variant="secondary" onClick={(event) => onAdd(event.currentTarget)}><Plus aria-hidden="true" />Plan a preview task</Button></div>;
}
