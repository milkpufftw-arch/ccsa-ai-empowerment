import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  BookOpen,
  ShieldCheck,
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";
import {
  PageIntro,
  ProjectCards,
  Notice,
  SectionTitle,
  CourseCard,
} from "../components/UI";
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
import {
  useContent,
  siteCourses,
  isDemoMode,
  ContentStatus,
} from "../data/repository";
import { RecruitmentPanel } from "./ManagedContent";
export function Seed() {
  const { data } = useContent();
  return (
    <>
      <PageIntro
        eyebrow="GROW TOGETHER"
        title="AI種子機構，一起把可能種下"
        description="從機構的日常需求出發，透過共學、實踐與交流，陪伴團隊找到適合自己的AI應用方式。"
      />
      <div className="container section">
        <ContentStatus />
        <Notice>
          招募時程及合作條件以已發布公告為準；申請請使用計畫既有的Google Forms。
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
            <RecruitmentPanel recruitment={data?.recruitment ?? null} />
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
        <section className="section">
          <SectionTitle eyebrow="OUR PARTNERS" title="合作機構" />
          {!data?.organizations.length && (
            <p>正式合作名單確認並取得公開授權後，將於此處介紹。</p>
          )}
          <div className="grid three">
            {data?.organizations.map((o) => (
              <article className="plain-card" key={o.id}>
                {o.logoUrl && (
                  <img
                    className="organization-logo"
                    src={o.logoUrl}
                    alt={`${o.name} Logo`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="tag">
                  {o.city}・{o.region}
                </span>
                <h3>
                  <Link to={`/organizations/${o.id}`}>{o.name}</Link>
                </h3>
                <p>{o.summary}</p>
                <Link className="text-link" to={`/organizations/${o.id}`}>
                  認識機構
                  <ArrowRight size={18} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
export function Courses() {
  const { data } = useContent();
  const courses = siteCourses(data);
  const [type, setType] = useState("全部課程");
  const types = ["全部課程", "專業人員", "青少年", "其他"];
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
        <ContentStatus />
        <Notice>
          {isDemoMode
            ? "以下均為示範活動，日期、地點、對象與課程內容不代表正式公告。第一階段不接受報名。"
            : "以下為已發布課程；開放報名時，請透過課程頁的Google Forms連結申請。"}
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
          共 {filtered.length} 堂{isDemoMode ? "示範課程" : "課程"}
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
  const { data, loading, error } = useContent();
  const c = siteCourses(data).find((x) => x.id === id);
  if (!isDemoMode && (loading || error))
    return (
      <div className="container section">
        <h1>課程資訊</h1>
        <ContentStatus />
      </div>
    );
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
          <Notice>
            {c.isDemo
              ? "示範活動・目前不開放報名，日期地點非正式公告。"
              : "正式課程資訊，報名狀態請見右側活動資訊。"}
          </Notice>
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
          <span className="tag">{c.isDemo ? "示範活動" : c.type}</span>
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
          {!c.isDemo && c.registrationStatus === "open" && c.registrationUrl ? (
            <a
              className="btn primary"
              href={c.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              前往Google Forms報名
            </a>
          ) : (
            <div className="closed-registration">
              {c.registrationStatus === "closed"
                ? "報名已截止"
                : c.registrationStatus === "full"
                  ? "已額滿"
                  : "尚未開放報名"}
            </div>
          )}
          <small>本網站不蒐集報名個資。</small>
        </aside>
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
