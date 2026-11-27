import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import Illustration from "../components/Illustration";
import { PublicImage } from "../components/LibraryMedia";
import OrganizationMark from "../components/OrganizationMark";
import { LibraryStatus, useLibrary } from "../data/library";
import {
  ContentStatus,
  isDemoMode,
  siteCourses,
  useContent,
} from "../data/repository";
import styles from "./Home.module.css";

const destinations = [
  { to: "/showcase", title: "AI 應用成果庫", description: "查看機構的實務案例" },
  { to: "/resources", title: "AI 學習資源", description: "找操作指引與學習素材" },
  { to: "/courses", title: "培力課程與活動", description: "查詢課程與報名資訊" },
  { to: "/seed", title: "種子機構招募與合作", description: "查看招募資訊及合作機構" },
];

export default function Home() {
  const { data, loading, error } = useContent();
  const courses = siteCourses(data).slice(0, 2);
  const library = useLibrary();
  const [leadShowcase, ...moreShowcases] = library.showcases.slice(0, 3);
  const announcements = (data?.announcements ?? [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className={styles.home}>
      <section className={styles.masthead}>
        <div className={`container ${styles.hero}`}>
          <div className={styles.intro}>
            <p className={styles.period}>2026.11 – 2027.10</p>
            <h1>全國安置機構AI賦能<wbr />與失家兒數位培力計畫</h1>
            <p className={styles.lede}>
              陪伴安置機構工作者與青少年學習 AI。從日常需求出發，透過培力課程、機構共學與經驗分享，探索安全、適切的應用方式。
            </p>
            <Link className={styles.primary} to="/about">
              認識計畫 <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.heroArt}>
            <Illustration />
          </div>

          <section className={styles.directory} aria-labelledby="home-directory">
            <h2 id="home-directory">探索與參與</h2>
            <ul className={styles.list}>
              {destinations.map(({ to, title, description }) => (
                <li key={to}>
                  <Link className={styles.entry} to={to}>
                    <span>
                      <strong>{title}</strong>
                      <span className={styles.meta}>{description}</span>
                    </span>
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <div className={`container ${styles.edition}`}>
        <section className={styles.showcases} aria-labelledby="home-showcases">
          <div className={styles.sectionHeading}>
            <h2 id="home-showcases">實務成果</h2>
            <Link className={styles.textLink} to="/showcase">
              查看成果庫 <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <LibraryStatus status={library.status} />
          {(library.status === "live" || library.status === "legacy") &&
            !leadShowcase && <p>成果將陸續公開。</p>}
          {leadShowcase && (
            <article className={styles.feature}>
              {leadShowcase.cover && (
                <Link
                  className={styles.coverLink}
                  to={`/showcase/${leadShowcase.id}`}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <PublicImage src={leadShowcase.cover} alt="" className={styles.cover} />
                </Link>
              )}
              <div className={styles.featureBody}>
                <p className={styles.meta}>
                  {leadShowcase.category}
                  {leadShowcase.isDemo && " ／ 示範案例"}
                  {leadShowcase.featured &&
                    (leadShowcase.featured === "pinned" ? " ／ 置頂" : " ／ 精選")}
                </p>
                <h3>
                  <Link to={`/showcase/${leadShowcase.id}`}>{leadShowcase.title}</Link>
                </h3>
                <p>{leadShowcase.summary}</p>
                {leadShowcase.organization && (
                  <p className={styles.meta}>{leadShowcase.organization}</p>
                )}
              </div>
            </article>
          )}
          {moreShowcases.length > 0 && (
            <ul className={styles.list}>
              {moreShowcases.map((item) => (
                <li key={item.id}>
                  <Link className={styles.entry} to={`/showcase/${item.id}`}>
                    <span>
                      <span className={styles.meta}>
                        {item.category}
                        {item.isDemo && " ／ 示範案例"}
                        {item.featured && (item.featured === "pinned" ? " ／ 置頂" : " ／ 精選")}
                      </span>
                      <strong>{item.title}</strong>
                    </span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.news} aria-label="計畫新鮮事">
          <div className={styles.sectionHeading}>
            <h2>最新公告</h2>
          </div>
          {loading && <p role="status">公告載入中…</p>}
          {error && <p role="alert">公告暫時無法載入，請稍後重新整理。</p>}
          {!loading && !error && !announcements.length && <p>最新公告將陸續更新。</p>}
          <ul className={styles.list}>
            {announcements.map((item) => (
              <li key={item.id}>
                <Link className={styles.entry} to={`/announcements/${item.id}`}>
                  <span>
                    <span className={styles.meta}>
                      <time dateTime={item.date}>{item.date}</time> ／ {item.category}
                    </span>
                    <strong>{item.title}</strong>
                  </span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`container ${styles.courses}`} aria-labelledby="home-courses">
        <div className={styles.sectionHeading}>
          <h2 id="home-courses">培力課程與活動</h2>
          <Link className={styles.textLink} to="/courses">
            查看所有課程 <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ContentStatus />
        {!loading && !error && !isDemoMode && !courses.length && (
          <p>正式課程資訊將陸續公告。</p>
        )}
        {courses.length > 0 && (
          <ul className={styles.list}>
            {courses.map((item) => (
              <li key={item.id}>
                <Link className={styles.entry} to={`/courses/${item.id}`}>
                  <span>
                    <span className={styles.meta}>
                      <time dateTime={item.date}>{item.date}</time> ／ {item.type}
                      {item.isDemo && " ／ 示範活動"}
                    </span>
                    <strong>{item.title}</strong>
                    <span className={styles.meta}>{item.location} ／ {item.time}</span>
                  </span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {isDemoMode && (
          <p>以上為課程規劃示範，日期與地點非正式公告，目前不開放報名。</p>
        )}
      </section>

      <section className={styles.credits} aria-label="主辦與支持單位">
        <dl className="container">
          <div>
            <dt>主辦單位</dt>
            <dd><OrganizationMark /> <span>中華育幼機構兒童關懷協會</span></dd>
          </div>
          <div>
            <dt>經費支持單位</dt>
            <dd><span>UBS 瑞銀集團</span></dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
