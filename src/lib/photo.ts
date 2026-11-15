// 하객 사진 업로드 (서버용). 사진은 클립 기록 1개로 저장되고 완성본에 PHOTO_SECONDS초 나온다.
export const PHOTO_SECONDS = 5;

// PHOTO_UPLOAD=off → 전체 끔. 쿠폰 행사(unlockedBy가 비어 있지 않은 문자열)는 PHOTO_UPLOAD_COUPON=on일 때만 켬.
// 두 환경변수가 없으면: 사진 켜짐, 쿠폰 행사만 꺼짐.
export function isPhotoAllowed(eventData: FirebaseFirestore.DocumentData): boolean {
  if ((process.env.PHOTO_UPLOAD ?? "").trim().toLowerCase() === "off") return false;
  const unlockedBy = eventData.unlockedBy;
  if (typeof unlockedBy === "string" && unlockedBy !== "") {
    return (process.env.PHOTO_UPLOAD_COUPON ?? "").trim().toLowerCase() === "on";
  }
  return true;
}
