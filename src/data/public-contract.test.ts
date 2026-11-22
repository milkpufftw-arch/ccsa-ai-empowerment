import { describe, it, expect } from "vitest";
import { validatePublicSnapshot } from "./public-contract.mjs";
const empty = () => ({
  schemaVersion: 1,
  generatedAt: "2026-11-22T00:00:00Z",
  organizations: [],
  courses: [],
  announcements: [],
  recruitment: null,
});
describe("公開JSON匯入邊界", () => {
  it("允許空發布清單；不允許內部表、未知欄位、其他版本與無效格式", () => {
    expect(validatePublicSnapshot(empty()).courses).toEqual([]);
    for (const input of [
      { ...empty(), AdminUsers: [] },
      { ...empty(), schemaVersion: 2 },
      { ...empty(), organizations: [{ id: "x", email: "private@test" }] },
      { ...empty(), generatedAt: "invalid" },
      null,
    ])
      expect(() => validatePublicSnapshot(input)).toThrow();
  });
  it("拒絕不安全網址及無效日期", () => {
    const r = {
      id: "recruitment_00000000-0000-0000-0000-000000000001",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      recruitmentStatus: "open",
      formUrl: "https://forms.gle/example",
      resultsUrl: "",
      description: "說明",
    };
    expect(
      validatePublicSnapshot({ ...empty(), recruitment: r }).recruitment
        ?.description,
    ).toBe("說明");
    for (const change of [
      { formUrl: "javascript:alert(1)" },
      { resultsUrl: "https://user:password@example.test" },
      { endDate: "2026-02-30" },
      { endDate: "2026-01-01" },
      { internalNotes: "private" },
    ])
      expect(() =>
        validatePublicSnapshot({
          ...empty(),
          recruitment: { ...r, ...change },
        }),
      ).toThrow();
  });
});
