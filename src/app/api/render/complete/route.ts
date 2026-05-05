import type { NextRequest } from "next/server";

// 렌더 완료 처리는 /api/cron/check-rendering 서버 cron이 담당.
// 이 라우트는 향후 Shotstack webhook 수신용으로 보존.
export async function POST(_request: NextRequest) {
  return Response.json({ error: "USE_CRON" }, { status: 401 });
}
