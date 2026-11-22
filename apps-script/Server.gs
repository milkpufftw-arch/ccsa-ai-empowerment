/** Public RPC surface: every operation re-authenticates. No doPost or HTTP data API. */
function doGet() {
  try {
    authorize_();
    return HtmlService.createHtmlOutputFromFile("Index")
      .setTitle("CCSA AI培力｜管理後台")
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
  } catch (e) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>無法存取</title><h1>無法存取管理後台</h1><p>請使用已授權且具試算表編輯權限的Google帳號。若仍無法存取，請聯絡計畫管理員確認部署與身分辨識設定。</p></html>',
    );
  }
}
function getBootstrap() {
  return rpc_(function (ctx) {
    const data = {};
    CONTENT_TABLES_.forEach(function (t) {
      data[t] = readRows_(ctx.book, t);
    });
    return {
      email: ctx.email,
      writeEnabled: writesEnabled_(),
      schemas: publicSchemas_(),
      counts: {
        organizations: data.Organizations.length,
        publishedOrganizations: data.Organizations.filter(isPublished_).length,
        publishedCourses: data.Courses.filter(isPublished_).length,
      },
      targets: {
        organizations: target_("TARGET_ORGANIZATIONS"),
        courses: target_("TARGET_COURSES"),
      },
      latestAnnouncements: data.Announcements.slice()
        .sort(function (a, b) {
          return b.updatedAt.localeCompare(a.updatedAt);
        })
        .slice(0, 5),
      recentChanges: readRows_(ctx.book, "AuditLogs").slice(-10).reverse(),
    };
  });
}
function listRecords(table) {
  return rpc_(function (ctx) {
    contentTable_(table);
    return readRows_(ctx.book, table);
  });
}
function getRecord(table, id) {
  return rpc_(function (ctx) {
    contentTable_(table);
    return findRecord_(ctx.book, table, id).record;
  });
}
function saveRecord(table, input) {
  return rpc_(function (ctx) {
    return locked_(function () {
      ctx = authorize_();
      requireWrites_();
      contentTable_(table);
      const values = validateFields_(table, input);
      const rows = readRows_(ctx.book, table);
      let before = null;
      if (input.id) {
        assert_(typeof input.id === "string", "VALIDATION", "資料ID格式錯誤。");
        before = findRecord_(ctx.book, table, input.id).record;
        assert_(
          Number.isInteger(input.version) && input.version === before.version,
          "CONFLICT",
          "其他同仁已修改這筆資料，請重新載入後再編輯。",
        );
      } else {
        assert_(
          input.version === undefined || input.version === 0,
          "VALIDATION",
          "新增資料不可指定版本。",
        );
        if (table === "Recruitment")
          assert_(
            rows.length === 0,
            "VALIDATION",
            "招募設定只能有一筆，請編輯現有設定。",
          );
      }
      if (table === "Courses" && values.organizationId) {
        const org = findRecord_(
          ctx.book,
          "Organizations",
          values.organizationId,
        ).record;
        assert_(
          values.status !== "published" || org.status === "published",
          "VALIDATION",
          "發布課程前，關聯機構也必須已發布。",
        );
      }
      if (table === "Organizations" && before && values.status !== "published")
        assertNoPublishedCourse_(ctx.book, before.id);
      const now = new Date().toISOString();
      const record = Object.assign({}, values, {
        id: before
          ? before.id
          : SCHEMAS_[table].prefix + "_" + Utilities.getUuid(),
        createdAt: before ? before.createdAt : now,
        updatedAt: now,
        version: before ? before.version + 1 : 1,
      });
      return mutate_(
        ctx,
        before ? "update" : "create",
        table,
        record.id,
        function () {
          const sheet = sheet_(ctx.book, table);
          const row = before
            ? findRecord_(ctx.book, table, before.id).row
            : sheet.getLastRow() + 1;
          writeRow_(sheet, table, row, record);
          return record;
        },
      );
    });
  });
}
function archiveRecord(table, id, version) {
  return rpc_(function (ctx) {
    return locked_(function () {
      ctx = authorize_();
      requireWrites_();
      contentTable_(table);
      const found = findRecord_(ctx.book, table, id);
      assert_(
        Number.isInteger(version) && found.record.version === version,
        "CONFLICT",
        "資料已變更，請重新載入。",
      );
      if (table === "Organizations") assertNoPublishedCourse_(ctx.book, id);
      const record = Object.assign({}, found.record, {
        status: "archived",
        version: version + 1,
        updatedAt: new Date().toISOString(),
      });
      return mutate_(ctx, "archive", table, id, function () {
        writeRow_(sheet_(ctx.book, table), table, found.row, record);
        return record;
      });
    });
  });
}
function deleteRecord(table, id, version) {
  return rpc_(function (ctx) {
    return locked_(function () {
      ctx = authorize_();
      requireWrites_();
      contentTable_(table);
      const found = findRecord_(ctx.book, table, id);
      assert_(
        Number.isInteger(version) && found.record.version === version,
        "CONFLICT",
        "資料已變更，請重新載入。",
      );
      assert_(
        found.record.status === "draft" || found.record.status === "archived",
        "VALIDATION",
        "請先下架後再刪除。",
      );
      if (table === "Organizations")
        assert_(
          !readRows_(ctx.book, "Courses").some(function (c) {
            return c.organizationId === id;
          }),
          "VALIDATION",
          "此機構仍有關聯課程，請先解除關聯。",
        );
      return mutate_(ctx, "delete", table, id, function () {
        sheet_(ctx.book, table).deleteRow(found.row);
        return { id: id };
      });
    });
  });
}
function previewPublic() {
  return rpc_(function (ctx) {
    return locked_(function () {
      ctx = authorize_();
      return buildPublic_(ctx.book);
    });
  });
}
function exportPublic() {
  return rpc_(function (ctx) {
    return locked_(function () {
      ctx = authorize_();
      requireWrites_();
      const snapshot = buildPublic_(ctx.book);
      return mutate_(ctx, "export", "PublicSnapshot", "snapshot", function () {
        return {
          filename: "content.json",
          json: JSON.stringify(snapshot, null, 2),
        };
      });
    });
  });
}

