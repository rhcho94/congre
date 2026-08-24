import type { NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { calcPrice, calcRawPrice, calcRerenderPrice } from "@/lib/plans";

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

  let mode: "first" | "rerender";
  if (eventData.status === "open" && eventData.unlocked !== true) {
    mode = "first";
  } else if (
    (eventData.status === "closed" || eventData.status === "done") &&
    eventData.unlocked === true
  ) {
    mode = "rerender";
  } else {
    return Response.json({ error: "INVALID_EVENT_STATE" }, { status: 400 });
  }

  const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();
  const includedDocs = clipsSnap.docs.filter((d) => !d.data().excludedAt);
  const clipCount = includedDocs.length;

  const maxClipSeconds = eventData.maxClipSeconds as number | undefined;

  if (typeof maxClipSeconds !== "number" || !Number.isInteger(maxClipSeconds) || maxClipSeconds <= 0) {
    return Response.json({ error: "INVALID_EVENT_DATA" }, { status: 400 });
  }

  let amount: number;
  let rawAmount: number;
  let firstAmount: number | undefined;

  if (mode === "first") {
    amount = calcPrice(maxClipSeconds, clipCount);
    rawAmount = calcRawPrice(maxClipSeconds, clipCount);
  } else {
    firstAmount = eventData.firstPaidAmount as number | undefined;
    if (typeof firstAmount !== "number" || !Number.isInteger(firstAmount) || firstAmount <= 0) {
      return Response.json({ error: "MISSING_FIRST_AMOUNT" }, { status: 400 });
    }
    amount = calcRerenderPrice(firstAmount);
    rawAmount = amount;
  }

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
      mode,
    });
  } catch (err) {
    console.error("[payment/prepare] failed to save order:", err);
    return Response.json({ error: "ORDER_SAVE_FAILED" }, { status: 500 });
  }

  return Response.json({
    orderId,
    amount,
    rawAmount,
    clipCount,
    orderName,
    maxClipSeconds,
    title: (eventData.title ?? null) as string | null,
    mode,
    ...(mode === "rerender" ? { firstAmount } : {}),
  });
}
