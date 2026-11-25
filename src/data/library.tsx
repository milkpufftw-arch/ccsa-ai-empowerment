import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { categories, resourceCategories, resources, showcases, type Showcase } from "./content";
import {
  parseLinks, splitLines, validateLibrarySnapshot,
  type LibraryResource, type LibraryShowcase, type LibrarySnapshot,
} from "./library-contract.mjs";

type LibraryState =
  | { status: "loading" | "legacy" | "error"; data?: undefined }
  | { status: "live"; data: LibrarySnapshot };

const LibraryContext = createContext<LibraryState>({ status: "loading" });

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  useEffect(() => {
    let request: AbortController | undefined;
    async function refresh() {
      if (request) return;
      const controller = new AbortController();
      request = controller;
      try {
        const response = await fetch("/api/library", {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
          cache: "no-store",
        });
        if (controller.signal.aborted) return;
        if (response.status === 204) setState({ status: "legacy" });
        else if (response.ok) {
          const data = validateLibrarySnapshot(await response.json());
          if (!controller.signal.aborted) setState({ status: "live", data });
        } else setState({ status: "error" });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      } finally {
        request = undefined;
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      request?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return <LibraryContext.Provider value={state}>{children}</LibraryContext.Provider>;
}

export type SiteShowcase = Showcase & Partial<Pick<LibraryShowcase,
  "cover" | "appUrl" | "githubUrl" | "instructions" | "instructionsUrl" | "features" | "videoUrl" | "featured" | "updatedAt">> & {
  gallery?: string[];
  artIndex?: number;
  categoryId?: string;
};
export type SiteResource = Omit<LibraryResource, "steps" | "attachments"> & {
  category: string;
  steps: string[];
  attachments: { label: string; url: string }[];
};
const illustrations = new Map(showcases.map((item, index) => [item.id, index]));

export function useLibrary() {
  const state = useContext(LibraryContext);
  const names = new Map(state.data?.categories.map((c) => [c.id, c.name]));
  const siteShowcases: SiteShowcase[] = state.status === "legacy"
    ? showcases.map((item, index) => ({ ...item, artIndex: index }))
    : (state.data?.showcases ?? []).map((r) => ({
        ...r, category: names.get(r.categoryId)!, tools: splitLines(r.tools),
        steps: splitLines(r.steps), attachments: parseLinks(r.attachments), gallery: splitLines(r.gallery),
        status: "published", isDemo: r.sample === "sample", artIndex: illustrations.get(r.id),
      }));
  const siteResources: SiteResource[] = state.status === "legacy"
    ? resources.map((r, index) => ({
        ...r, summary: r.body, type: ["操作指引", "提示詞", "課程", "操作指引", "操作指引"][index],
        categoryId: "", cover: "", videoUrl: "", publishedAt: "", updatedAt: "", sortOrder: "", featured: "",
        sample: "sample", attachments: [], audience: "", level: "", source: "", resourceUrl: "", fee: "",
      }))
    : (state.data?.resources ?? []).map((r) => ({
        ...r, category: names.get(r.categoryId)!, steps: splitLines(r.steps), attachments: parseLinks(r.attachments),
      }));
  function choices(module: "showcases" | "resources", legacy: readonly string[]) {
    return state.status === "legacy" ? legacy.map((name) => ({ id: name, name })) :
      (state.data?.categories ?? []).filter((c) => c.module === module);
  }
  return {
    status: state.status,
    showcases: siteShowcases,
    showcaseCategories: choices("showcases", categories),
    resources: siteResources,
    resourceCategories: choices("resources", resourceCategories.slice(1)),
  };
}

export function LibraryStatus({ status }: { status: LibraryState["status"] }) {
  if (status === "loading") return <p role="status">正在載入成果與資源…</p>;
  if (status === "error") return <p role="alert">成果與資源暫時無法載入，系統將自動重試。</p>;
  return null;
}
