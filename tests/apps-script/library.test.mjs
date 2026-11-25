import assert from "node:assert/strict";
import { test } from "node:test";
import { harness } from "./harness.mjs";
import { showcases, resources } from "../../src/data/content.ts";
import { validateLibrarySnapshot, splitLines } from "../../src/data/library-contract.mjs";

function ok(result) {
  assert.equal(result.ok, true, JSON.stringify(result.error));
  return result.data;
}
function fields(row) {
  const { createdAt, updatedAt, ...input } = row;
  return input;
}

test("備份與權限、移轉重跑、保留既有成果網址及前台資源、已刪除的種子內容不復活", () => {
  const h = harness();
  assert.throws(() => h.context.migrateLibrary_(), /備份/);
  h.enableOwner();
  h.migrateLibrary();
  h.migrateLibrary();
  const data = validateLibrarySnapshot(ok(h.call("previewLibrary")));
  assert.equal(data.showcases.length, showcases.length);
  assert.equal(data.resources.length, resources.length);
  for (const item of showcases) {
    const migrated = data.showcases.find((row) => row.id === item.id);
    for (const key of ["title", "organization", "summary", "context", "problem", "prompt", "benefit", "limitations", "publishedAt"])
      assert.equal(migrated[key], item[key], key);
    assert.deepEqual(splitLines(migrated.steps), item.steps);
    assert.deepEqual(splitLines(migrated.tools), item.tools);
    assert.equal(data.categories.find((row) => row.id === migrated.categoryId).name, item.category);
  }
  for (const item of resources) {
    const migrated = data.resources.find((row) => row.id === item.id);
    assert.equal(migrated.title, item.title);
    assert.equal(migrated.body, item.body);
    assert.deepEqual(splitLines(migrated.steps), item.steps);
    assert.equal(data.categories.find((row) => row.id === migrated.categoryId).name, item.category);
  }
  const archived = ok(h.call("archiveRecord", "Showcases", "meeting-notes", 1));
  ok(h.call("deleteRecord", "Showcases", archived.id, archived.version));
  h.migrateLibrary();
  assert.equal(ok(h.call("previewLibrary")).showcases.length, 5);
  assert.equal(ok(h.call("listRecords", "Recruitment")).length, 1);
});

test("分類異動、排序、精選、版本、防止資料洩漏及未授權寫入", () => {
  const h = harness();
  h.migrateLibrary();
  const request = {
    title: "测试成果", organization: "測試團隊", summary: "初版", categoryId: "category_showcases_1",
    status: "draft", featured: "pinned",
  };
  assert.equal(h.call("saveRecord", "Showcases", request).error.code, "WRITES_DISABLED");
  h.enableOwner();
  h.state.email = "";
  for (const [method, args] of [
    ["saveRecord", ["Showcases", request]],
    ["archiveRecord", ["LearningResources", "tool", 1]],
    ["deleteRecord", ["LibraryCategories", "category_showcases_1", 1]],
    ["previewLibrary", []],
  ]) assert.equal(h.call(method, ...args).error.code, "IDENTITY_UNAVAILABLE");
  h.state.email = "admin@example.test";
  const category = ok(h.call("saveRecord", "LibraryCategories",
    { name: "測試分類", module: "showcases", status: "published", sortOrder: "0" }));
  const draft = ok(h.call("saveRecord", "Showcases", { ...request, categoryId: category.id }));
  assert.ok(!ok(h.call("previewLibrary")).showcases.some((r) => r.id === draft.id));
  const change = { ...fields(draft), status: "published", summary: "新版", appUrl: "https://example.org/app" };
  assert.equal(h.call("saveRecord", "Showcases", { ...change, cover: "data:image/svg+xml;base64,PHN2Zz4=" }).error.code, "VALIDATION");
  assert.equal(h.call("saveRecord", "Showcases", { ...change, attachments: "附件｜javascript:alert(1)" }).error.code, "VALIDATION");
  assert.equal(h.call("saveRecord", "Showcases", { ...change, categoryId: "category_resources_1" }).error.code, "VALIDATION");
  const published = ok(h.call("saveRecord", "Showcases", change));
  assert.equal(h.call("saveRecord", "Showcases", change).error.code, "CONFLICT");
  ok(h.call("saveRecord", "LibraryCategories", { ...fields(category), name: "改名後分類" }));
  assert.equal(h.call("archiveRecord", "LibraryCategories", category.id, 2).error.code, "VALIDATION");
  const view = validateLibrarySnapshot(ok(h.call("previewLibrary")));
  assert.equal(view.categories[0].name, "改名後分類");
  assert.equal(view.showcases[0].id, draft.id);
  assert.equal(view.showcases[0].summary, "新版");
  assert.equal(view.showcases[0].appUrl, "https://example.org/app");
  assert.ok(!Object.hasOwn(view.showcases[0], "version"));
  assert.ok(!JSON.stringify(view).includes("admin@example.test"));
  ok(h.call("archiveRecord", "Showcases", published.id, published.version));
  assert.ok(!ok(h.call("previewLibrary")).showcases.some((r) => r.id === draft.id));
});

test("擁有者重跑同步安裝只建立一份私有快照及一個觸發條件，定時更新排除下架資料", () => {
  const h = harness();
  h.migrateLibrary();
  h.enableOwner();
  h.properties.set("LIBRARY_SNAPSHOT_READER", "reader@staging-test.iam.gserviceaccount.com");
  const settings = h.context.installLibraryPublisher_();
  assert.equal(h.context.installLibraryPublisher_().LIBRARY_PUBLIC_FILE_ID, settings.LIBRARY_PUBLIC_FILE_ID);
  assert.equal(h.state.files.size, 1);
  assert.equal(h.state.triggers.length, 1);
  const file = h.state.files.get(settings.LIBRARY_PUBLIC_FILE_ID);
  assert.deepEqual(JSON.parse(JSON.stringify(file.permissions)), [
    { type: "user", role: "owner" },
    { type: "user", role: "reader", emailAddress: "reader@staging-test.iam.gserviceaccount.com" },
  ]);
  assert.equal(validateLibrarySnapshot(JSON.parse(file.blob.json)).showcases.length, 6);
  ok(h.call("archiveRecord", "Showcases", "meeting-notes", 1));
  h.state.email = "";
  h.context.refreshLibrary_();
  assert.equal(validateLibrarySnapshot(JSON.parse(file.blob.json)).showcases.length, 5);
  h.state.effective = "wrong@example.test";
  h.properties.set("LIBRARY_DIRTY", "true");
  assert.throws(() => h.context.refreshLibrary_(), /擁有者/);
});
