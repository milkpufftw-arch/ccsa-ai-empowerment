import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  Leaf,
} from "lucide-react";
import Illustration from "../components/Illustration";
import OrganizationMark from "../components/OrganizationMark";
import {
  SectionTitle,
  ProjectCards,
  CourseCard,
  ShowcaseCard,
} from "../components/UI";
import { courses, showcases } from "../data/content";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill">
              <span />
              以陪伴為起點，與AI一起向前
            </span>
            <h1>
              讓科技有溫度，
              <br />
              讓成長<span className="underline-green">有可能</span>
              <span className="title-dot">。</span>
            </h1>
            <p className="hero-sub">全國安置機構AI賦能與失家兒數位培力計畫</p>
            <p className="hero-description">
              從專業工作者到青少年，讓AI成為日常的好夥伴。
              <br className="desktop-break" />
              一起學習、一起實踐，為每一個未來多打開一扇門。
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/about">
                認識我們的計畫
                <ArrowRight size={18} />
              </Link>
              <Link className="btn secondary" to="/courses">
                探索培力課程
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="hero-partners">
              <span>
                主辦單位
                <OrganizationMark />
                <small>中華育幼機構兒童關懷協會</small>
              </span>
              <i />
              <span>
                贊助單位<b className="ubs">UBS</b>
                <small>瑞銀集團</small>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-label label-top">
              <Sparkles size={18} />
              小小的嘗試，大大的可能
            </div>
            <Illustration />
            <div className="visual-label label-bottom">
              <span className="tiny-heart">♥</span> PEOPLE FIRST. TECHNOLOGY FOR
              GOOD.
            </div>
          </div>
        </div>
        <div className="hero-caption container">
          <span>2026.11 — 2027.10</span>
          <span>
            一起共學・一起實踐・一起成長
            <Leaf size={16} />
          </span>
        </div>
      </section>
      <div className="values-strip">
        <div className="container">
          <span>
            <HeartHandshake />
            以人為本的科技陪伴
          </span>
          <span>
            <ShieldCheck />
            安心探索，重視個資保護
          </span>
          <span>
            <BookOpen />
            讓實務經驗成為共享知識
          </span>
        </div>
      </div>
      <section className="section container">
        <SectionTitle
          eyebrow="OUR INITIATIVES"
          title="四個起點，一起走向更多可能"
          description="從機構支持到青年成長，把科技的力量帶進每一天。"
          link="了解完整計畫"
          to="/about"
        />
        <ProjectCards />
      </section>
      <section className="section tinted">
        <div className="container">
          <SectionTitle
            eyebrow="LEARN & CONNECT"
            title="每一次學習，都是改變的開始"
            description="為專業工作者與青少年設計，從認識AI到動手實踐。"
            link="查看所有課程"
            to="/courses"
          />
          <div className="grid two">
            {courses.slice(0, 2).map((c) => (
              <CourseCard key={c.id} item={c} />
            ))}
          </div>
          <p className="section-note">
            以下為課程規劃示範，日期與地點非正式公告，目前不開放報名。
          </p>
        </div>
      </section>
      <section className="section container">
        <SectionTitle
          eyebrow="IDEAS INTO IMPACT"
          title="好方法，值得被更多人看見"
          description="探索AI如何融入實務，從彼此的嘗試中找到新的靈感。"
          link="走進AI應用成果庫"
          to="/showcase"
        />
        <div className="grid three">
          {showcases.slice(0, 3).map((c, i) => (
            <ShowcaseCard key={c.id} item={c} index={i} />
          ))}
        </div>
      </section>
      <section className="container">
        <div className="impact">
          <div>
            <div className="eyebrow">GROWING A BETTER TOMORROW</div>
            <h2>
              不只學會工具，
              <br />
              更要讓改變持續發生。
            </h2>
            <p>
              以機構共學、專業培力、青年探索與知識共享，
              <br />
              累積屬於兒少安置服務的數位能量。
            </p>
            <Link className="text-link" to="/about">
              看看我們期待的改變
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="impact-grid">
            {[
              ["01", "機構共學", "建立可相互支持的實務網絡"],
              ["02", "專業成長", "讓AI協助工作，保留專業判斷"],
              ["03", "青年探索", "培養數位素養與自主學習"],
              ["04", "知識共享", "留下可以持續運用的好方法"],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <SectionTitle eyebrow="LATEST UPDATES" title="計畫新鮮事" />
        <Link to="/seed" className="news-row">
          <span>計畫資訊</span>
          <time>2026.11</time>
          <h3>AI種子機構：一起探索合作與共學的可能</h3>
          <ArrowUpRight />
        </Link>
        <Link to="/resources" className="news-row">
          <span>學習資源</span>
          <time>示範內容</time>
          <h3>開始使用AI之前，先認識個資保護與資訊查證</h3>
          <ArrowUpRight />
        </Link>
      </section>
      <section className="join-banner">
        <div className="container">
          <div>
            <span className="eyebrow">LET’S CREATE THE FUTURE</span>
            <h2>改變的路上，我們一起。</h2>
            <p>讓每一份專業、每一個好奇，都有向前的力量。</p>
          </div>
          <Link className="btn primary" to="/seed">
            認識AI種子機構
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
    </>
  );
}
