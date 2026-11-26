import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  validatePublicSnapshot,
  type PublicSnapshot,
} from "./public-contract.mjs";
import { courses as demos, type Course } from "./content";

export interface ContentRepository {
  load(signal?: AbortSignal): Promise<PublicSnapshot>;
}
export class JsonContentRepository implements ContentRepository {
  constructor(private path = `${import.meta.env.BASE_URL}data/content.json`) {}
  async load(signal?: AbortSignal) {
    const live = await fetch("/api/content", {
      signal,
      cache: "no-store",
      credentials: "same-origin",
    });
    if (live.status !== 204) {
      if (!live.ok) throw new Error("公開資料暫時無法同步");
      return validatePublicSnapshot(await live.json());
    }
    const response = await fetch(this.path, {
      signal,
      cache: "no-cache",
      // Vercel-protected previews require this site's login cookie for static JSON too.
      // Same-origin credentials are never sent to a different site's data source.
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("公開資料暫時無法載入");
    return validatePublicSnapshot(await response.json());
  }
}
type State = { data: PublicSnapshot | null; loading: boolean; error: boolean };
const ContentContext = createContext<State>({
  data: null,
  loading: true,
  error: false,
});
const defaultRepository = new JsonContentRepository();
export function ContentProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  repository?: ContentRepository;
}) {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: false,
  });
  useEffect(() => {
    let currentRequest: AbortController | undefined;
    let disposed = false;
    async function refresh() {
      if (currentRequest) return;
      const controller = new AbortController();
      currentRequest = controller;
      const timeout = window.setTimeout(() => controller.abort(), 12_000);
      try {
        const data = await repository.load(controller.signal);
        if (!disposed) setState({ data, loading: false, error: false });
      } catch {
        if (!disposed) setState({ data: null, loading: false, error: true });
      } finally {
        window.clearTimeout(timeout);
        currentRequest = undefined;
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      currentRequest?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [repository]);
  return (
    <ContentContext.Provider value={state}>{children}</ContentContext.Provider>
  );
}
export function useContent() {
  return useContext(ContentContext);
}
export type SiteCourse = Course & {
  isDemo: boolean;
  registrationUrl?: string;
  registrationStatus?: string;
};
export function siteCourses(data: PublicSnapshot | null): SiteCourse[] {
  // Demonstration mode is explicit. In production, empty/error snapshots never resurrect demo content.
  if (import.meta.env.VITE_CONTENT_MODE === "demo")
    return demos.map((c) => ({ ...c, isDemo: true }));
  return (data?.courses || []).map((c) => ({
    ...c,
    type: c.category,
    agenda: c.agenda.split("\n").filter(Boolean),
    color: c.category.startsWith("青少年") ? "orange" : "blue",
    isDemo: false,
  }));
}
export function ContentStatus() {
  const { loading, error } = useContent();
  if (loading) return <p role="status">正在載入公開資料…</p>;
  if (error) return <p role="alert">公開資料暫時無法載入，系統將自動重試。</p>;
  return null;
}
export const isDemoMode = import.meta.env.VITE_CONTENT_MODE === "demo";
