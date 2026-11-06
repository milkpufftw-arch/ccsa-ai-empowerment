import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";
import {
  PageIntro,
  ProjectCards,
  Notice,
  SectionTitle,
  ShowcaseCard,
  CourseCard,
} from "../components/UI";
import {
  categories,
  showcases,
  courses,
  resources,
  resourceCategories,
  filterShowcases,
} from "../data/content";
export function About() {
  return (
    <>
      <PageIntro
        eyebrow="ABOUT THE PROJECT"
        title="讓AI的可能，成為陪伴的力量"
        description="共創未來｜全國安置機構AI賦能與失家兒數位培力計畫"
      />
      <div className="container section">
        <div className="editorial">
          <div>
            <span className="eyebrow">WHY WE START</span>
            <h2>
              科技快速前進，
              <br />
              我們希望每個人都能一起向前。
            </h2>
          </div>
          <div>
            <p>
              AI正逐漸改變工作與生活。對兒少安置機構而言，如何在保護服務對象、尊重專業判斷的前提下運用新工具，是值得一起探索的課題。
            </p>
            <p>
              CCSA攜手UBS瑞銀集團，透過機構陪伴、專業人員培力與青少年體驗教育，協助團隊將科技融入實務，也讓青少年有機會認識、理解並善用AI。
            </p>
            <p>
              我們期待的不只是學會操作，更是培養提問、查證與自主學習的能力，並將安全、適切的實務方法轉化為可共享的知識。
            </p>
          </div>
        </div>
        <SectionTitle
          eyebrow="FOUR CONNECTED INITIATIVES"
          title="四大子案，相互連結"
          description="以下以四項工作方向整理計畫架構，正式執行細節將依公告更新。"
        />
        <ProjectCards />
        <div className="editorial section">
          <div>
            <span className="eyebrow">OUR JOURNEY</span>
            <h2>
              一年的同行，
              <br />
              留下持續成長的種子。
            </h2>
            <p>執行期間：2026年11月至2027年10月</p>
          </div>
          <div className="timeline">
            {[
              ["連結與準備", "盤點機構需求、規劃合作與學習內容。"],
              ["培力與實踐", "透過課程、體驗與陪伴，探索實際應用。"],
              ["交流與累積", "整理去識別化經驗，建立持續擴充的知識資源。"],
            ].map(([t, d], i) => (
              <div key={t}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <SectionTitle eyebrow="EXPECTED IMPACT" title="我們期待的改變" />
        <div className="grid three">
          {[
            [
              "機構與專業",
              "累積AI應用能力，建立人工覆核與資料保護的共同意識。",
            ],
            [
              "青少年成長",
              "透過探索與創作，培養數位素養、自主學習及生活應用能力。",
            ],
            ["永續共享", "將經驗整理為可搜尋的資源，促進跨機構交流。"],
          ].map(([t, d]) => (
            <div className="plain-card" key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="partner-panel">
          <h2>一起為更好的未來</h2>
          <div className="grid two">
            <div>
              <span className="eyebrow">主辦單位</span>
              <h3>CCSA 中華育幼機構兒童關懷協會</h3>
              <p>串連兒少服務資源，陪伴安置機構與青少年探索成長的可能。</p>
            </div>
            <div>
              <span className="eyebrow">贊助單位</span>
              <h3>UBS 瑞銀集團</h3>
              <p>支持本計畫推動AI賦能與數位培力，一起拓展學習與未來的機會。</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export function Seed() {
  return (
    <>
      <PageIntro
        eyebrow="GROW TOGETHER"
        title="AI種子機構，一起把可能種下"
        description="從機構的日常需求出發，透過共學、實踐與交流，陪伴團隊找到適合自己的AI應用方式。"
      />
      <div className="container section">
        <Notice>
          第一階段為計畫展示。招募資格、名額、申請時程與配合事項尚待正式公告，本頁不受理申請或蒐集資料。
        </Notice>
        <div className="editorial section">
          <div>
            <span className="eyebrow">A SHARED JOURNEY</span>
            <h2>
              一個機構的嘗試，
              <br />
              可以成為更多人的起點。
            </h2>
          </div>
          <div>
            <p>
              種子機構共學以兒少安置服務的實務需求為起點，探索AI可協助的工作情境，並透過經驗交流累積可參考的方法。
            </p>
            <p>
              參與對象規劃為兒少安置服務相關機構，實際資格與合作條件以CCSA後續正式公告為準。
            </p>
          </div>
        </div>
        <SectionTitle eyebrow="WHAT WE EXPLORE" title="參與內容與合作方向" />
        <div className="grid three">
          {[
            ["01", "需求對話", "盤點團隊的工作情境，討論適合AI協作的任務。"],
            ["02", "共學實踐", "參與培力與交流，以虛構或公開資料練習。"],
            [
              "03",
              "經驗分享",
              "經人工覆核與授權確認後，分享不含個資的實務方法。",
            ],
          ].map(([n, t, d]) => (
            <div className="plain-card" key={n}>
              <span className="large-number">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="partner-panel">
          <ShieldCheck size={30} />
          <h2>以安全與專業為共同基礎</h2>
          <p>
            不提供可辨識服務兒少的資料，不以AI取代專業決策。課程參與、成果分享、授權及審核等配合事項，待正式合作流程確認後公告。
          </p>
        </div>
        <div className="grid two">
          <div className="plain-card">
            <h2>如何申請？</h2>
            <p>
              正式招募資訊尚未公告。目前不開放申請，亦未設定報名表單。後續請留意本網站計畫資訊。
            </p>
            <Link className="text-link" to="/about">
              先了解完整計畫
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="plain-card">
            <h2>合作機構介紹</h2>
            <p>
              正式合作名單確認並取得公開授權後，將於此處介紹。成果庫中的機構名稱均為示範名稱，不代表實際合作關係。
            </p>
            <Link className="text-link" to="/showcase">
              探索示範應用成果
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
export function Courses() {
  const [type, setType] = useState("全部課程");
  const types = ["全部課程", "專業人員", "青少年"];
  const filtered = courses.filter(
    (c) => type === "全部課程" || c.type.startsWith(type),
  );
  return (
    <>
      <PageIntro
        eyebrow="LEARN & CONNECT"
        title="把好奇，變成向前的力量"
        description="專業工作者與青少年的AI學習旅程，從認識工具到動手實踐。"
      />
      <div className="container section">
        <Notice>
          以下均為示範活動，日期、地點、對象與課程內容不代表正式公告。第一階段不接受報名。
        </Notice>
        <div className="filter-tabs" aria-label="課程對象篩選">
          {types.map((t) => (
            <button
              key={t}
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
              aria-pressed={type === t}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="results-count" aria-live="polite">
          共 {filtered.length} 堂示範課程
        </p>
        <div className="grid two course-list">
          {filtered.map((c) => (
            <CourseCard key={c.id} item={c} />
          ))}
        </div>
      </div>
    </>
  );
}
export function CourseDetail() {
  const { id } = useParams();
  const c = courses.find((x) => x.id === id);
  if (!c) return <NotFound />;
  return (
    <>
      <PageIntro
        eyebrow="COURSE INFORMATION"
        title={c.title}
        description={c.type}
      />
      <div className="container section detail-layout">
        <article>
          <Link to="/courses" className="text-link">
            <ArrowLeft size={17} />
            返回課程列表
          </Link>
          <Notice>示範活動・目前不開放報名，日期地點非正式公告。</Notice>
          <h2>一起學些什麼？</h2>
          <p>{c.description}</p>
          <h2>課程內容</h2>
          <ol className="steps">
            {c.agenda.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h2>參與前的小提醒</h2>
          <p>
            以公開資料或完全虛構的情境練習，不提供服務對象資訊。正式課程所需設備、參與條件及安排，以後續公告為準。
          </p>
        </article>
        <aside className="detail-aside">
          <span className="tag">示範活動</span>
          <h3>活動資訊</h3>
          <p>
            <CalendarDays size={19} />
            {c.date}
            <br />
            {c.time}
          </p>
          <p>
            <MapPin size={19} />
            {c.location}
          </p>
          <p>
            <Users size={19} />
            {c.audience}
          </p>
          <div className="closed-registration">尚未開放報名</div>
          <small>本網站不蒐集報名個資。</small>
        </aside>
      </div>
    </>
  );
}
export function Showcase() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "全部成果";
  const query = params.get("q") || "";
  const filtered = filterShowcases(showcases, category, query);
  function update(k: string, v: string) {
    const p = new URLSearchParams(params);
    v ? p.set(k, v) : p.delete(k);
    setParams(p, { replace: true });
  }
  return (
    <>
      <PageIntro
        eyebrow="IDEAS INTO IMPACT"
        title="AI應用成果庫"
        description="每一個實務嘗試，都可能成為另一個團隊的靈感。一起探索、交流，讓好方法持續發生。"
      />
      <div className="container section">
        <Notice>
          本區所有內容均為示範案例，不代表真實服務成果、合作機構或成效數據；不含真實個案資訊。
        </Notice>
        <div className="search-box">
          <Search size={21} />
          <label className="sr-only" htmlFor="case-search">
            搜尋成果
          </label>
          <input
            id="case-search"
            placeholder="搜尋成果、AI工具或應用情境…"
            value={query}
            onChange={(e) => update("q", e.target.value)}
          />
          {query && <button onClick={() => update("q", "")}>清除</button>}
        </div>
        <div className="filter-tabs" aria-label="成果分類篩選">
          {["全部成果", ...categories].map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? "active" : ""}
              onClick={() => update("category", c === "全部成果" ? "" : c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="result-heading">
          <p aria-live="polite">
            共 <strong>{filtered.length}</strong> 件示範成果
          </p>
          <span>持續累積，分享更多可能</span>
        </div>
        {filtered.length ? (
          <div className="grid three">
            {filtered.map((c) => (
              <ShowcaseCard item={c} key={c.id} index={showcases.indexOf(c)} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={36} />
            <h2>還沒找到符合的成果</h2>
            <p>試試其他關鍵字，或查看所有分類。</p>
            <button className="btn primary" onClick={() => setParams({})}>
              清除所有篩選
            </button>
          </div>
        )}
      </div>
    </>
  );
}
export function ShowcaseDetail() {
  const { id } = useParams();
  const item = showcases.find((x) => x.id === id && x.status === "published");
  if (!item) return <NotFound />;
  return (
    <>
      <PageIntro
        eyebrow="PRACTICE & POSSIBILITY"
        title={item.title}
        description={item.summary}
      />
      <div className="container section detail-layout">
        <article>
          <Link to="/showcase" className="text-link">
            <ArrowLeft size={17} />
            返回成果庫
          </Link>
          <Notice>
            示範案例：機構、情境及方法均用於介面展示，不代表真實服務成果。
          </Notice>
          <div className="tag-row">
            <span className="tag">{item.category}</span>
            <span>{item.publishedAt}</span>
          </div>
          <h2>應用情境</h2>
          <p>{item.context}</p>
          <h2>原有問題及需求</h2>
          <p>{item.problem}</p>
          <h2>AI應用方法與操作步驟</h2>
          <ol className="steps">
            {item.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h2>提示詞範例</h2>
          <blockquote>{item.prompt}</blockquote>
          <h2>實際效益與評估方向</h2>
          <p>{item.benefit}</p>
          <h2>應用限制與注意事項</h2>
          <p>{item.limitations}</p>
          <h2>成果示意與附件</h2>
          <p>
            {item.attachments.length
              ? ""
              : "本示範未提供附件。成果卡片圖形為情境示意，非實際工具畫面。"}
          </p>
          {item.attachments.map((a) => (
            <a key={a.url} href={a.url}>
              {a.label}
            </a>
          ))}
        </article>
        <aside className="detail-aside">
          <BookOpen size={30} />
          <h3>成果小檔案</h3>
          <dl>
            <dt>成果ID</dt>
            <dd>{item.id}</dd>
            <dt>投稿機構（示範）</dt>
            <dd>{item.organization}</dd>
            <dt>使用工具</dt>
            <dd>{item.tools.join("、")}</dd>
            <dt>發布狀態</dt>
            <dd>已發布・示範內容</dd>
          </dl>
          <p className="small">
            請依機構規範評估工具與使用方式，並保留人工查證與覆核。
          </p>
          <Link className="text-link" to="/resources">
            看看安全使用指引
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
    </>
  );
}
export function Resources() {
  const [category, setCategory] = useState("全部資源");
  return (
    <>
      <PageIntro
        eyebrow="YOUR LEARNING TOOLKIT"
        title="每一步探索，都有資源陪你"
        description="從入門教學、提示詞到實務指引，找到適合自己的AI學習起點。"
      />
      <div className="container section">
        <Notice>
          本頁為示範學習內容，不代表正式課程教材或機構政策。所有練習請使用公開資料或完全虛構情境。
        </Notice>
        <div className="filter-tabs" aria-label="資源分類">
          {resourceCategories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="results-count" aria-live="polite">
          共{" "}
          {
            resources.filter(
              (r) => category === "全部資源" || category === r.category,
            ).length
          }{" "}
          項示範資源
        </p>
        <div className="grid two">
          {resources
            .filter((r) => category === "全部資源" || category === r.category)
            .map((r) => (
              <article className="resource-card" key={r.id}>
                <div className="resource-icon">
                  <BookOpen size={26} />
                </div>
                <span className="tag">{r.category}</span>
                <h2>{r.title}</h2>
                <p>{r.body}</p>
                <details>
                  <summary>
                    閱讀操作指引
                    <ChevronDown size={18} />
                  </summary>
                  <ol className="steps">
                    {r.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <span className="demo-label">示範資源</span>
                </details>
              </article>
            ))}
        </div>
        <div className="partner-panel">
          <ShieldCheck size={32} />
          <h2>保護資料，是使用AI的第一步。</h2>
          <p>
            不輸入可辨識個人或服務兒少的資料，確認使用授權，並由人員查證與審核產出。AI的回答不等於事實，也不取代專業判斷。
          </p>
        </div>
      </div>
    </>
  );
}
export function NotFound() {
  return (
    <section className="container empty-state not-found">
      <span className="eyebrow">404 · A LITTLE DETOUR</span>
      <h1>這條路，還沒通往未來。</h1>
      <p>找不到這個頁面，讓我們回到起點，繼續探索。</p>
      <Link className="btn primary" to="/">
        返回首頁
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
