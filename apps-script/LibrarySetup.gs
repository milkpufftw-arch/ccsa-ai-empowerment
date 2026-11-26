function libraryOwner_() {
  const ctx = authorize_();
  const owner = ctx.book.getOwner();
  assert_(owner && owner.getEmail().toLowerCase() === ctx.email, "SETUP_OWNER",
    "此操作僅能由試算表擁有者在 Apps Script 編輯器執行。");
  return ctx;
}

/** After backing up the spreadsheet, run once from the Apps Script editor. */
function migrateLibrary_() {
  return locked_(function () {
    const ctx = libraryOwner_();
    const props = PropertiesService.getScriptProperties();
    if (libraryReady_()) return "資料已移轉。";
    assert_(props.getProperty("LIBRARY_BACKUP_CONFIRMED") === ctx.book.getId(), "BACKUP_REQUIRED",
      "請先備份此試算表，再於指令碼屬性將 LIBRARY_BACKUP_CONFIRMED 設為來源試算表 ID。");
    const now = new Date().toISOString();
    mutate_(ctx, "initialize", "Library", "library_v1", function () {
      Object.keys(LIBRARY_SEED_).forEach(function (table) {
        const expected = headers_(table);
        let sheet = ctx.book.getSheetByName(table);
        if (!sheet) sheet = ctx.book.insertSheet(table);
        if (!sheet.getLastRow()) {
          if (sheet.getMaxColumns() < expected.length)
            sheet.insertColumnsAfter(sheet.getMaxColumns(), expected.length - sheet.getMaxColumns());
          sheet.getRange(1, 1, 1, expected.length).setValues([expected])
            .setFontWeight("bold").setBackground("#e9f2fb");
          sheet.setFrozenRows(1);
        }
        const ids = new Set(readRows_(ctx.book, table).map(function (row) { return row.id; }));
        LIBRARY_SEED_[table].forEach(function (seed) {
          if (ids.has(seed.id)) return;
          // Seed content comes from the demo site. Make it editable without publishing it.
          const status = table === "LibraryCategories" ? "published" : "draft";
          const input = Object.assign({}, seed, { status: status });
          const values = validateFields_(table, input);
          writeRow_(sheet, table, sheet.getLastRow() + 1, Object.assign(values, {
            id: seed.id, createdAt: now, updatedAt: now, version: 1,
          }));
        });
      });
      props.setProperty("LIBRARY_SCHEMA", "1");
    });
    return "已完成成果、學習資源及分類移轉。";
  });
}

function writePublicSnapshot_(data, props, prefix, filename) {
  const json = JSON.stringify(data);
  const blob = Utilities.newBlob(json, "application/json", filename);
  assert_(blob.getBytes().length <= 3500000, "LIBRARY_SIZE", "公開快照超過 3.5 MB，請調整已發布內容或改用圖片網址。");
  const reader = props.getProperty("LIBRARY_SNAPSHOT_READER") || "";
  assert_(/^[a-z0-9._-]+@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/i.test(reader),
    "NOT_CONFIGURED", "請先設定 LIBRARY_SNAPSHOT_READER 為專用的服務帳戶 Email。");
  let id = props.getProperty(prefix + "_PUBLIC_FILE_ID");
  if (!id) {
    const file = Drive.Files.create({ name: filename }, blob, { fields: "id" });
    id = file.id;
    props.setProperty(prefix + "_PUBLIC_FILE_ID", id);
  }
  const result = Drive.Permissions.list(id, { fields: "permissions(type,role,emailAddress),nextPageToken", pageSize: 100 });
  const permissions = result.permissions || [];
  assert_(!result.nextPageToken && permissions.every(function (permission) {
    return permission.role === "owner" || (permission.type === "user" &&
      permission.role === "reader" && permission.emailAddress === reader);
  }), "LIBRARY_SHARING", "公開快照檔的 Drive 權限不符，請在 Drive 檢查分享設定。");
  if (!permissions.some(function (p) { return p.type === "user" && p.emailAddress === reader; }))
    Drive.Permissions.create({ type: "user", role: "reader", emailAddress: reader }, id,
      { sendNotificationEmail: false });
  Drive.Files.update({}, id, blob, { fields: "id" });
  props.setProperty(prefix + "_LAST_SYNC_AT", data.generatedAt);
  props.deleteProperty(prefix + "_DIRTY");
  return id;
}

function writeLibraryFile_(book, props) {
  return writePublicSnapshot_(buildLibrary_(book), props, "LIBRARY", "CCSA 公開成果與資源.json");
}

function writeContentFile_(book, props) {
  return writePublicSnapshot_(buildPublic_(book), props, "CONTENT", "CCSA 公開機構課程公告與招募.json");
}

function installSnapshotPublisher_(prefix, writer, trigger) {
  return locked_(function () {
    const ctx = libraryOwner_();
    const props = PropertiesService.getScriptProperties();
    const id = writer(ctx.book, props);
    if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === trigger; }))
      ScriptApp.newTrigger(trigger).timeBased().everyMinutes(1).create();
    const settings = {};
    settings[prefix + "_PUBLIC_FILE_ID"] = id;
    console.log(JSON.stringify(settings));
    return settings;
  });
}

/** Owner only. Creates a private snapshot file and a one-minute trigger. */
function installLibraryPublisher_() {
  return installSnapshotPublisher_("LIBRARY", writeLibraryFile_, "refreshLibrary_");
}

/** Owner only. Run after verifying the original content in the unified workbook. */
function installContentPublisher_() {
  return installSnapshotPublisher_("CONTENT", writeContentFile_, "refreshContent_");
}

/** Freshness expires independently for each publisher. */
function refreshSnapshot_(prefix, writer) {
  return locked_(function () {
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty(prefix + "_PUBLIC_FILE_ID")) return;
    // Sync edits on the next tick and refresh unchanged snapshots periodically.
    const lastSync = Date.parse(props.getProperty(prefix + "_LAST_SYNC_AT"));
    if (props.getProperty(prefix + "_DIRTY") !== "true" && Date.now() - lastSync < 240000) return;
    const book = SpreadsheetApp.openById(props.getProperty("SPREADSHEET_ID"));
    const owner = book.getOwner();
    assert_(owner && owner.getEmail().toLowerCase() === Session.getEffectiveUser().getEmail().toLowerCase(),
      "SETUP_OWNER", "公開同步須由試算表擁有者執行。");
    writer(book, props);
  });
}

function refreshLibrary_() {
  return refreshSnapshot_("LIBRARY", writeLibraryFile_);
}

function refreshContent_() {
  return refreshSnapshot_("CONTENT", writeContentFile_);
}
