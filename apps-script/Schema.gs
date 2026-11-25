// All helpers end in '_' so google.script.run cannot invoke them.
const FORM_URL_ =
  "https://docs.google.com/forms/d/e/1FAIpQLSdYOmU6G3BHpwnS_FqiO1yjfdEisC5e-3EqhL0QzycA9FwDiQ/viewform";
const STATUSES_ = ["draft", "pending_review", "published", "archived"];
const COURSE_CATEGORIES_ = [
  "專業人員AI初階培力",
  "專業人員AI進階培力",
  "青少年AI生活應用訓練",
  "青少年AI體驗教育",
  "其他計畫相關活動",
];
const ANNOUNCEMENT_CATEGORIES_ = [
  "最新消息",
  "機構招募",
  "錄取公告",
  "課程通知",
  "成果交流",
];
const BASE_ = ["id", "createdAt", "updatedAt", "status", "version"];
const SCHEMAS_ = {
  Organizations: {
    label: "合作機構",
    prefix: "org",
    fields: [
      ["name", "機構名稱", "text", true, 160],
      ["city", "縣市", "text", true, 30],
      [
        "region",
        "區域",
        "select",
        true,
        ["北部", "中部", "南部", "東部", "離島", "全國"],
      ],
      ["summary", "公開簡介", "textarea", true, 2000],
      ["features", "服務特色", "textarea", false, 2000],
      ["aiDirection", "AI推動方向", "textarea", false, 2000],
      ["logoUrl", "已核准公開的Logo網址", "image", false, 1000],
      ["internalNotes", "內部備註（不匯出）", "textarea", false, 4000],
    ],
    publicFields: [
      "id",
      "name",
      "city",
      "region",
      "summary",
      "features",
      "aiDirection",
      "logoUrl",
    ],
  },
  Courses: {
    label: "課程活動",
    prefix: "course",
    fields: [
      ["title", "課程名稱", "text", true, 160],
      ["category", "分類", "select", true, COURSE_CATEGORIES_],
      ["description", "課程說明", "textarea", true, 6000],
      ["date", "日期", "date", true],
      ["time", "時間", "text", false, 100],
      ["location", "地點", "text", true, 300],
      ["audience", "參與對象", "text", true, 500],
      ["agenda", "課程內容（一行一項）", "textarea", false, 4000],
      ["registrationUrl", "Google Forms報名網址", "form", false, 1000],
      [
        "registrationStatus",
        "報名狀態",
        "select",
        true,
        ["not_open", "open", "closed", "full"],
      ],
      ["organizationId", "關聯機構ID（選填）", "organization", false, 100],
      ["internalNotes", "內部備註（不匯出）", "textarea", false, 4000],
    ],
    publicFields: [
      "id",
      "title",
      "category",
      "description",
      "date",
      "time",
      "location",
      "audience",
      "agenda",
      "registrationUrl",
      "registrationStatus",
      "organizationId",
    ],
  },
  Announcements: {
    label: "公告",
    prefix: "news",
    fields: [
      ["title", "標題", "text", true, 160],
      ["category", "分類", "select", true, ANNOUNCEMENT_CATEGORIES_],
      ["summary", "摘要", "textarea", true, 800],
      ["content", "內容（純文字）", "textarea", true, 12000],
      ["date", "公告日期", "date", true],
      ["internalNotes", "內部備註（不匯出）", "textarea", false, 4000],
    ],
    publicFields: ["id", "title", "category", "summary", "content", "date"],
  },
  Recruitment: {
    label: "招募設定",
    prefix: "recruitment",
    fields: [
      ["startDate", "招募開始日期", "date", false],
      ["endDate", "招募截止日期", "date", false],
      [
        "recruitmentStatus",
        "招募狀態",
        "select",
        true,
        ["not_open", "open", "closed", "announced"],
      ],
      ["formUrl", "既有Google Forms網址", "form", true, 1000],
      ["resultsUrl", "錄取公告網址", "url", false, 1000],
      ["description", "招募說明", "textarea", true, 6000],
      ["internalNotes", "內部備註（不匯出）", "textarea", false, 4000],
    ],
    publicFields: [
      "id",
      "startDate",
      "endDate",
      "recruitmentStatus",
      "formUrl",
      "resultsUrl",
      "description",
    ],
  },
  AdminUsers: {
    label: "管理員白名單",
    prefix: "admin",
    fields: [
      ["email", "Google帳號", "email", true, 254],
      ["displayName", "顯示名稱", "text", false, 100],
    ],
    publicFields: [],
  },
  AuditLogs: {
    label: "操作紀錄",
    prefix: "audit",
    fields: [
      ["actor", "操作帳號", "email", true, 254],
      ["action", "操作", "text", true, 60],
      ["entity", "資料表", "text", true, 60],
      ["recordId", "資料ID", "text", true, 100],
      ["outcome", "結果", "select", true, ["pending", "applied", "failed"]],
      ["errorCode", "錯誤代碼", "text", false, 100],
    ],
    publicFields: [],
  },
};
const CONTENT_TABLES_ = [
  "Organizations",
  "Courses",
  "Announcements",
  "Recruitment",
];

