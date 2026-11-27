import assert from "node:assert/strict";
import { test } from "node:test";
import { course, harness, org } from "./harness.mjs";
import { validatePublicSnapshot } from "../../src/data/public-contract.mjs";

function data(result) {
  assert.equal(result.ok, true, JSON.stringify(result.error));
  return result.data;
}

test("新版後台自動發布四類內容，舊草稿與內部欄位留在試算表", () => {
  const h = harness();
  h.enableOwner();
  h.migrateLibrary();
  h.properties.set("LIBRARY_SNAPSHOT_READER", "reader@staging-test.iam.gserviceaccount.com");
  const libraryFile = h.context.installLibraryPublisher_().LIBRARY_PUBLIC_FILE_ID;
  const contentFile = h.context.installContentPublisher_().CONTENT_PUBLIC_FILE_ID;
  assert.notEqual(contentFile, libraryFile);
  assert.equal(h.context.installContentPublisher_().CONTENT_PUBLIC_FILE_ID, contentFile);
  assert.equal(h.state.triggers.length, 2);
  assert.equal(data(h.call("getBootstrap")).contentSync.enabled, true);
  const organization = data(h.call("saveRecord", "Organizations", org({ status: "published" })));
  data(h.call("saveRecord", "Organizations", org({ name: "未發布機構" })));
  const publishedCourse = data(h.call("saveRecord", "Courses", course({ status: "published", organizationId: organization.id })));
  const announcement = data(h.call("saveRecord", "Announcements", {
    status: "published", title: "公開交接公告", category: "最新消息", summary: "摘要",
    content: "公開內文", date: "2026-11-26", internalNotes: "只限內部查閱",
  }));
  const current = data(h.call("listRecords", "Recruitment"))[0];
  const { createdAt, updatedAt, ...settings } = current;
  const recruitment = data(h.call("saveRecord", "Recruitment", {
    ...settings, status: "published", startDate: "2026-11-01", endDate: "2026-12-10", recruitmentStatus: "open",
  }));
  assert.equal(h.properties.get("CONTENT_DIRTY"), "true");
  h.context.refreshContent_();

  const file = h.state.files.get(contentFile);
  const snapshot = validatePublicSnapshot(JSON.parse(file.blob.json));
  assert.deepEqual(snapshot.organizations.map((row) => row.id), [organization.id]);
  assert.deepEqual(snapshot.courses.map((row) => row.id), [publishedCourse.id]);
  assert.deepEqual(snapshot.announcements.map((row) => row.id), [announcement.id]);
  assert.equal(snapshot.recruitment.id, recruitment.id);
  assert.equal(snapshot.recruitment.formUrl, current.formUrl);
  assert.ok(!file.blob.json.includes("只限內部查閱"));
  assert.ok(!file.blob.json.includes("admin@example.test"));

  for (const [table, row] of [["Courses", publishedCourse], ["Organizations", organization],
    ["Announcements", announcement], ["Recruitment", recruitment]]) {
    data(h.call("archiveRecord", table, row.id, row.version));
  }
  h.context.refreshContent_();
  const updated = validatePublicSnapshot(JSON.parse(file.blob.json));
  assert.deepEqual([updated.organizations, updated.courses, updated.announcements, updated.recruitment], [[], [], [], null]);
  assert.ok(Object.hasOwn(JSON.parse(h.state.files.get(libraryFile).blob.json), "showcases"));
});
