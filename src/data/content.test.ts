import { describe, it, expect } from "vitest";
import { filterShowcases, showcases, categories } from "./content";
describe("公開成果搜尋", () => {
  it("六種分類各有示範案例，且ID不重複", () => {
    expect(new Set(showcases.map((s) => s.id)).size).toBe(showcases.length);
    for (const c of categories)
      expect(filterShowcases(showcases, c, "")).toHaveLength(1);
  });
  it("支援標題、工具及空白處理", () => {
    expect(filterShowcases(showcases, "全部成果", "  會議  ")).toHaveLength(1);
    expect(filterShowcases(showcases, "全部成果", "共筆文件")).toHaveLength(2);
  });
  it("同時套用分類與關鍵字", () => {
    expect(filterShowcases(showcases, categories[0], "會議")).toHaveLength(1);
    expect(filterShowcases(showcases, categories[3], "會議")).toHaveLength(0);
  });
  it("不會將未發布成果放進公開搜尋", () => {
    expect(
      filterShowcases(
        [{ ...showcases[0], status: "submitted" }],
        "全部成果",
        "",
      ),
    ).toHaveLength(0);
  });
});
