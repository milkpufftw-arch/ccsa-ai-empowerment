import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validatePublicSnapshot } from "../src/data/public-contract.mjs";
const source = process.argv[2];
if (!source) {
  console.error("用法：npm run content:import -- /本機路徑/content.json");
  process.exit(1);
}
try {
  const raw = await readFile(source, "utf8");
  if (Buffer.byteLength(raw) > 5 * 1024 * 1024)
    throw new Error("檔案超過5MB，請由維護人員檢查。");
  const data = validatePublicSnapshot(JSON.parse(raw));
  const dest = fileURLToPath(
    new URL("../public/data/content.json", import.meta.url),
  );
  await mkdir(fileURLToPath(new URL("../public/data/", import.meta.url)), {
    recursive: true,
  });
  await writeFile(dest, JSON.stringify(data, null, 2) + "\n");
  console.log(
    `已驗證並匯入 ${data.organizations.length} 家機構、${data.courses.length} 堂課程、${data.announcements.length} 則公告。請人工檢查公開授權、內容及Git差異，再進行部署。`,
  );
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
