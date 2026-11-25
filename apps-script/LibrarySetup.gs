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
          const input = Object.assign({}, seed, { status: "published" });
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

function writeLibraryFile_(book, props) {
  const data = buildLibrary_(book);
  const json = JSON.stringify(data);
  const blob = Utilities.newBlob(json, "application/json", "ccsa-public-library.json");
  assert_(blob.getBytes().length <= 3500000, "LIBRARY_SIZE", "公開快照超過 3.5 MB，請改用部分圖片網址。");
  const reader = props.getProperty("LIBRARY_SNAPSHOT_READER") || "";
  assert_(/^[a-z0-9._-]+@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/i.test(reader),
    "NOT_CONFIGURED", "請先設定 LIBRARY_SNAPSHOT_READER 為專用的服務帳戶 Email。");
  let id = props.getProperty("LIBRARY_PUBLIC_FILE_ID");
  if (!id) {
    const file = Drive.Files.create({ name: "CCSA 公開成果與資源.json" }, blob, { fields: "id" });
    id = file.id;
    props.setProperty("LIBRARY_PUBLIC_FILE_ID", id);
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
  props.setProperty("LIBRARY_LAST_SYNC_AT", data.generatedAt);
  props.deleteProperty("LIBRARY_DIRTY");
  return id;
}

/** Owner only. Creates a private snapshot file and a one-minute trigger. */
function installLibraryPublisher_() {
  return locked_(function () {
    const ctx = libraryOwner_();
    const props = PropertiesService.getScriptProperties();
    const id = writeLibraryFile_(ctx.book, props);
    if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "refreshLibrary_"; }))
      ScriptApp.newTrigger("refreshLibrary_").timeBased().everyMinutes(1).create();
    const settings = { LIBRARY_PUBLIC_FILE_ID: id };
    console.log(JSON.stringify(settings));
    return settings;
  });
}

/** Installed owner trigger. Freshness on the public API expires if this job stops succeeding. */
function refreshLibrary_() {
  return locked_(function () {
    // A time-driven trigger has no active visitor. It was installed by the owner
    // and never uses a browser identity or a caller-supplied file ID.
    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty("LIBRARY_PUBLIC_FILE_ID");
    if (!id) return;
    // Sync admin edits on the next tick. Refresh unchanged snapshots periodically
    // to keep freshness verifiable and stay within trigger/Drive quotas.
    const lastSync = Date.parse(props.getProperty("LIBRARY_LAST_SYNC_AT"));
    if (props.getProperty("LIBRARY_DIRTY") !== "true" && Date.now() - lastSync < 240000) return;
    const book = SpreadsheetApp.openById(props.getProperty("SPREADSHEET_ID"));
    const owner = book.getOwner();
    assert_(owner && owner.getEmail().toLowerCase() === Session.getEffectiveUser().getEmail().toLowerCase(),
      "SETUP_OWNER", "公開同步須由試算表擁有者執行。");
    writeLibraryFile_(book, props);
  });
}
