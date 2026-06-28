import "dotenv/config";
import { Worker } from "bullmq";
import { getPrisma } from "@sempt/database";
import { getBullMqConnectionOptions } from "../lib/redis";
import { getOrCreateReport, getReportWindow } from "../lib/report-service";
import type { ReportQueuePayload } from "../lib/report-queue";

const connection = getBullMqConnectionOptions();
if (!connection) {
  throw new Error("REDIS_URL is required to run the report worker.");
}

const worker = new Worker<ReportQueuePayload>(
  "sempt-report-generation",
  async (job) => {
    const prisma = getPrisma();
    const window = getReportWindow(job.data.period);
    const existingJob = await prisma.reportJob.findFirst({
      where: { guildId: job.data.guildId, cacheKey: window.cacheKey },
      orderBy: { createdAt: "desc" }
    });
    if (existingJob) {
      await prisma.reportJob.update({ where: { id: existingJob.id }, data: { status: "PROCESSING" } });
    }
    const result = await getOrCreateReport(job.data.guildId, job.data.period);
    if (existingJob) {
      await prisma.reportJob.update({
        where: { id: existingJob.id },
        data: { status: "COMPLETED", reportId: result.report.id }
      });
    }
  },
  { connection }
);

worker.on("failed", async (job, error) => {
  if (!job) return;
  const prisma = getPrisma();
  await prisma.reportJob.updateMany({
    where: { guildId: job.data.guildId, status: { in: ["QUEUED", "PROCESSING"] } },
    data: { status: "FAILED", errorMessage: error.message.slice(0, 500) }
  });
});

console.log("Sempt report worker started.");
