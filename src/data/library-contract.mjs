// The HTTP response is untrusted even when served from the configured Drive file.
const imagePattern = /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/;
export function libraryUrl(value) {
  return typeof value === "string" && value.length <= 1500 &&
    /^https:\/\/[a-z0-9.-]+(?:[/?][^\s@#\\]*)?$/i.test(value);
}
export function libraryImage(value) {
  return libraryUrl(value) || (typeof value === "string" && value.length <= 45000 && imagePattern.test(value));
}
const common = ["title", "categoryId", "summary", "cover", "videoUrl", "publishedAt", "sortOrder", "featured", "sample", "steps", "attachments", "updatedAt"];
const schemas = {
  categories: ["module", "name", "sortOrder"],
  showcases: common.concat(["organization", "context", "problem", "features", "tools", "prompt",
    "benefit", "limitations", "gallery", "appUrl", "githubUrl", "instructions", "instructionsUrl"]),
  resources: common.concat(["type", "body", "audience", "level", "source", "resourceUrl", "fee"]),
};
function requireField(condition) {
  if (!condition) throw new Error("公開成果與資源資料格式錯誤");
}
export function splitLines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
export function parseLinks(value) {
  return splitLines(value).map((line) => {
    const parts = line.split("｜");
    requireField(parts.length === 2 && parts[0].trim() && libraryUrl(parts[1].trim()));
    return { label: parts[0].trim(), url: parts[1].trim() };
  });
}
export function validateLibrarySnapshot(input) {
  requireField(input?.schemaVersion === 1 && typeof input.generatedAt === "string" &&
    Number.isFinite(Date.parse(input.generatedAt)));
  requireField(Object.keys(input).length === 5);
  const data = { schemaVersion: 1, generatedAt: input.generatedAt };
  const ids = new Set();
  const categories = new Map();
  for (const [group, fields] of Object.entries(schemas)) {
    requireField(Array.isArray(input[group]));
    data[group] = input[group].map((row) => {
      requireField(row && /^[a-z0-9][a-z0-9_-]{0,99}$/.test(row.id) &&
        typeof row.id === "string" && !ids.has(row.id) &&
        Object.keys(row).length === fields.length + 1);
      ids.add(row.id);
      for (const key of fields) {
        requireField(Object.hasOwn(row, key) && typeof row[key] === "string" && row[key].length <= 48000);
        if (key.endsWith("Url")) requireField(!row[key] || libraryUrl(row[key]));
      }
      requireField(!row.sortOrder || /^\d{1,6}$/.test(row.sortOrder));
      if (group === "categories") {
        requireField(row.name.trim() && ["showcases", "resources"].includes(row.module));
        categories.set(row.id, row.module);
      } else {
        requireField(categories.get(row.categoryId) === group && row.title.trim() && row.summary.trim());
        requireField(!row.cover || libraryImage(row.cover));
        requireField(!row.gallery || splitLines(row.gallery).every(libraryImage));
        requireField(["", "featured", "pinned"].includes(row.featured) && ["", "sample"].includes(row.sample));
        requireField(row.updatedAt && Number.isFinite(Date.parse(row.updatedAt)));
        parseLinks(row.attachments);
      }
      return row;
    });
  }
  return data;
}