function rpc_(fn) {
  try {
    return { ok: true, data: fn(authorize_()) };
  } catch (e) {
    // Never include Google exception details, spreadsheet IDs, content or stack in browser responses.
    return {
      ok: false,
      error: {
        code: e.isPublicError ? e.code : "INTERNAL",
        message: e.isPublicError
          ? e.message
          : "操作未完成，請重新載入確認資料。若持續發生，請聯絡管理員。",
      },
    };
  }
}
function authorize_() {
  const email = String(Session.getActiveUser().getEmail() || "")
    .trim()
    .toLowerCase();
  const effective = String(Session.getEffectiveUser().getEmail() || "")
    .trim()
    .toLowerCase();
  assert_(
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "IDENTITY_UNAVAILABLE",
    "無法辨識Google登入身分，已拒絕操作。",
  );
  assert_(
    email === effective,
    "EXECUTION_IDENTITY",
    "執行身分與登入者不符，請確認以存取者身分執行。",
  );
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("SPREADSHEET_ID");
  assert_(id, "NOT_CONFIGURED", "後台尚未完成試算表設定。");
  let book;
  try {
    // Drive capabilities are evaluated with the current visitor's OAuth token, not the owner token.
    const file = Drive.Files.get(id, { fields: "capabilities(canEdit)" });
    assert_(
      file.capabilities && file.capabilities.canEdit === true,
      "SHEET_PERMISSION",
      "此Google帳號未具備試算表編輯權限。",
    );
    book = SpreadsheetApp.openById(id);
  } catch (e) {
    if (e.code) throw e;
    fail_("SHEET_PERMISSION", "無法確認試算表存取權限，已拒絕操作。");
  }
  const admins = readRows_(book, "AdminUsers");
  assert_(
    admins.some(function (a) {
      return (
        a.status === "published" &&
        String(a.email).trim().toLowerCase() === email
      );
    }),
    "NOT_AUTHORIZED",
    "此Google帳號未列入管理員白名單。",
  );
  return { email: email, book: book };
}
function writesEnabled_() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty("WRITE_ENABLED") !== "true") return false;
  try {
    const review = JSON.parse(p.getProperty("SECURITY_REVIEW_JSON") || "{}");
    return (
      review.executeAs === "USER_ACCESSING" &&
      review.access === "ANYONE" &&
      typeof review.testedAt === "string" &&
      !isNaN(Date.parse(review.testedAt)) &&
      Number.isInteger(review.authorizedAccountsTested) &&
      review.authorizedAccountsTested >= 2 &&
      review.unauthorizedDenied === true &&
      review.viewerDenied === true &&
      review.exportChecked === true
    );
  } catch (_) {
    return false;
  }
}
function requireWrites_() {
  assert_(
    writesEnabled_(),
    "WRITES_DISABLED",
    "正式寫入尚未啟用。請先完成Google帳號及部署安全驗收。",
  );
}
function locked_(fn) {
  const lock = LockService.getScriptLock();
  assert_(lock.tryLock(10000), "BUSY", "其他同仁正在儲存，請稍後再試。");
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
function contentTable_(t) {
  assert_(
    CONTENT_TABLES_.indexOf(t) !== -1,
    "INVALID_TABLE",
    "不允許操作此資料表。",
  );
}
function sheet_(book, table) {
  assert_(
    Object.prototype.hasOwnProperty.call(SCHEMAS_, table),
    "INVALID_TABLE",
    "資料表無效。",
  );
  const s = book.getSheetByName(table);
  assert_(s, "SCHEMA", "缺少工作表，請聯絡管理員執行初始化。");
  const expected = headers_(table);
  const actual = s
    .getRange(1, 1, 1, Math.max(s.getLastColumn(), expected.length))
    .getValues()[0];
  assert_(
    JSON.stringify(actual) === JSON.stringify(expected),
    "SCHEMA",
    "工作表欄位已變更，已停止操作。請聯絡維護人員。",
  );
  return s;
}
function readRows_(book, table) {
  const s = sheet_(book, table),
    h = headers_(table);
  if (s.getLastRow() < 2) return [];
  const range = s.getRange(2, 1, s.getLastRow() - 1, h.length);
  assert_(
    !range.getFormulas().some(function (row) {
      return row.some(Boolean);
    }),
    "SCHEMA",
    "資料區不得包含試算表公式。",
  );
  const ids = {};
  return range
    .getValues()
    .filter(function (row) {
      return row.some(function (v) {
        return v !== "";
      });
    })
    .map(function (row) {
      const out = {};
      h.forEach(function (k, i) {
        const v = row[i];
        out[k] = v instanceof Date ? v.toISOString() : v;
      });
      assert_(
        typeof out.id === "string" && out.id && !ids[out.id],
        "SCHEMA",
        "資料ID遺失或重複，已停止操作。",
      );
      ids[out.id] = true;
      assert_(
        Number.isInteger(out.version) &&
          out.version >= 1 &&
          typeof out.status === "string" &&
          typeof out.createdAt === "string" &&
          !isNaN(Date.parse(out.createdAt)) &&
          typeof out.updatedAt === "string" &&
          !isNaN(Date.parse(out.updatedAt)),
        "SCHEMA",
        "資料版本或時間欄位錯誤。",
      );
      return out;
    });
}
function findRecord_(book, table, id) {
  assert_(
    typeof id === "string" && id.length > 0,
    "VALIDATION",
    "缺少資料ID。",
  );
  const rows = readRows_(book, table);
  const record = rows.find(function (r) {
    return r.id === id;
  });
  assert_(record, "NOT_FOUND", "找不到資料，可能已被刪除。");
  // Locate the physical row by ID; blank rows never change permanent identity.
  const s = sheet_(book, table);
  const cells = s.getRange(2, 1, s.getLastRow() - 1, 1).getValues();
  return {
    record: record,
    row:
      cells.findIndex(function (r) {
        return r[0] === id;
      }) + 2,
  };
}
function writeRow_(sheet, table, row, record) {
  const h = headers_(table);
  if (row > sheet.getMaxRows())
    sheet.insertRowsAfter(
      sheet.getMaxRows(),
      Math.max(100, row - sheet.getMaxRows()),
    );
  const values = h.map(function (k) {
    const v = record[k] === undefined ? "" : record[k];
    // Escape formula triggers, including whitespace prefixes. Plain text formatting alone is insufficient.
    return typeof v === "string" && /^[\s]*[=+@'\-]/.test(v) ? "'" + v : v;
  });
  sheet.getRange(row, 1, 1, h.length).setNumberFormat("@");
  sheet.getRange(row, 5, 1, 1).setNumberFormat("0");
  sheet.getRange(row, 1, 1, h.length).setValues([values]);
  SpreadsheetApp.flush();
}
function mutate_(ctx, action, entity, recordId, fn) {
  const sheet = sheet_(ctx.book, "AuditLogs"),
    row = sheet.getLastRow() + 1,
    now = new Date().toISOString();
  const audit = {
    id: "audit_" + Utilities.getUuid(),
    createdAt: now,
    updatedAt: now,
    version: 1,
    status: "archived",
    actor: ctx.email,
    action: action,
    entity: entity,
    recordId: recordId,
    outcome: "pending",
    errorCode: "",
  };
  // Write-ahead audit: if this fails, no content mutation is attempted.
  writeRow_(sheet, "AuditLogs", row, audit);
  let result;
  try {
    result = fn();
  } catch (e) {
    audit.outcome = "failed";
    audit.errorCode = e.code || "STORAGE_ERROR";
    audit.updatedAt = new Date().toISOString();
    audit.version = 2;
    try {
      writeRow_(sheet, "AuditLogs", row, audit);
    } catch (_) {
      /* pending audit remains for reconciliation */
    }
    throw e;
  }
  audit.outcome = "applied";
  audit.updatedAt = new Date().toISOString();
  audit.version = 2;
  try {
    writeRow_(sheet, "AuditLogs", row, audit);
  } catch (_) {
    fail_(
      "AUDIT_PENDING",
      "資料可能已儲存，但紀錄尚待確認。請先重新載入，勿重複新增；請管理員檢查pending操作紀錄。",
    );
  }
  return result;
}
function assertNoPublishedCourse_(book, id) {
  assert_(
    !readRows_(book, "Courses").some(function (c) {
      return c.organizationId === id && isPublished_(c);
    }),
    "VALIDATION",
    "請先下架此機構的已發布課程或解除課程關聯。",
  );
}
function isPublished_(r) {
  return r.status === "published";
}
function publicSchemas_() {
  const out = {};
  CONTENT_TABLES_.forEach(function (t) {
    out[t] = { label: SCHEMAS_[t].label, fields: SCHEMAS_[t].fields };
  });
  return out;
}
function target_(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  return v && /^\d+$/.test(v) ? Number(v) : null;
}
function buildPublic_(book) {
  const data = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    organizations: [],
    courses: [],
    announcements: [],
    recruitment: null,
  };
  const names = {
    Organizations: "organizations",
    Courses: "courses",
    Announcements: "announcements",
    Recruitment: "recruitment",
  };
  CONTENT_TABLES_.forEach(function (t) {
    const published = readRows_(book, t)
      .filter(isPublished_)
      .map(function (r) {
        const input = { status: r.status };
        SCHEMAS_[t].fields.forEach(function (f) {
          input[f[0]] = r[f[0]];
        });
        // Revalidate sheet edits; only explicit public fields can cross this boundary.
        const valid = validateFields_(t, input);
        assert_(
          new RegExp("^" + SCHEMAS_[t].prefix + "_[a-f0-9-]{36}$").test(r.id),
          "SCHEMA",
          "發布資料ID格式錯誤。",
        );
        const out = { id: r.id };
        SCHEMAS_[t].publicFields
          .filter(function (k) {
            return k !== "id";
          })
          .forEach(function (k) {
            out[k] = valid[k];
          });
        return out;
      });
    if (t === "Recruitment") {
      assert_(published.length <= 1, "SCHEMA", "招募設定不可重複。");
      data.recruitment = published[0] || null;
    } else data[names[t]] = published;
  });
  const publicOrgIds = data.organizations.map(function (r) {
    return r.id;
  });
  assert_(
    data.courses.every(function (c) {
      return !c.organizationId || publicOrgIds.indexOf(c.organizationId) !== -1;
    }),
    "SCHEMA",
    "課程關聯到未公開機構，請先修正再匯出。",
  );
  return data;
}
