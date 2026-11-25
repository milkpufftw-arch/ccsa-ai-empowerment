import vm from "node:vm";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

export function harness() {
  const state = {
    email: "admin@example.test",
    effective: "admin@example.test",
    canEdit: true,
    locked: false,
    failContent: false,
    failAudit: false,
    failAuditFinalize: false,
    sheets: new Map(),
    files: new Map(),
    triggers: [],
    reads: [],
    writes: 0,
  };
  class Range {
    constructor(sheet, r, c, n = 1, m = 1) {
      Object.assign(this, { sheet, r, c, n, m });
    }
    getValues() {
      return Array.from({ length: this.n }, (_, i) =>
        Array.from(
          { length: this.m },
          (_, j) => this.sheet.rows[this.r - 1 + i]?.[this.c - 1 + j] ?? "",
        ),
      );
    }
    getFormulas() {
      return this.getValues().map((row, i) =>
        row.map((v, j) =>
          typeof v === "string" &&
          v.startsWith("=") &&
          this.sheet.textCells.get(this.r - 1 + i + ":" + (this.c - 1 + j)) !==
            v
            ? v
            : "",
        ),
      );
    }
    setValues(rows) {
      if (state.failContent && this.sheet.name === "Organizations")
        throw new Error("private Google detail");
      if (state.failAudit && this.sheet.name === "AuditLogs")
        throw new Error("private audit detail");
      if (
        state.failAuditFinalize &&
        this.sheet.name === "AuditLogs" &&
        rows[0].includes("applied")
      )
        throw new Error("audit finalization");
      for (let i = 0; i < rows.length; i++)
        for (let j = 0; j < rows[i].length; j++) {
          this.sheet.rows[this.r - 1 + i] ??= [];
          const v = rows[i][j];
          this.sheet.textCells.delete(this.r - 1 + i + ":" + (this.c - 1 + j));
          if (typeof v === "string" && v.startsWith("'"))
            this.sheet.textCells.set(
              this.r - 1 + i + ":" + (this.c - 1 + j),
              v.slice(1),
            );
          // Google Sheets interprets a leading apostrophe as a literal-text escape.
          this.sheet.rows[this.r - 1 + i][this.c - 1 + j] =
            typeof v === "string" && v.startsWith("'") ? v.slice(1) : v;
        }
      state.writes++;
      return this;
    }
    setNumberFormat() {
      return this;
    }
    setFontWeight() {
      return this;
    }
    setBackground() {
      return this;
    }
    setDataValidation() {
      return this;
    }
  }
  class Sheet {
    constructor(name) {
      this.name = name;
      this.rows = [];
      this.textCells = new Map();
    }
    getRange(...args) {
      return new Range(this, ...args);
    }
    getLastRow() {
      return this.rows.length;
    }
    getLastColumn() {
      return Math.max(0, ...this.rows.map((r) => r.length));
    }
    getMaxColumns() {
      return 26;
    }
    insertColumnsAfter() {}
    getMaxRows() {
      return Math.max(1000, this.rows.length);
    }
    setFrozenRows() {}
    deleteRow(r) {
      this.rows.splice(r - 1, 1);
      state.writes++;
    }
    getProtections() {
      return [];
    }
    protect() {
      return {
        setDescription() {},
        setWarningOnly() {},
        setUnprotectedRanges() {},
        addEditor() {},
        getEditors() {
          return [];
        },
        canDomainEdit() {
          return false;
        },
      };
    }
  }
  const book = {
    getSheetByName(name) {
      state.reads.push(name);
      return state.sheets.get(name);
    },
    insertSheet(name) {
      const s = new Sheet(name);
      state.sheets.set(name, s);
      return s;
    },
    getId() {
      return "private-sheet-id";
    },
    getOwner() {
      return { getEmail: () => "admin@example.test" };
    },
  };
  const properties = new Map([["SPREADSHEET_ID", "private-sheet-id"]]);
  const props = {
    getProperty: (k) => properties.get(k) ?? null,
    setProperty: (k, v) => properties.set(k, v),
    deleteProperty: (k) => properties.delete(k),
  };
  const html = {
    setTitle() {
      return this;
    },
    addMetaTag() {
      return this;
    },
  };
  function assertInterval(interval) {
    if (interval !== 1) throw new Error("Expected a one-minute trigger");
  }
  const context = vm.createContext({
    console: { log() {} },
    Date,
    JSON,
    Number,
    Object,
    Array,
    String,
    RegExp,
    Math,
    isNaN,
    Session: {
      getActiveUser: () => ({ getEmail: () => state.email }),
      getEffectiveUser: () => ({ getEmail: () => state.effective }),
    },
    PropertiesService: { getScriptProperties: () => props },
    Drive: {
      Files: {
        get() {
          return { capabilities: { canEdit: state.canEdit } };
        },
        create(metadata, blob) {
          const id = randomUUID();
          state.files.set(id, { metadata, blob, permissions: [{ type: "user", role: "owner" }] });
          return { id };
        },
        update(_metadata, id, blob) {
          state.files.get(id).blob = blob;
          return { id };
        },
      },
      Permissions: {
        list(id) { return { permissions: state.files.get(id).permissions }; },
        create(permission, id) { state.files.get(id).permissions.push(permission); },
      },
    },
    ScriptApp: {
      getProjectTriggers: () => state.triggers,
      newTrigger: (name) => ({
        timeBased() { return this; },
        everyMinutes(interval) { assertInterval(interval); return this; },
        create() { state.triggers.push({ getHandlerFunction: () => name }); },
      }),
    },
    SpreadsheetApp: {
      openById: () => book,
      flush() {},
      ProtectionType: { SHEET: "SHEET" },
      newDataValidation: () => ({
        requireValueInList() {
          return this;
        },
        setAllowInvalid() {
          return this;
        },
        build() {
          return this;
        },
      }),
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => !state.locked, releaseLock() {} }),
    },
    Utilities: {
      getUuid: randomUUID,
      base64Decode: (data) => [...Buffer.from(data, "base64")],
      newBlob: (json) => ({ getBytes: () => Buffer.from(json), json }),
    },
    HtmlService: {
      createHtmlOutput: () => html,
      createHtmlOutputFromFile: () => html,
    },
  });
  for (const file of ["Schema.gs", "Library.gs", "LibrarySeed.gs", "LibrarySetup.gs", "Server.gs", "Setup.gs"])
    vm.runInContext(
      readFileSync(
        new URL("../../apps-script/" + file, import.meta.url),
        "utf8",
      ),
      context,
      { filename: file },
    );
  context.initialize_();
  function migrateLibrary() {
    properties.set("LIBRARY_BACKUP_CONFIRMED", book.getId());
    return context.migrateLibrary_();
  }
  function enable() {
    props.setProperty("WRITE_ENABLED", "true");
    props.setProperty(
      "SECURITY_REVIEW_JSON",
      JSON.stringify({
        testedAt: "2026-11-22T00:00:00Z",
        executeAs: "USER_ACCESSING",
        access: "ANYONE",
        authorizedAccountsTested: 2,
        unauthorizedDenied: true,
        viewerDenied: true,
        exportChecked: true,
      }),
    );
  }
  function enableOwner() {
    props.setProperty("WRITE_ENABLED", "true");
    props.setProperty("ADMIN_WRITE_MODE", "owner_only");
    props.setProperty("DEPLOYMENT_EXECUTE_AS", "USER_ACCESSING");
    props.setProperty("DEPLOYMENT_ACCESS", "ANYONE");
  }
  return {
    state,
    book,
    context,
    properties,
    enable,
    enableOwner,
    migrateLibrary,
    call: (method, ...args) =>
      JSON.parse(JSON.stringify(context[method](...args))),
  };
}
export const org = (extra = {}) => ({
  status: "draft",
  name: "測試機構",
  city: "臺北市",
  region: "北部",
  summary: "可公開的機構簡介",
  features: "",
  aiDirection: "",
  logoUrl: "",
  internalNotes: "內部備註-不可公開",
  ...extra,
});
export const course = (extra = {}) => ({
  status: "draft",
  title: "正式測試課程",
  category: "專業人員AI初階培力",
  description: "公開課程說明",
  date: "2026-12-10",
  time: "09:30–16:30",
  location: "線上",
  audience: "社工",
  agenda: "認識AI\n實作",
  registrationUrl: "",
  registrationStatus: "not_open",
  organizationId: "",
  internalNotes: "私有備註",
  ...extra,
});
