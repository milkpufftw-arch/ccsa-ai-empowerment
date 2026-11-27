import { ArrowLeft, ArrowRight, Search, BookOpen, ShieldCheck, ChevronDown, Sparkles } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PageIntro, Notice, ShowcaseCard } from "../components/UI";
import { FormattedText, LibraryLink, PublicImage } from "../components/LibraryMedia";
import { LibraryStatus, useLibrary, type SiteResource } from "../data/library";
import { NotFound } from "./Content";
import PublicIntro from "./PublicIntro";
import styles from "./PublicPages.module.css";

function useLibraryFilters() {
  const [params, setParams] = useSearchParams();
  return {
    category: params.get("category") || "",
    query: params.get("q") || "",
    type: params.get("type") || "",
    featured: params.get("featured") === "1",
    update(key: string, value: string) {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next, { replace: true });
    },
    clear() { setParams({}, { replace: true }); },
  };
}
function matches(values: string[], query: string) {
  return values.join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
function SearchBox({ name, query, onChange }: { name: string; query: string; onChange: (v: string) => void }) {
  return <div className="search-box">
    <Search size={21} />
    <input aria-label={name} placeholder={name + "…"} value={query}
      onChange={(event) => onChange(event.target.value)} />
    {query && <button onClick={() => onChange("")}>清除</button>}
  </div>;
}
function CategoryTabs({ choices, active, all, label, onChange }: {
  choices: { id: string; name: string }[]; active: string; all: string;
  label: string; onChange: (v: string) => void;
}) {
  return <div className="filter-tabs" aria-label={label}>
    {[{ id: "", name: all }, ...choices].map(({ id, name }) => {
      const selected = active === id || (!!id && active === name);
      return <button key={id} aria-pressed={selected} className={selected ? "active" : ""}
        onClick={() => onChange(id)}>{name}</button>;
    })}
  </div>;
}
function EmptyLibrary({ message, filtered, clear }: { message: string; filtered: boolean; clear: () => void }) {
  return <div className="empty-state">
    <Search size={36} />
    <h2>{message}</h2>
    {filtered && <button className="btn primary" onClick={clear}>清除所有篩選</button>}
  </div>;
}

export function Showcase() {
  const { status, showcases, showcaseCategories } = useLibrary();
  const filters = useLibraryFilters();
  const filtered = showcases.filter((r) =>
    (!filters.category || [r.categoryId, r.category].includes(filters.category)) &&
    (!filters.featured || !!r.featured) &&
    matches([r.title, r.summary, r.organization, r.category, r.context, r.features ?? "", ...r.tools], filters.query));
  return <div className={styles.page}>
    <PublicIntro label="AI 應用成果庫" title="好方法，值得被更多人看見" icon={Sparkles} tone="blue"
      description="每一個實務嘗試，都可能成為另一個團隊的靈感。一起探索、交流，讓好方法持續發生。" />
    <div className="container section">
      <LibraryStatus status={status} />
      {(status === "legacy" || status === "live") && <>
        {showcases.length > 0 && showcases.every((item) => item.isDemo) && <Notice>
          本區所有內容均為示範案例，不代表真實服務成果、合作機構或成效數據；不含真實個案資訊。
        </Notice>}
        <SearchBox name="搜尋成果" query={filters.query} onChange={(v) => filters.update("q", v)} />
        <CategoryTabs choices={showcaseCategories} active={filters.category} all="全部成果" label="成果分類篩選"
          onChange={(v) => filters.update("category", v)} />
        <div className="result-heading">
          <p aria-live="polite">共 <strong>{filtered.length}</strong> 件成果</p>
          {(filters.featured || showcases.some((r) => r.featured)) && <label>
            <input type="checkbox" checked={filters.featured}
              onChange={(event) => filters.update("featured", event.target.checked ? "1" : "")} /> 只看精選與置頂
          </label>}
        </div>
        {filtered.length ? <div className={`grid three ${styles.showcaseList}`}>
          {filtered.map((item) => <ShowcaseCard item={item} key={item.id} />)}
        </div> : <EmptyLibrary message="還沒找到符合的成果" filtered={!!(filters.query || filters.category || filters.featured)} clear={filters.clear} />}
      </>}
    </div>
  </div>;
}

export function ShowcaseDetail() {
  const { id } = useParams();
  const { status, showcases } = useLibrary();
  const item = showcases.find((x) => x.id === id);
  if (status === "loading" || status === "error")
    return <div className="container section"><LibraryStatus status={status} /></div>;
  if (!item) return <NotFound />;
  const sections = [
    ["應用情境", item.context],
    ["原有問題及需求", item.problem],
    ["功能介紹", item.features],
  ];
  return <div className={styles.page}>
    <PageIntro eyebrow="PRACTICE & POSSIBILITY" title={item.title} description={item.summary} />
    <div className="container section detail-layout">
      <article>
        <Link to="/showcase" className="text-link"><ArrowLeft size={17} />返回成果庫</Link>
        {item.isDemo && <Notice>示範案例：機構、情境及方法均用於介面展示，不代表真實服務成果。</Notice>}
        <div className="tag-row">
          <span className="tag">{item.category}</span>
          {item.publishedAt && <span>{item.publishedAt}</span>}
        </div>
        <PublicImage src={item.cover} alt={item.title + "封面"} className="library-detail-image" />
        {sections.map(([title, text]) => text && <section key={title}><h2>{title}</h2><p><FormattedText text={text} /></p></section>)}
        {!!item.steps.length && <><h2>AI應用方法與操作步驟</h2><StepList steps={item.steps} /></>}
        {item.prompt && <><h2>提示詞範例</h2><blockquote><FormattedText text={item.prompt} /></blockquote></>}
        {item.benefit && <><h2>實際效益與評估方向</h2><p><FormattedText text={item.benefit} /></p></>}
        {item.limitations && <><h2>應用限制與注意事項</h2><p><FormattedText text={item.limitations} /></p></>}
        {item.instructions && <><h2>操作說明</h2><p><FormattedText text={item.instructions} /></p></>}
        {!!item.gallery?.length && <div className="library-gallery">
          {item.gallery.map((url, index) => <PublicImage key={index} src={url} alt={`成果展示圖片 ${index + 1}`} className="library-detail-image" />)}
        </div>}
        <div className="library-actions">
          <LibraryLink url={item.appUrl}>體驗 AI 應用</LibraryLink>
          <LibraryLink url={item.instructionsUrl}>操作教學</LibraryLink>
          <LibraryLink url={item.githubUrl}>查看原始碼</LibraryLink>
          <LibraryLink url={item.videoUrl}>觀看影片</LibraryLink>
          {item.attachments.map((a, index) => <LibraryLink key={index} url={a.url}>{a.label}</LibraryLink>)}
        </div>
      </article>
      <aside className="detail-aside">
        <BookOpen size={30} />
        <h3>成果小檔案</h3>
        <dl>
          <dt>成果ID</dt><dd>{item.id}</dd>
          <dt>{item.isDemo ? "投稿機構（示範）" : "開發／應用機構"}</dt><dd>{item.organization}</dd>
          {!!item.tools.length && <><dt>使用工具</dt><dd>{item.tools.join("、")}</dd></>}
          {item.updatedAt && <><dt>更新日期</dt><dd>{item.updatedAt.slice(0, 10)}</dd></>}
        </dl>
        <p className="small">請依機構規範評估工具與使用方式，並保留人工查證與覆核。</p>
        <Link className="text-link" to="/resources">看看安全使用指引<ArrowRight size={16} /></Link>
      </aside>
    </div>
  </div>;
}

function StepList({ steps }: { steps: string[] }) {
  return <ol className="steps">{steps.map((step, index) => <li key={index}><FormattedText text={step} /></li>)}</ol>;
}
function ResourceCard({ item }: { item: SiteResource }) {
  const metadata = [item.level, item.audience, item.source, item.fee, item.publishedAt,
    item.updatedAt && "更新 " + item.updatedAt.slice(0, 10)].filter(Boolean);
  return <article className="resource-card">
    <div className="resource-icon"><BookOpen size={26} /></div>
    <PublicImage src={item.cover} alt={item.title + "封面"} className="library-detail-image" />
    <div className="tag-row">
      <span className="tag">{item.category}</span>
      <span className="tag">{item.type}</span>
      {item.featured && <span className="tag">{item.featured === "pinned" ? "置頂" : "推薦"}</span>}
    </div>
    <h2>{item.title}</h2>
    <p>{item.summary}</p>
    {!!metadata.length && <p className="small">{metadata.join("・")}</p>}
    {(item.body !== item.summary && item.body || item.steps.length > 0) && <details>
      <summary>閱讀操作指引<ChevronDown size={18} /></summary>
      {item.body && item.body !== item.summary && <p><FormattedText text={item.body} /></p>}
      {!!item.steps.length && <StepList steps={item.steps} />}
      {item.sample && <span className="demo-label">示範資源</span>}
    </details>}
    <div className="library-actions">
      <LibraryLink url={item.resourceUrl}>
        {item.type === "AI 工具" ? "使用工具" : item.type === "影片" ? "觀看影片" :
          item.type === "文件" ? "下載教材" : "前往學習"}
      </LibraryLink>
      <LibraryLink url={item.videoUrl}>觀看教學影片</LibraryLink>
      {item.attachments.map((a, index) => <LibraryLink key={index} url={a.url}>下載教材 · {a.label}</LibraryLink>)}
    </div>
  </article>;
}

export function Resources() {
  const { status, resources, resourceCategories } = useLibrary();
  const filters = useLibraryFilters();
  const types = [...new Set(resources.map((r) => r.type))];
  const filtered = resources.filter((r) =>
    (!filters.category || [r.categoryId, r.category].includes(filters.category)) &&
    (!filters.type || r.type === filters.type) &&
    matches([r.title, r.summary, r.body, r.category, r.type, r.source, r.audience], filters.query));
  return <div className={styles.page}>
    <PublicIntro label="AI 學習資源" title="每一步探索，都有資源陪你" icon={BookOpen} tone="green"
      description="從入門教學、提示詞到實務指引，找到適合自己的AI學習起點。" />
    <div className="container section">
      <LibraryStatus status={status} />
      {(status === "legacy" || status === "live") && <>
        {resources.length > 0 && resources.every((item) => item.sample) && <Notice>
          本頁為示範學習內容，不代表正式課程教材或機構政策。所有練習請使用公開資料或完全虛構情境。
        </Notice>}
        <SearchBox name="搜尋學習資源" query={filters.query} onChange={(v) => filters.update("q", v)} />
        <CategoryTabs choices={resourceCategories} active={filters.category} all="全部資源" label="資源分類"
          onChange={(v) => filters.update("category", v)} />
        <label className="library-type-filter">資源類型 <select value={filters.type}
          onChange={(event) => filters.update("type", event.target.value)}>
          <option value="">所有類型</option>
          {types.map((type) => <option key={type}>{type}</option>)}
        </select></label>
        <p className="results-count" aria-live="polite">共 {filtered.length} 項資源</p>
        {filtered.length ? <div className={`grid two ${styles.resourceList}`}>
          {filtered.map((item) => <ResourceCard item={item} key={item.id} />)}
        </div> : <EmptyLibrary message="還沒找到符合的資源" filtered={!!(filters.query || filters.category || filters.type)} clear={filters.clear} />}
      </>}
      <div className="partner-panel">
        <ShieldCheck size={32} />
        <h2>保護資料，是使用AI的第一步。</h2>
        <p>不輸入可辨識個人或服務兒少的資料，確認使用授權，並由人員查證與審核產出。AI的回答不等於事實，也不取代專業判斷。</p>
      </div>
    </div>
  </div>;
}
