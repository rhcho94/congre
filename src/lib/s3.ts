export async function checkS3(): Promise<boolean> {
  try {
    const res = await fetch("/api/upload/presign");
    const json = await res.json();
    return json.configured === true;
  } catch {
    return false;
  }
}

export async function getPresignedUrl(
  eventId: string,
  fileName: string,
  fileType: string
): Promise<{ url: string; key: string }> {
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, fileName, fileType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `presign_failed:${res.status}`);
  }
  return res.json();
}

export function uploadToS3(
  url: string,
  blob: Blob,
  mimeType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      console.log(`[s3] PUT status=${xhr.status} response=${xhr.responseText?.slice(0, 300)}`);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload_http:${xhr.status} ${xhr.responseText?.slice(0, 200)}`));
    };
    xhr.onerror = () => {
      // onerror는 보통 CORS 거부 또는 네트워크 단절 시 발생
      // CORS 에러는 브라우저가 세부 내용을 차단하므로 F12 Network 탭 확인 필요
      console.error(`[s3] XHR onerror — 가능한 원인: CORS(PUT 미허용), 네트워크 단절, URL 만료`);
      console.error(`[s3] S3 PUT url(앞 100자): ${url.slice(0, 100)}`);
      reject(new Error("upload_network_error — CORS 또는 네트워크 문제. F12 Network 탭 확인"));
    };
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.send(blob);
  });
}
