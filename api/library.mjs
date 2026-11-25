import { sign } from "node:crypto";
import { validateLibrarySnapshot } from "../src/data/library-contract.mjs";

const MAX_BYTES = 3_500_000;
const MAX_AGE = 10 * 60 * 1000;
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
let cachedToken;

async function getToken(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken?.email === email && now + 60 < cachedToken.expires) return cachedToken.value;
  const claim = encode({
    iss: email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  });
  const payload = `${encode({ alg: "RS256", typ: "JWT" })}.${claim}`;
  const signature = sign("RSA-SHA256", Buffer.from(payload), privateKey.replace(/\\n/g, "\n")).toString("base64url");
  const result = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${payload}.${signature}`,
    }),
    signal: AbortSignal.timeout(4000),
    redirect: "error",
  });
  if (!result.ok) throw new Error("Drive authentication failed");
  const { access_token, expires_in } = await result.json();
  if (typeof access_token !== "string" || !Number.isFinite(expires_in) || expires_in <= 0)
    throw new Error("Invalid Drive token response");
  cachedToken = { email, value: access_token, expires: now + expires_in };
  return access_token;
}

async function loadSnapshot(id, token) {
  const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (!upstream.ok || !upstream.body || Number(upstream.headers.get("content-length")) > MAX_BYTES)
    throw new Error("Drive snapshot unavailable");
  let size = 0;
  const chunks = [];
  for await (const chunk of upstream.body) {
    size += chunk.byteLength;
    if (size > MAX_BYTES) throw new Error("Drive snapshot exceeds size limit");
    chunks.push(chunk);
  }
  const data = validateLibrarySnapshot(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  const age = Date.now() - Date.parse(data.generatedAt);
  if (age > MAX_AGE || age < -60_000) throw new Error("Drive snapshot outside freshness window");
  return data;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const id = process.env.LIBRARY_PUBLIC_FILE_ID;
  const email = process.env.LIBRARY_DRIVE_CLIENT_EMAIL;
  const key = process.env.LIBRARY_DRIVE_PRIVATE_KEY;
  // An unconfigured deployment intentionally uses the bundled legacy content.
  if (!id && !email && !key) return res.status(204).end();
  if (!/^[a-zA-Z0-9_-]{10,100}$/.test(id || "") || !email || !key) return unavailable(res);

  try {
    const token = await getToken(email, key);
    return res.status(200).json(await loadSnapshot(id, token));
  } catch {
    return unavailable(res);
  }
}

function unavailable(res) {
  return res.status(503).json({ error: "公開成果與資源暫時無法同步" });
}
