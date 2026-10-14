"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Info, LayoutGrid, LockKeyhole, Plus } from "lucide-react";
import { DateTime } from "luxon";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { ControlSelect } from "@/components/ui/control-select";
import { DateControl } from "@/components/ui/date-control";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Toggle } from "@/components/ui/toggle";
import { Agenda, WeekStrip } from "./agenda";
import { ProfileMenu, ShellNavigation, viewTitles, type PreviewView } from "./navigation";
import { domainOptions, type PreviewDomain, type PreviewTask } from "./preview-model";
import { PreviewStatePanel, stateOptions, type PreviewState } from "./preview-states";
import { TaskEditor } from "./task-editor";

export function ShellPreview({ initialTasks, initialDate }: { initialTasks: PreviewTask[]; initialDate: string }) {
  const [view, setView] = useState<PreviewView>("today");
  const [date, setDate] = useState(initialDate);
  const [domain, setDomain] = useState<"all" | PreviewDomain>("all");
  const [tasks, setTasks] = useState(initialTasks);
  const [state, setState] = useState<PreviewState>("ready");
  const [studyTab, setStudyTab] = useState("college");
  const [compact, setCompact] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PreviewTask | null>(null);
  const [notice, setNotice] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const addTask = useRef<HTMLButtonElement>(null);
  const quickAdd = useRef<HTMLButtonElement>(null);
  const agendaView = view === "today" || view === "planner";
  const filtered = tasks.filter((task) => domain === "all" || task.domain === domain);
  function edit(task: PreviewTask | null, trigger: HTMLElement) {
    returnFocus.current = trigger;
    setEditing(task);
    setEditorOpen(true);
  }
  function apply(task: PreviewTask) {
    setTasks((current) => current.some((item) => item.id === task.id) ? current.map((item) => item.id === task.id ? task : item) : [...current, task]);
    if (task.date) setDate(task.date);
    setState("ready");
    setEditorOpen(false);
    setNotice("Preview updated. This draft exists only in memory until refresh; nothing was saved and no XP was awarded.");
  }
  function moveWeek(amount: number) {
    setDate(DateTime.fromISO(date).plus({ weeks: amount }).toISODate() ?? date);
  }
  return <div className="workspace">
    <ShellNavigation view={view} onViewChange={setView} />
    <div className="workspace-body">
      <header className="workspace-topbar"><div className="mobile-brand"><Brand /></div><p className="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>{viewTitles[view]}</strong></p><div className="topbar-end"><span className="preview-tag">Visual preview</span><Button ref={quickAdd} className="topbar-add" aria-label="Quick add preview task" title="Add a preview task" onClick={(event) => edit(null, event.currentTarget)}><Plus aria-hidden="true" /></Button><ProfileMenu onViewChange={setView} /></div></header>
      <main id="main" tabIndex={-1} className="workspace-main">
        <div className="preview-banner"><Info aria-hidden="true" /><p><strong>Synthetic preview.</strong> No account, no sync, no rewards. Changes reset on refresh.</p></div>
        <div className="page-heading"><div><p className="eyebrow">Synthetic workspace</p><h1>{viewTitles[view]}</h1><p className="page-subtitle">{DateTime.fromISO(date).toFormat("cccc, d LLLL yyyy")} <span>· Asia/Kolkata</span></p></div><Button ref={addTask} className="add-task" onClick={(event) => edit(null, event.currentTarget)}><Plus aria-hidden="true" />Add task<span className="sr-only"> to preview</span></Button></div>
        <div className="workspace-filters"><ControlSelect label="Workspace domain" value={domain} onValueChange={setDomain} options={[{ value: "all", label: "All domains" }, ...domainOptions]} /><div className="date-tools"><Button variant="quiet" aria-label="Previous week" className="icon-button" onClick={() => moveWeek(-1)}><ChevronLeft aria-hidden="true" /></Button><DateControl value={date} onChange={setDate} /><Button variant="quiet" aria-label="Next week" className="icon-button" onClick={() => moveWeek(1)}><ChevronRight aria-hidden="true" /></Button></div></div>
        <p role="status" className={notice ? "draft-notice" : "sr-only"}>{notice || `Showing ${viewTitles[view]} synthetic preview.`}</p>
        {agendaView ? <>
          <WeekStrip date={date} onDateChange={setDate} />
          <div className="day-layout"><section className="agenda-area" aria-label={`${viewTitles[view]} sample agenda`}>
            <div className="sample-metrics"><div><strong>120 <span>XP</span></strong><span>Fixed sample total</span></div><div><strong>3 <span>days</span></strong><span>Fixed sample study streak</span></div></div>
            {view === "planner" && <p className="section-note">Agenda view adapts to your screen. The persisted week calendar arrives with the scheduling service.</p>}
            {state === "ready" || state === "empty" ? <Agenda tasks={state === "empty" ? [] : filtered} date={date} onInspect={(task, trigger) => edit(task, trigger)} onAdd={(trigger) => edit(null, trigger)} showSources={showSources} compact={compact} /> : <PreviewStatePanel state={state} onRetry={() => setState("ready")} />}
          </section><aside className="context-column" aria-label="Sample week context"><WeekContext onStudy={() => setView("study")} /><section className="preview-tools"><h2>Review the states</h2><p>These controls change synthetic examples only.</p><ControlSelect label="Preview state" value={state} onValueChange={setState} options={stateOptions} /></section></aside></div>
        </> : view === "study" ? <section className="destination-panel"><Tabs.Root value={studyTab} onValueChange={setStudyTab}><Tabs.List className="tabs" aria-label="Study sections"><Tabs.Trigger value="college">College study</Tabs.Trigger><Tabs.Trigger value="self">Self-study</Tabs.Trigger></Tabs.List><Tabs.Content value="college" className="tab-content"><BookOpen aria-hidden="true" /><h2>A syllabus with a clear next step.</h2><p>Subjects, units and leaf topics will live here. Their progress will come from learned leaves, with no extra XP for a parent.</p><p className="section-note">College editing and persisted progress are not implemented yet. The sample agenda shows the layout of a linked topic.</p><Button variant="secondary" onClick={() => setView("today")}><ArrowLeft aria-hidden="true" />Review linked sample session</Button></Tabs.Content><Tabs.Content value="self" className="tab-content"><BookOpen aria-hidden="true" /><h2>Make room for independent study.</h2><p>Self-study sessions will have a date, start and end time. Only eligible same-day completions will extend a study streak.</p><Button variant="secondary" onClick={() => { setDomain("study"); setView("planner"); }}>Review study agenda <ArrowRight aria-hidden="true" /></Button></Tabs.Content></Tabs.Root></section> : view === "settings" ? <section className="destination-panel settings-panel"><h2>Preview display</h2><p>These choices apply to this view and reset on refresh.</p><Toggle label="Compact agenda" checked={compact} onCheckedChange={setCompact} description="Use tighter rows while keeping touch targets accessible." /><Toggle label="Show college source labels" checked={showSources} onCheckedChange={setShowSources} description="Display the sample syllabus reference on linked sessions." /><p className="section-note">Reduced motion follows your device preference. Account privacy and permanent settings arrive after real sign-in.</p><Button variant="secondary" onClick={() => setView("today")}>Back to Today</Button></section> : <UnavailableDestination view={view} onBack={() => setView("today")} />}
      </main>
    </div>
    <DialogFrame open={editorOpen} onOpenChange={setEditorOpen} returnFocus={returnFocus} fallbackFocus={quickAdd} sheet title={editing ? "Review a sample task" : "Plan a preview task"} description="A temporary draft editor for reviewing the interface. Changes are not saved.">
      <TaskEditor key={editing?.id ?? "new"} task={editing} date={date} onApply={apply} onCancel={() => setEditorOpen(false)} />
    </DialogFrame>
  </div>;
}

