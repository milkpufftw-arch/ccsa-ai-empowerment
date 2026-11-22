// Shared by the website and the controlled import tool. Reject unknown fields before commit.
export const publicFields = {
  organizations: [
    "id",
    "name",
    "city",
    "region",
    "summary",
    "features",
    "aiDirection",
    "logoUrl",
  ],
  courses: [
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
  announcements: ["id", "title", "category", "summary", "content", "date"],
  recruitment: [
    "id",
    "startDate",
    "endDate",
    "recruitmentStatus",
    "formUrl",
    "resultsUrl",
    "description",
  ],
};
export const courseCategories = [
  "專業人員AI初階培力",
  "專業人員AI進階培力",
  "青少年AI生活應用訓練",
  "青少年AI體驗教育",
  "其他計畫相關活動",
];
const newsCategories = [
  "最新消息",
  "機構招募",
  "錄取公告",
  "課程通知",
  "成果交流",
];
function check(ok, message) {
  if (!ok) throw new Error("公開資料格式錯誤：" + message);
}
function keys(value, expected) {
  check(
    value && typeof value === "object" && !Array.isArray(value),
    "必須為物件",
  );
  check(
    Object.keys(value).length === expected.length &&
      expected.every((k) => Object.hasOwn(value, k)),
    "欄位白名單不符",
  );
}
function date(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
function url(value, kind) {
  if (!value) return true;
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.hash ||
      u.port ||
      /[\s\\]/.test(value)
    )
      return false;
    if (kind === "form")
      return (
        (u.hostname === "docs.google.com" && /^\/forms\//.test(u.pathname)) ||
        (u.hostname === "forms.gle" && u.pathname.length > 1)
      );
    if (kind === "image")
      return /\.(png|jpe?g|webp)$/i.test(u.pathname) && !u.search;
    return true;
  } catch {
    return false;
  }
}
export function validatePublicSnapshot(data) {
  keys(data, [
    "schemaVersion",
    "generatedAt",
    "organizations",
    "courses",
    "announcements",
    "recruitment",
  ]);
  check(data.schemaVersion === 1, "不支援的版本");
  check(
    typeof data.generatedAt === "string" &&
      /^\d{4}-\d{2}-\d{2}T/.test(data.generatedAt) &&
      !Number.isNaN(Date.parse(data.generatedAt)),
    "產生時間無效",
  );
  const prefixes = {
    organizations: "org",
    courses: "course",
    announcements: "news",
    recruitment: "recruitment",
  };
  for (const table of Object.keys(publicFields)) {
    const rows =
      table === "recruitment"
        ? data.recruitment === null
          ? []
          : [data.recruitment]
        : data[table];
    check(Array.isArray(rows) && rows.length <= 10000, "清單無效或過大");
    const ids = new Set();
    for (const r of rows) {
      keys(r, publicFields[table]);
      check(
        Object.values(r).every(
          (v) =>
            typeof v === "string" &&
            v.length <= 12000 &&
            !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
        ),
        "欄位必須是有效文字",
      );
      check(
        new RegExp("^" + prefixes[table] + "_[a-f0-9-]{36}$").test(r.id) &&
          !ids.has(r.id),
        "ID無效或重複",
      );
      ids.add(r.id);
      const required = {
        organizations: ["name", "city", "region", "summary"],
        courses: [
          "title",
          "category",
          "description",
          "date",
          "location",
          "audience",
          "registrationStatus",
        ],
        announcements: ["title", "category", "summary", "content", "date"],
        recruitment: ["recruitmentStatus", "formUrl", "description"],
      }[table];
      check(
        required.every((k) => r[k].trim().length > 0),
        "缺少必填欄位",
      );
      if (table === "organizations") {
        check(
          ["北部", "中部", "南部", "東部", "離島", "全國"].includes(r.region),
          "區域無效",
        );
        check(url(r.logoUrl, "image"), "Logo網址無效");
      }
      if (table === "courses") {
        check(courseCategories.includes(r.category), "課程分類無效");
        check(date(r.date), "日期無效");
        check(
          ["not_open", "open", "closed", "full"].includes(r.registrationStatus),
          "報名狀態無效",
        );
        check(
          url(r.registrationUrl, "form") &&
            (r.registrationStatus !== "open" || !!r.registrationUrl),
          "報名網址無效",
        );
      }
      if (table === "announcements") {
        check(newsCategories.includes(r.category), "公告分類無效");
        check(date(r.date), "日期無效");
      }
      if (table === "recruitment") {
        check(
          ["not_open", "open", "closed", "announced"].includes(
            r.recruitmentStatus,
          ),
          "招募狀態無效",
        );
        check(
          (!r.startDate || date(r.startDate)) &&
            (!r.endDate || date(r.endDate)) &&
            (!r.startDate || !r.endDate || r.startDate <= r.endDate),
          "招募日期無效",
        );
        check(
          r.recruitmentStatus !== "open" || (!!r.startDate && !!r.endDate),
          "招募日期未設定",
        );
        check(url(r.formUrl, "form") && url(r.resultsUrl), "招募網址無效");
      }
    }
  }
  const orgIds = new Set(data.organizations.map((r) => r.id));
  check(
    data.courses.every(
      (c) => !c.organizationId || orgIds.has(c.organizationId),
    ),
    "課程關聯機構未公開",
  );
  return data;
}
