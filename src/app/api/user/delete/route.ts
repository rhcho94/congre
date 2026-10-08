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

  // Firestore 삭제가 중간에 실패하면 users·Auth를 지우기 전에 멈춘다.
  // 다시 요청하면 hostId로 남은 이벤트를 다시 조회해 이어서 지운다.
  try {
    for (const eventDoc of allEventsSnap.docs) {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data();

      // 3a. 해당 이벤트의 모든 클립 → S3(원본·썸네일) + Firestore 삭제
      const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();
      for (const clipDoc of clipsSnap.docs) {
        const clipData = clipDoc.data();
        const keys = [clipData.s3Key, clipData.thumbKey].filter((k): k is string => typeof k === "string" && k.length > 0);
        for (const key of keys) {
          try {
            await deleteS3Object(key);
          } catch (e) {
            console.error("[user/delete] S3 clip delete failed:", { eventId, key, error: e });
          }
        }
        await db.collection("clips").doc(clipDoc.id).delete();
      }

      // 3a-2. 인트로·아웃트로 파일 S3 삭제
      for (const key of [eventData.introMediaKey, eventData.outroMediaKey]) {
        if (typeof key !== "string" || !key) continue;
        try {
          await deleteS3Object(key);
        } catch (e) {
          console.error("[user/delete] S3 host media delete failed:", { eventId, key, error: e });
        }
      }

      // 3a-3. 이 이벤트의 알림 발송 기록 삭제
      const notificationsSnap = await db.collection("notifications").where("eventId", "==", eventId).get();
      for (let i = 0; i < notificationsSnap.docs.length; i += 500) {
        const batch = db.batch();
        for (const d of notificationsSnap.docs.slice(i, i + 500)) batch.delete(d.ref);
        await batch.commit();
      }

      // 3b. Shotstack 자산 + S3 완성본 삭제
      // videos[] 있는 신규 문서: 배열 전원소 삭제 (탈퇴 = 전량, 만료 여부 무관)
      const videosArr = eventData.videos as Array<{ renderId: string; s3Key: string }> | undefined;
      if (videosArr && videosArr.length > 0) {
        for (const entry of videosArr) {
          try {
            await deleteShotstackAssetsByRenderId(entry.renderId);
          } catch (e) {
            console.error("[user/delete] Shotstack delete failed:", { eventId, renderId: entry.renderId, error: e });
          }
          try {
            await deleteS3Object(entry.s3Key);
          } catch (e) {
            console.error("[user/delete] S3 video delete failed:", { eventId, s3Key: entry.s3Key, error: e });
          }
        }
      } else if (eventData.renderId && eventData.videoS3Key) {
        // videos[] 없는 옛 문서: 기존 단건 로직 (하위호환)
        try {
          await deleteShotstackAssetsByRenderId(eventData.renderId as string);
        } catch (e) {
          console.error("[user/delete] Shotstack delete failed:", { eventId, error: e });
        }
        try {
          await deleteS3Object(eventData.videoS3Key as string);
        } catch (e) {
          console.error("[user/delete] S3 video delete failed:", { eventId, error: e });
        }
      }

      // 3c. 이벤트 문서 삭제
      await db.collection("events").doc(eventId).delete();
    }
  } catch (err) {
    console.error("[user/delete] partial delete failed:", err);
    return Response.json(
      { code: "PARTIAL_DELETE", message: "일부 데이터 삭제 중 오류가 났습니다. 다시 시도해 주세요." },
      { status: 500 }
    );
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
