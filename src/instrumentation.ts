export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getRuntimeEnvironment } = await import("./server/config/environment");
    const environment = getRuntimeEnvironment();
    if (environment.APP_MODE === "live") {
      process.env.NEXTAUTH_URL = environment.APP_ORIGIN;
      if (process.env.NODE_ENV === "production") {
        const { getIntegrationEnvironment } = await import("./server/config/environment");
        const { verifyAccountDependencies } = await import("./server/encryption/availability");
        await verifyAccountDependencies(getIntegrationEnvironment());
      }
    }
  }
}