function WeekContext({ onStudy }: { onStudy: () => void }) {
  return <section className="week-context"><p className="eyebrow">Fixed sample snapshot</p><h2>A look at your week</h2><dl><div><dt>Study planned</dt><dd>90 <span>minutes</span></dd></div><div><dt>Self-reported time</dt><dd>Not recorded</dd></div></dl><p>Planned minutes describe the schedule. They are not measured time worked.</p><div className="context-divider" /><h3>The next study step</h3><p>Review the operating systems topic in your sample afternoon session.</p><Button variant="quiet" onClick={onStudy}>Open Study <ArrowRight aria-hidden="true" /></Button><p className="snapshot-note">These fixed values demonstrate layout. They do not change when a preview draft is edited.</p></section>;
}

function UnavailableDestination({ view, onBack }: { view: PreviewView; onBack: () => void }) {
  const descriptions: Partial<Record<PreviewView, { title: string; copy: string }>> = {
    insights: { title: "Your own activity will tell the story.", copy: "Real charts need recorded tasks and the server’s reward ledger. No analytics or productivity scores are invented for this preview." },
    friends: { title: "A little encouragement, on your terms.", copy: "Friend requests and rankings require real accounts. Discovery and metric sharing will each start off, with explicit choices before sharing." },
    domains: { title: "Different parts of life, one clear day.", copy: "Study, Fitness, Relationships and Finance share this workspace. Use the domain filter to review their sample tasks. Custom domains arrive with saved account settings." },
    profile: { title: "A profile that feels like you.", copy: "Username and local avatar choices arrive after Google authentication. The DL symbol is a sample initials fallback, not a signed-in student." },
  };
  const content = descriptions[view];
  return <section className="destination-panel unavailable-destination">{view === "domains" ? <LayoutGrid aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}<h2>{content?.title ?? "This workspace is taking shape."}</h2><p>{content?.copy ?? "This feature is not available yet."}</p><Button variant="secondary" onClick={onBack}><ArrowLeft aria-hidden="true" />Back to sample day</Button></section>;
}
