import { readFile } from "node:fs/promises";
import { validatePublicSnapshot } from "../src/data/public-contract.mjs";

try {
  const source =
    process.argv[2] || new URL("../public/data/content.json", import.meta.url);
  const raw = await readFile(source, "utf8");
  if (Buffer.byteLength(raw) > 5 * 1024 * 1024)
    throw new Error("公開資料檔超過5MB，請檢查匯出內容。");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    throw new Error("公開資料不是有效JSON，請重新下載後台匯出檔。");
  }
  const data = validatePublicSnapshot(parsed);
  console.log(
    `公開資料驗證通過：${data.organizations.length} 家機構、${data.courses.length} 堂課程、${data.announcements.length} 則公告。`,
  );
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
