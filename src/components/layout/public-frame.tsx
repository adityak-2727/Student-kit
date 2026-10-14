import { Brand } from "./brand";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return <>
    <header className="site-header"><Brand /><span className="build-label">Development preview</span></header>
    {children}
    <footer className="site-footer">Made for a student’s day. Built one thoughtful step at a time.</footer>
  </>;
}
