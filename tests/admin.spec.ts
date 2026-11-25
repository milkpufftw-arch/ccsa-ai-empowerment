import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { harness } from "./apps-script/harness.mjs";
import { validatePublicSnapshot } from "../src/data/public-contract.mjs";
async function loadAdmin(page: Page, enabled = true, ownerOnly = false, library = false) {
  const h = harness();
  if (library) h.migrateLibrary();
  if (enabled) {
    if (ownerOnly) h.enableOwner();
    else h.enable();
  }
  await page.exposeFunction("__adminRpc", (method: string, args: unknown[]) =>
    h.call(method, ...args),
  );
  await page.addInitScript(() => {
    function runner(success?: Function, failure?: Function): unknown {
      return new Proxy(
        {},
        {
          get(_t, key) {
            if (key === "withSuccessHandler")
              return (fn: Function) => runner(fn, failure);
            if (key === "withFailureHandler")
              return (fn: Function) => runner(success, fn);
            return (...args: unknown[]) =>
              Reflect.get(window, "__adminRpc")(key, args).then(
                success,
                failure,
              );
          },
        },
      );
    }
    Reflect.set(window, "google", { script: { run: runner() } });
  });
  const html = readFileSync(
    new URL("../apps-script/Index.html", import.meta.url),
    "utf8",
  );
  await page.route("**/admin-local-test", (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  await page.goto("/admin-local-test");
  await expect(
    page.getByRole("heading", { name: "後台首頁", exact: true }),
  ).toBeVisible();
  return h;
}
test("後台桌機與手機：新增、驗證、發布、預覽、下架確認、刪除與操作紀錄", async ({
  page,
}) => {
  const h = await loadAdmin(page);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "合作機構", exact: true })
      .click();
    await page
      .getByRole("button", { name: "＋ 新增合作機構", exact: true })
      .click();
    await page
      .getByLabel("機構名稱 ＊", { exact: true })
      .fill("新增測試機構" + width);
    await page.getByLabel("縣市 ＊", { exact: true }).fill("臺北市");
    await page
      .getByLabel("公開簡介 ＊", { exact: true })
      .fill("經核定的公開簡介");
    await page
      .getByLabel("內部備註（不匯出）", { exact: false })
      .fill("內部作業文字");
    await page
      .getByRole("combobox", { name: "發布狀態 ＊", exact: true })
      .selectOption("published");
    await page.getByRole("button", { name: "預覽公開欄位" }).click();
    await expect(page.locator("#preview-body")).toContainText(
      "經核定的公開簡介",
    );
    await expect(page.locator("#preview-body")).not.toContainText(
      "內部作業文字",
    );
    await page.locator("#preview-close").click();
    await page.getByRole("button", { name: "儲存", exact: true }).click();
    await expect(page.locator("#editor")).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: "已發布", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    page.once("dialog", (d) => d.dismiss());
    await page.getByRole("button", { name: "下架", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: "已發布", exact: true }),
    ).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "下架", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: "已下架", exact: true }),
    ).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "刪除", exact: true }).click();
    await expect(page.getByText("目前沒有符合條件的資料。")).toBeVisible();
  }
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "後台首頁", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "最近修改紀錄" }),
  ).toBeVisible();
  expect(
    h
      .call("getBootstrap")
      .data.recentChanges.some(
        (l: { action: string }) => l.action === "delete",
      ),
  ).toBe(true);
});
test("後台寫入關閉時可查看資料，新增及匯出無法操作", async ({ page }) => {
  await loadAdmin(page, false);
  await expect(page.locator("#write-notice")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "合作機構", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "＋ 新增合作機構", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "公開資料發布", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "下載公開JSON", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "預覽已發布JSON", exact: true })
    .click();
  await expect(page.locator("#preview-body")).toContainText(
    '"organizations": []',
  );
});

