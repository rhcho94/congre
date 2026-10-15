import { DescribeExecutionCommand, SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const ENGINE_STATE_MACHINE_ARN = (process.env.ENGINE_STATE_MACHINE_ARN ?? "").trim();

export function isEngineConfigured(): boolean {
  return Boolean(
    ENGINE_STATE_MACHINE_ARN &&
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

let sfnClient: SFNClient | null = null;

function sfn(): SFNClient {
  if (!sfnClient) {
    sfnClient = new SFNClient({
      region: (process.env.AWS_REGION ?? "").trim(),
      credentials: {
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID ?? "").trim(),
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY ?? "").trim(),
      },
    });
  }
  return sfnClient;
}

const TRANSITION_POOLS = {
  default: ["fadeFast", "slideLeftFast", "slideRightFast", "zoom"],
  soft: ["fade", "fadeSlow"],
  dynamic: ["slideLeftFast", "slideRightFast", "zoom"],
} as const;

export type TransitionStyle = keyof typeof TRANSITION_POOLS;

function pickSequence(pool: readonly string[], count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    let pick: string;
    do {
      pick = pool[Math.floor(Math.random() * pool.length)];
    } while (i > 0 && pick === result[i - 1]);
    result.push(pick);
  }
  return result;
}

export function pickTransitions(
  count: number,
  style: TransitionStyle = "default"
): { transitionsIn: string[]; transitionsOut: string[] } {
  const pool = TRANSITION_POOLS[style];
  return {
    transitionsIn: pickSequence(pool, count),
    transitionsOut: pickSequence(pool, count),
  };
}

export type EngineSegment = { type: "clip" | "card" | "image" | "video"; plan: string } & Record<string, unknown>;

export async function startEngineRender(input: {
  jobId: string;
  segments: EngineSegment[];
  bgm: { key: string; mode: "once" } | null;
  outKey: string;
}): Promise<{ executionArn: string }> {
  const res = await sfn().send(new StartExecutionCommand({
    stateMachineArn: ENGINE_STATE_MACHINE_ARN,
    name: input.jobId,
    input: JSON.stringify({
      job_id: input.jobId,
      segments: input.segments,
      bgm: input.bgm,
      out_key: input.outKey,
    }),
  }));
  if (!res.executionArn) throw new Error("engine_start:no_execution_arn");
  return { executionArn: res.executionArn };
}

export async function getEngineRenderStatus(executionArn: string): Promise<{
  status: "running" | "succeeded" | "failed";
  skipped?: { index: number; code?: string }[];
  outKey?: string;
  errorCode?: string;
}> {
  const res = await sfn().send(new DescribeExecutionCommand({ executionArn }));

  if (res.status === "RUNNING") return { status: "running" };

  if (res.status === "SUCCEEDED") {
    try {
      const output = JSON.parse(res.output ?? "{}") as {
        merge?: { result?: { out_key?: string; skipped?: { index: number; code?: string }[] } };
      };
      const result = output.merge?.result;
      return {
        status: "succeeded",
        skipped: Array.isArray(result?.skipped) ? result.skipped : undefined,
        outKey: typeof result?.out_key === "string" ? result.out_key : undefined,
      };
    } catch {
      return { status: "succeeded" };
    }
  }

  return { status: "failed", errorCode: res.error ?? undefined };
}
