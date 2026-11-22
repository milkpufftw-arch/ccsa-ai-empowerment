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
    const response = await fetch(this.path, {
      signal,
      cache: "no-cache",
      credentials: "omit",
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
    const controller = new AbortController();
    repository
      .load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error: true });
      });
    return () => controller.abort();
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
  if (error) return <p role="alert">公開資料暫時無法載入，請稍後重新整理。</p>;
  return null;
}
export const isDemoMode = import.meta.env.VITE_CONTENT_MODE === "demo";