test("擁有者新增公告、下載公開資料後，前台首頁與詳細頁能顯示", async ({
  page,
  context,
}) => {
  const h = await loadAdmin(page, true, true);
  await expect(page.locator("#write-notice")).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "公告", exact: true })
    .click();
  await page.getByRole("button", { name: "＋ 新增公告", exact: true }).click();
  await page.getByLabel("標題 ＊", { exact: true }).fill("後台發布流程練習");
  await page
    .getByLabel("摘要 ＊", { exact: true })
    .fill("這是一則可公開的測試公告。");
  await page
    .getByLabel("內容（純文字） ＊", { exact: true })
    .fill("完成資料確認，再將核准內容更新到前台。");
  await page.getByLabel("公告日期 ＊", { exact: true }).fill("2026-11-23");
  await page
    .getByLabel("內部備註", { exact: false })
    .fill("僅供內部核對，不可公開");
  await page
    .getByRole("combobox", { name: "發布狀態 ＊", exact: true })
    .selectOption("published");
  await page.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(page.locator("#editor")).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "公開資料發布", exact: true })
    .click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "下載公開JSON", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("content.json");
  const path = await download.path();
  if (!path) throw new Error("公開檔案未下載");
  const raw = readFileSync(path, "utf8");
  const snapshot = validatePublicSnapshot(JSON.parse(raw));
  expect(snapshot.announcements).toHaveLength(1);
  expect(raw).not.toContain("僅供內部核對");
  expect(raw).not.toContain("admin@example.test");
  expect(h.properties.has("SECURITY_REVIEW_JSON")).toBe(false);
  const frontend = await context.newPage();
  await frontend.route("**/data/content.json", (route) =>
    route.fulfill({ json: snapshot }),
  );
  await frontend.goto("http://127.0.0.1:4173/");
  await frontend.getByRole("link", { name: /後台發布流程練習/ }).click();
  await expect(frontend.locator("main h1")).toHaveText("後台發布流程練習");
  await expect(
    frontend.getByText("完成資料確認，再將核准內容更新到前台。", {
      exact: true,
    }),
  ).toBeVisible();
  await frontend.close();
});

