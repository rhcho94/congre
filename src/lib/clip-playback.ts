"use client";

import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "./firebase";

export async function getClipPlaybackUrl(
  clipId: string
): Promise<{ url: string; expiresAt: number }> {
  const auth = getAuth(getFirebaseApp());
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("로그인이 필요합니다");

  const res = await fetch(`/api/clips/${clipId}/playback`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `playback_failed:${res.status}`);
  }

  return res.json() as Promise<{ url: string; expiresAt: number }>;
}
