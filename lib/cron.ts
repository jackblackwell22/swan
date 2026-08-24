import cron from "node-cron";
import { londonDateISO } from "@/lib/format";
import { runMonthlyInvoiceJob, runReminderJob } from "@/lib/jobs";

let started = false;

export function startCron() {
  if (started) return;
  started = true;

  cron.schedule(
    "5 8 1 * *",
    async () => {
      try {
        await runMonthlyInvoiceJob();
        console.info(`[cron] monthly invoices ran for ${londonDateISO()}`);
      } catch (error) {
        console.error("[cron] monthly invoices failed", error);
      }
    },
    { timezone: "Europe/London" },
  );

  cron.schedule(
    "10 9 * * *",
    async () => {
      try {
        await runReminderJob();
        console.info(`[cron] reminders ran for ${londonDateISO()}`);
      } catch (error) {
        console.error("[cron] reminders failed", error);
      }
    },
    { timezone: "Europe/London" },
  );
}
