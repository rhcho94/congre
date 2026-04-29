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
      console.log(`[s3] PUT status=${xhr.status} response=${xhr.responseText?.slice(0, 200)}`);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload_http:${xhr.status} ${xhr.responseText?.slice(0, 100)}`));
    };
    xhr.onerror = () => reject(new Error("upload_network_error"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.send(blob);
  });
}