function headers_(table) {
  return BASE_.concat(
    schema_(table).fields.map(function (f) {
      return f[0];
    }),
  );
}
function fail_(code, message) {
  const e = new Error(message);
  e.code = code;
  e.isPublicError = true;
  throw e;
}
function assert_(condition, code, message) {
  if (!condition) fail_(code, message);
}
function isDate_(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
function safeUrl_(value, type) {
  if (!value) return true;
  // No credentials, fragments, control characters, protocol-relative URLs or arbitrary protocols.
  if (!/^https:\/\/[^\s@#\\]+$/.test(value)) return false;
  const host = value.slice(8).split("/")[0].split("?")[0];
  if (!/^[a-z0-9.-]+$/i.test(host)) return false;
  if (type === "form")
    return /^https:\/\/(docs\.google\.com\/forms\/(d\/(e\/)?[a-zA-Z0-9_-]+\/(viewform|edit)|[a-zA-Z0-9_/-]+)|forms\.gle\/[a-zA-Z0-9_-]+)(\?[^\s#]*)?$/.test(
      value,
    );
  // Logo assets are reviewed repository files; Drive private links are not exposed as images.
  if (type === "image")
    return /^https:\/\/[a-z0-9.-]+\/[^?#]+\.(png|jpg|jpeg|webp)$/i.test(value);
  return true;
}
function validateFields_(table, input) {
  assert_(
    CONTENT_TABLES_.indexOf(table) !== -1 || !!librarySchema_(table),
    "INVALID_TABLE",
    "不允許操作此資料表。",
  );
  assert_(
    input && typeof input === "object" && !Array.isArray(input),
    "VALIDATION",
    "資料格式錯誤。",
  );
  const schema = schema_(table);
  const allowed = schema.fields
    .map(function (f) {
      return f[0];
    })
    .concat(["id", "status", "version"]);
  Object.keys(input).forEach(function (k) {
    assert_(allowed.indexOf(k) !== -1, "VALIDATION", "含有不允許的欄位。");
  });
  assert_(
    STATUSES_.indexOf(input.status) !== -1,
    "VALIDATION",
    "請選擇發布狀態。",
  );
  if (librarySchema_(table) || table === "Announcements" || table === "Recruitment")
    assert_(
      input.status !== "pending_review",
      "VALIDATION",
      "此資料不提供待審核狀態。",
    );
  const out = { status: input.status };
  schema.fields.forEach(function (f) {
    const key = f[0],
      label = f[1],
      type = f[2],
      required = f[3];
    const raw = input[key] === undefined ? "" : input[key];
    assert_(typeof raw === "string", "VALIDATION", label + "必須為文字。");
    const v = raw.trim();
    assert_(!required || v.length > 0, "VALIDATION", "請填寫" + label + "。");
    assert_(
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
      "VALIDATION",
      label + "含有無效字元。",
    );
    if (typeof f[4] === "number")
      assert_(v.length <= f[4], "VALIDATION", label + "超過長度限制。");
    if (v && type === "select")
      assert_(f[4].indexOf(v) !== -1, "VALIDATION", label + "選項無效。");
    if (v && type === "date")
      assert_(isDate_(v), "VALIDATION", label + "日期無效。");
    if (v && ["url", "form", "image"].indexOf(type) !== -1)
      assert_(
        safeUrl_(v, type),
        "VALIDATION",
        label + "須使用有效且核准的HTTPS網址。",
      );
    if (v && type === "organization")
      assert_(
        /^org_[a-f0-9-]{36}$/.test(v),
        "VALIDATION",
        "關聯機構ID格式錯誤。",
      );
    if (v && librarySchema_(table)) validateLibraryValue_(type, v, label);
    out[key] = v;
  });
  if (table === "Courses" && out.registrationStatus === "open")
    assert_(
      !!out.registrationUrl,
      "VALIDATION",
      "開放報名時必須提供Google Forms網址。",
    );
  if (table === "Recruitment") {
    assert_(
      !out.startDate || !out.endDate || out.startDate <= out.endDate,
      "VALIDATION",
      "截止日期不得早於開始日期。",
    );
    if (out.recruitmentStatus === "open")
      assert_(
        !!out.startDate && !!out.endDate,
        "VALIDATION",
        "開放招募前請填寫起訖日期。",
      );
  }
  return out;
}
