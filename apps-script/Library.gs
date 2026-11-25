// Library tables share the existing authenticated CRUD and audit trail.
const LIBRARY_TABLES_ = ["Showcases", "LearningResources", "LibraryCategories"];
const LIBRARY_NAMES_ = { Showcases: "showcases", LearningResources: "resources" };
const LIBRARY_TYPES_ = ["網站", "影片", "文件", "課程", "提示詞", "Skill", "AI 工具", "操作指引", "其他"];
const LIBRARY_COMMON_ = [
  ["title", "名稱", "text", true, 160],
  ["categoryId", "分類", "category", true, 100],
  ["summary", "摘要", "textarea", true, 1500],
  ["cover", "封面圖片", "library-image", false, 45000],
  ["videoUrl", "教學影片網址", "url", false, 1500],
  ["publishedAt", "發布日期", "date", false],
  ["sortOrder", "顯示順序（數字小的在前）", "order", false, 6],
  ["featured", "精選設定", "select", false, ["", "featured", "pinned"]],
];
const LIBRARY_DEFINITIONS_ = {
  Showcases: {
    label: "AI 應用成果",
    prefix: "showcase",
    fields: LIBRARY_COMMON_.concat([
      ["organization", "開發／應用機構", "text", true, 160],
      ["context", "應用背景", "textarea", false, 6000],
      ["problem", "原有問題及需求", "textarea", false, 6000],
      ["features", "功能介紹", "textarea", false, 6000],
      ["tools", "使用的 AI 工具（一行一項）", "textarea", false, 2000],
      ["steps", "操作步驟（一行一項）", "textarea", false, 6000],
      ["prompt", "提示詞範例", "textarea", false, 6000],
      ["benefit", "應用成效", "textarea", false, 6000],
      ["limitations", "應用限制與注意事項", "textarea", false, 6000],
      ["gallery", "展示圖片（一行一張）", "library-gallery", false, 48000],
      ["appUrl", "AI 應用網址", "url", false, 1500],
      ["githubUrl", "GitHub 網址", "url", false, 1500],
      ["instructions", "操作說明", "textarea", false, 6000],
      ["instructionsUrl", "操作說明網址", "url", false, 1500],
      ["attachments", "附件（一行一項：名稱｜HTTPS 網址）", "library-links", false, 6000],
      ["sample", "示範標示", "select", false, ["", "sample"]],
    ]),
  },
  LearningResources: {
    label: "AI 學習資源",
    prefix: "resource",
    fields: LIBRARY_COMMON_.concat([
      ["type", "資源類型", "select", true, LIBRARY_TYPES_],
      ["body", "詳細介紹", "textarea", false, 6000],
      ["steps", "操作指引（一行一項）", "textarea", false, 6000],
      ["audience", "適用對象", "text", false, 500],
      ["level", "學習程度", "select", false, ["", "入門", "進階", "不限"]],
      ["source", "資源來源", "text", false, 300],
      ["resourceUrl", "資源網址", "url", false, 1500],
      ["attachments", "教材（一行一項：名稱｜HTTPS 網址）", "library-links", false, 6000],
      ["fee", "費用類型", "select", false, ["", "免費", "付費", "部分免費"]],
      ["sample", "示範標示", "select", false, ["", "sample"]],
    ]),
  },
  LibraryCategories: {
    label: "分類",
    prefix: "category",
    fields: [
      ["name", "分類名稱", "text", true, 80],
      ["module", "適用模組", "select", true, ["showcases", "resources"]],
      ["sortOrder", "顯示順序（數字小的在前）", "order", false, 6],
    ],
  },
};

