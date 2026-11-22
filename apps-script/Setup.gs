/** Run only in the Apps Script editor. Private suffix prevents web RPC invocation. */
function initialize_() {
  return locked_(function () {
    const p = PropertiesService.getScriptProperties(),
      id = p.getProperty("SPREADSHEET_ID");
    const email = String(Session.getActiveUser().getEmail() || "")
      .trim()
      .toLowerCase();
    assert_(
      email &&
        email ===
          String(Session.getEffectiveUser().getEmail() || "")
            .trim()
            .toLowerCase(),
      "IDENTITY_UNAVAILABLE",
      "請由設定人員以本人Google帳號執行。",
    );
    assert_(id, "NOT_CONFIGURED", "請先在指令碼屬性設定SPREADSHEET_ID。");
    const file = Drive.Files.get(id, { fields: "capabilities(canEdit)" });
    assert_(
      file.capabilities && file.capabilities.canEdit === true,
      "SHEET_PERMISSION",
      "需要試算表編輯權限。",
    );
    const book = SpreadsheetApp.openById(id),
      adminSheet = book.getSheetByName("AdminUsers");
    const owner = book.getOwner();
    assert_(
      owner && owner.getEmail().toLowerCase() === email,
      "SETUP_OWNER",
      "初始化及白名單保護設定須由試算表擁有者執行。",
    );
    if (adminSheet && adminSheet.getLastRow() > 1) authorize_();
    p.setProperty("WRITE_ENABLED", "false");
    p.deleteProperty("SECURITY_REVIEW_JSON");
    Object.keys(SCHEMAS_).forEach(function (t) {
      let s = book.getSheetByName(t);
      if (!s) s = book.insertSheet(t);
      if (s.getLastRow() === 0) {
        s.getRange(1, 1, 1, headers_(t).length)
          .setValues([headers_(t)])
          .setFontWeight("bold")
          .setBackground("#e9f2fb");
      }
      sheet_(book, t); // Never silently overwrite an existing schema or data.
      s.setFrozenRows(1);
      s.getRange(
        2,
        1,
        Math.max(s.getMaxRows() - 1, 1),
        headers_(t).length,
      ).setNumberFormat("@");
      s.getRange(2, 5, Math.max(s.getMaxRows() - 1, 1), 1).setNumberFormat("0");
      const choices =
        t === "AdminUsers"
          ? ["published", "archived"]
          : t === "AuditLogs"
            ? ["archived"]
            : STATUSES_.filter(function (v) {
                return !(
                  ["Announcements", "Recruitment"].indexOf(t) !== -1 &&
                  v === "pending_review"
                );
              });
      s.getRange(2, 4, Math.max(s.getMaxRows() - 1, 1), 1).setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(choices, true)
          .setAllowInvalid(false)
          .build(),
      );
      SCHEMAS_[t].fields.forEach(function (f, i) {
        if (f[2] === "select")
          s.getRange(
            2,
            BASE_.length + i + 1,
            Math.max(s.getMaxRows() - 1, 1),
            1,
          ).setDataValidation(
            SpreadsheetApp.newDataValidation()
              .requireValueInList(f[4], true)
              .setAllowInvalid(false)
              .build(),
          );
      });
    });
    const now = new Date().toISOString();
    if (!readRows_(book, "AdminUsers").length)
      writeRow_(sheet_(book, "AdminUsers"), "AdminUsers", 2, {
        id: "admin_" + Utilities.getUuid(),
        createdAt: now,
        updatedAt: now,
        status: "published",
        version: 1,
        email: email,
        displayName: "初始管理員",
      });
    // Content editors must not be able to add themselves to the authorization whitelist.
    // Only the sheet owner (and Google platform administrators) can alter this protection.
    const admins = sheet_(book, "AdminUsers");
    const protections = admins.getProtections(
      SpreadsheetApp.ProtectionType.SHEET,
    );
    const protection = protections.length ? protections[0] : admins.protect();
    protection.setDescription("CCSA管理員白名單：限試算表擁有者維護");
    protection.setWarningOnly(false);
    protection.setUnprotectedRanges([]);
    protection.addEditor(email);
    const others = protection.getEditors().filter(function (u) {
      return u.getEmail().toLowerCase() !== email;
    });
    if (others.length) protection.removeEditors(others);
    if (protection.canDomainEdit()) protection.setDomainEdit(false);
    if (!readRows_(book, "Recruitment").length)
      writeRow_(sheet_(book, "Recruitment"), "Recruitment", 2, {
        id: "recruitment_" + Utilities.getUuid(),
        createdAt: now,
        updatedAt: now,
        status: "draft",
        version: 1,
        startDate: "",
        endDate: "",
        recruitmentStatus: "not_open",
        formUrl: FORM_URL_,
        resultsUrl: "",
        description: "招募資訊請以CCSA正式公告為準。",
        internalNotes: "",
      });
    mutate_(
      { email: email, book: book },
      "initialize",
      "System",
      "schema_v1",
      function () {},
    );
    if (!p.getProperty("WRITE_ENABLED"))
      p.setProperty("WRITE_ENABLED", "false");
    return "初始化完成；未啟用正式寫入。";
  });
}

