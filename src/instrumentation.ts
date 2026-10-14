export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getRuntimeEnvironment } = await import("./server/config/environment");
    getRuntimeEnvironment();
  }
}