function librarySchema_(table) {
  return Object.prototype.hasOwnProperty.call(LIBRARY_DEFINITIONS_, table)
    ? LIBRARY_DEFINITIONS_[table]
    : null;
}
function schema_(table) {
  return librarySchema_(table) ||
    (Object.prototype.hasOwnProperty.call(SCHEMAS_, table) ? SCHEMAS_[table] : null);
}
function libraryReady_() {
  return PropertiesService.getScriptProperties().getProperty("LIBRARY_SCHEMA") === "1";
}
function lines_(value) {
  return value.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
}
function libraryLink_(value) {
  const parts = value.split("｜");
  return parts.length === 2 && parts[0].trim() && parts[0].length <= 160 &&
    parts[1].trim() && safeUrl_(parts[1].trim(), "url");
}
function libraryImage_(value) {
  if (/^https:\/\//.test(value)) return value.length <= 1500 && safeUrl_(value, "url");
  if (value.length > 45000 || !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const data = value.slice(value.indexOf(",") + 1);
  if (data.length % 4 !== 0) return false;
  const end = Utilities.base64Decode(data.slice(-8));
  return end.length >= 2 && (end[end.length - 2] & 255) === 255 && (end[end.length - 1] & 255) === 217;
}
function validateLibraryValue_(type, value, label) {
  if (type === "order") assert_(/^\d{1,6}$/.test(value), "VALIDATION", label + "須為 0 至 999999 的整數。");
  if (type === "library-image") assert_(libraryImage_(value), "VALIDATION", label + "須為 HTTPS 網址或有效的 JPEG 圖片。");
  if (type === "library-gallery") {
    const images = lines_(value);
    assert_(images.length <= 8 && images.every(libraryImage_), "VALIDATION", "最多 8 張展示圖片，請檢查網址或上傳圖片容量。");
  }
  if (type === "library-links") {
    const links = lines_(value);
    assert_(links.length <= 12 && links.every(libraryLink_), "VALIDATION", label + "須以「名稱｜HTTPS 網址」填寫，最多 12 項。");
  }
}
function validateLibraryReference_(book, table, values, before) {
  if (table === "LibraryCategories") {
    if (before && (values.module !== before.module || values.status !== "published"))
      assertUnusedLibraryCategory_(book, before.id);
    assert_(!readRows_(book, table).some(function (r) {
      return (!before || before.id !== r.id) && r.module === values.module &&
        r.name.toLowerCase() === values.name.toLowerCase();
    }), "VALIDATION", "同一模組已有同名分類。");
  } else if (LIBRARY_NAMES_[table]) {
    const category = findRecord_(book, "LibraryCategories", values.categoryId).record;
    assert_(category.module === LIBRARY_NAMES_[table] && isPublished_(category),
      "VALIDATION", "請選擇此模組已公開的分類。");
  }
}
function assertUnusedLibraryCategory_(book, id) {
  assert_(!Object.keys(LIBRARY_NAMES_).some(function (table) {
    return readRows_(book, table).some(function (r) { return r.categoryId === id; });
  }), "VALIDATION", "此分類仍有資料使用，請先將資料改到其他分類。");
}
function sortLibrary_(a, b) {
  const priority = { pinned: 2, featured: 1 };
  return (priority[b.featured] || 0) - (priority[a.featured] || 0) ||
    Number(a.sortOrder || 0) - Number(b.sortOrder || 0) ||
    String(a.id).localeCompare(String(b.id));
}
function buildLibrary_(book) {
  assert_(libraryReady_(), "SCHEMA", "請先完成成果與資源資料移轉。");
  const data = { schemaVersion: 1, generatedAt: new Date().toISOString() };
  LIBRARY_TABLES_.slice().reverse().forEach(function (table) {
    const schema = librarySchema_(table);
    data[LIBRARY_NAMES_[table] || "categories"] = readRows_(book, table)
      .filter(isPublished_)
      .map(function (r) {
        const input = { status: r.status };
        schema.fields.forEach(function (f) { input[f[0]] = r[f[0]]; });
        const valid = validateFields_(table, input);
        assert_(/^[a-z0-9][a-z0-9_-]{0,99}$/.test(r.id), "SCHEMA", "公開資料 ID 格式錯誤。");
        // Construct the DTO only from schema fields plus explicitly public metadata.
        const out = { id: r.id };
        if (table !== "LibraryCategories") {
          assert_(data.categories.some(function (c) {
            return c.id === valid.categoryId && c.module === LIBRARY_NAMES_[table];
          }), "VALIDATION", "已發布內容缺少公開分類。");
          out.updatedAt = r.updatedAt;
        }
        schema.fields.forEach(function (f) { out[f[0]] = valid[f[0]]; });
        return out;
      }).sort(sortLibrary_);
  });
  return data;
}

function getLibrarySyncStatus() {
  return rpc_(function () {
    return PropertiesService.getScriptProperties().getProperty("LIBRARY_LAST_SYNC_AT");
  });
}

function previewLibrary() {
  return rpc_(function (ctx) {
    return locked_(function () { return buildLibrary_(authorize_().book); });
  });
}
