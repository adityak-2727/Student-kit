import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShellPreviewPage() {
  // Unconditional server gate. No query parameter, cookie, or test-auth flag enables it.
  if (process.env.NODE_ENV !== "development") notFound();
  const [{ ShellPreview }, { syntheticTasks, previewDate }] = await Promise.all([
    import("@/features/shell/shell-preview"), import("@/features/shell/fixtures.server"),
  ]);
  return <ShellPreview initialTasks={syntheticTasks} initialDate={previewDate} />;
}
