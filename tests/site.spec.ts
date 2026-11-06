import { test, expect } from "@playwright/test";
test("主要頁面與行動版均可閱讀，無水平溢出", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/about",
      "/seed",
      "/courses",
      "/showcase",
      "/resources",
      "/courses/ai-basics",
      "/showcase/meeting-notes",
      "/missing",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      expect(await page.evaluate(() => scrollY)).toBe(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test("成果篩選、搜尋、空結果、詳細頁與重新載入", async ({ page }) => {
  await page.goto("/showcase");
  await expect(page.locator(".showcase-card")).toHaveCount(6);
  await page
    .getByRole("button", { name: "行政管理與工作效率", exact: true })
    .click();
  await expect(page.locator(".showcase-card")).toHaveCount(1);
  await page.getByLabel("搜尋成果").fill("找不到的內容");
  await expect(page.getByText("還沒找到符合的成果")).toBeVisible();
  await page.getByRole("button", { name: "清除所有篩選" }).click();
  await expect(page.locator(".showcase-card")).toHaveCount(6);
  await page.getByLabel("搜尋成果").fill("會議");
  await page.reload();
  await expect(page.locator(".showcase-card")).toHaveCount(1);
  await page
    .getByRole("link", {
      name: "把會議整理時間，留給更重要的陪伴",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "提示詞範例", exact: true }),
  ).toBeVisible();
  await page.goto("/showcase/unknown");
  await expect(page.getByText("這條路，還沒通往未來。")).toBeVisible();
});
test("手機選單、課程分類與資源展開", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "開啟選單" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "培力課程與活動" })
    .click();
  await expect(page.getByRole("button", { name: "開啟選單" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.getByRole("button", { name: "青少年", exact: true }).click();
  await expect(page.locator(".course-card")).toHaveCount(2);
  await page.goto("/resources");
  await page
    .getByRole("button", { name: "AI倫理與個資保護", exact: true })
    .click();
  await expect(page.locator(".resource-card")).toHaveCount(1);
  await page.getByText("閱讀操作指引").click();
  await expect(page.getByText("檢查直接與間接識別資訊。")).toBeVisible();
});
