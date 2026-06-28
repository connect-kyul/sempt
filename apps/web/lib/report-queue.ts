import { Queue } from "bullmq";
import { getPrisma } from "@sempt/database";
import { getBullMqConnectionOptions } from "./redis";
import { getReportWindow, type ReportPeriodValue } from "./report-service";

export interface ReportQueuePayload {
  guildId: string;
  period: ReportPeriodValue;
  requestedBy?: string;
}

let queue: Queue | null | undefined;

export function getReportQueue(): Queue | null {
  if (queue !== undefined) return queue;
  const connection = getBullMqConnectionOptions();
  if (!connection || process.env.REPORT_QUEUE_ENABLED === "false") {
    queue = null;
    return queue;
  }
  queue = new Queue("sempt-report-generation", { connection });
  return queue;
}

export async function enqueueReportGeneration(payload: ReportQueuePayload) {
  const prisma = getPrisma();
  const window = getReportWindow(payload.period);
  const job = await prisma.reportJob.create({
    data: {
      guildId: payload.guildId,
      period: payload.period,
      cacheKey: window.cacheKey,
      createdBy: payload.requestedBy
    }
  });

  const queue = getReportQueue();
  if (queue) {
    await queue.add("generate-report", payload, {
      jobId: `${payload.guildId}:${window.cacheKey}`,
      attempts: 2,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 100
    });
    return { job, queued: true };
  }

  return { job, queued: false };
}
