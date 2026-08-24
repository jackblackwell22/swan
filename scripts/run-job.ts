import { runMonthlyInvoiceJob } from "../lib/jobs";

const job = process.argv[2];

async function main() {
  if (job === "monthly") {
    const result = await runMonthlyInvoiceJob();
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.error("Usage: npx tsx scripts/run-job.ts monthly");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
