import type { NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { calcPrice } from "@/lib/plans";

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json() as { eventId?: string };
  const { eventId } = body;

  if (!eventId) {
    return Response.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });
  }

  const db = getAdminDb();
  const eventSnap = await db.collection("events").doc(eventId).get();

  if (!eventSnap.exists) {
    return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  }

  const eventData = eventSnap.data()!;

  if (eventData.hostId !== uid) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (eventData.plan !== "paid") {
    return Response.json({ error: "NOT_PAID_PLAN" }, { status: 400 });
  }

  if (eventData.status !== "open") {
    return Response.json({ error: "EVENT_NOT_OPEN" }, { status: 400 });
  }

  if (eventData.unlocked === true) {
    return Response.json({ error: "ALREADY_UNLOCKED" }, { status: 400 });
  }

  const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();
  const includedDocs = clipsSnap.docs.filter((d) => !d.data().excludedAt);
  const clipCount = includedDocs.length;

  if (clipCount === 0) {
    return Response.json({ error: "NO_CLIPS" }, { status: 400 });
  }

  const maxClipSeconds = eventData.maxClipSeconds as number | undefined;
  if (typeof maxClipSeconds !== "number" || !Number.isInteger(maxClipSeconds) || maxClipSeconds <= 0) {
    return Response.json({ error: "INVALID_EVENT_DATA" }, { status: 400 });
  }
  const amount = calcPrice(maxClipSeconds, clipCount);

  const orderId = `congre_${eventId}_${Date.now()}`;
  const orderName = "Congre 영상 제작 — 유료";

  try {
    await db.collection("payments").doc(orderId).set({
      orderId,
      eventId,
      hostId: uid,
      amount,
      clipCount,
      status: "pending",
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error("[payment/prepare] failed to save order:", err);
    return Response.json({ error: "ORDER_SAVE_FAILED" }, { status: 500 });
  }

  return Response.json({ orderId, amount, clipCount, orderName, maxClipSeconds });
}
