import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { harness, org, course } from "./harness.mjs";
import { validatePublicSnapshot } from "../../src/data/public-contract.mjs";
const assertError = (r, code) => {
  assert.equal(r.ok, false);
  assert.equal(r.error.code, code);
};

test("初始化建立六張表、唯一ID、既有表單、預設關閉寫入，重跑不重複", () => {
  const h = harness();
  assert.equal(h.state.sheets.size, 6);
  const before = h.context.listRecords("Recruitment").data;
  assert.equal(before.length, 1);
  assert.match(before[0].formUrl, /1FAIpQLSdYOm/);
  assert.equal(h.properties.get("WRITE_ENABLED"), "false");
  h.context.initialize_();
  assert.deepEqual(h.context.listRecords("Recruitment").data, before);
  assertError(h.call("saveRecord", "Organizations", org()), "WRITES_DISABLED");
  h.properties.set("WRITE_ENABLED", "true");
  assertError(h.call("saveRecord", "Organizations", org()), "WRITES_DISABLED");
});
test("每一個公開RPC在未授權、空白身分、錯誤執行者、僅檢視權限時拒絕", () => {
  const calls = [
    ["getBootstrap"],
    ["listRecords", "Organizations"],
    ["getRecord", "Organizations", "x"],
    ["saveRecord", "Organizations", org()],
    ["archiveRecord", "Organizations", "x", 1],
    ["deleteRecord", "Organizations", "x", 1],
    ["previewPublic"],
    ["exportPublic"],
  ];
  for (const [patch, code] of [
    [{ email: "" }, "IDENTITY_UNAVAILABLE"],
    [
      { email: "other@example.test", effective: "other@example.test" },
      "NOT_AUTHORIZED",
    ],
    [{ effective: "owner@example.test" }, "EXECUTION_IDENTITY"],
    [{ canEdit: false }, "SHEET_PERMISSION"],
  ]) {
    for (const args of calls) {
      const h = harness();
      h.enable();
      Object.assign(h.state, patch);
      const count = h.state.writes;
      h.state.reads = [];
      assertError(h.call(...args), code);
      assert.equal(h.state.writes, count);
      assert.ok(!h.state.reads.includes("Organizations"));
    }
  }
});
test("新增、編輯、空列、穩定ID及版本衝突防護", () => {
  const h = harness();
  h.enable();
  const first = h.call("saveRecord", "Organizations", org()).data;
  assert.match(first.id, /^org_/);
  assert.equal(first.version, 1);
  h.state.sheets.get("Organizations").rows.splice(1, 0, Array(13).fill(""));
  const updated = h.call("saveRecord", "Organizations", {
    ...org(),
    id: first.id,
    version: first.version,
    name: "更新機構",
  }).data;
  assert.equal(updated.id, first.id);
  assert.equal(updated.version, 2);
  assert.equal(h.call("listRecords", "Organizations").data.length, 1);
  assertError(
    h.call("saveRecord", "Organizations", {
      ...org(),
      id: first.id,
      version: 1,
    }),
    "CONFLICT",
  );
  assert.equal(
    h.call("getRecord", "Organizations", first.id).data.name,
    "更新機構",
  );
});
test("前端Email無法作身分依據；禁止控制系統時間、稽核、白名單", () => {
  const h = harness();
  h.enable();
  assertError(
    h.call("saveRecord", "Organizations", org({ email: "admin@example.test" })),
    "VALIDATION",
  );
  assertError(
    h.call("saveRecord", "Organizations", org({ createdAt: "2020-01-01" })),
    "VALIDATION",
  );
  for (const t of ["AdminUsers", "AuditLogs", "__proto__"]) {
    assertError(h.call("listRecords", t), "INVALID_TABLE");
    assertError(h.call("saveRecord", t, {}), "INVALID_TABLE");
    assertError(h.call("deleteRecord", t, "x", 1), "INVALID_TABLE");
  }
});
test("日期、必填、型別、分類、報名、網址與機構關聯驗證", () => {
  const h = harness();
  h.enable();
  for (const bad of [
    org({ name: "" }),
    org({ name: 45 }),
    org({ logoUrl: "javascript:alert(1)" }),
    org({ logoUrl: "https://example.test/icon.svg" }),
    org({ region: "未知" }),
  ])
    assertError(h.call("saveRecord", "Organizations", bad), "VALIDATION");
  for (const bad of [
    course({ date: "2027-02-30" }),
    course({ category: "未知" }),
    course({ registrationStatus: "open" }),
    course({ registrationUrl: "https://evil.test/" }),
    course({ organizationId: "org_no" }),
  ])
    assertError(h.call("saveRecord", "Courses", bad), "VALIDATION");
  assert.equal(
    h.call(
      "saveRecord",
      "Courses",
      course({
        registrationStatus: "open",
        registrationUrl: "https://forms.gle/testForm",
      }),
    ).ok,
    true,
  );
});
test("只匯出已發布白名單，不包含管理員、稽核、私有備註；與網站契約相容", () => {
  const h = harness();
  h.enable();
  h.call("saveRecord", "Organizations", org({ name: "草稿不可見" }));
  h.call(
    "saveRecord",
    "Organizations",
    org({ name: "下架不可見", status: "archived" }),
  );
  const o = h.call(
    "saveRecord",
    "Organizations",
    org({ status: "published" }),
  ).data;
  h.call(
    "saveRecord",
    "Courses",
    course({ status: "published", organizationId: o.id }),
  );
  h.call("saveRecord", "Announcements", {
    status: "published",
    title: "新公告",
    category: "最新消息",
    summary: "公開摘要",
    content: "公開內容",
    date: "2026-11-22",
    internalNotes: "秘密",
  });
  const preview = h.call("previewPublic");
  assert.equal(preview.ok, true);
  assert.equal(preview.data.organizations.length, 1);
  assert.equal(preview.data.courses.length, 1);
  assert.equal(preview.data.announcements.length, 1);
  assert.equal(preview.data.recruitment, null);
  const json = h.call("exportPublic").data.json;
  for (const secret of [
    "admin@example.test",
    "internalNotes",
    "AdminUsers",
    "AuditLogs",
    "草稿不可見",
    "下架不可見",
    "秘密",
    "createdAt",
    "version",
    "status",
  ])
    assert.ok(!json.includes(secret), secret);
  assert.deepEqual(validatePublicSnapshot(JSON.parse(json)), JSON.parse(json));
});
test("招募單例、草稿不發布、起迄日期、既有表單", () => {
  const h = harness();
  h.enable();
  const r = h.call("listRecords", "Recruitment").data[0];
  assertError(
    h.call("saveRecord", "Recruitment", {
      ...Object.fromEntries(
        Object.entries(r).filter(
          ([k]) => !["id", "createdAt", "updatedAt", "version"].includes(k),
        ),
      ),
    }),
    "VALIDATION",
  );
  const { createdAt, updatedAt, ...input } = r;
  assertError(
    h.call("saveRecord", "Recruitment", {
      ...input,
      startDate: "2026-12-20",
      endDate: "2026-12-01",
    }),
    "VALIDATION",
  );
  assert.equal(
    h.call("saveRecord", "Recruitment", { ...input, status: "published" }).ok,
    true,
  );
  assert.equal(h.call("previewPublic").data.recruitment.formUrl, r.formUrl);
});
test("機構關聯防護、下架與刪除順序、操作留紀錄", () => {
  const h = harness();
  h.enable();
  const o = h.call(
    "saveRecord",
    "Organizations",
    org({ status: "published" }),
  ).data;
  const c = h.call(
    "saveRecord",
    "Courses",
    course({ status: "published", organizationId: o.id }),
  ).data;
  assertError(h.call("archiveRecord", "Organizations", o.id, 1), "VALIDATION");
  assertError(h.call("deleteRecord", "Organizations", o.id, 1), "VALIDATION");
  const archived = h.call("archiveRecord", "Courses", c.id, 1).data;
  assert.equal(archived.status, "archived");
  assert.equal(h.call("archiveRecord", "Organizations", o.id, 1).ok, true);
  assertError(h.call("deleteRecord", "Organizations", o.id, 2), "VALIDATION");
  assert.equal(h.call("deleteRecord", "Courses", c.id, 2).ok, true);
  assert.equal(h.call("deleteRecord", "Organizations", o.id, 2).ok, true);
  assert.equal(h.call("listRecords", "Organizations").data.length, 0);
  const log = h.call("getBootstrap").data.recentChanges;
  assert.equal(log[0].action, "delete");
  assert.ok(log.every((l) => l.outcome === "applied"));
});
test("鎖定中、稽核寫入失敗時不變更內容；內容失敗時留下failed", () => {
  const h = harness();
  h.enable();
  h.state.locked = true;
  assertError(h.call("saveRecord", "Organizations", org()), "BUSY");
  h.state.locked = false;
  h.state.failAudit = true;
  assertError(h.call("saveRecord", "Organizations", org()), "INTERNAL");
  assert.equal(h.call("listRecords", "Organizations").data.length, 0);
  h.state.failAudit = false;
  h.state.failContent = true;
  const failure = h.call("saveRecord", "Organizations", org());
  assertError(failure, "INTERNAL");
  assert.ok(!failure.error.message.includes("private"));
  h.state.failContent = false;
  assert.equal(h.call("getBootstrap").data.recentChanges[0].outcome, "failed");
});
test("內容已儲存而稽核完成失敗，回報待確認並保留pending紀錄", () => {
  const h = harness();
  h.enable();
  h.state.failAuditFinalize = true;
  assertError(h.call("saveRecord", "Organizations", org()), "AUDIT_PENDING");
  assert.equal(h.call("listRecords", "Organizations").data.length, 1);
  assert.equal(h.call("getBootstrap").data.recentChanges[0].outcome, "pending");
});
test("試算表手動改欄位、重複ID、公式及無效發布內容會拒絕", () => {
  const h = harness();
  h.enable();
  const o = h.call(
    "saveRecord",
    "Organizations",
    org({ status: "published" }),
  ).data;
  const s = h.state.sheets.get("Organizations");
  s.rows.push([...s.rows[1]]);
  assertError(h.call("listRecords", "Organizations"), "SCHEMA");
  s.rows.pop();
  const nameIndex = s.rows[0].indexOf("name");
  s.rows[1][nameIndex] = '=IMPORTXML("private")';
  assertError(h.call("previewPublic"), "SCHEMA");
  s.rows[1][nameIndex] = "";
  assertError(h.call("previewPublic"), "VALIDATION");
  s.rows[1][nameIndex] = o.name;
  s.rows[0].push("extra");
  assertError(h.call("listRecords", "Organizations"), "SCHEMA");
});
test("試算表公式注入會以純文字儲存", () => {
  const h = harness();
  h.enable();
  const r = h.call(
    "saveRecord",
    "Organizations",
    org({ summary: '=IMPORTXML("https://bad.test")' }),
  );
  assert.equal(r.ok, true);
  assert.equal(h.call("listRecords", "Organizations").ok, true);
  assert.equal(
    h.call("listRecords", "Organizations").data[0].summary,
    '=IMPORTXML("https://bad.test")',
  );
});
test("只暴露預定RPC，初始化及輔助函式以_結尾；部署不是匿名或擁有者模式", () => {
  const source = ["Schema.gs", "Server.gs", "Setup.gs"]
    .map((f) =>
      readFileSync(new URL("../../apps-script/" + f, import.meta.url), "utf8"),
    )
    .join("\n");
  const names = [...source.matchAll(/^function (\w+)\(/gm)]
    .map((m) => m[1])
    .filter((n) => !n.endsWith("_"))
    .sort();
  assert.deepEqual(
    names,
    [
      "archiveRecord",
      "deleteRecord",
      "doGet",
      "exportPublic",
      "getBootstrap",
      "getRecord",
      "listRecords",
      "previewPublic",
      "saveRecord",
    ].sort(),
  );
  const manifest = JSON.parse(
    readFileSync(
      new URL("../../apps-script/appsscript.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(manifest.webapp, {
    executeAs: "USER_ACCESSING",
    access: "ANYONE",
  });
  const html = readFileSync(
    new URL("../../apps-script/Index.html", import.meta.url),
    "utf8",
  );
  new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);
  assert.ok(!html.includes("innerHTML"));
});

test("私人白名單工具新增及停用都有紀錄；撤銷後下一次RPC立即失效", () => {
  const h = harness();
  h.properties.set("NEW_ADMIN_EMAIL", "second@example.test");
  h.context.addAdmin_();
  assert.equal(h.properties.has("NEW_ADMIN_EMAIL"), false);
  h.state.email = h.state.effective = "second@example.test";
  assert.equal(h.call("getBootstrap").ok, true);
  h.properties.set("NEW_ADMIN_EMAIL", "third@example.test");
  assert.throws(() => h.context.addAdmin_(), /白名單僅由試算表擁有者維護/);
  h.state.email = h.state.effective = "admin@example.test";
  h.properties.set("REMOVE_ADMIN_EMAIL", "second@example.test");
  h.context.deactivateAdmin_();
  assert.equal(h.properties.has("REMOVE_ADMIN_EMAIL"), false);
  assert.equal(
    h.call("getBootstrap").data.recentChanges[0].action,
    "deactivate_admin",
  );
  h.state.email = h.state.effective = "second@example.test";
  assertError(h.call("getBootstrap"), "NOT_AUTHORIZED");
});

test("重新初始化會關閉寫入並清除過期驗收", () => {
  const h = harness();
  h.enable();
  h.context.initialize_();
  assert.equal(h.properties.get("WRITE_ENABLED"), "false");
  assert.equal(h.properties.has("SECURITY_REVIEW_JSON"), false);
  assertError(h.call("saveRecord", "Organizations", org()), "WRITES_DISABLED");
});
