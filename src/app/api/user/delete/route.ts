import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { deleteS3Object } from "@/lib/s3-server";
import { deleteShotstackAssetsByRenderId } from "@/lib/shotstack";

export async function POST(request: NextRequest) {
  // 1. 인증
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return Response.json({ code: "UNAUTHORIZED", message: "인증 토큰 없음" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    console.error("[user/delete] verifyIdToken failed:", err);
    return Response.json({ code: "INVALID_TOKEN", message: "토큰 검증 실패" }, { status: 401 });
  }

  const db = getAdminDb();

  // 2. 진행 중 이벤트 카운트 체크 (서버 측 재검증)
  const inProgressSnap = await db
    .collection("events")
    .where("hostId", "==", uid)
    .where("status", "in", ["open", "rendering"])
    .get();

  if (inProgressSnap.size > 0) {
    return Response.json(
      {
        code: "INCOMPLETE_EVENTS",
        message: `진행 중 이벤트 ${inProgressSnap.size}개를 먼저 마감해주세요`,
      },
      { status: 400 }
    );
  }

  // 3. 일괄 삭제
  const allEventsSnap = await db.collection("events").where("hostId", "==", uid).get();

  for (const eventDoc of allEventsSnap.docs) {
    const eventId = eventDoc.id;
    const eventData = eventDoc.data();

    // 3a. 해당 이벤트의 모든 클립 → S3 + Firestore 삭제
    const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();
    for (const clipDoc of clipsSnap.docs) {
      const s3Key = clipDoc.data().s3Key as string | undefined;
      if (s3Key) {
        try {
          await deleteS3Object(s3Key);
        } catch (e) {
          console.warn("[user/delete] S3 delete failed:", { eventId, clipId: clipDoc.id, error: e });
        }
      }
      await db.collection("clips").doc(clipDoc.id).delete();
    }

    // 3b. Shotstack 자산 삭제 (renderId 있고 videoUrl 살아있을 때)
    if (eventData.renderId && eventData.videoUrl) {
      try {
        await deleteShotstackAssetsByRenderId(eventData.renderId as string);
      } catch (e) {
        console.warn("[user/delete] Shotstack delete failed:", { eventId, error: e });
      }
    }

    // 3c. 이벤트 문서 삭제
    await db.collection("events").doc(eventId).delete();
  }

  // 4. users 문서 삭제
  await db.collection("users").doc(uid).delete();

  // 5. Auth 계정 삭제 (마지막 — 이후 토큰 무효)
  try {
    await getAdminAuth().deleteUser(uid);
  } catch (err) {
    console.error("[user/delete] deleteUser failed:", err);
    return Response.json(
      { code: "AUTH_DELETE_FAILED", message: "계정 삭제 중 오류" },
      { status: 500 }
    );
  }

  console.log("[user/delete] success:", { uid, eventsDeleted: allEventsSnap.size });
  return Response.json({ ok: true });
}