test("成果與資源從後台同步前台，保留原內容並隔離草稿、下架與無法讀取的狀態", async ({ page, context }) => {
  test.setTimeout(120_000);
  const h = await loadAdmin(page, true, true, true);
  h.properties.set("LIBRARY_SNAPSHOT_READER", "reader@staging-test.iam.gserviceaccount.com");
  const { LIBRARY_PUBLIC_FILE_ID } = h.context.installLibraryPublisher_();
  const file = h.state.files.get(LIBRARY_PUBLIC_FILE_ID);
  const publicPage = await context.newPage();
  await publicPage.clock.install();
  let unavailable = false;
  await publicPage.route("**/api/library", (route) => {
    if (unavailable) return route.fulfill({ status: 503 });
    return route.fulfill({ contentType: "application/json", body: file.blob.json });
  });
  async function nav(name: string) {
    await page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
  }
  async function save() {
    await page.getByRole("button", { name: "儲存", exact: true }).click();
    await expect(page.locator("#editor")).not.toBeVisible();
  }
  function form(key: string) { return page.locator("#field-" + key); }
  async function synchronize() {
    h.context.refreshLibrary_();
    await publicPage.clock.fastForward(60_100);
  }
  const row = (title: string) => page.getByRole("row").filter({ hasText: title });
  const publicApp = () => publicPage.locator(".showcase-card").filter({ hasText: "公開成果測試" });
  await publicPage.goto("/showcase");
  await expect(publicPage.getByText("還沒找到符合的成果")).toBeVisible();
  await expect(publicPage.locator(".showcase-card")).toHaveCount(0);

  await nav("成果與資源分類管理");
  await page.getByRole("button", { name: "＋ 新增分類" }).click();
  await form("name").fill("新增實務分類");
  await form("module").selectOption("showcases");
  await form("sortOrder").fill("0");
  await save();
  const categoryId = h.call("listRecords", "LibraryCategories").data.find((r) => r.name === "新增實務分類").id;
  await nav("AI 應用成果庫管理");
  await expect(row("把會議整理時間，留給更重要的陪伴")).toContainText("草稿");
  await page.getByRole("button", { name: "＋ 新增AI 應用成果" }).click();
  await form("title").fill("公開成果測試");
  await form("categoryId").selectOption(categoryId);
  await form("summary").fill("草稿摘要");
  await form("organization").fill("隔離測試團隊");
  page.once("dialog", (d) => d.dismiss());
  await page.locator("#editor-close").click();
  await expect(page.locator("#editor")).toBeVisible();
  await save();
  await synchronize();
  await expect(publicApp()).toHaveCount(0);

  await row("公開成果測試").getByRole("button", { name: "編輯", exact: true }).click();
  const pixels = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 16;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#005533";
    ctx.fillRect(0, 0, 16, 16);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const image = { name: "cover.png", mimeType: "image/png", buffer: Buffer.from(pixels, "base64") };
  await page.getByLabel("上傳封面圖片").setInputFiles(image);
  await expect(page.getByAltText("封面圖片 1")).toBeVisible();
  await page.getByLabel("上傳展示圖片").setInputFiles(image);
  await expect(page.getByAltText("展示圖片 1")).toBeVisible();
  await form("summary").fill("發布後的摘要");
  await form("status").selectOption("published");
  await form("featured").selectOption("pinned");
  await form("appUrl").fill("https://example.org/app");
  await form("instructionsUrl").fill("https://example.org/guide");
  await form("videoUrl").fill("https://www.youtube.com/watch?v=test");
  await form("githubUrl").fill("https://github.com/example/repo");
  await form("features").fill("具備 **可格式化** 的文字");
  await page.getByRole("button", { name: "預覽公開欄位" }).click();
  await expect(page.locator("#preview-body").getByRole("link", { name: "體驗 AI 應用" })).toHaveAttribute("href", "https://example.org/app");
  await page.locator("#preview-close").click();
  await save();
  await synchronize();
  await expect(publicPage.locator(".showcase-card").first()).toContainText("公開成果測試");
  const showcaseId = h.call("listRecords", "Showcases").data.find((r) => r.title === "公開成果測試").id;
  const stored = h.call("getRecord", "Showcases", showcaseId).data;
  expect(stored.cover).toMatch(/^data:image\/jpeg;base64,/);
  expect(stored.gallery).toMatch(/^data:image\/jpeg;base64,/);
  await publicPage.getByRole("button", { name: "新增實務分類", exact: true }).click();
  await expect(publicPage.locator(".showcase-card")).toHaveCount(1);
  await nav("成果與資源分類管理");
  await row("新增實務分類").getByRole("button", { name: "編輯", exact: true }).click();
  await form("name").fill("更新實務分類");
  await save();
  await synchronize();
  await expect(publicPage.getByRole("button", { name: "更新實務分類" })).toHaveAttribute("aria-pressed", "true");
  await publicApp().getByRole("link", { name: "公開成果測試", exact: true }).click();
  await expect(publicPage.getByAltText("公開成果測試封面")).toBeVisible();
  await expect(publicPage.getByAltText("成果展示圖片 1")).toBeVisible();
  await expect(publicPage.locator(".library-text strong")).toHaveText("可格式化");
  await expect(publicPage.getByRole("link", { name: "查看原始碼" })).toHaveAttribute("href", "https://github.com/example/repo");
  await expect(publicPage.getByRole("link", { name: "操作教學" })).toHaveAttribute("href", "https://example.org/guide");
  await expect(publicPage.getByRole("link", { name: "觀看影片" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=test");
  await nav("AI 應用成果庫管理");
  await row("公開成果測試").getByRole("button", { name: "編輯", exact: true }).click();
  await page.getByLabel("封面圖片網址").fill("https://example.org/new.jpg");
  await page.getByRole("button", { name: "使用此封面網址" }).click();
  await form("summary").fill("更新後的摘要");
  await save();
  await publicPage.route("https://example.org/new.jpg", (route) => route.fulfill({ contentType: "image/png", body: image.buffer }));
  await synchronize();
  await expect(publicPage.getByAltText("公開成果測試封面")).toHaveAttribute("src", "https://example.org/new.jpg");
  await expect(publicPage.getByText("更新後的摘要", { exact: true })).toBeVisible();
  await row("公開成果測試").getByRole("button", { name: "編輯", exact: true }).click();
  await page.getByRole("button", { name: "移除圖片 1" }).first().click();
  await save();
  await synchronize();
  await expect(publicPage.getByAltText("公開成果測試封面")).toHaveCount(0);
  await row("公開成果測試").getByRole("button", { name: "複製", exact: true }).click();
  await expect(form("status")).toHaveValue("draft");
  await form("title").fill("複製的草稿");
  await save();
  expect(h.call("listRecords", "Showcases").data.find((r) => r.title === "複製的草稿").id).not.toBe(showcaseId);

  page.once("dialog", (d) => d.accept());
  await row("公開成果測試").getByRole("button", { name: "下架", exact: true }).click();
  await expect(row("公開成果測試")).toContainText("已下架");
  await synchronize();
  await expect(publicPage.getByText("這條路，還沒通往未來。")).toBeVisible();
  const decisions = [true, false];
  const confirmDelete = async (dialog) => decisions.shift() ? dialog.accept() : dialog.dismiss();
  page.on("dialog", confirmDelete);
  await row("公開成果測試").getByRole("button", { name: "刪除", exact: true }).click();
  page.off("dialog", confirmDelete);
  expect(decisions).toHaveLength(0);
  await expect(row("公開成果測試")).toBeVisible();

  await nav("AI 學習資源管理");
  await expect(row("第一次使用AI：提問與查證入門")).toContainText("草稿");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "＋ 新增AI 學習資源" }).click();
  await form("title").fill("新學習資源");
  await form("categoryId").selectOption("category_resources_1");
  await form("summary").fill("可公開的學習摘要");
  await form("type").selectOption("AI 工具");
  await form("resourceUrl").fill("https://example.org/tool");
  await form("attachments").fill("練習手冊｜https://drive.google.com/file/d/sample/view");
  await form("status").selectOption("published");
  await form("featured").selectOption("featured");
  await save();
  await synchronize();
  await publicPage.setViewportSize({ width: 390, height: 844 });
  await publicPage.goto("/resources");
  await expect(publicPage.locator(".resource-card")).toHaveCount(1);
  await expect(publicPage.locator(".resource-card").first()).toContainText("新學習資源");
  await publicPage.getByLabel("資源類型").selectOption("AI 工具");
  await expect(publicPage.locator(".resource-card")).toHaveCount(1);
  await expect(publicPage.getByRole("link", { name: "下載教材 · 練習手冊" }))
    .toHaveAttribute("href", "https://drive.google.com/file/d/sample/view");
  await expect(publicPage.getByRole("link", { name: "使用工具" })).toHaveAttribute("href", "https://example.org/tool");
  await row("新學習資源").getByRole("button", { name: "編輯", exact: true }).click();
  await form("summary").fill("新版學習摘要");
  await save();
  await synchronize();
  await expect(publicPage.getByText("新版學習摘要")).toBeVisible();
  expect(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  page.once("dialog", (dialog) => dialog.accept());
  await row("新學習資源").getByRole("button", { name: "下架", exact: true }).click();
  await expect(row("新學習資源")).toContainText("已下架");
  await synchronize();
  await expect(publicPage.getByText("還沒找到符合的資源")).toBeVisible();
  await expect(publicPage.locator(".resource-card")).toHaveCount(0);

  unavailable = true;
  await synchronize();
  await expect(publicPage.getByRole("alert")).toContainText("暫時無法載入");
  await expect(publicPage.locator(".resource-card")).toHaveCount(0);
});
