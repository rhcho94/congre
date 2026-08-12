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

  const body = await request.json() as { paymentKey?: string; orderId?: string; amount?: number };
  const { paymentKey, orderId, amount } = body;

  if (!paymentKey || !orderId || typeof amount !== "number") {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const db = getAdminDb();
  const orderRef = db.collection("payments").doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return Response.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  const order = orderSnap.data()!;

  if (order.hostId !== uid) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (order.status !== "pending") {
    return Response.json({ error: "ORDER_NOT_PENDING" }, { status: 400 });
  }

  if (amount !== order.amount) {
    return Response.json({ error: "AMOUNT_MISMATCH" }, { status: 400 });
  }

  const eventId = order.eventId as string;
  const eventRef = db.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();

  if (!eventSnap.exists) {
    return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  }

  const eventData = eventSnap.data()!;
  const maxClipSeconds = eventData.maxClipSeconds as number | undefined;
  if (typeof maxClipSeconds !== "number" || !Number.isInteger(maxClipSeconds) || maxClipSeconds <= 0) {
    return Response.json({ error: "INVALID_EVENT_DATA" }, { status: 400 });
  }

  const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();
  const currentCount = clipsSnap.docs.filter((d) => !d.data().excludedAt).length;

  if (currentCount !== order.clipCount) {
    const newAmount = calcPrice(maxClipSeconds, currentCount);
    try {
      await orderRef.update({ status: "stale" });
    } catch (err) {
      console.error("[payment/confirm] failed to mark order stale:", err);
    }
    return Response.json(
      { error: "CLIP_COUNT_CHANGED", savedCount: order.clipCount, currentCount, newAmount },
      { status: 409 }
    );
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    console.error("[payment/confirm] TOSS_SECRET_KEY missing");
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  let tossJson: Record<string, unknown>;
  let tossRes: Response;
  try {
    tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    tossJson = await tossRes.json();
  } catch (err) {
    console.error("[payment/confirm] toss confirm request failed:", err);
    try {
      await orderRef.update({ status: "failed" });
    } catch (updateErr) {
      console.error("[payment/confirm] failed to mark order failed:", updateErr);
    }
    return Response.json({ error: "TOSS_REQUEST_FAILED" }, { status: 400 });
  }

  if (!tossRes.ok) {
    try {
      await orderRef.update({ status: "failed" });
    } catch (err) {
      console.error("[payment/confirm] failed to mark order failed:", err);
    }
    return Response.json(tossJson, { status: 400 });
  }

  try {
    await orderRef.update({
      status: "paid",
      paymentKey,
      paidAt: Timestamp.now(),
    });
    await eventRef.update({
      unlocked: true,
      status: "closed",
      sessionToken: null,
    });
  } catch (err) {
    console.error("[payment/confirm] failed to save paid status:", err);
    return Response.json({ error: "SAVE_FAILED" }, { status: 500 });
  }

  return Response.json({ ok: true, eventId });
}
