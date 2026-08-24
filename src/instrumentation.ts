export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMonthlyCron } = await import("./lib/cron");
    startMonthlyCron();
  }
}
