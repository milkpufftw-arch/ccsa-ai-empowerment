import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { harness } from "./apps-script/harness.mjs";
async function loadAdmin(page: Page, enabled = true) {
  const h = harness();
  if (enabled) h.enable();
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
