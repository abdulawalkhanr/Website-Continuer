import { randomUUID } from "crypto";
import { Storage } from "@google-cloud/storage";

const sidecar = "http://127.0.0.1:1106";
export const storage = new Storage({
  credentials: { audience: "replit", subject_token_type: "access_token", token_url: `${sidecar}/token`, type: "external_account", credential_source: { url: `${sidecar}/credential`, format: { type: "json", subject_token_field_name: "access_token" } }, universe_domain: "googleapis.com" },
  projectId: "",
});

function privateLocation(): { bucket: string; prefix: string } {
  const raw = process.env.PRIVATE_OBJECT_DIR;
  if (!raw) throw new Error("PRIVATE_OBJECT_DIR is not configured");
  const [bucket, ...parts] = raw.replace(/^\/+/, "").split("/");
  if (!bucket) throw new Error("Invalid PRIVATE_OBJECT_DIR");
  return { bucket, prefix: parts.filter(Boolean).join("/") };
}
export function isReportObjectPath(path: string, customerId: number): boolean {
  return /^\/objects\/reports\/\d+\/[0-9a-f-]+$/.test(path) && path.startsWith(`/objects/reports/${customerId}/`);
}
function fileFor(path: string) {
  if (!path.startsWith("/objects/")) throw new Error("Invalid private object path");
  const { bucket, prefix } = privateLocation();
  const name = path.slice("/objects/".length);
  if (name.includes("..")) throw new Error("Invalid private object path");
  return storage.bucket(bucket).file([prefix, name].filter(Boolean).join("/"));
}
export async function createReportUpload(customerId: number, contentType: string): Promise<{ uploadURL: string; objectPath: string; headers: Record<string, string> }> {
  const { bucket, prefix } = privateLocation();
  const objectPath = `/objects/reports/${customerId}/${randomUUID()}`;
  const file = storage.bucket(bucket).file([prefix, objectPath.slice("/objects/".length)].filter(Boolean).join("/"));
  // Replit's sidecar signs with its workload identity; GCS service-account signing
  // cannot work here because the sidecar credentials do not include client_email.
  const response = await fetch(`${sidecar}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucket,
      object_name: file.name,
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      headers: { "Content-Type": contentType },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Object storage signing failed with status ${response.status}`);
  const result = await response.json() as { signed_url?: string };
  if (!result.signed_url) throw new Error("Object storage signing returned no URL");
  return { uploadURL: result.signed_url, objectPath, headers: { "Content-Type": contentType } };
}
export async function validateReportObject(path: string, customerId: number, contentType: string, declaredSize: number): Promise<void> {
  if (!isReportObjectPath(path, customerId)) throw new Error("Upload path does not belong to customer");
  const file = fileFor(path);
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isFinite(size) || size < 5 || size > 15 * 1024 * 1024 || size !== declaredSize) throw new Error("Invalid uploaded file size");
  if (metadata.contentType !== contentType) throw new Error("Invalid uploaded content type");
  const [head] = await file.download({ start: 0, end: 15 });
  const pdf = head.subarray(0, 5).toString("ascii") === "%PDF-";
  const jpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const png = head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!((contentType === "application/pdf" && pdf) || (contentType === "image/jpeg" && jpg) || (contentType === "image/png" && png))) throw new Error("File signature does not match declared type");
}
export async function downloadReport(path: string) { return fileFor(path).createReadStream(); }
export async function readReport(path: string): Promise<Buffer> { const [buffer] = await fileFor(path).download(); return buffer; }