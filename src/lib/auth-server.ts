import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "./firebase-admin";

export async function verifyIdToken(req: NextRequest): Promise<DecodedIdToken> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new Error("Authorization 헤더가 없습니다");
  return getAdminAuth().verifyIdToken(token);
}
