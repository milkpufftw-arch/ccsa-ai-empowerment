import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import { test } from "node:test";
import handler from "../../api/library.mjs";
import { harness } from "./harness.mjs";

function response() {
  return {
    headers: new Map(),
    setHeader(name, value) { this.headers.set(name, value); },
    status(status) { this.statusCode = status; return this; },
    json(json) { this.body = json; return this; },
    end() { return this; },
  };
}

test("Vercel API 只讀取固定 Drive 檔，拒絕寫入、過期或含私有欄位的快照", async (t) => {
  const call = async (method = "GET") => handler({ method, url: "/api/library?id=other-file" }, response());
  const environment = ["LIBRARY_PUBLIC_FILE_ID", "LIBRARY_DRIVE_CLIENT_EMAIL", "LIBRARY_DRIVE_PRIVATE_KEY"];
  const saved = environment.map((key) => process.env[key]);
  t.after(() => environment.forEach((key, index) => {
    if (saved[index] === undefined) delete process.env[key];
    else process.env[key] = saved[index];
  }));
  for (const key of environment) delete process.env[key];
  assert.equal((await call()).statusCode, 204);
  const forbidden = await call("POST");
  assert.equal(forbidden.statusCode, 405);
  assert.equal(forbidden.headers.get("Allow"), "GET");
  process.env.LIBRARY_PUBLIC_FILE_ID = "approved-file-id";
  assert.equal((await call()).statusCode, 503);

  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  process.env.LIBRARY_DRIVE_CLIENT_EMAIL = "reader@example.iam.gserviceaccount.com";
  process.env.LIBRARY_DRIVE_PRIVATE_KEY = privateKey.export({ format: "pem", type: "pkcs8" });
  const h = harness();
  h.migrateLibrary();
  const snapshot = h.call("previewLibrary").data;
  let payload = snapshot;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "https://oauth2.googleapis.com/token") {
      const [header, claim, signature] = options.body.get("assertion").split(".");
      assert.equal(JSON.parse(Buffer.from(claim, "base64url")).scope, "https://www.googleapis.com/auth/drive.readonly");
      assert.ok(verify("RSA-SHA256", Buffer.from(header + "." + claim), publicKey, Buffer.from(signature, "base64url")));
      return Response.json({ access_token: "mock-drive-oauth", expires_in: 3600 });
    }
    assert.equal(url, "https://www.googleapis.com/drive/v3/files/approved-file-id?alt=media");
    assert.equal(options.headers.Authorization, "Bearer mock-drive-oauth");
    return Response.json(payload);
  });
  const first = await call();
  assert.equal(first.statusCode, 200);
  assert.equal(first.headers.get("Cache-Control"), "no-store");
  assert.equal(first.body.showcases.length, 6);
  payload = { ...snapshot, generatedAt: "2000-01-01T00:00:00Z" };
  assert.equal((await call()).statusCode, 503);
  payload = { ...snapshot, resources: [{ ...snapshot.resources[0], internalNotes: "private" }] };
  const rejected = await call();
  assert.equal(rejected.statusCode, 503);
  assert.ok(!JSON.stringify(rejected.body).includes("private"));
});
