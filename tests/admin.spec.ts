import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { harness } from "./apps-script/harness.mjs";
import { validatePublicSnapshot } from "../src/data/public-contract.mjs";
async function loadAdmin(page: Page, enabled = true, ownerOnly = false) {
  const h = harness();
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