/** Copies only an email entered privately in Script Properties; never accept browser identity input. */
function addAdmin_() {
  return locked_(function () {
    const ctx = authorize_(),
      p = PropertiesService.getScriptProperties();
    assert_(
      ctx.book.getOwner().getEmail().toLowerCase() === ctx.email,
      "SETUP_OWNER",
      "白名單僅由試算表擁有者維護。",
    );
    const email = String(p.getProperty("NEW_ADMIN_EMAIL") || "")
      .trim()
      .toLowerCase();
    assert_(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      "VALIDATION",
      "請在指令碼屬性私下設定NEW_ADMIN_EMAIL。",
    );
    const rows = readRows_(ctx.book, "AdminUsers");
    assert_(
      !rows.some(function (r) {
        return String(r.email).toLowerCase() === email;
      }),
      "VALIDATION",
      "帳號已存在，請檢查白名單。",
    );
    const now = new Date().toISOString(),
      id = "admin_" + Utilities.getUuid();
    mutate_(ctx, "add_admin", "AdminUsers", id, function () {
      writeRow_(
        sheet_(ctx.book, "AdminUsers"),
        "AdminUsers",
        sheet_(ctx.book, "AdminUsers").getLastRow() + 1,
        {
          id: id,
          createdAt: now,
          updatedAt: now,
          status: "published",
          version: 1,
          email: email,
          displayName: "",
        },
      );
    });
    p.deleteProperty("NEW_ADMIN_EMAIL");
    return "已加入白名單；仍須另外分享試算表編輯權限。";
  });
}

function disableWrites_() {
  authorize_();
  PropertiesService.getScriptProperties().setProperty("WRITE_ENABLED", "false");
}

function deactivateAdmin_() {
  return locked_(function () {
    const ctx = authorize_(),
      p = PropertiesService.getScriptProperties();
    assert_(
      ctx.book.getOwner().getEmail().toLowerCase() === ctx.email,
      "SETUP_OWNER",
      "白名單僅由試算表擁有者維護。",
    );
    const email = String(p.getProperty("REMOVE_ADMIN_EMAIL") || "")
      .trim()
      .toLowerCase();
    assert_(
      email && email !== ctx.email,
      "VALIDATION",
      "請設定REMOVE_ADMIN_EMAIL，且不得停用擁有者本人。",
    );
    const user = readRows_(ctx.book, "AdminUsers").find(function (a) {
      return a.email === email && a.status === "published";
    });
    assert_(user, "NOT_FOUND", "找不到啟用中的管理員。");
    const row = findRecord_(ctx.book, "AdminUsers", user.id).row;
    const updated = Object.assign({}, user, {
      status: "archived",
      version: user.version + 1,
      updatedAt: new Date().toISOString(),
    });
    mutate_(ctx, "deactivate_admin", "AdminUsers", user.id, function () {
      writeRow_(sheet_(ctx.book, "AdminUsers"), "AdminUsers", row, updated);
    });
    p.deleteProperty("REMOVE_ADMIN_EMAIL");
    return "已停用白名單，請另外撤銷試算表分享。";
  });
}

/** Safe fallback for the trusted owner when consumer-Gmail web deployment cannot pass identity tests. */
function previewInEditor_() {
  const ctx = authorize_();
  console.log(JSON.stringify(buildPublic_(ctx.book), null, 2));
}
