import type { Timestamp } from "firebase/firestore";

export type EventPlan = "free" | "paid";
export type EventStatus = "open" | "closed" | "rendering" | "done";

export interface CongreEvent {
  id: string;
  title: string;
  date: Timestamp;
  plan: EventPlan;
  hostId: string;
  status: EventStatus;
  sessionToken: string | null;
  uploadToken?: string;          // 원본 토큰 — 마감 후에도 QR 재표시용으로 보존
  createdAt: Timestamp;
  renderId?: string;
  videoUrl?: string;
  videoS3Key?: string;
  renderDoneAt?: Timestamp;
  videos?: Array<{ renderId: string; s3Key: string; doneAt: Timestamp }>;
  organizerEmail?: string;
  organizerPhone?: string;
  deadlineAt?: Timestamp;        // 마감 시각 — render/start에서 저장, 완료 시간 계산용
  introText?: string;
  introMediaKey?: string;
  introMediaType?: "image" | "video";
  outroText?: string;
  outroMediaKey?: string;
  outroMediaType?: "image" | "video";
  maxClips?: number;             // 유료 정원 — 호스트 설정, 클립 업로드 차단 기준
  unlocked?: boolean;            // 결제/쿠폰으로 paid 플랜 렌더 게이트 해제 여부
  unlockedBy?: string;           // 해제 근거 (베타 쿠폰 정규화 전화번호 등)
}

export interface Clip {
  id: string;
  eventId: string;
  s3Key: string;
  uploadedAt: Timestamp;
  uploaderName?: string;
  uploaderPhone?: string;
  sessionToken?: string;
  excludedAt?: Timestamp | null;
}
