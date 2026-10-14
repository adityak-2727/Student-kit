"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, ChartNoAxesCombined, CircleUserRound, Ellipsis, LayoutGrid, Settings2, Sun, Users } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Hint } from "@/components/ui/hint";

export type PreviewView = "today" | "planner" | "study" | "insights" | "friends" | "domains" | "profile" | "settings";
export const viewTitles: Record<PreviewView, string> = { today: "Today", planner: "Planner", study: "Study", insights: "Insights", friends: "Friends", domains: "Domains", profile: "Profile", settings: "Settings" };
const primary = [
  { view: "today", label: "Today", icon: Sun }, { view: "planner", label: "Planner", icon: CalendarDays },
  { view: "study", label: "Study", icon: BookOpen }, { view: "insights", label: "Insights", icon: ChartNoAxesCombined },
] as const;
const secondary = [
  { view: "domains", label: "Domains", icon: LayoutGrid }, { view: "friends", label: "Friends", icon: Users },
  { view: "profile", label: "Profile", icon: CircleUserRound }, { view: "settings", label: "Settings", icon: Settings2 },
] as const;

export function ShellNavigation({ view, onViewChange }: { view: PreviewView; onViewChange: (view: PreviewView) => void }) {
  return <Tooltip.Provider delayDuration={350}>
    <aside className="sidebar">
      <div className="sidebar-brand"><Brand /></div>
      <p className="sidebar-caption">Your workspace</p>
      <nav aria-label="Workspace navigation" className="sidebar-nav">
        {[...primary, ...secondary].map((item) => <Hint key={item.view} text={item.label}><button className="nav-item" aria-label={item.label} aria-current={view === item.view ? "page" : undefined} onClick={() => onViewChange(item.view)}><item.icon aria-hidden="true" /><span>{item.label}</span></button></Hint>)}
      </nav>
      <div className="sidebar-bottom"><p>One day at a time.</p><Link href="/" className="nav-item"><ArrowLeft aria-hidden="true" /><span>Leave preview</span></Link></div>
    </aside>
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {primary.map((item) => <button key={item.view} aria-current={view === item.view ? "page" : undefined} onClick={() => onViewChange(item.view)}><item.icon aria-hidden="true" /><span>{item.label}</span></button>)}
      <Menu.Root><Menu.Trigger className="more-trigger" aria-current={secondary.some((item) => item.view === view) ? "page" : undefined}><Ellipsis aria-hidden="true" /><span>More</span></Menu.Trigger><Menu.Portal><Menu.Content className="menu-content" side="top" align="end" sideOffset={12} aria-label="More destinations">{secondary.map((item) => <Menu.Item className="menu-item" key={item.view} onSelect={() => onViewChange(item.view)}><item.icon aria-hidden="true" />{item.label}</Menu.Item>)}<Menu.Separator className="menu-separator" /><Menu.Item asChild className="menu-item"><Link href="/"><ArrowLeft aria-hidden="true" />Leave preview</Link></Menu.Item></Menu.Content></Menu.Portal></Menu.Root>
    </nav>
  </Tooltip.Provider>;
}

export function ProfileMenu({ onViewChange }: { onViewChange: (view: PreviewView) => void }) {
  return <Menu.Root><Menu.Trigger className="sample-avatar" aria-label="Open preview profile menu">DL</Menu.Trigger><Menu.Portal><Menu.Content className="menu-content" align="end" sideOffset={8}><Menu.Label className="menu-label">Sample profile · no account</Menu.Label><Menu.Item className="menu-item" onSelect={() => onViewChange("profile")}><CircleUserRound aria-hidden="true" />Profile preview</Menu.Item><Menu.Item className="menu-item" onSelect={() => onViewChange("settings")}><Settings2 aria-hidden="true" />Display settings</Menu.Item></Menu.Content></Menu.Portal></Menu.Root>;
}
