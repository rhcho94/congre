import type { NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyEventCreated } from "@/lib/notifications/scenarios/event-created";
import { getPlanMaxClipSeconds, MAX_TOTAL_CLIP_SECONDS, type PlanId } from "@/lib/plans";

function tsToMs(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection("events").where("hostId", "==", uid).get();

    const events = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title as string,
          date: tsToMs(data.date),
          plan: data.plan as string,
          hostId: data.hostId as string,
          status: data.status as string,
          sessionToken: (data.sessionToken ?? null) as string | null,
          uploadToken: (data.uploadToken ?? undefined) as string | undefined,
          createdAt: tsToMs(data.createdAt),
          renderId: (data.renderId ?? undefined) as string | undefined,
          organizerEmail: (data.organizerEmail ?? undefined) as string | undefined,
          organizerPhone: (data.organizerPhone ?? undefined) as string | undefined,
          deadlineAt: tsToMs(data.deadlineAt),
          maxClipSeconds: (data.maxClipSeconds ?? undefined) as number | undefined,
        };
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    return Response.json({ events });
  } catch (err) {
    console.error("[api/events GET] Firestore error:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json() as {
    title?: string;
    date?: string;
    plan?: string;
    organizerEmail?: string;
    organizerPhone?: string;
    introText?: string;
    outroText?: string;
    maxClipSeconds?: number;
    maxClips?: number;
    couponCode?: string;
  };
  const { title, date, plan, organizerEmail, organizerPhone, maxClipSeconds, maxClips, couponCode } = body;

  if (!title || !date || !plan || !organizerEmail || !organizerPhone) {
    return Response.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  if (plan !== "free" && plan !== "paid") {
    return Response.json({ error: "INVALID_PLAN" }, { status: 400 });
  }

  if (plan === "paid") {
    if (
      typeof maxClips !== "number" ||
      !Number.isInteger(maxClips) ||
      maxClips < 10 ||
      maxClips > 200
    ) {
      return Response.json({ error: "INVALID_MAX_CLIPS" }, { status: 400 });
    }
  }

  const maxAllowed = getPlanMaxClipSeconds(plan as PlanId);
  if (
    maxClipSeconds !== undefined &&
    (
      typeof maxClipSeconds !== "number" ||
      !Number.isInteger(maxClipSeconds) ||
      maxClipSeconds < 10 ||
      maxClipSeconds > maxAllowed ||
      maxClipSeconds % 5 !== 0
    )
  ) {
    return Response.json({ error: "INVALID_CLIP_SECONDS", plan, maxAllowed }, { status: 400 });
  }

  const normalizedCouponCode = typeof couponCode === "string" ? couponCode.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  if (plan === "paid" && !normalizedCouponCode) {
    const total = (maxClips as number) * (maxClipSeconds ?? 15);
    if (total > MAX_TOTAL_CLIP_SECONDS) {
      return Response.json(
        { error: "TOTAL_TOO_LONG", maxTotalSeconds: MAX_TOTAL_CLIP_SECONDS },
        { status: 400 }
      );
    }
  }

  const organizerPhoneClean = typeof organizerPhone === "string" ? organizerPhone.replace(/\D/g, "") : "";
  if (!/^010\d{8}$/.test(organizerPhoneClean)) {
    return Response.json({ error: "INVALID_PHONE" }, { status: 400 });
  }

  const db = getAdminDb();

  // 쿠폰 검증 — couponCode가 있을 때만 진입, 없으면 기존 free/paid 생성 경로 그대로
  if (normalizedCouponCode) {
    const couponSnap = await db.collection("betaCoupons").doc(normalizedCouponCode).get();
    if (!couponSnap.exists) {
      return Response.json({ error: "INVALID_COUPON" }, { status: 400 });
    }
    if (couponSnap.data()?.used === true) {
      return Response.json({ error: "COUPON_ALREADY_USED" }, { status: 400 });
    }
    const expiresAt = couponSnap.data()?.expiresAt;
    if (!(expiresAt instanceof Timestamp)) {
      return Response.json({ error: "INVALID_COUPON" }, { status: 400 });
    }
    if (expiresAt.toMillis() < Date.now()) {
      return Response.json({ error: "COUPON_EXPIRED" }, { status: 400 });
    }
  }

  const sessionToken = crypto.randomUUID();

  const ref = await db.collection("events").add({
    title,
    date: Timestamp.fromDate(new Date(date + "T00:00:00")),
    plan: normalizedCouponCode ? "paid" : plan,
    hostId: uid,
    status: "open",
    sessionToken,
    uploadToken: sessionToken,
    createdAt: FieldValue.serverTimestamp(),
    organizerEmail,
    organizerPhone: organizerPhoneClean,
    ...(body.introText !== undefined ? { introText: body.introText } : {}),
    ...(body.outroText !== undefined ? { outroText: body.outroText } : {}),
    ...(normalizedCouponCode
      ? { maxClipSeconds: 15 }
      : maxClipSeconds !== undefined ? { maxClipSeconds } : {}),
    ...(normalizedCouponCode
      ? { maxClips: 30 }
      : plan === "paid" ? { maxClips } : {}),
    ...(normalizedCouponCode ? { unlocked: true, unlockedBy: normalizedCouponCode } : {}),
  });

  const eventId = ref.id;

  if (normalizedCouponCode) {
    await db.collection("betaCoupons").doc(normalizedCouponCode).set(
      { used: true, eventId, usedAt: FieldValue.serverTimestamp() },
      { merge: true }
    ).catch((err) => console.error("[api/events] betaCoupons mark-used error:", err));
  }

  const origin = request.headers.get("origin") ?? "";
  const dashboardUrl = `${origin}/dashboard/events/${eventId}`;

  await notifyEventCreated({ eventId, title, date, organizerEmail, dashboardUrl }).catch((err) =>
    console.error("[api/events] notifyEventCreated error:", err)
  );

  return Response.json({
    eventId,
    sessionToken,
    ...(normalizedCouponCode
      ? { maxClips: 30 }
      : plan === "paid" ? { maxClips } : {}),
  });
}
