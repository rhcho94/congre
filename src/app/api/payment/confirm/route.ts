import type { NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { calcPrice } from "@/lib/plans";

const STATUS_UNKNOWN_MESSAGE =
  "결제 결과를 확인하지 못했어요. 이 화면을 새로고침해 주세요. 결제가 두 번 되지는 않아요. 계속 안 되면 카카오톡 @congre로 문의해 주세요.";

async function lookupTossPayment(
  orderId: string,
  authHeader: string
): Promise<{ ok: boolean; httpStatus?: number; status?: string; totalAmount?: number; paymentKey?: string; code?: string }> {
  try {
    const res = await fetch(
      `https://api.tosspayments.com/v1/payments/orders/${encodeURIComponent(orderId)}`,
      { method: "GET", headers: { Authorization: authHeader } }
    );
    const json = (await res.json()) as Record<string, unknown>;
    return {
      ok: res.ok,
      httpStatus: res.status,
      status: typeof json?.status === "string" ? json.status : undefined,
      totalAmount: typeof json?.totalAmount === "number" ? json.totalAmount : undefined,
      paymentKey: typeof json?.paymentKey === "string" ? json.paymentKey : undefined,
      code: typeof json?.code === "string" ? json.code : undefined,
    };
  } catch (err) {
    console.error("[payment/confirm] toss lookup failed:", err);
    return { ok: false };
  }
}

function isConfirmedPaid(
  lookup: Awaited<ReturnType<typeof lookupTossPayment>>,
  orderAmount: number,
  paymentKey: string
): boolean {
  return (
    lookup.ok &&
    lookup.status === "DONE" &&
    lookup.totalAmount === orderAmount &&
    lookup.paymentKey === paymentKey
  );
}

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

  const mode = order.mode ?? "first";

  if (mode === "first") {
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
        { error: "CLIP_COUNT_CHANGED", eventId, savedCount: order.clipCount, currentCount, newAmount },
        { status: 409 }
      );
    }
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    console.error("[payment/confirm] TOSS_SECRET_KEY missing");
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  let tossJson: Record<string, unknown> = {};
  let tossOk = false;
  let tossStatus = 0;
  let confirmedByLookup = false;
  try {
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    tossJson = await tossRes.json();
    tossOk = tossRes.ok;
    tossStatus = tossRes.status;
  } catch (err) {
    console.error("[payment/confirm] toss confirm request failed:", err);
    const lookup = await lookupTossPayment(orderId, authHeader);
    if (isConfirmedPaid(lookup, order.amount, paymentKey)) {
      console.warn("[payment/confirm] confirm request failed but payment is DONE; continuing", { orderId });
      confirmedByLookup = true;
    } else {
      console.error("[payment/confirm] payment status unknown after request failure", { orderId, lookup });
      return Response.json({ error: "PAYMENT_STATUS_UNKNOWN", message: STATUS_UNKNOWN_MESSAGE }, { status: 502 });
    }
  }

  if (!confirmedByLookup && !tossOk) {
    console.error("[payment/confirm] toss confirm non-OK:", { orderId, status: tossStatus, code: tossJson?.code, message: tossJson?.message });
    if (tossJson?.code === "ALREADY_PROCESSING_REQUEST") {
      return Response.json(
        { error: "PAYMENT_PROCESSING", message: "결제를 처리하고 있어요. 잠시 뒤 이 화면을 새로고침해 주세요." },
        { status: 409 }
      );
    }
    if (tossJson?.code === "ALREADY_PROCESSED_PAYMENT") {
      const lookup = await lookupTossPayment(orderId, authHeader);
      if (isConfirmedPaid(lookup, order.amount, paymentKey)) {
        console.warn("[payment/confirm] already processed and DONE; continuing", { orderId });
      } else {
        console.error("[payment/confirm] already processed but not confirmed DONE", { orderId, lookup });
        return Response.json({ error: "PAYMENT_STATUS_UNKNOWN", message: STATUS_UNKNOWN_MESSAGE }, { status: 502 });
      }
    } else {
      try {
        await orderRef.update({ status: "failed" });
      } catch (err) {
        console.error("[payment/confirm] failed to mark order failed:", err);
      }
      return Response.json(tossJson, { status: 400 });
    }
  }

  let alreadySaved = false;
  try {
    await db.runTransaction(async (tx) => {
      alreadySaved = false;
      const snap = await tx.get(orderRef);
      if (snap.data()?.status === "paid") {
        alreadySaved = true;
        return;
      }
      const paidAt = Timestamp.now();
      tx.update(orderRef, {
        status: "paid",
        paymentKey,
        paidAt,
      });
      const refundFields = {
        refund50At: Timestamp.fromMillis(
          paidAt.toMillis() + 4 * 60 * 60 * 1000
        ),
        refund100At: Timestamp.fromMillis(
          paidAt.toMillis() + 48 * 60 * 60 * 1000
        ),
      };

      if (mode === "first") {
        tx.update(eventRef, {
          unlocked: true,
          status: "closed",
          sessionToken: null,
          closedAt: FieldValue.serverTimestamp(),
          firstPaidAmount: amount,
          ...refundFields,
        });
      } else {
        tx.update(eventRef, {
          ...refundFields,
        });
      }
    });
  } catch (err) {
    console.error("[payment/confirm] failed to save paid status:", err);
    return Response.json(
      { error: "SAVE_FAILED", message: "결제는 됐지만 기록 저장에 실패했어요. 이 화면을 새로고침해 주세요. 계속 안 되면 카카오톡 @congre로 문의해 주세요." },
      { status: 500 }
    );
  }

  if (alreadySaved) {
    console.warn("[payment/confirm] order already paid; skipping save", { orderId });
  }

  return Response.json({ ok: true, eventId });
}
